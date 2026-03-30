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

  const sourceCanvas = document.getElementById("texture-source-canvas");
  const preview = document.getElementById("acorr-preview");
  const acorrCanvas = document.getElementById("acorr-canvas");
  const patchSizeLabel = document.getElementById("patch-size-label");
  const contrastInput = document.getElementById("acorr-contrast");
  const contrastValue = document.getElementById("acorr-contrast-value");

  if (!sourceCanvas || !preview || !acorrCanvas || !patchSizeLabel) {
    console.error("Missing required DOM elements.");
    return;
  }

  const sourceCtx = sourceCanvas.getContext("2d", { willReadFrequently: true });
  const acorrCtx = acorrCanvas.getContext("2d");

  const textureImg = new Image();

  let viewW = window.innerWidth;
  let viewH = window.innerHeight;

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

  function resizeSourceCanvas() {
    viewW = window.innerWidth;
    viewH = window.innerHeight;

    sourceCanvas.width = viewW;
    sourceCanvas.height = viewH;

    drawHiddenTexture();
  }

  function drawHiddenTexture() {
    if (!textureImg.complete || !textureImg.naturalWidth) return;

    sourceCtx.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);

    const pattern = sourceCtx.createPattern(textureImg, "repeat");
    if (!pattern) return;

    sourceCtx.fillStyle = pattern;
    sourceCtx.fillRect(0, 0, sourceCanvas.width, sourceCanvas.height);
  }

  function getPatchFromHiddenTexture(pageX, pageY) {
    const half = Math.floor(patchSize / 2);

    const patchCanvas = document.createElement("canvas");
    patchCanvas.width = patchSize;
    patchCanvas.height = patchSize;

    const pctx = patchCanvas.getContext("2d", { willReadFrequently: true });
    const sx = Math.round(pageX - half);
    const sy = Math.round(pageY - half);

    pctx.imageSmoothingEnabled = true;
    pctx.drawImage(sourceCanvas, sx, sy, patchSize, patchSize, 0, 0, patchSize, patchSize);

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

    ctx.strokeStyle = "rgba(255, 0, 0, 0.85)";
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
    const patchCanvas = getPatchFromHiddenTexture(pageX, pageY);
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
    const boxW = 280;
    const boxH = 330;

    let x = pageX + 16;
    let y = pageY + 12;

    if (x + boxW > window.innerWidth - pad) x = pageX - boxW - 16;
    if (y + boxH > window.innerHeight - pad) y = window.innerHeight - boxH - pad;
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

  function initAutocorrelationSystem() {
    resizeSourceCanvas();

    if (contrastInput && contrastValue) {
      contrastValue.textContent = `${parseFloat(contrastInput.value).toFixed(1)}×`;

      contrastInput.addEventListener("input", function () {
        contrastValue.textContent = `${parseFloat(contrastInput.value).toFixed(1)}×`;
        rerenderLastAutocorr();
      });
    }

    window.addEventListener("resize", resizeSourceCanvas);
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("pointermove", onPointerMove, true);
    document.addEventListener("pointerup", onPointerUp, true);
    document.addEventListener("pointercancel", onPointerUp, true);
    document.addEventListener("wheel", onWheel, { passive: false, capture: true });
    document.addEventListener("contextmenu", onContextMenu, true);
  }

  textureImg.onload = function () {
    initAutocorrelationSystem();
  };

  textureImg.onerror = function () {
    console.error("Impossible to load texture image:", TEXTURE_SRC);
  };

  textureImg.src = TEXTURE_SRC;
})();
