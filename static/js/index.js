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
    const btnResetParams = document.getElementById("btn-reset-params");

    const projectionModeLabel = document.getElementById("projection-mode-label");
    const patchSizeLabel = document.getElementById("patch-size-label");
    const patchSizeInline = document.getElementById("patch-size-inline");
    const autocorrStateLabel = document.getElementById("autocorr-state-label");
    const acorrModeLabel = document.getElementById("acorr-mode-label");

    const contrastSlider = document.getElementById("acorr-contrast");
    const contrastValue = document.getElementById("acorr-contrast-value");

    const texOccupancy = document.getElementById("tex-occupancy");
    const texDilation = document.getElementById("tex-dilation");
    const texAngle = document.getElementById("tex-angle");
    const texShift = document.getElementById("tex-shift");
    const patchSizeControl = document.getElementById("patch-size-control");

    const valOccupancy = document.getElementById("val-occupancy");
    const valDilation = document.getElementById("val-dilation");
    const valAngle = document.getElementById("val-angle");
    const valShift = document.getElementById("val-shift");
    const valPatchSlider = document.getElementById("val-patch-slider");

    const panelAffine = document.getElementById("panel-affine");
    const panelPerspective = document.getElementById("panel-perspective");
    const panelCylindrical = document.getElementById("panel-cylindrical");

    const controlIds = [
      "param-a-rot", "param-a-scalex", "param-a-scaley", "param-a-shearx", "param-a-sheary",
      "param-p-tiltx", "param-p-tilty", "param-p-focal", "param-p-zrot",
      "param-c-curv", "param-c-drop", "param-c-zrot", "param-c-vstretch"
    ];

    const controls = {};
    controlIds.forEach((id) => {
      controls[id] = document.getElementById(id);
    });

    const values = {
      aRot: document.getElementById("val-a-rot"),
      aScaleX: document.getElementById("val-a-scalex"),
      aScaleY: document.getElementById("val-a-scaley"),
      aShearX: document.getElementById("val-a-shearx"),
      aShearY: document.getElementById("val-a-sheary"),
      pTiltX: document.getElementById("val-p-tiltx"),
      pTiltY: document.getElementById("val-p-tilty"),
      pFocal: document.getElementById("val-p-focal"),
      pZRot: document.getElementById("val-p-zrot"),
      cCurv: document.getElementById("val-c-curv"),
      cDrop: document.getElementById("val-c-drop"),
      cZRot: document.getElementById("val-c-zrot"),
      cVStretch: document.getElementById("val-c-vstretch")
    };

    const DEFAULTS = {
      texture: {
        occupancy: 0.16,
        dilation: 1,
        angleShiftDeg: 90,
        normShift: 22
      },
      affine: {
        rotationDeg: -18,
        scaleX: 0.90,
        scaleY: 0.95,
        shearX: 0.38,
        shearY: -0.18
      },
      perspective: {
        tiltX: 0.55,
        tiltY: -0.15,
        focalScale: 1.25,
        zRotationDeg: 0
      },
      cylindrical: {
        curvature: 1.05,
        perspectiveDrop: 0.35,
        zRotationDeg: 0,
        verticalStretch: 1.00
      }
    };

    const state = {
      size: 900,
      sourceCanvas: document.createElement("canvas"),
      sourceCtx: null,
      displayedCanvas: document.createElement("canvas"),
      displayedCtx: null,
      sourceImageData: null,
      displayedImageData: null,
      patchSize: 60,
      previewContrast: 1.5,
      autocorrEnabled: false,
      projectionModes: ["Affine", "Perspective", "Cylindrical"],
      projectionIndex: 0,
      mouseX: 450,
      mouseY: 450,
      displayMode: "autocorr",
      texture: { ...DEFAULTS.texture },
      affine: { ...DEFAULTS.affine },
      perspective: { ...DEFAULTS.perspective },
      cylindrical: { ...DEFAULTS.cylindrical },
      previewComputeSize: 64
    };

    let canvasHovered = false;
    let rafPreview = null;

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

    function degToRad(deg) {
      return deg * Math.PI / 180;
    }

    function rotate2D(x, y, angleRad) {
      const c = Math.cos(angleRad);
      const s = Math.sin(angleRad);
      return {
        x: c * x - s * y,
        y: s * x + c * y
      };
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

      if (max <= min) {
        return out;
      }

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

    function getCanvasMousePos(event, targetCanvas) {
      const rect = targetCanvas.getBoundingClientRect();
      const sx = targetCanvas.width / rect.width;
      const sy = targetCanvas.height / rect.height;

      return {
        x: (event.clientX - rect.left) * sx,
        y: (event.clientY - rect.top) * sy
      };
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

    function drawCross(targetCtx, x, y, color = "#00ffff", size = 5, lineWidth = 1) {
      targetCtx.save();
      targetCtx.strokeStyle = color;
      targetCtx.lineWidth = lineWidth;
      targetCtx.beginPath();
      targetCtx.moveTo(x - size, y);
      targetCtx.lineTo(x + size, y);
      targetCtx.moveTo(x, y - size);
      targetCtx.lineTo(x, y + size);
      targetCtx.stroke();
      targetCtx.restore();
    }

    function applyDisplayContrast(arr, contrast) {
      const out = new Float64Array(arr.length);
      const gamma = 1 / contrast;

      for (let i = 0; i < arr.length; i++) {
        const v = arr[i];
        out[i] = Math.sign(v) * Math.pow(Math.abs(v), gamma);
      }

      return out;
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
      acorrModeLabel.textContent =
        state.displayMode === "laplacian"
          ? "Laplacian of Autocorrelation"
          : "Autocorrelation";
      patchSizeLabel.textContent = `Patch: ${state.patchSize} px`;
      patchSizeInline.textContent = state.patchSize;
    }

    function refreshProjectionPanels() {
      const mode = state.projectionModes[state.projectionIndex];
      panelAffine.classList.toggle("is-active", mode === "Affine");
      panelPerspective.classList.toggle("is-active", mode === "Perspective");
      panelCylindrical.classList.toggle("is-active", mode === "Cylindrical");
      projectionModeLabel.textContent = mode;
    }

    function refreshControlLabels() {
      valOccupancy.textContent = state.texture.occupancy.toFixed(2);
      valDilation.textContent = String(state.texture.dilation);
      valAngle.textContent = `${state.texture.angleShiftDeg}°`;
      valShift.textContent = String(state.texture.normShift);
      valPatchSlider.textContent = `${state.patchSize} px`;

      values.aRot.textContent = `${state.affine.rotationDeg}°`;
      values.aScaleX.textContent = state.affine.scaleX.toFixed(2);
      values.aScaleY.textContent = state.affine.scaleY.toFixed(2);
      values.aShearX.textContent = state.affine.shearX.toFixed(2);
      values.aShearY.textContent = state.affine.shearY.toFixed(2);

      values.pTiltX.textContent = state.perspective.tiltX.toFixed(2);
      values.pTiltY.textContent = state.perspective.tiltY.toFixed(2);
      values.pFocal.textContent = state.perspective.focalScale.toFixed(2);
      values.pZRot.textContent = `${state.perspective.zRotationDeg}°`;

      values.cCurv.textContent = state.cylindrical.curvature.toFixed(2);
      values.cDrop.textContent = state.cylindrical.perspectiveDrop.toFixed(2);
      values.cZRot.textContent = `${state.cylindrical.zRotationDeg}°`;
      values.cVStretch.textContent = state.cylindrical.verticalStretch.toFixed(2);

      contrastValue.textContent = `${state.previewContrast.toFixed(1)}×`;
      patchSizeLabel.textContent = `Patch: ${state.patchSize} px`;
      patchSizeInline.textContent = state.patchSize;
    }

    function syncControlsFromState() {
      texOccupancy.value = String(state.texture.occupancy);
      texDilation.value = String(state.texture.dilation);
      texAngle.value = String(state.texture.angleShiftDeg);
      texShift.value = String(state.texture.normShift);
      patchSizeControl.value = String(state.patchSize);

      controls["param-a-rot"].value = String(state.affine.rotationDeg);
      controls["param-a-scalex"].value = String(state.affine.scaleX);
      controls["param-a-scaley"].value = String(state.affine.scaleY);
      controls["param-a-shearx"].value = String(state.affine.shearX);
      controls["param-a-sheary"].value = String(state.affine.shearY);

      controls["param-p-tiltx"].value = String(state.perspective.tiltX);
      controls["param-p-tilty"].value = String(state.perspective.tiltY);
      controls["param-p-focal"].value = String(state.perspective.focalScale);
      controls["param-p-zrot"].value = String(state.perspective.zRotationDeg);

      controls["param-c-curv"].value = String(state.cylindrical.curvature);
      controls["param-c-drop"].value = String(state.cylindrical.perspectiveDrop);
      controls["param-c-zrot"].value = String(state.cylindrical.zRotationDeg);
      controls["param-c-vstretch"].value = String(state.cylindrical.verticalStretch);

      contrastSlider.value = String(state.previewContrast);
      refreshControlLabels();
      refreshProjectionPanels();
      refreshAutocorrStateUI();
    }

    function updateStateFromControls() {
      state.texture.occupancy = parseFloat(texOccupancy.value);
      state.texture.dilation = parseInt(texDilation.value, 10);
      state.texture.angleShiftDeg = parseInt(texAngle.value, 10);
      state.texture.normShift = parseInt(texShift.value, 10);
      state.patchSize = clamp(parseInt(patchSizeControl.value, 10), 32, 128);

      state.affine.rotationDeg = parseInt(controls["param-a-rot"].value, 10);
      state.affine.scaleX = parseFloat(controls["param-a-scalex"].value);
      state.affine.scaleY = parseFloat(controls["param-a-scaley"].value);
      state.affine.shearX = parseFloat(controls["param-a-shearx"].value);
      state.affine.shearY = parseFloat(controls["param-a-sheary"].value);

      state.perspective.tiltX = parseFloat(controls["param-p-tiltx"].value);
      state.perspective.tiltY = parseFloat(controls["param-p-tilty"].value);
      state.perspective.focalScale = parseFloat(controls["param-p-focal"].value);
      state.perspective.zRotationDeg = parseInt(controls["param-p-zrot"].value, 10);

      state.cylindrical.curvature = parseFloat(controls["param-c-curv"].value);
      state.cylindrical.perspectiveDrop = parseFloat(controls["param-c-drop"].value);
      state.cylindrical.zRotationDeg = parseInt(controls["param-c-zrot"].value, 10);
      state.cylindrical.verticalStretch = parseFloat(controls["param-c-vstretch"].value);

      refreshControlLabels();
    }

    function schedulePreviewRender() {
      if (!state.autocorrEnabled || !state.displayedImageData) return;
      if (rafPreview !== null) return;

      rafPreview = window.requestAnimationFrame(() => {
        rafPreview = null;
        renderAutocorrelationAt(state.mouseX, state.mouseY);
      });
    }

    // =========================================================
    // TEXTURE GENERATION
    // =========================================================
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
      const k = degToRad(angleShiftDeg);

      const shift1 = { x: 0, y: Math.round(normShift) };
      const shift2 = {
        x: Math.round(normShift * Math.sin(k)),
        y: Math.round(normShift * Math.cos(k))
      };

      const combined = generateWhiteNoiseAndShifts(w, h, shift1, shift2);
      const thr = percentile(combined, occupancy);

      const binary = new Uint8ClampedArray(w * h);
      for (let i = 0; i < combined.length; i++) {
        binary[i] = combined[i] <= thr ? 0 : 255;
      }

      return applyBinaryDilation(binary, w, h, dilationSize);
    }

    function renderGeneratedTexture() {
      const w = state.size;
      const h = state.size;

      const gray = genRandomBinaryTexture(
        w,
        h,
        state.texture.dilation,
        state.texture.occupancy,
        state.texture.angleShiftDeg,
        state.texture.normShift
      );

      const img = createImageDataFromGray(gray, w, h);
      state.sourceImageData = img;
      state.sourceCtx.putImageData(img, 0, 0);

      applyCurrentProjection();
    }

    // =========================================================
    // PROJECTIONS
    // =========================================================
    function applyAffineProjection(imageData) {
      const tmpCanvas = document.createElement("canvas");
      tmpCanvas.width = imageData.width;
      tmpCanvas.height = imageData.height;
      tmpCanvas.getContext("2d").putImageData(imageData, 0, 0);

      const outCanvas = document.createElement("canvas");
      outCanvas.width = imageData.width;
      outCanvas.height = imageData.height;
      const octx = outCanvas.getContext("2d");

      octx.fillStyle = "white";
      octx.fillRect(0, 0, outCanvas.width, outCanvas.height);

      octx.save();
      octx.translate(outCanvas.width / 2, outCanvas.height / 2);
      octx.rotate(degToRad(state.affine.rotationDeg));
      octx.transform(
        state.affine.scaleX,
        state.affine.shearY,
        state.affine.shearX,
        state.affine.scaleY,
        0,
        0
      );
      octx.drawImage(tmpCanvas, -outCanvas.width / 2, -outCanvas.height / 2);
      octx.restore();

      return canvasToImageData(outCanvas);
    }

    function applyPerspectiveProjection(imageData) {
      const w = imageData.width;
      const h = imageData.height;
      const out = new ImageData(w, h);
      const src = imageData.data;
      const dst = out.data;

      const cx = w / 2;
      const cy = h / 2;

      const tiltX = state.perspective.tiltX;
      const tiltY = state.perspective.tiltY;
      const focalScale = state.perspective.focalScale;
      const zRot = degToRad(state.perspective.zRotationDeg);

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const xn = (x - cx) / cx;
          const yn = (y - cy) / cy;

          const p = rotate2D(xn, yn, -zRot);
          const xr = p.x;
          const yr = p.y;

          const denomX = 1 + tiltX * yr;
          const denomY = 1 + tiltY * xr;

          const srcXn = (xr / focalScale) / denomX;
          const srcYn = (yr / focalScale) / denomY;

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

    function applyCylindricalProjection(imageData) {
      const w = imageData.width;
      const h = imageData.height;
      const src = imageData.data;
      const out = new ImageData(w, h);
      const dst = out.data;

      const cx = w / 2;
      const cy = h / 2;

      const curvature = Math.max(0.001, state.cylindrical.curvature);
      const perspectiveDrop = state.cylindrical.perspectiveDrop;
      const zRot = degToRad(state.cylindrical.zRotationDeg);
      const vStretch = state.cylindrical.verticalStretch;

      const denomSin = Math.sin(curvature);
      const safeDenom = Math.abs(denomSin) < 1e-6 ? 1e-6 : denomSin;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const xn = (x - cx) / cx;
          const yn = (y - cy) / cy;

          const p = rotate2D(xn, yn, -zRot);
          const xr = p.x;
          const yr = p.y;

          const theta = xr * curvature;
          const srcXn = Math.sin(theta) / safeDenom;
          const depth = Math.cos(theta);
          const srcYn = (yr * vStretch) / (1 + perspectiveDrop * (1 - depth));

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

      if (state.autocorrEnabled) {
        schedulePreviewRender();
      }
    }

    function redrawMainCanvas() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (state.displayedImageData) {
        ctx.putImageData(state.displayedImageData, 0, 0);
      }

      if (state.autocorrEnabled) {
        const half = Math.floor(state.patchSize / 2);
        const x = Math.round(state.mouseX) - half;
        const y = Math.round(state.mouseY) - half;

        ctx.save();
        ctx.strokeStyle = "#00bcd4";
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 0.5, y + 0.5, state.patchSize, state.patchSize);
        ctx.restore();
      }
    }

    // =========================================================
    // AUTOCORRELATION
    // =========================================================
    function extractPatchGrayResampled(imageData, cx, cy, patchSize, targetSize) {
      const out = new Float64Array(targetSize * targetSize);
      const half = patchSize / 2;
      const w = imageData.width;
      const h = imageData.height;
      const data = imageData.data;

      let k = 0;
      for (let j = 0; j < targetSize; j++) {
        const v = (j + 0.5) / targetSize;
        const yy = cy - half + v * patchSize;

        for (let i = 0; i < targetSize; i++) {
          const u = (i + 0.5) / targetSize;
          const xx = cx - half + u * patchSize;

          const xi = clamp(Math.round(xx), 0, w - 1);
          const yi = clamp(Math.round(yy), 0, h - 1);
          const idx = (yi * w + xi) * 4;

          out[k++] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        }
      }

      return out;
    }

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

          out[(dy + center) * n + (dx + center)] = energy > 1e-9 ? sum / energy : 0;
        }
      }

      return out;
    }

    function computeLaplacian2D(arr, w, h) {
      const out = new Float64Array(w * h);

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const c = arr[y * w + x];
          const left = arr[y * w + clamp(x - 1, 0, w - 1)];
          const right = arr[y * w + clamp(x + 1, 0, w - 1)];
          const up = arr[clamp(y - 1, 0, h - 1) * w + x];
          const down = arr[clamp(y + 1, 0, h - 1) * w + x];
          out[y * w + x] = left + right + up + down - 4 * c;
        }
      }

      return out;
    }

    function renderAutocorrelationAt(x, y) {
      if (!state.autocorrEnabled || !state.displayedImageData) return;

      const patchSize = state.patchSize;
      const computeSize = Math.min(state.previewComputeSize, patchSize);
      const cx = Math.round(x);
      const cy = Math.round(y);

      const patch = extractPatchGrayResampled(
        state.displayedImageData,
        cx,
        cy,
        patchSize,
        computeSize
      );

      const ac = computeAutocorrelation2D(patch, computeSize);

      const displayField =
        state.displayMode === "laplacian"
          ? computeLaplacian2D(ac, computeSize, computeSize)
          : ac;

      const contrasted = applyDisplayContrast(displayField, state.previewContrast);
      const gray = normalizeToUint8(contrasted);
      const img = createImageDataFromGray(gray, computeSize, computeSize);

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = computeSize;
      tempCanvas.height = computeSize;
      tempCanvas.getContext("2d").putImageData(img, 0, 0);

      acorrCtx.clearRect(0, 0, acorrCanvas.width, acorrCanvas.height);
      acorrCtx.imageSmoothingEnabled = false;
      acorrCtx.drawImage(tempCanvas, 0, 0, acorrCanvas.width, acorrCanvas.height);

      drawCross(
        acorrCtx,
        acorrCanvas.width / 2,
        acorrCanvas.height / 2,
        "#00ffff",
        5,
        1
      );

      acorrModeLabel.textContent =
        state.displayMode === "laplacian"
          ? "Laplacian of Autocorrelation"
          : "Autocorrelation";

      patchSizeLabel.textContent = `Patch: ${patchSize} px`;
      patchSizeInline.textContent = patchSize;

      redrawMainCanvas();
    }

    // =========================================================
    // PARAMETER ACTIONS
    // =========================================================
    function resetCurrentProjectionParams() {
      const mode = state.projectionModes[state.projectionIndex];

      if (mode === "Affine") {
        state.affine = { ...DEFAULTS.affine };
      } else if (mode === "Perspective") {
        state.perspective = { ...DEFAULTS.perspective };
      } else {
        state.cylindrical = { ...DEFAULTS.cylindrical };
      }

      syncControlsFromState();
      applyCurrentProjection();
    }

    function cycleProjectionMode() {
      state.projectionIndex = (state.projectionIndex + 1) % state.projectionModes.length;
      refreshProjectionPanels();
      applyCurrentProjection();
    }

    function updatePreviewContrast(delta) {
      state.previewContrast = clamp(
        Math.round((state.previewContrast + delta) * 10) / 10,
        0.4,
        4.0
      );
      contrastSlider.value = String(state.previewContrast);
      refreshControlLabels();

      if (state.autocorrEnabled) {
        schedulePreviewRender();
      }
    }

    // =========================================================
    // EVENTS
    // =========================================================
    btnGenerate.addEventListener("click", () => {
      updateStateFromControls();
      renderGeneratedTexture();
    });

    btnProjection.addEventListener("click", () => {
      cycleProjectionMode();
    });

    btnAutocorr.addEventListener("click", () => {
      state.autocorrEnabled = !state.autocorrEnabled;
      refreshAutocorrStateUI();

      if (state.autocorrEnabled) {
        renderAutocorrelationAt(state.mouseX, state.mouseY);
      } else {
        redrawMainCanvas();
      }
    });

    btnResetParams.addEventListener("click", () => {
      resetCurrentProjectionParams();
    });

    contrastSlider.addEventListener("input", () => {
      state.previewContrast = parseFloat(contrastSlider.value);
      refreshControlLabels();
      if (state.autocorrEnabled) {
        schedulePreviewRender();
      }
    });

    patchSizeControl.addEventListener("input", () => {
      updateStateFromControls();
      refreshControlLabels();
      if (state.autocorrEnabled) {
        schedulePreviewRender();
      } else {
        redrawMainCanvas();
      }
    });

    [texOccupancy, texDilation, texAngle, texShift].forEach((el) => {
      el.addEventListener("input", () => {
        updateStateFromControls();
        renderGeneratedTexture();
      });
    });

    controlIds.forEach((id) => {
      controls[id].addEventListener("input", () => {
        updateStateFromControls();
        applyCurrentProjection();
      });
    });

    canvas.addEventListener("mousemove", (event) => {
      const pos = getCanvasMousePos(event, canvas);
      state.mouseX = pos.x;
      state.mouseY = pos.y;

      if (state.autocorrEnabled) {
        updateAutocorrPreviewPosition(event.clientX, event.clientY);
        schedulePreviewRender();
      } else {
        redrawMainCanvas();
      }
    });

    canvas.addEventListener("mouseenter", (event) => {
      canvasHovered = true;

      if (state.autocorrEnabled) {
        acorrPreview.style.display = "block";
        updateAutocorrPreviewPosition(event.clientX, event.clientY);
        renderAutocorrelationAt(state.mouseX, state.mouseY);
      }
    });

    canvas.addEventListener("mouseleave", () => {
      canvasHovered = false;
      if (state.autocorrEnabled) {
        acorrPreview.style.display = "none";
      }
      redrawMainCanvas();
    });

    canvas.addEventListener("wheel", (event) => {
      if (!state.autocorrEnabled) return;

      event.preventDefault();

      const step = event.deltaY < 0 ? 4 : -4;
      let next = clamp(state.patchSize + step, 32, 128);

      if (next % 2 !== 0) {
        next += step > 0 ? 1 : -1;
        next = clamp(next, 32, 128);
      }

      state.patchSize = next;
      patchSizeControl.value = String(state.patchSize);
      refreshControlLabels();
      schedulePreviewRender();
    }, { passive: false });

    window.addEventListener("keydown", (event) => {
      if (!state.autocorrEnabled || !canvasHovered) return;

      if (event.key === "ArrowRight") {
        event.preventDefault();
        updatePreviewContrast(0.1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        updatePreviewContrast(-0.1);
      } else if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        state.displayMode = state.displayMode === "autocorr" ? "laplacian" : "autocorr";
        refreshAutocorrStateUI();
        schedulePreviewRender();
      }
    });

    window.addEventListener("resize", () => {
      if (state.autocorrEnabled) {
        schedulePreviewRender();
      }
    });

    // =========================================================
    // INIT
    // =========================================================
    syncControlsFromState();
    renderGeneratedTexture();
  });
})();
