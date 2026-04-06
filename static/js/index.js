(function () {
  "use strict";

  // =========================================================
  // BASIC PAGE HELPERS
  // =========================================================
  window.scrollToTop = function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  window.copyBibTeX = function () {
    const el = document.getElementById("bibtex-code");
    if (!el) return;
    const text = el.innerText;
    navigator.clipboard.writeText(text).then(() => {
      const btn = document.querySelector(".copy-bibtex-btn .copy-text");
      if (!btn) return;
      const oldText = btn.textContent;
      btn.textContent = "Copied";
      setTimeout(() => {
        btn.textContent = oldText;
      }, 1500);
    });
  };

  // =========================================================
  // SIMPLE CAROUSEL INIT
  // =========================================================
  document.addEventListener("DOMContentLoaded", () => {
    if (window.bulmaCarousel) {
      window.bulmaCarousel.attach("#results-carousel", {
        slidesToScroll: 1,
        slidesToShow: 1,
        loop: true,
        autoplay: true,
        autoplaySpeed: 3500,
        pauseOnHover: true
      });
    }
  });

  // =========================================================
  // INTERACTIVE DEMO
  // =========================================================
  document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("interactive-canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const acorrPreview = document.getElementById("acorr-preview");
    const acorrCanvas = document.getElementById("acorr-canvas");
    const acorrCtx = acorrCanvas.getContext("2d", { willReadFrequently: true });

    const btnGenerate = document.getElementById("btn-generate-texture");
    const btnProjection = document.getElementById("btn-change-projection");
    const btnAutocorr = document.getElementById("btn-toggle-autocorr");

    const projectionModeLabel = document.getElementById("projection-mode-label");
    const patchSizeLabel = document.getElementById("patch-size-label");
    const patchSizeInline = document.getElementById("patch-size-inline");
    const autocorrStateLabel = document.getElementById("autocorr-state-label");
    const contrastSlider = document.getElementById("acorr-contrast");
    const contrastValue = document.getElementById("acorr-contrast-value");

    const state = {
      size: 900,
      sourceCanvas: document.createElement("canvas"),
      sourceCtx: null,
      displayedCanvas: document.createElement("canvas"),
      displayedCtx: null,
      sourceImageData: null,
      displayedImageData: null,
      patchSize: 128,
      contrast: 1.5,
      autocorrEnabled: false,
      projectionModes: ["Affine", "Perspective", "Cylindrical"],
      projectionIndex: 0,
      mouseX: 450,
      mouseY: 450
    };

    state.sourceCanvas.width = state.size;
    state.sourceCanvas.height = state.size;
    state.sourceCtx = state.sourceCanvas.getContext("2d", { willReadFrequently: true });

    state.displayedCanvas.width = state.size;
    state.displayedCanvas.height = state.size;
    state.displayedCtx = state.displayedCanvas.getContext("2d", { willReadFrequently: true });

    // =========================================================
    // UTILS
    // =========================================================
    function clamp(v, a, b) {
      return Math.max(a, Math.min(b, v));
    }

    function lerp(a, b, t) {
      return a + (b - a) * t;
    }

    function normalizeToUint8(arr) {
      let min = Infinity;
      let max = -Infinity;
      for (let i = 0; i < arr.length; i++) {
        const v = arr[i];
        if (v < min) min = v;
        if (v > max) max = v;
      }
      const out = new Uint8ClampedArray(arr.length);
      if (max <= min) return out;
      const scale = 255 / (max - min);
      for (let i = 0; i < arr.length; i++) {
        out[i] = clamp(Math.round((arr[i] - min) * scale), 0, 255);
      }
      return out;
    }

    function canvasToImageData(srcCanvas) {
      const cctx = srcCanvas.getContext("2d", { willReadFrequently: true });
      return cctx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);
    }

    function drawImageDataToCanvas(imageData, destCtx) {
      destCtx.putImageData(imageData, 0, 0);
    }

    function getCanvasMousePos(event, targetCanvas) {
      const rect = targetCanvas.getBoundingClientRect();
      const sx = targetCanvas.width / rect.width;
      const sy = targetCanvas.height / rect.height;
      return {
        x: (event.clientX - rect.left) * sx,
        y: (event.clientY - rect.top) * sy
      };
    }

    function sampleGrayFromImageData(imageData, x, y) {
      const w = imageData.width;
      const h = imageData.height;
      const xi = clamp(Math.round(x), 0, w - 1);
      const yi = clamp(Math.round(y), 0, h - 1);
      const idx = (yi * w + xi) * 4;
      const d = imageData.data;
      return 0.299 * d[idx] + 0.587 * d[idx + 1] + 0.114 * d[idx + 2];
    }

    function extractPatchGray(imageData, cx, cy, patchSize) {
      const half = Math.floor(patchSize / 2);
      const out = new Float64Array(patchSize * patchSize);
      const w = imageData.width;
      const h = imageData.height;

      let k = 0;
      for (let j = 0; j < patchSize; j++) {
        const yy = cy - half + j;
        for (let i = 0; i < patchSize; i++) {
          const xx = cx - half + i;
          if (xx >= 0 && xx < w && yy >= 0 && yy < h) {
            out[k++] = sampleGrayFromImageData(imageData, xx, yy);
          } else {
            out[k++] = 0;
          }
        }
      }
      return out;
    }

    function createImageDataFromGray(gray, w, h) {
      const img = new ImageData(w, h);
      for (let i = 0; i < gray.length; i++) {
        const v = gray[i];
        const idx = i * 4;
        img.data[idx] = v;
        img.data[idx + 1] = v;
        img.data[idx + 2] = v;
        img.data[idx + 3] = 255;
      }
      return img;
    }

    function drawCross(ctx, x, y, color = "#ff0000", size = 4, lineWidth = 1) {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(x - size, y);
      ctx.lineTo(x + size, y);
      ctx.moveTo(x, y - size);
      ctx.lineTo(x, y + size);
      ctx.stroke();
      ctx.restore();
    }
    
    function applyBinaryDilation(gray, w, h, radius) {
      const out = new Uint8ClampedArray(w * h);
    
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          let makeBlack = false;
    
          for (let dy = -radius; dy <= radius && !makeBlack; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const xx = x + dx;
              const yy = y + dy;
    
              if (xx < 0 || xx >= w || yy < 0 || yy >= h) continue;
    
              if (gray[yy * w + xx] === 0) {
                makeBlack = true;
                break;
              }
            }
          }
    
          out[y * w + x] = makeBlack ? 0 : 255;
        }
      }
    
      return out;
}

    // =========================================================
    // TEXTURE GENERATION
    // Equivalent browser version of your binary shifted texture logic
    // =========================================================
    function generateWhiteNoiseAndShifts(w, h, shift1, shift2) {
      const base = new Float64Array(w * h);
      for (let i = 0; i < base.length; i++) {
        base[i] = Math.random() * 2 - 1;
      }
    
      const out = new Float64Array(w * h);
    
      function wrappedIndex(x, y) {
        let xx = x % w;
        let yy = y % h;
        if (xx < 0) xx += w;
        if (yy < 0) yy += h;
        return yy * w + xx;
      }
    
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = y * w + x;
    
          const idx1 = wrappedIndex(x - shift1.x, y - shift1.y);
          const idx2 = wrappedIndex(x - shift2.x, y - shift2.y);
    
          out[idx] = base[idx] + base[idx1] + base[idx2];
        }
      }
    
      return out;
    }
    
    function percentile(values, p) {
      const arr = Array.from(values).sort((a, b) => a - b);
      const idx = Math.floor(clamp(p, 0, 1) * (arr.length - 1));
      return arr[idx];
    }
    
    function genRandomBinaryTexture(w, h, dilationSize, occupancy, angleShiftDeg, normShift) {
      const k = angleShiftDeg * Math.PI / 180.0;
    
      const shift1 = { x: 0, y: Math.round(normShift) };
      const shift2 = {
        x: Math.round(normShift * Math.sin(k)),
        y: Math.round(normShift * Math.cos(k))
      };
    
      const combined = generateWhiteNoiseAndShifts(w, h, shift1, shift2);
    
      // occupancy = proportion de pixels noirs voulue
      // ex: occupancy = 0.18 => environ 18% de pixels noirs avant dilation
      const thr = percentile(combined, occupancy);
    
      const binary = new Uint8ClampedArray(w * h);
    
      for (let i = 0; i < combined.length; i++) {
        binary[i] = combined[i] <= thr ? 0 : 255;
      }
    
      const dilated = applyBinaryDilation(binary, w, h, dilationSize);
      return dilated;
    }
    
    function renderGeneratedTexture() {
      const w = state.size;
      const h = state.size;
    
      const gray = genRandomBinaryTexture(
        w,
        h,
        0.5,      // dilation size
        0.011,   // proportion de noir
        90,     // angle shift
        22      // norm shift
      );
    
      const img = createImageDataFromGray(gray, w, h);
      state.sourceImageData = img;
      state.sourceCtx.putImageData(img, 0, 0);
      applyCurrentProjection();
    }


    // =========================================================
    // PROJECTIONS
    // 1) Affine
    // 2) Perspective
    // 3) Cylindrical
    // =========================================================
    function applyAffineProjection(imageData) {
      const tmpCanvas = document.createElement("canvas");
      tmpCanvas.width = imageData.width;
      tmpCanvas.height = imageData.height;
      const tctx = tmpCanvas.getContext("2d");
      tctx.putImageData(imageData, 0, 0);

      const outCanvas = document.createElement("canvas");
      outCanvas.width = imageData.width;
      outCanvas.height = imageData.height;
      const octx = outCanvas.getContext("2d");

      octx.fillStyle = "white";
      octx.fillRect(0, 0, outCanvas.width, outCanvas.height);

      octx.save();
      octx.translate(outCanvas.width / 2, outCanvas.height / 2);
      octx.rotate(-18 * Math.PI / 180);
      octx.transform(1.12, -0.18, 0.38, 0.95, 0, 0);
      octx.drawImage(tmpCanvas, -outCanvas.width / 2, -outCanvas.height / 2);
      octx.restore();

      return canvasToImageData(outCanvas);
    }

    function applyPerspectiveProjection(imageData) {
      const srcCanvas = document.createElement("canvas");
      srcCanvas.width = imageData.width;
      srcCanvas.height = imageData.height;
      const sctx = srcCanvas.getContext("2d");
      sctx.putImageData(imageData, 0, 0);

      const w = imageData.width;
      const h = imageData.height;
      const out = new ImageData(w, h);
      const src = imageData.data;
      const dst = out.data;

      const cx = w / 2;
      const cy = h / 2;
      const ax = 0.55;
      const ay = -0.15;
      const focal = 1.35;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const xn = (x - cx) / cx;
          const yn = (y - cy) / cy;

          const u = xn / (1 + ax * yn);
          const v = yn / (1 + ay * xn);

          const sx = Math.round((u / focal) * cx + cx);
          const sy = Math.round((v / focal) * cy + cy);

          const di = (y * w + x) * 4;

          if (sx >= 0 && sx < w && sy >= 0 && sy < h) {
            const si = (sy * w + sx) * 4;
            dst[di] = src[si];
            dst[di + 1] = src[si + 1];
            dst[di + 2] = src[si + 2];
            dst[di + 3] = 255;
          } else {
            dst[di] = 255;
            dst[di + 1] = 255;
            dst[di + 2] = 255;
            dst[di + 3] = 255;
          }
        }
      }
      return out;
    }

    function applyCylindricalProjection(imageData) {
      const w = imageData.width;
      const h = imageData.height;
      const src = imageData.data;
      const out = new ImageData(w, h);
      const dst = out.data;

      const cx = w / 2;
      const cy = h / 2;

      const cylinderStrength = 1.05;
      const perspectiveDrop = 0.35;

      for (let y = 0; y < h; y++) {
        const yn = (y - cy) / cy;
        for (let x = 0; x < w; x++) {
          const xn = (x - cx) / cx;

          const theta = xn * cylinderStrength;
          const srcXn = Math.sin(theta) / Math.sin(cylinderStrength);
          const depth = Math.cos(theta);
          const srcYn = yn / (1 + perspectiveDrop * (1 - depth));

          const sx = Math.round(srcXn * cx + cx);
          const sy = Math.round(srcYn * cy + cy);

          const di = (y * w + x) * 4;

          if (sx >= 0 && sx < w && sy >= 0 && sy < h) {
            const si = (sy * w + sx) * 4;
            dst[di] = src[si];
            dst[di + 1] = src[si + 1];
            dst[di + 2] = src[si + 2];
            dst[di + 3] = 255;
          } else {
            dst[di] = 255;
            dst[di + 1] = 255;
            dst[di + 2] = 255;
            dst[di + 3] = 255;
          }
        }
      }

      return out;
    }

    function applyCurrentProjection() {
      if (!state.sourceImageData) return;

      const mode = state.projectionModes[state.projectionIndex];
      let result;

      if (mode === "Affine") {
        result = applyAffineProjection(state.sourceImageData);
      } else if (mode === "Perspective") {
        result = applyPerspectiveProjection(state.sourceImageData);
      } else {
        result = applyCylindricalProjection(state.sourceImageData);
      }

      state.displayedImageData = result;
      state.displayedCtx.putImageData(result, 0, 0);
      redrawMainCanvas();
      projectionModeLabel.textContent = mode;
    }

    function redrawMainCanvas() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (state.displayedImageData) {
        ctx.putImageData(state.displayedImageData, 0, 0);
      }
    }

    // =========================================================
    // AUTOCORRELATION
    // Naive spatial autocorrelation on patch
    // =========================================================
    function computeAutocorrelation2D(grayPatch, n) {
      const out = new Float64Array(n * n);
      const center = Math.floor(n / 2);

      for (let dy = -center; dy <= center; dy++) {
        for (let dx = -center; dx <= center; dx++) {
          let sum = 0.0;
          let energy = 0.0;

          for (let y = 0; y < n; y++) {
            const yy = y + dy;
            if (yy < 0 || yy >= n) continue;

            for (let x = 0; x < n; x++) {
              const xx = x + dx;
              if (xx < 0 || xx >= n) continue;

              const a = grayPatch[y * n + x];
              const b = grayPatch[yy * n + xx];
              sum += a * b;
              energy += a * a;
            }
          }

          const oy = dy + center;
          const ox = dx + center;
          out[oy * n + ox] = energy > 1e-9 ? sum / energy : 0;
        }
      }
      return out;
    }

    function renderAutocorrelationAt(x, y) {
      if (!state.autocorrEnabled || !state.displayedImageData) return;

      const patchSize = state.patchSize;
      const cx = Math.round(x);
      const cy = Math.round(y);

      const patch = extractPatchGray(state.displayedImageData, cx, cy, patchSize);
      let ac = computeAutocorrelation2D(patch, patchSize);

      const contrasted = new Float64Array(ac.length);
      const contrast = state.contrast;
      for (let i = 0; i < ac.length; i++) {
        contrasted[i] = Math.sign(ac[i]) * Math.pow(Math.abs(ac[i]), 1 / contrast);
      }

      const gray = normalizeToUint8(contrasted);
      const img = createImageDataFromGray(gray, patchSize, patchSize);

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = patchSize;
      tempCanvas.height = patchSize;
      const tctx = tempCanvas.getContext("2d");
      tctx.putImageData(img, 0, 0);

      acorrCtx.clearRect(0, 0, acorrCanvas.width, acorrCanvas.height);
      acorrCtx.imageSmoothingEnabled = false;
      acorrCtx.drawImage(tempCanvas, 0, 0, acorrCanvas.width, acorrCanvas.height);

      acorrCtx.save();
      acorrCtx.strokeStyle = "cyan";
      acorrCtx.lineWidth = 1;
      drawCross(acorrCtx, acorrCanvas.width / 2, acorrCanvas.height / 2, "cyan", 5, 1);
      acorrCtx.restore();

      patchSizeLabel.textContent = `Patch: ${patchSize} px`;
      patchSizeInline.textContent = patchSize;
    }

    function updateAutocorrPreviewPosition(clientX, clientY) {
      const pad = 18;
      let left = clientX + pad;
      let top = clientY + pad;

      const rect = acorrPreview.getBoundingClientRect();
      if (left + rect.width > window.innerWidth - 8) {
        left = clientX - rect.width - pad;
      }
      if (top + rect.height > window.innerHeight - 8) {
        top = clientY - rect.height - pad;
      }

      acorrPreview.style.left = `${left}px`;
      acorrPreview.style.top = `${top}px`;
    }

    function refreshAutocorrStateUI() {
      autocorrStateLabel.textContent = state.autocorrEnabled ? "ON" : "OFF";
      acorrPreview.style.display = state.autocorrEnabled ? "block" : "none";
    }

    // =========================================================
    // EVENTS
    // =========================================================
    btnGenerate.addEventListener("click", () => {
      renderGeneratedTexture();
    });

    btnProjection.addEventListener("click", () => {
      state.projectionIndex = (state.projectionIndex + 1) % state.projectionModes.length;
      applyCurrentProjection();
      if (state.autocorrEnabled) {
        renderAutocorrelationAt(state.mouseX, state.mouseY);
      }
    });

    btnAutocorr.addEventListener("click", () => {
      state.autocorrEnabled = !state.autocorrEnabled;
      refreshAutocorrStateUI();
      if (state.autocorrEnabled) {
        renderAutocorrelationAt(state.mouseX, state.mouseY);
      }
    });

    contrastSlider.addEventListener("input", () => {
      state.contrast = parseFloat(contrastSlider.value);
      contrastValue.textContent = `${state.contrast.toFixed(1)}×`;
      if (state.autocorrEnabled) {
        renderAutocorrelationAt(state.mouseX, state.mouseY);
      }
    });

    canvas.addEventListener("mousemove", (event) => {
      const pos = getCanvasMousePos(event, canvas);
      state.mouseX = pos.x;
      state.mouseY = pos.y;

      if (state.autocorrEnabled) {
        updateAutocorrPreviewPosition(event.clientX, event.clientY);
        renderAutocorrelationAt(pos.x, pos.y);
      }
    });

    canvas.addEventListener("mouseenter", (event) => {
      if (state.autocorrEnabled) {
        acorrPreview.style.display = "block";
        updateAutocorrPreviewPosition(event.clientX, event.clientY);
      }
    });

    canvas.addEventListener("mouseleave", () => {
      acorrPreview.style.display = "none";
    });

    canvas.addEventListener("wheel", (event) => {
      if (!state.autocorrEnabled) return;
      event.preventDefault();

      const step = event.deltaY < 0 ? 8 : -8;
      state.patchSize = clamp(state.patchSize + step, 32, 256);

      if (state.patchSize % 2 !== 0) {
        state.patchSize += 1;
      }

      patchSizeLabel.textContent = `Patch: ${state.patchSize} px`;
      patchSizeInline.textContent = state.patchSize;

      renderAutocorrelationAt(state.mouseX, state.mouseY);
    }, { passive: false });

    window.addEventListener("resize", () => {
      if (state.autocorrEnabled) {
        renderAutocorrelationAt(state.mouseX, state.mouseY);
      }
    });

    // =========================================================
    // INIT
    // =========================================================
    contrastValue.textContent = `${state.contrast.toFixed(1)}×`;
    projectionModeLabel.textContent = state.projectionModes[state.projectionIndex];
    patchSizeLabel.textContent = `Patch: ${state.patchSize} px`;
    patchSizeInline.textContent = state.patchSize;
    refreshAutocorrStateUI();
    renderGeneratedTexture();
  });
})();
