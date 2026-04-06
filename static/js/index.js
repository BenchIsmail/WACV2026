(function () {
  "use strict";

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
    const acorrModeLabel = document.getElementById("acorr-mode-label");
    const acorrModeInline = document.getElementById("acorr-mode-inline");

    const perspTiltXLabel = document.getElementById("persp-tilt-x-label");
    const perspTiltYLabel = document.getElementById("persp-tilt-y-label");

    const affineRotZLabel = document.getElementById("affine-rot-z-label");
    const affineTiltLabel = document.getElementById("affine-tilt-label");
    const affineOrientLabel = document.getElementById("affine-orient-label");

    const cylRotZLabel = document.getElementById("cyl-rot-z-label");

    const state = {
      size: 900,
      sourceCanvas: document.createElement("canvas"),
      sourceCtx: null,
      displayedCanvas: document.createElement("canvas"),
      displayedCtx: null,
      sourceImageData: null,
      displayedImageData: null,
      patchSize: 60,
      autocorrEnabled: false,
      projectionModes: ["Affine", "Perspective", "Cylindrical"],
      projectionIndex: 0,
      mouseX: 450,
      mouseY: 450,
      displayMode: "autocorr",
      peakThresholdRatio: 0.25,

      texture: {
        dotSize: 3,
        cellSize: 3,
        occupancy: 0.12,
        angleShiftDeg: 90,
        normShiftPx: 24
      },

      perspective: {
        tiltXDeg: 25,
        tiltYDeg: -8,
        focal: 1.35
      },

      affine: {
        rotZDeg: -18,
        tilt: 0.28,
        orientDeg: 32
      },

      cylindrical: {
        rotZDeg: 0,
        cylinderStrength: 1.05,
        perspectiveDrop: 0.35
      }
    };

    let canvasHovered = false;

    state.sourceCanvas.width = state.size;
    state.sourceCanvas.height = state.size;
    state.sourceCtx = state.sourceCanvas.getContext("2d", { willReadFrequently: true });

    state.displayedCanvas.width = state.size;
    state.displayedCanvas.height = state.size;
    state.displayedCtx = state.displayedCanvas.getContext("2d", { willReadFrequently: true });

    function clamp(v, a, b) {
      return Math.max(a, Math.min(b, v));
    }

    function degToRad(d) {
      return d * Math.PI / 180;
    }

    function wrapAngleDeg(d) {
      let x = d;
      while (x > 180) x -= 360;
      while (x < -180) x += 360;
      return x;
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

    function thresholdAndNormalize(arr, ratio) {
      const out = new Uint8ClampedArray(arr.length);

      let minVal = Infinity;
      let maxVal = -Infinity;
      for (let i = 0; i < arr.length; i++) {
        const v = arr[i];
        if (v < minVal) minVal = v;
        if (v > maxVal) maxVal = v;
      }

      if (!(maxVal > minVal)) {
        return out;
      }

      const threshold = minVal + ratio * (maxVal - minVal);

      let keptMin = Infinity;
      let keptMax = -Infinity;
      for (let i = 0; i < arr.length; i++) {
        const v = arr[i];
        if (v >= threshold) {
          if (v < keptMin) keptMin = v;
          if (v > keptMax) keptMax = v;
        }
      }

      if (!(keptMax > keptMin)) {
        for (let i = 0; i < arr.length; i++) {
          out[i] = arr[i] >= threshold ? 255 : 0;
        }
        return out;
      }

      const scale = 255 / (keptMax - keptMin);
      for (let i = 0; i < arr.length; i++) {
        const v = arr[i];
        out[i] = v < threshold ? 0 : clamp(Math.round((v - keptMin) * scale), 0, 255);
      }

      return out;
    }

    function computeAutocorrelation2D(grayPatch, n) {
      const out = new Float64Array(n * n);
      const center = Math.floor(n / 2);

      let mean = 0;
      for (let i = 0; i < grayPatch.length; i++) mean += grayPatch[i];
      mean /= grayPatch.length;

      const centered = new Float64Array(grayPatch.length);
      for (let i = 0; i < grayPatch.length; i++) {
        centered[i] = grayPatch[i] - mean;
      }

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

              const a = centered[y * n + x];
              const b = centered[yy * n + xx];
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

    function updateLabels() {
      projectionModeLabel.textContent = state.projectionModes[state.projectionIndex];
      patchSizeLabel.textContent = `Patch: ${state.patchSize} px`;
      patchSizeInline.textContent = String(state.patchSize);
      autocorrStateLabel.textContent = state.autocorrEnabled ? "ON" : "OFF";
      contrastValue.textContent = `${state.peakThresholdRatio.toFixed(2)}·max`;

      const acText = state.displayMode === "laplacian"
        ? "Laplacian of Autocorrelation"
        : "Autocorrelation";
      acorrModeLabel.textContent = acText;
      acorrModeInline.textContent = acText;

      perspTiltXLabel.textContent = `${state.perspective.tiltXDeg}°`;
      perspTiltYLabel.textContent = `${state.perspective.tiltYDeg}°`;

      affineRotZLabel.textContent = `${state.affine.rotZDeg}°`;
      affineTiltLabel.textContent = state.affine.tilt.toFixed(2);
      affineOrientLabel.textContent = `${state.affine.orientDeg}°`;

      cylRotZLabel.textContent = `${state.cylindrical.rotZDeg}°`;
    }

    function refreshAutocorrStateUI() {
      acorrPreview.style.display = state.autocorrEnabled ? "block" : "none";
      updateLabels();
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

    function build3x3Texture(w, h) {
      const cell = state.texture.cellSize;
      const gw = Math.ceil(w / cell);
      const gh = Math.ceil(h / cell);

      const angle = degToRad(state.texture.angleShiftDeg);
      const shiftPix = state.texture.normShiftPx;
      const shiftCells = Math.max(1, Math.round(shiftPix / cell));

      const shift1 = { x: 0, y: shiftCells };
      const shift2 = {
        x: Math.round(shiftCells * Math.sin(angle)),
        y: Math.round(shiftCells * Math.cos(angle))
      };

      const combined = generateWhiteNoiseAndShifts(gw, gh, shift1, shift2);
      const thr = percentile(combined, state.texture.occupancy);

      const coarse = new Uint8ClampedArray(gw * gh);
      for (let i = 0; i < combined.length; i++) {
        coarse[i] = combined[i] <= thr ? 0 : 255;
      }

      const gray = new Uint8ClampedArray(w * h);

      for (let gy = 0; gy < gh; gy++) {
        for (let gx = 0; gx < gw; gx++) {
          const v = coarse[gy * gw + gx];
          const x0 = gx * cell;
          const y0 = gy * cell;

          for (let yy = y0; yy < y0 + cell && yy < h; yy++) {
            for (let xx = x0; xx < x0 + cell && xx < w; xx++) {
              gray[yy * w + xx] = v;
            }
          }
        }
      }

      return gray;
    }

    function renderGeneratedTexture() {
      const w = state.size;
      const h = state.size;
      const gray = build3x3Texture(w, h);
      const img = createImageDataFromGray(gray, w, h);
      state.sourceImageData = img;
      state.sourceCtx.putImageData(img, 0, 0);
      applyCurrentProjection();
    }

    function sampleSourceRGBA(imageData, x, y) {
      const w = imageData.width;
      const h = imageData.height;
      const xi = Math.round(x);
      const yi = Math.round(y);

      if (xi < 0 || xi >= w || yi < 0 || yi >= h) {
        return [255, 255, 255, 255];
      }

      const idx = (yi * w + xi) * 4;
      const d = imageData.data;
      return [d[idx], d[idx + 1], d[idx + 2], 255];
    }

    function rotatePoint(x, y, angleRad) {
      const c = Math.cos(angleRad);
      const s = Math.sin(angleRad);
      return {
        x: c * x - s * y,
        y: s * x + c * y
      };
    }

    function applyAffineProjection(imageData) {
      const w = imageData.width;
      const h = imageData.height;
      const out = new ImageData(w, h);

      const cx = w / 2;
      const cy = h / 2;

      const rotZ = degToRad(state.affine.rotZDeg);
      const orient = degToRad(state.affine.orientDeg);
      const tilt = state.affine.tilt;

      const cu = Math.cos(orient);
      const su = Math.sin(orient);

      const a1 = 1 + tilt;
      const a2 = 1 - 0.45 * tilt;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const xn = (x - cx) / cx;
          const yn = (y - cy) / cy;

          const p0 = rotatePoint(xn, yn, -rotZ);

          const u = cu * p0.x + su * p0.y;
          const v = -su * p0.x + cu * p0.y;

          const uu = u / a1;
          const vv = v / a2;

          const srcDirX = cu * uu - su * vv;
          const srcDirY = su * uu + cu * vv;

          const sx = srcDirX * cx + cx;
          const sy = srcDirY * cy + cy;

          const di = (y * w + x) * 4;
          const rgba = sampleSourceRGBA(imageData, sx, sy);

          out.data[di] = rgba[0];
          out.data[di + 1] = rgba[1];
          out.data[di + 2] = rgba[2];
          out.data[di + 3] = 255;
        }
      }

      return out;
    }

    function applyPerspectiveProjection(imageData) {
      const w = imageData.width;
      const h = imageData.height;
      const out = new ImageData(w, h);

      const cx = w / 2;
      const cy = h / 2;

      const ax = Math.tan(degToRad(state.perspective.tiltXDeg));
      const ay = Math.tan(degToRad(state.perspective.tiltYDeg));
      const focal = state.perspective.focal;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const xn = (x - cx) / cx;
          const yn = (y - cy) / cy;

          const denomX = 1 + ax * yn;
          const denomY = 1 + ay * xn;

          const u = xn / denomX;
          const v = yn / denomY;

          const sx = (u / focal) * cx + cx;
          const sy = (v / focal) * cy + cy;

          const di = (y * w + x) * 4;
          const rgba = sampleSourceRGBA(imageData, sx, sy);

          out.data[di] = rgba[0];
          out.data[di + 1] = rgba[1];
          out.data[di + 2] = rgba[2];
          out.data[di + 3] = 255;
        }
      }

      return out;
    }

    function applyCylindricalProjection(imageData) {
      const w = imageData.width;
      const h = imageData.height;
      const out = new ImageData(w, h);

      const cx = w / 2;
      const cy = h / 2;

      const rotZ = degToRad(state.cylindrical.rotZDeg);
      const cylinderStrength = state.cylindrical.cylinderStrength;
      const perspectiveDrop = state.cylindrical.perspectiveDrop;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const xn0 = (x - cx) / cx;
          const yn0 = (y - cy) / cy;

          const p = rotatePoint(xn0, yn0, -rotZ);

          const theta = p.x * cylinderStrength;
          const sinDen = Math.sin(cylinderStrength);
          const srcXn = Math.abs(sinDen) < 1e-9 ? p.x : Math.sin(theta) / sinDen;
          const depth = Math.cos(theta);
          const srcYn = p.y / (1 + perspectiveDrop * (1 - depth));

          const sx = srcXn * cx + cx;
          const sy = srcYn * cy + cy;

          const di = (y * w + x) * 4;
          const rgba = sampleSourceRGBA(imageData, sx, sy);

          out.data[di] = rgba[0];
          out.data[di + 1] = rgba[1];
          out.data[di + 2] = rgba[2];
          out.data[di + 3] = 255;
        }
      }

      return out;
    }

    function redrawMainCanvas() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (state.displayedImageData) {
        ctx.putImageData(state.displayedImageData, 0, 0);
      }
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
      updateLabels();

      if (state.autocorrEnabled) {
        renderAutocorrelationAt(state.mouseX, state.mouseY);
      }
    }

    function renderAutocorrelationAt(x, y) {
      if (!state.autocorrEnabled || !state.displayedImageData) return;

      const patchSize = state.patchSize;
      const cx = Math.round(x);
      const cy = Math.round(y);

      const patch = extractPatchGray(state.displayedImageData, cx, cy, patchSize);
      const ac = computeAutocorrelation2D(patch, patchSize);

      const displayField = state.displayMode === "laplacian"
        ? computeLaplacian2D(ac, patchSize, patchSize)
        : ac;

      const gray = thresholdAndNormalize(displayField, state.peakThresholdRatio);
      const img = createImageDataFromGray(gray, patchSize, patchSize);

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = patchSize;
      tempCanvas.height = patchSize;
      const tctx = tempCanvas.getContext("2d", { willReadFrequently: true });
      tctx.putImageData(img, 0, 0);

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

      updateLabels();
