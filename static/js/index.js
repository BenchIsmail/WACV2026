(function () {
  "use strict";

  window.scrollToTop = function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  window.copyBibTeX = function () {
    const bib = document.getElementById("bibtex-code");
    if (!bib) return;

    const text = bib.innerText;
    navigator.clipboard.writeText(text).then(() => {
      const btn = document.querySelector(".copy-bibtex-btn .copy-text");
      if (!btn) return;
      const oldText = btn.textContent;
      btn.textContent = "Copied!";
      setTimeout(() => {
        btn.textContent = oldText;
      }, 1200);
    }).catch(() => {});
  };

  document.addEventListener("DOMContentLoaded", function () {
    if (window.bulmaCarousel) {
      bulmaCarousel.attach("#results-carousel", {
        slidesToScroll: 1,
        slidesToShow: 1,
        infinite: true,
        autoplay: false
      });
    }
  });

  const TEXTURE_SRC = "static/images/WACV2026_sk4_3x22.png";
  const LONG_PRESS_MS = 1000;

  const bgCanvas = document.getElementById("texture-bg-canvas");
  const workCanvas = document.getElementById("texture-work-canvas");
  const preview = document.getElementById("acorr-preview");
  const acorrCanvas = document.getElementById("acorr-canvas");
  const patchSizeLabel = document.getElementById("patch-size-label");
  const contrastInput = document.getElementById("acorr-contrast");
  const contrastValue = document.getElementById("acorr-contrast-value");

  if (!bgCanvas || !workCanvas || !preview || !acorrCanvas || !patchSizeLabel) {
    console.error("Missing required DOM elements for texture/autocorrelation.");
    return;
  }

  const bgCtx = bgCanvas.getContext("2d", { alpha: false });
  const workCtx = workCanvas.getContext("2d", { willReadFrequently: true });
  const acorrCtx = acorrCanvas.getContext("2d");

  const textureImg = new Image();

  let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  let viewW = window.innerWidth;
  let viewH = window.innerHeight;

  let simScale = 0.5;
  let simW = 0;
  let simH = 0;

  let patchSize = 200;
  const patchMin = 80;
  const patchMax = 500;
  const patchStep = 20;

  let lastAutocorrMatrix = null;

  const state = {
    mouseX: 0,
    mouseY: 0,
    rightDown: false,
    showPreview: false,
    pressTimerRight: null
  };

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function isInteractiveElement(el) {
    return !!el.closest("a, button, iframe, input, textarea, select, video, .carousel, .slider, .publication-links");
  }

  function resizeAll() {
    viewW = window.innerWidth;
    viewH = window.innerHeight;
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    bgCanvas.width = Math.floor(viewW * dpr);
    bgCanvas.height = Math.floor(viewH * dpr);
    bgCanvas.style.width = `${viewW}px`;
    bgCanvas.style.height = `${viewH}px`;
    bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    simW = Math.max(320, Math.floor(viewW * simScale));
    simH = Math.max(320, Math.floor(viewH * simScale));

    workCanvas.width = simW;
    workCanvas.height = simH;

    drawFixedTexture();
  }

  function pageToSim(x, y) {
    return {
      x: (x / viewW) * simW,
      y: (y / viewH) * simH
    };
  }

  function drawFixedTexture() {
    if (!textureImg.complete || !textureImg.naturalWidth) return;

    workCtx.clearRect(0, 0, simW, simH);

    const pattern = workCtx.createPattern(textureImg, "repeat");
    if (!pattern) return;

    workCtx.fillStyle = pattern;
    workCtx.fillRect(0, 0, simW, simH);

    bgCtx.clearRect(0, 0, viewW, viewH);
    bgCtx.imageSmoothingEnabled = true;
    bgCtx.drawImage(workCanvas, 0, 0, viewW, viewH);
  }

  function getPatchFromRenderedView(pageX, pageY) {
    const p = pageToSim(pageX, pageY);
    const half = Math.floor((patchSize * simScale) / 2);

    const patchCanvas = document.createElement("canvas");
    patchCanvas.width = patchSize;
    patchCanvas.height = patchSize;

    const pctx = patchCanvas.getContext("2d", { willReadFrequently: true });

    const sx = Math.round(p.x - half);
    const sy = Math.round(p.y - half);
    const sw = Math.max(1, Math.round(patchSize * simScale));
    const sh = Math.max(1, Math.round(patchSize * simScale));

    pctx.imageSmoothingEnabled = true;
    pctx.drawImage(workCanvas, sx, sy, sw, sh, 0, 0, patchSize, patchSize);

    return patchCanvas;
  }

  function fftshift2D(mat) {
    const h = mat.length;
    const w = mat[0].length;
    const out = Array.from({ length: h }, () => new Float64Array(w));

    const h2 = Math.floor(h / 2);
    const w2 = Math.floor(w / 2);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const yy = (y + h2) % h;
        const xx = (x + w2) % w;
        out[yy][xx] = mat[y][x];
      }
    }
    return out;
  }

  function getLuminancePatch(canvas) {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = img.data;

    const out = Array.from({ length: canvas.height }, () => new Float64Array(canvas.width));

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const k = 4 * (y * canvas.width + x);
        const r = data[k];
        const g = data[k + 1];
        const b = data[k + 2];
        out[y][x] = 0.299 * r + 0.587 * g + 0.114 * b;
      }
    }
    return out;
  }

  function removeMean(mat) {
    const h = mat.length;
    const w = mat[0].length;
    let sum = 0;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        sum += mat[y][x];
      }
    }

    const mean = sum / (h * w);
    const out = Array.from({ length: h }, () => new Float64Array(w));

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        out[y][x] = mat[y][x] - mean;
      }
    }

    return out;
  }

  function energyOf(mat) {
    const h = mat.length;
    const w = mat[0].length;
    let e = 0;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const v = mat[y][x];
        e += v * v;
      }
    }
    return e;
  }

  function dft2DReal(mat) {
    const h = mat.length;
    const w = mat[0].length;
    const out = Array.from({ length: h }, () => Array.from({ length: w }, () => ({ re: 0, im: 0 })));

    for (let ky = 0; ky < h; ky++) {
      for (let kx = 0; kx < w; kx++) {
        let re = 0;
        let im = 0;

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const angle = -2 * Math.PI * ((kx * x / w) + (ky * y / h));
            const v = mat[y][x];
            re += v * Math.cos(angle);
            im += v * Math.sin(angle);
          }
        }

        out[ky][kx] = { re, im };
      }
    }

    return out;
  }

  function idft2DComplex(freq) {
    const h = freq.length;
    const w = freq[0].length;
    const out = Array.from({ length: h }, () => new Float64Array(w));

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let re = 0;

        for (let ky = 0; ky < h; ky++) {
          for (let kx = 0; kx < w; kx++) {
            const angle = 2 * Math.PI * ((kx * x / w) + (ky * y / h));
            const F = freq[ky][kx];
            re += F.re * Math.cos(angle) - F.im * Math.sin(angle);
          }
        }

        out[y][x] = re / (w * h);
      }
    }

    return out;
  }

  function powerSpectrum(freq) {
    const h = freq.length;
    const w = freq[0].length;
    const out = Array.from({ length: h }, () => Array.from({ length: w }, () => ({ re: 0, im: 0 })));

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let re = freq[y][x].re;
        let im = freq[y][x].im;

        if (x === 0 && y === 0) {
          re = 0;
          im = 0;
        }

        const mag2 = re * re + im * im;
        out[y][x] = { re: mag2, im: 0 };
      }
    }

    return out;
  }

  function normalizeAutocorr(mat, energy) {
    const h = mat.length;
    const w = mat[0].length;
    const denom = energy !== 0 ? energy : 1;
    const out = Array.from({ length: h }, () => new Float64Array(w));

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        out[y][x] = mat[y][x] / denom;
      }
    }

    return out;
  }

  function renderAutocorrToCanvas(mat, canvas, contrast) {
    const h = mat.length;
    const w = mat[0].length;
    const ctx = canvas.getContext("2d");

    const tmp = document.createElement("canvas");
    tmp.width = w;
    tmp.height = h;
    const tctx = tmp.getContext("2d");

    const img = tctx.createImageData(w, h);

    let minV = Infinity;
    let maxV = -Infinity;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const v = mat[y][x];
        if (v < minV) minV = v;
        if (v > maxV) maxV = v;
      }
    }

    const center = 0.5 * (minV + maxV);
    const halfRange = Math.max(1e-12, 0.5 * (maxV - minV));

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let v = mat[y][x];
        v = (v - center) / halfRange;
        v *= contrast;
        v = Math.tanh(v);

        const g = Math.max(0, Math.min(255, Math.round((v + 1) * 127.5)));
        const k = 4 * (y * w + x);

        img.data[k] = g;
        img.data[k + 1] = g;
        img.data[k + 2] = g;
        img.data[k + 3] = 255;
      }
    }

    tctx.putImageData(img, 0, 0);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(tmp, 0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(255,0,0,0.85)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  }

  function computeAutocorrelationLikePython(patchCanvas) {
    let u = getLuminancePatch(patchCanvas);
    u = removeMean(u);

    const energy = energyOf(u);
    const F = dft2DReal(u);
    const P = powerSpectrum(F);
    const ac = idft2DComplex(P);
    const acShift = fftshift2D(ac);
    return normalizeAutocorr(acShift, energy);
  }

  async function updateAutocorrelationPreview(pageX, pageY) {
    const patchCanvas = getPatchFromRenderedView(pageX, pageY);
    const contrast = contrastInput ? parseFloat(contrastInput.value) : 1.5;

    try {
      lastAutocorrMatrix = computeAutocorrelationLikePython(patchCanvas);
      renderAutocorrToCanvas(lastAutocorrMatrix, acorrCanvas, contrast);
    } catch (err) {
      console.error("Autocorrelation preview failed:", err);
      acorrCtx.clearRect(0, 0, acorrCanvas.width, acorrCanvas.height);
      acorrCtx.drawImage(patchCanvas, 0, 0, acorrCanvas.width, acorrCanvas.height);
    }
  }

  function rerenderLastAutocorr() {
    if (!lastAutocorrMatrix) return;
    const contrast = contrastInput ? parseFloat(contrastInput.value) : 1.5;
    renderAutocorrToCanvas(lastAutocorrMatrix, acorrCanvas, contrast);
  }

  function placePreview(pageX, pageY) {
    const pad = 18;
    let x = pageX + 16;
    let y = pageY + 12;

    const w = 270;
    const h = 320;

    if (x + w > window.innerWidth - pad) x = pageX - w - 18;
    if (y + h > window.innerHeight - pad) y = window.innerHeight - h - pad;
    if (x < pad) x = pad;
    if (y < pad) y = pad;

    preview.style.left = `${x}px`;
    preview.style.top = `${y}px`;
  }

  function showPreviewAt(pageX, pageY) {
    patchSizeLabel.textContent = `Patch: ${patchSize} px`;
    preview.style.display = "block";
    placePreview(pageX, pageY);
    updateAutocorrelationPreview(pageX, pageY);
  }

  function hidePreview() {
    preview.style.display = "none";
  }

  function onPointerDown(e) {
    state.mouseX = e.clientX;
    state.mouseY = e.clientY;

    if (isInteractiveElement(e.target)) return;

    if (e.button === 2) {
      state.rightDown = true;

      clearTimeout(state.pressTimerRight);
      state.pressTimerRight = setTimeout(() => {
        if (state.rightDown) {
          state.showPreview = true;
          showPreviewAt(e.clientX, e.clientY);
        }
      }, LONG_PRESS_MS);
    }
  }

  function onPointerMove(e) {
    state.mouseX = e.clientX;
    state.mouseY = e.clientY;

    if (state.showPreview) {
      placePreview(e.clientX, e.clientY);
      updateAutocorrelationPreview(e.clientX, e.clientY);
    }
  }

  function onPointerUp(e) {
    if (e.button === 2) {
      state.rightDown = false;
      clearTimeout(state.pressTimerRight);

      if (state.showPreview) {
        hidePreview();
      }
      state.showPreview = false;
    }
  }

  function onWheel(e) {
    if (!state.showPreview) return;

    e.preventDefault();

    if (e.deltaY < 0) {
      patchSize = clamp(patchSize + patchStep, patchMin, patchMax);
    } else {
      patchSize = clamp(patchSize - patchStep, patchMin, patchMax);
    }

    patchSizeLabel.textContent = `Patch: ${patchSize} px`;
    updateAutocorrelationPreview(state.mouseX, state.mouseY);
  }

  function onContextMenu(e) {
    e.preventDefault();
  }

  function initTexture() {
    resizeAll();

    if (contrastInput && contrastValue) {
      contrastValue.textContent = `${parseFloat(contrastInput.value).toFixed(1)}×`;
      contrastInput.addEventListener("input", function () {
        contrastValue.textContent = `${parseFloat(contrastInput.value).toFixed(1)}×`;
        rerenderLastAutocorr();
      });
    }

    window.addEventListener("resize", resizeAll);
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("pointermove", onPointerMove, true);
    document.addEventListener("pointerup", onPointerUp, true);
    document.addEventListener("pointercancel", onPointerUp, true);
    document.addEventListener("wheel", onWheel, { passive: false, capture: true });
    document.addEventListener("contextmenu", onContextMenu, true);

    drawFixedTexture();
    console.log("Texture background initialized.");
  }

  textureImg.onload = function () {
    console.log("Texture loaded:", TEXTURE_SRC);
    initTexture();
  };

  textureImg.onerror = function () {
    console.error("Impossible to load texture image:", TEXTURE_SRC);
  };

  textureImg.src = TEXTURE_SRC;
})();
