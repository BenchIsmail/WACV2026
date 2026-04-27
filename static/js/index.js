// index.js
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
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const acorrPreview = document.getElementById("acorr-preview");
    const acorrCanvas = document.getElementById("acorr-canvas");
    const acorrCtx = acorrCanvas
      ? acorrCanvas.getContext("2d", { willReadFrequently: true })
      : null;

    const btnGenerate = document.getElementById("btn-generate-texture");
    const btnProjection = document.getElementById("btn-change-projection");
    const btnAutocorr = document.getElementById("btn-toggle-autocorr");
    const btnResetParams = document.getElementById("btn-reset-params");

    let btnDetectPeaks = document.getElementById("btn-detect-peaks");
    let peaksStateLabel = document.getElementById("peaks-state-label");

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
    const texBlur = document.getElementById("tex-blur");
    const patchSizeControl = document.getElementById("patch-size-control");

    const valOccupancy = document.getElementById("val-occupancy");
    const valDilation = document.getElementById("val-dilation");
    const valAngle = document.getElementById("val-angle");
    const valShift = document.getElementById("val-shift");
    const valBlur = document.getElementById("val-blur");
    const valPatchSlider = document.getElementById("val-patch-slider");

    const panelAffine = document.getElementById("panel-affine");
    const panelPerspective = document.getElementById("panel-perspective");
    const panelCylindrical = document.getElementById("panel-cylindrical");
    const panelShoulder = document.getElementById("panel-shoulder");
    const panelCrumpled = document.getElementById("panel-crumpled");

    const controlIds = [
      "param-a-rot", "param-a-scalex", "param-a-scaley", "param-a-shearx", "param-a-sheary",
      "param-p-tiltx", "param-p-tilty", "param-p-focal", "param-p-zrot",
      "param-c-curv", "param-c-drop", "param-c-zrot", "param-c-vstretch",
      "param-s-span", "param-s-camera", "param-s-neck", "param-s-shoulder", "param-s-roll", "param-s-vstretch",
      "param-r-amp", "param-r-freq", "param-r-persp", "param-r-roll", "param-r-twist", "param-r-shade"
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
      cVStretch: document.getElementById("val-c-vstretch"),
      sSpan: document.getElementById("val-s-span"),
      sCamera: document.getElementById("val-s-camera"),
      sNeck: document.getElementById("val-s-neck"),
      sShoulder: document.getElementById("val-s-shoulder"),
      sRoll: document.getElementById("val-s-roll"),
      sVStretch: document.getElementById("val-s-vstretch"),
      rAmp: document.getElementById("val-r-amp"),
      rFreq: document.getElementById("val-r-freq"),
      rPersp: document.getElementById("val-r-persp"),
      rRoll: document.getElementById("val-r-roll"),
      rTwist: document.getElementById("val-r-twist"),
      rShade: document.getElementById("val-r-shade")
    };

    const DEFAULTS = {
      texture: {
        occupancy: 0.40,
        dilation: 0,
        angleShiftDeg: 90,
        normShift: 22,
        blurSigma: 1.05
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
      },
      shoulder: {
        angularSpan: 1.05,
        cameraDistance: 0.35,
        neckRadius: 0.55,
        shoulderLength: 0.55,
        zRotationDeg: 0,
        verticalStretch: 1.00
      },
      crumpled: {
        amplitude: 0.11,
        frequency: 3.0,
        perspective: 0.25,
        zRotationDeg: 0,
        twist: 0.18,
        shade: 0.35
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
      patchSize: 90,
      previewContrast: 2.2,
      autocorrEnabled: false,
      peaksEnabled: false,
      projectionModes: ["Affine", "Perspective", "Cylindrical", "Shoulder", "Crumpled"],
      projectionIndex: 0,
      mouseX: 450,
      mouseY: 450,
      lockedPatch: false,
      lockedPatchX: 450,
      lockedPatchY: 450,
      displayMode: "autocorr",
      texture: { ...DEFAULTS.texture },
      affine: { ...DEFAULTS.affine },
      perspective: { ...DEFAULTS.perspective },
      cylindrical: { ...DEFAULTS.cylindrical },
      shoulder: { ...DEFAULTS.shoulder },
      crumpled: { ...DEFAULTS.crumpled },
      previewComputeSize: 64,
      centerBlendRadius: 6,

      // ---------------------------------------------------------
      // Equivalent JS des kwargs de find_hexagon / stable patch.
      // Tu peux modifier ces valeurs directement ici.
      // ---------------------------------------------------------
      peakDetection: {
        // Détection des maxima locaux dans l'autocorr
        k: 80,
        nmsSize: 9,
        excludeCenterRadius: 7.0,
        minSeparation: 3.0,

        // Sélection du meilleur couple (u, v)
        energyHalfwin: 2.0,
        minDist: 3.0,
        antipodalTol: 2.0,
        angleMinDeg: 12.0,
        wExcludeCenterRadius: 7.0,

        // Raffinement sous-pixelique simple 3x3
        refineSubpixel: true,

        // Si true, lance une version multi-échelles inspirée de
        // find_min_stable_patch_size_centered. Plus lent.
        useStablePatch: false,
        minPs: 40,
        maxPs: 140,
        step: 4,
        stableSeqLen: 3,
        stableTol: 1.0
      },

      lastDetection: null
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
    // AUTO-CREATE PEAK BUTTON / STATUS IF MISSING IN HTML
    // =========================================================
    function ensurePeakControlsExist() {
      if (!btnDetectPeaks) {
        const toolbar = document.querySelector(".interactive-toolbar");
        if (toolbar) {
          btnDetectPeaks = document.createElement("button");
          btnDetectPeaks.id = "btn-detect-peaks";
          btnDetectPeaks.className = "button is-success is-rounded";
          btnDetectPeaks.innerHTML = '<span class="icon"><i class="fas fa-crosshairs"></i></span><span>Detect Peaks</span>';
          if (btnAutocorr && btnAutocorr.nextSibling) {
            toolbar.insertBefore(btnDetectPeaks, btnAutocorr.nextSibling);
          } else {
            toolbar.appendChild(btnDetectPeaks);
          }
        }
      }

      if (!peaksStateLabel) {
        const status = document.querySelector(".interactive-status");
        if (status) {
          const pill = document.createElement("span");
          pill.className = "status-pill";
          pill.innerHTML = 'Peaks: <span id="peaks-state-label">OFF</span>';
          status.appendChild(pill);
          peaksStateLabel = document.getElementById("peaks-state-label");
        }
      }
    }

    ensurePeakControlsExist();

    // =========================================================
    // UTILS
    // =========================================================
    function clamp(v, a, b) {
      return Math.max(a, Math.min(b, v));
    }

    function degToRad(deg) {
      return (deg * Math.PI) / 180;
    }

    function rotate2D(x, y, angleRad) {
      const c = Math.cos(angleRad);
      const s = Math.sin(angleRad);
      return { x: c * x - s * y, y: s * x + c * y };
    }

    function normalizeVec3(v, eps = 1e-12) {
      const n = Math.hypot(v[0], v[1], v[2]);
      if (n < eps) throw new Error("Zero vector cannot be normalized");
      return [v[0] / n, v[1] / n, v[2] / n];
    }

    function dotVec3(a, b) {
      return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    }

    function crossVec3(a, b) {
      return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0]
      ];
    }

    function addVec3(a, b) {
      return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
    }

    function subVec3(a, b) {
      return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    }

    function scaleVec3(v, s) {
      return [v[0] * s, v[1] * s, v[2] * s];
    }

    function buildCameraBasisJS(viewDir, worldUp = [0, 0, 1], roll = 0) {
      let fwd = normalizeVec3(viewDir);
      let wu = normalizeVec3(worldUp);
      if (Math.abs(dotVec3(fwd, wu)) > 0.98) wu = [0, 1, 0];

      let right = normalizeVec3(crossVec3(fwd, wu));
      let up = normalizeVec3(crossVec3(right, fwd));

      if (Math.abs(roll) > 1e-12) {
        const cr = Math.cos(roll);
        const sr = Math.sin(roll);
        const right2 = addVec3(scaleVec3(right, cr), scaleVec3(up, sr));
        const up2 = addVec3(scaleVec3(right, -sr), scaleVec3(up, cr));
        right = right2;
        up = up2;
      }
      return { right, up, fwd };
    }

    function getActivePatchCenter() {
      if (state.lockedPatch) return { x: state.lockedPatchX, y: state.lockedPatchY };
      return { x: state.mouseX, y: state.mouseY };
    }

    function getCanvasMousePos(event, targetCanvas) {
      const rect = targetCanvas.getBoundingClientRect();
      const sx = targetCanvas.width / rect.width;
      const sy = targetCanvas.height / rect.height;
      return { x: (event.clientX - rect.left) * sx, y: (event.clientY - rect.top) * sy };
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

    function sampleGrayBilinear(imageData, x, y, background = 255) {
      const w = imageData.width;
      const h = imageData.height;
      const data = imageData.data;
      if (x < 0 || x > w - 1 || y < 0 || y > h - 1) return background;

      const x0 = Math.floor(x);
      const y0 = Math.floor(y);
      const x1 = Math.min(x0 + 1, w - 1);
      const y1 = Math.min(y0 + 1, h - 1);
      const ax = x - x0;
      const ay = y - y0;

      function grayAt(xx, yy) {
        const idx = (yy * w + xx) * 4;
        return 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      }

      const g00 = grayAt(x0, y0);
      const g10 = grayAt(x1, y0);
      const g01 = grayAt(x0, y1);
      const g11 = grayAt(x1, y1);
      const g0 = g00 * (1 - ax) + g10 * ax;
      const g1 = g01 * (1 - ax) + g11 * ax;
      return g0 * (1 - ay) + g1 * ay;
    }

    function setGrayPixel(dst, pixelIndex, gray) {
      const v = clamp(Math.round(gray), 0, 255);
      dst[pixelIndex] = v;
      dst[pixelIndex + 1] = v;
      dst[pixelIndex + 2] = v;
      dst[pixelIndex + 3] = 255;
    }

    function percentile(values, p) {
      const arr = Array.from(values).sort((a, b) => a - b);
      const idx = Math.floor(clamp(p, 0, 1) * (arr.length - 1));
      return arr[idx];
    }

    function percentileSorted(sortedArr, p) {
      if (!sortedArr.length) return 0;
      const idx = Math.floor(clamp(p, 0, 1) * (sortedArr.length - 1));
      return sortedArr[idx];
    }

    function robustNormalizeFloat(arr, lowP = 0.01, highP = 0.995) {
      const sorted = Array.from(arr).sort((a, b) => a - b);
      const lo = percentileSorted(sorted, lowP);
      const hi = percentileSorted(sorted, highP);
      const out = new Float64Array(arr.length);
      if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi <= lo) return out;
      const range = hi - lo;
      for (let i = 0; i < arr.length; i++) out[i] = clamp((arr[i] - lo) / range, 0, 1);
      return out;
    }

    function absArray(arr) {
      const out = new Float64Array(arr.length);
      for (let i = 0; i < arr.length; i++) out[i] = Math.abs(arr[i]);
      return out;
    }

    function attenuateCenterDisk(arr, width, height, radius) {
      if (radius <= 0) return new Float64Array(arr);
      const out = new Float64Array(arr);
      const cx = (width - 1) / 2;
      const cy = (height - 1) / 2;
      const annulus = [];
      const rInner = radius;
      const rOuter = radius + 4;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const d = Math.hypot(x - cx, y - cy);
          if (d > rInner && d <= rOuter) annulus.push(arr[y * width + x]);
        }
      }
      const median = annulus.length ? percentile(annulus, 0.5) : 0;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const d = Math.hypot(x - cx, y - cy);
          if (d <= radius) {
            const idx = y * width + x;
            const t = d / Math.max(radius, 1e-6);
            const alpha = t * t;
            out[idx] = alpha * arr[idx] + (1 - alpha) * median;
          }
        }
      }
      return out;
    }

    function applyDisplayContrastRobust(arr, width, height, contrast, mode) {
      let work = new Float64Array(arr);
      if (mode === "laplacian") work = absArray(work);
      work = attenuateCenterDisk(work, width, height, state.centerBlendRadius);
      const normalized = robustNormalizeFloat(
        work,
        mode === "laplacian" ? 0.03 : 0.01,
        mode === "laplacian" ? 0.998 : 0.995
      );
      const out = new Float64Array(normalized.length);
      const gamma = 1 / Math.max(contrast, 1e-6);
      for (let i = 0; i < normalized.length; i++) {
        out[i] = Math.pow(clamp(normalized[i], 0, 1), gamma);
      }
      return out;
    }

    function float01ToUint8(arr01) {
      const out = new Uint8ClampedArray(arr01.length);
      for (let i = 0; i < arr01.length; i++) out[i] = clamp(Math.round(arr01[i] * 255), 0, 255);
      return out;
    }

    function updateAutocorrPreviewPosition(clientX, clientY) {
      if (!acorrPreview) return;
      const pad = 18;
      let left = clientX + pad;
      let top = clientY + pad;
      const rect = acorrPreview.getBoundingClientRect();
      if (left + rect.width > window.innerWidth - 8) left = clientX - rect.width - pad;
      if (top + rect.height > window.innerHeight - 8) top = clientY - rect.height - pad;
      acorrPreview.style.left = `${left}px`;
      acorrPreview.style.top = `${top}px`;
    }

    function updateAutocorrPreviewPositionFromCanvasPoint(x, y) {
      if (!acorrPreview || !canvas) return;
      const canvasRect = canvas.getBoundingClientRect();
      const clientX = canvasRect.left + (x / canvas.width) * canvasRect.width;
      const clientY = canvasRect.top + (y / canvas.height) * canvasRect.height;
      const pad = 18;
      const previewRect = acorrPreview.getBoundingClientRect();
      let left = clientX + pad;
      let top = clientY - previewRect.height * 0.35;
      if (left + previewRect.width > window.innerWidth - 8) left = clientX - previewRect.width - pad;
      if (top < 8) top = 8;
      if (top + previewRect.height > window.innerHeight - 8) top = window.innerHeight - previewRect.height - 8;
      acorrPreview.style.left = `${left}px`;
      acorrPreview.style.top = `${top}px`;
    }

    function drawCross(ctx2, x, y, color = "#00ffff", size = 5, lineWidth = 1) {
      ctx2.save();
      ctx2.strokeStyle = color;
      ctx2.lineWidth = lineWidth;
      ctx2.beginPath();
      ctx2.moveTo(x - size, y);
      ctx2.lineTo(x + size, y);
      ctx2.moveTo(x, y - size);
      ctx2.lineTo(x, y + size);
      ctx2.stroke();
      ctx2.restore();
    }

    function drawCircle(ctx2, x, y, radius, color, lineWidth = 2) {
      ctx2.save();
      ctx2.strokeStyle = color;
      ctx2.lineWidth = lineWidth;
      ctx2.beginPath();
      ctx2.arc(x, y, radius, 0, 2 * Math.PI);
      ctx2.stroke();
      ctx2.restore();
    }

    function drawText(ctx2, text, x, y, color) {
      ctx2.save();
      ctx2.font = "bold 11px Inter, Arial, sans-serif";
      ctx2.fillStyle = color;
      ctx2.strokeStyle = "rgba(0, 0, 0, 0.78)";
      ctx2.lineWidth = 3;
      ctx2.strokeText(text, x, y);
      ctx2.fillText(text, x, y);
      ctx2.restore();
    }

    // =========================================================
    // UI REFRESH
    // =========================================================
    function refreshPeakStateUI() {
      if (peaksStateLabel) peaksStateLabel.textContent = state.peaksEnabled ? "ON" : "OFF";
      if (btnDetectPeaks) {
        btnDetectPeaks.classList.toggle("is-success", !state.peaksEnabled);
        btnDetectPeaks.classList.toggle("is-danger", state.peaksEnabled);
        const textSpan = btnDetectPeaks.querySelector("span:last-child");
        if (textSpan) textSpan.textContent = state.peaksEnabled ? "Hide Peaks" : "Detect Peaks";
      }
    }

    function refreshAutocorrStateUI() {
      if (autocorrStateLabel) autocorrStateLabel.textContent = state.autocorrEnabled ? "ON" : "OFF";
      if (acorrPreview) acorrPreview.style.display = state.autocorrEnabled ? "block" : "none";
      if (acorrModeLabel) {
        acorrModeLabel.textContent = state.displayMode === "laplacian"
          ? "Laplacian of Autocorrelation"
          : "Autocorrelation";
      }
      if (patchSizeLabel) patchSizeLabel.textContent = `Patch: ${state.patchSize} px`;
      if (patchSizeInline) patchSizeInline.textContent = state.patchSize;
      refreshPeakStateUI();
    }

    function refreshProjectionPanels() {
      const mode = state.projectionModes[state.projectionIndex];
      if (panelAffine) panelAffine.classList.toggle("is-active", mode === "Affine");
      if (panelPerspective) panelPerspective.classList.toggle("is-active", mode === "Perspective");
      if (panelCylindrical) panelCylindrical.classList.toggle("is-active", mode === "Cylindrical");
      if (panelShoulder) panelShoulder.classList.toggle("is-active", mode === "Shoulder");
      if (panelCrumpled) panelCrumpled.classList.toggle("is-active", mode === "Crumpled");
      if (projectionModeLabel) projectionModeLabel.textContent = mode;
    }

    function refreshControlLabels() {
      if (valOccupancy) valOccupancy.textContent = state.texture.occupancy.toFixed(2);
      if (valDilation) valDilation.textContent = String(state.texture.dilation);
      if (valAngle) valAngle.textContent = `${state.texture.angleShiftDeg}°`;
      if (valShift) valShift.textContent = String(state.texture.normShift);
      if (valBlur) valBlur.textContent = state.texture.blurSigma.toFixed(2);
      if (valPatchSlider) valPatchSlider.textContent = `${state.patchSize} px`;

      if (values.aRot) values.aRot.textContent = `${state.affine.rotationDeg}°`;
      if (values.aScaleX) values.aScaleX.textContent = state.affine.scaleX.toFixed(2);
      if (values.aScaleY) values.aScaleY.textContent = state.affine.scaleY.toFixed(2);
      if (values.aShearX) values.aShearX.textContent = state.affine.shearX.toFixed(2);
      if (values.aShearY) values.aShearY.textContent = state.affine.shearY.toFixed(2);

      if (values.pTiltX) values.pTiltX.textContent = state.perspective.tiltX.toFixed(2);
      if (values.pTiltY) values.pTiltY.textContent = state.perspective.tiltY.toFixed(2);
      if (values.pFocal) values.pFocal.textContent = state.perspective.focalScale.toFixed(2);
      if (values.pZRot) values.pZRot.textContent = `${state.perspective.zRotationDeg}°`;

      if (values.cCurv) values.cCurv.textContent = state.cylindrical.curvature.toFixed(2);
      if (values.cDrop) values.cDrop.textContent = state.cylindrical.perspectiveDrop.toFixed(2);
      if (values.cZRot) values.cZRot.textContent = `${state.cylindrical.zRotationDeg}°`;
      if (values.cVStretch) values.cVStretch.textContent = state.cylindrical.verticalStretch.toFixed(2);

      if (values.sSpan) values.sSpan.textContent = state.shoulder.angularSpan.toFixed(2);
      if (values.sCamera) values.sCamera.textContent = state.shoulder.cameraDistance.toFixed(2);
      if (values.sNeck) values.sNeck.textContent = state.shoulder.neckRadius.toFixed(2);
      if (values.sShoulder) values.sShoulder.textContent = state.shoulder.shoulderLength.toFixed(2);
      if (values.sRoll) values.sRoll.textContent = `${state.shoulder.zRotationDeg}°`;
      if (values.sVStretch) values.sVStretch.textContent = state.shoulder.verticalStretch.toFixed(2);

      if (values.rAmp) values.rAmp.textContent = state.crumpled.amplitude.toFixed(2);
      if (values.rFreq) values.rFreq.textContent = state.crumpled.frequency.toFixed(1);
      if (values.rPersp) values.rPersp.textContent = state.crumpled.perspective.toFixed(2);
      if (values.rRoll) values.rRoll.textContent = `${state.crumpled.zRotationDeg}°`;
      if (values.rTwist) values.rTwist.textContent = state.crumpled.twist.toFixed(2);
      if (values.rShade) values.rShade.textContent = state.crumpled.shade.toFixed(2);

      if (contrastValue) contrastValue.textContent = `${state.previewContrast.toFixed(1)}×`;
      if (patchSizeLabel) patchSizeLabel.textContent = `Patch: ${state.patchSize} px`;
      if (patchSizeInline) patchSizeInline.textContent = state.patchSize;
      refreshPeakStateUI();
    }

    function syncControlsFromState() {
      if (texOccupancy) texOccupancy.value = String(state.texture.occupancy);
      if (texDilation) texDilation.value = String(state.texture.dilation);
      if (texAngle) texAngle.value = String(state.texture.angleShiftDeg);
      if (texShift) texShift.value = String(state.texture.normShift);
      if (texBlur) texBlur.value = String(state.texture.blurSigma);
      if (patchSizeControl) patchSizeControl.value = String(state.patchSize);

      if (controls["param-a-rot"]) controls["param-a-rot"].value = String(state.affine.rotationDeg);
      if (controls["param-a-scalex"]) controls["param-a-scalex"].value = String(state.affine.scaleX);
      if (controls["param-a-scaley"]) controls["param-a-scaley"].value = String(state.affine.scaleY);
      if (controls["param-a-shearx"]) controls["param-a-shearx"].value = String(state.affine.shearX);
      if (controls["param-a-sheary"]) controls["param-a-sheary"].value = String(state.affine.shearY);

      if (controls["param-p-tiltx"]) controls["param-p-tiltx"].value = String(state.perspective.tiltX);
      if (controls["param-p-tilty"]) controls["param-p-tilty"].value = String(state.perspective.tiltY);
      if (controls["param-p-focal"]) controls["param-p-focal"].value = String(state.perspective.focalScale);
      if (controls["param-p-zrot"]) controls["param-p-zrot"].value = String(state.perspective.zRotationDeg);

      if (controls["param-c-curv"]) controls["param-c-curv"].value = String(state.cylindrical.curvature);
      if (controls["param-c-drop"]) controls["param-c-drop"].value = String(state.cylindrical.perspectiveDrop);
      if (controls["param-c-zrot"]) controls["param-c-zrot"].value = String(state.cylindrical.zRotationDeg);
      if (controls["param-c-vstretch"]) controls["param-c-vstretch"].value = String(state.cylindrical.verticalStretch);

      if (controls["param-s-span"]) controls["param-s-span"].value = String(state.shoulder.angularSpan);
      if (controls["param-s-camera"]) controls["param-s-camera"].value = String(state.shoulder.cameraDistance);
      if (controls["param-s-neck"]) controls["param-s-neck"].value = String(state.shoulder.neckRadius);
      if (controls["param-s-shoulder"]) controls["param-s-shoulder"].value = String(state.shoulder.shoulderLength);
      if (controls["param-s-roll"]) controls["param-s-roll"].value = String(state.shoulder.zRotationDeg);
      if (controls["param-s-vstretch"]) controls["param-s-vstretch"].value = String(state.shoulder.verticalStretch);

      if (controls["param-r-amp"]) controls["param-r-amp"].value = String(state.crumpled.amplitude);
      if (controls["param-r-freq"]) controls["param-r-freq"].value = String(state.crumpled.frequency);
      if (controls["param-r-persp"]) controls["param-r-persp"].value = String(state.crumpled.perspective);
      if (controls["param-r-roll"]) controls["param-r-roll"].value = String(state.crumpled.zRotationDeg);
      if (controls["param-r-twist"]) controls["param-r-twist"].value = String(state.crumpled.twist);
      if (controls["param-r-shade"]) controls["param-r-shade"].value = String(state.crumpled.shade);

      if (contrastSlider) contrastSlider.value = String(state.previewContrast);

      refreshControlLabels();
      refreshProjectionPanels();
      refreshAutocorrStateUI();
      refreshPeakStateUI();
    }

    function updateStateFromControls() {
      if (texOccupancy) state.texture.occupancy = parseFloat(texOccupancy.value);
      if (texDilation) state.texture.dilation = clamp(parseInt(texDilation.value, 10), 0, 2);
      if (texAngle) state.texture.angleShiftDeg = parseInt(texAngle.value, 10);
      if (texShift) state.texture.normShift = parseInt(texShift.value, 10);
      if (texBlur) state.texture.blurSigma = parseFloat(texBlur.value);
      if (patchSizeControl) state.patchSize = clamp(parseInt(patchSizeControl.value, 10), 32, 140);

      if (controls["param-a-rot"]) state.affine.rotationDeg = parseInt(controls["param-a-rot"].value, 10);
      if (controls["param-a-scalex"]) state.affine.scaleX = parseFloat(controls["param-a-scalex"].value);
      if (controls["param-a-scaley"]) state.affine.scaleY = parseFloat(controls["param-a-scaley"].value);
      if (controls["param-a-shearx"]) state.affine.shearX = parseFloat(controls["param-a-shearx"].value);
      if (controls["param-a-sheary"]) state.affine.shearY = parseFloat(controls["param-a-sheary"].value);

      if (controls["param-p-tiltx"]) state.perspective.tiltX = parseFloat(controls["param-p-tiltx"].value);
      if (controls["param-p-tilty"]) state.perspective.tiltY = parseFloat(controls["param-p-tilty"].value);
      if (controls["param-p-focal"]) state.perspective.focalScale = parseFloat(controls["param-p-focal"].value);
      if (controls["param-p-zrot"]) state.perspective.zRotationDeg = parseInt(controls["param-p-zrot"].value, 10);

      if (controls["param-c-curv"]) state.cylindrical.curvature = parseFloat(controls["param-c-curv"].value);
      if (controls["param-c-drop"]) state.cylindrical.perspectiveDrop = parseFloat(controls["param-c-drop"].value);
      if (controls["param-c-zrot"]) state.cylindrical.zRotationDeg = parseInt(controls["param-c-zrot"].value, 10);
      if (controls["param-c-vstretch"]) state.cylindrical.verticalStretch = parseFloat(controls["param-c-vstretch"].value);

      if (controls["param-s-span"]) state.shoulder.angularSpan = parseFloat(controls["param-s-span"].value);
      if (controls["param-s-camera"]) state.shoulder.cameraDistance = parseFloat(controls["param-s-camera"].value);
      if (controls["param-s-neck"]) state.shoulder.neckRadius = parseFloat(controls["param-s-neck"].value);
      if (controls["param-s-shoulder"]) state.shoulder.shoulderLength = parseFloat(controls["param-s-shoulder"].value);
      if (controls["param-s-roll"]) state.shoulder.zRotationDeg = parseInt(controls["param-s-roll"].value, 10);
      if (controls["param-s-vstretch"]) state.shoulder.verticalStretch = parseFloat(controls["param-s-vstretch"].value);

      if (controls["param-r-amp"]) state.crumpled.amplitude = parseFloat(controls["param-r-amp"].value);
      if (controls["param-r-freq"]) state.crumpled.frequency = parseFloat(controls["param-r-freq"].value);
      if (controls["param-r-persp"]) state.crumpled.perspective = parseFloat(controls["param-r-persp"].value);
      if (controls["param-r-roll"]) state.crumpled.zRotationDeg = parseInt(controls["param-r-roll"].value, 10);
      if (controls["param-r-twist"]) state.crumpled.twist = parseFloat(controls["param-r-twist"].value);
      if (controls["param-r-shade"]) state.crumpled.shade = parseFloat(controls["param-r-shade"].value);

      refreshControlLabels();
    }

    function schedulePreviewRender() {
      if (!state.autocorrEnabled || !state.displayedImageData) return;
      if (rafPreview !== null) return;
      rafPreview = window.requestAnimationFrame(() => {
        rafPreview = null;
        const p = getActivePatchCenter();
        if (state.lockedPatch) updateAutocorrPreviewPositionFromCanvasPoint(p.x, p.y);
        renderAutocorrelationAt(p.x, p.y);
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
              if (gray[yy * w + xx] === 0) { makeBlack = true; break; }
            }
          }
          out[y * w + x] = makeBlack ? 0 : 255;
        }
      }
      return out;
    }

    function generateWhiteNoiseAndShifts(w, h, shift1, shift2) {
      const base = new Float64Array(w * h);
      for (let i = 0; i < base.length; i++) base[i] = Math.random() * 2 - 1;
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

    function gaussianKernel1D(sigma) {
      if (sigma <= 0) return new Float64Array([1]);
      const radius = Math.max(1, Math.ceil(3 * sigma));
      const size = 2 * radius + 1;
      const kernel = new Float64Array(size);
      const denom = 2 * sigma * sigma;
      let sum = 0;
      for (let i = -radius; i <= radius; i++) {
        const v = Math.exp(-(i * i) / denom);
        kernel[i + radius] = v;
        sum += v;
      }
      for (let i = 0; i < size; i++) kernel[i] /= sum;
      return kernel;
    }

    function blurGraySeparable(gray, w, h, sigma) {
      if (sigma <= 0) return new Uint8ClampedArray(gray);
      const kernel = gaussianKernel1D(sigma);
      const radius = Math.floor(kernel.length / 2);
      const temp = new Float64Array(w * h);
      const out = new Uint8ClampedArray(w * h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          let sum = 0;
          for (let k = -radius; k <= radius; k++) {
            const xx = clamp(x + k, 0, w - 1);
            sum += gray[y * w + xx] * kernel[k + radius];
          }
          temp[y * w + x] = sum;
        }
      }
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          let sum = 0;
          for (let k = -radius; k <= radius; k++) {
            const yy = clamp(y + k, 0, h - 1);
            sum += temp[yy * w + x] * kernel[k + radius];
          }
          out[y * w + x] = clamp(Math.round(sum), 0, 255);
        }
      }
      return out;
    }

    function genRandomBinaryTexture(w, h, dilationSize, occupancy, angleShiftDeg, normShift, blurSigma) {
      const k = degToRad(angleShiftDeg);
      const shift1 = { x: 0, y: Math.round(normShift) };
      const shift2 = {
        x: Math.round(normShift * Math.sin(k)),
        y: Math.round(normShift * Math.cos(k))
      };
      const combined = generateWhiteNoiseAndShifts(w, h, shift1, shift2);
      const thr = percentile(combined, occupancy);
      const binary = new Uint8ClampedArray(w * h);
      for (let i = 0; i < combined.length; i++) binary[i] = combined[i] <= thr ? 0 : 255;
      const dilated = applyBinaryDilation(binary, w, h, dilationSize);
      return blurGraySeparable(dilated, w, h, blurSigma);
    }

    function renderGeneratedTexture() {
      const w = state.size;
      const h = state.size;
      const gray = genRandomBinaryTexture(
        w, h,
        state.texture.dilation,
        state.texture.occupancy,
        state.texture.angleShiftDeg,
        state.texture.normShift,
        state.texture.blurSigma
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
      const tctx = tmpCanvas.getContext("2d", { willReadFrequently: true });
      tctx.putImageData(imageData, 0, 0);

      const outCanvas = document.createElement("canvas");
      outCanvas.width = imageData.width;
      outCanvas.height = imageData.height;
      const octx = outCanvas.getContext("2d", { willReadFrequently: true });
      octx.imageSmoothingEnabled = true;
      octx.imageSmoothingQuality = "high";
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
      return octx.getImageData(0, 0, outCanvas.width, outCanvas.height);
    }

    function applyPerspectiveProjection(imageData) {
      const w = imageData.width;
      const h = imageData.height;
      const out = new ImageData(w, h);
      const dst = out.data;
      const cx = w / 2;
      const cy = h / 2;
      const tiltX = state.perspective.tiltX;
      const tiltY = state.perspective.tiltY;
      const focalScale = Math.max(0.05, state.perspective.focalScale);
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
          const sx = srcXn * cx + cx;
          const sy = srcYn * cy + cy;
          const di = (y * w + x) * 4;
          const gray = sampleGrayBilinear(imageData, sx, sy, 255);
          setGrayPixel(dst, di, gray);
        }
      }
      return out;
    }

    function applyCylindricalProjection(imageData) {
      const w = imageData.width;
      const h = imageData.height;
      const out = new ImageData(w, h);
      const dst = out.data;
      const zRot = degToRad(state.cylindrical.zRotationDeg);
      const radius = 1.0;
      const thetaHalf = clamp(state.cylindrical.curvature * 0.55, 0.15, 1.25);
      const halfHeight = Math.max(0.15, state.cylindrical.verticalStretch) * radius * 0.85;
      const cameraDistance = radius * (1.4 + 2.8 * (1.0 - clamp(state.cylindrical.perspectiveDrop, 0, 2)));
      const cameraPos = [radius + cameraDistance, 0.0, 0.0];
      const target = [0.0, 0.0, 0.0];
      const viewDir = subVec3(target, cameraPos);
      const focalPx = 0.95 * Math.max(w, h);
      const { right, up, fwd } = buildCameraBasisJS(viewDir, [0, 0, 1], zRot);
      const cx = (w - 1) / 2;
      const cy = (h - 1) / 2;
      const Cx = cameraPos[0];
      const Cy = cameraPos[1];
      const Cz = cameraPos[2];
      for (let y = 0; y < h; y++) {
        const yCam = -(y - cy);
        for (let x = 0; x < w; x++) {
          const xCam = x - cx;
          let D = addVec3(addVec3(scaleVec3(right, xCam), scaleVec3(up, yCam)), scaleVec3(fwd, focalPx));
          D = normalizeVec3(D);
          const Dx = D[0];
          const Dy = D[1];
          const Dz = D[2];
          const a = Dx * Dx + Dy * Dy;
          const b = 2.0 * (Cx * Dx + Cy * Dy);
          const c = Cx * Cx + Cy * Cy - radius * radius;
          let gray = 255;
          if (a > 1e-12) {
            const disc = b * b - 4.0 * a * c;
            if (disc > 0.0) {
              const sqrtDisc = Math.sqrt(disc);
              const t1 = (-b - sqrtDisc) / (2.0 * a);
              const t2 = (-b + sqrtDisc) / (2.0 * a);
              let t = Infinity;
              if (t1 > 1e-6 && t2 > 1e-6) t = Math.min(t1, t2);
              else if (t1 > 1e-6) t = t1;
              else if (t2 > 1e-6) t = t2;
              if (Number.isFinite(t)) {
                const Px = Cx + t * Dx;
                const Py = Cy + t * Dy;
                const Pz = Cz + t * Dz;
                const theta = Math.atan2(Py, Px);
                const insideAngular = theta >= -thetaHalf && theta <= thetaHalf;
                const insideVertical = Pz >= -halfHeight && Pz <= halfHeight;
                const Nx = Math.cos(theta);
                const Ny = Math.sin(theta);
                const facing = ((Cx - Px) * Nx + (Cy - Py) * Ny) > 0.0;
                if (insideAngular && insideVertical && facing) {
                  const uNorm = (theta + thetaHalf) / (2.0 * thetaHalf);
                  const vNorm = (halfHeight - Pz) / (2.0 * halfHeight);
                  const sx = clamp(uNorm * (w - 1), 0, w - 1);
                  const sy = clamp(vNorm * (h - 1), 0, h - 1);
                  gray = sampleGrayBilinear(imageData, sx, sy, 255);
                }
              }
            }
          }
          const di = (y * w + x) * 4;
          setGrayPixel(dst, di, gray);
        }
      }
      return out;
    }


    function bottleProfileJS(z, R1, R2, L) {
      let r = R1;
      let dr = 0.0;
      if (z > L / 2.0) {
        r = R2;
      } else if (z >= -L / 2.0) {
        const u = (z + L / 2.0) / L;
        r = R2 + 0.5 * (R1 - R2) * (1.0 + Math.cos(Math.PI * u));
        dr = -0.5 * (R1 - R2) * Math.sin(Math.PI * u) * (Math.PI / L);
      }
      return { r, dr };
    }

    function applyShoulderProjection(imageData) {
      const w = imageData.width;
      const h = imageData.height;
      const out = new ImageData(w, h);
      const dst = out.data;
      const R1 = 1.0;
      const R2 = clamp(state.shoulder.neckRadius, 0.20, 0.95) * R1;
      const L = Math.max(0.05, state.shoulder.shoulderLength) * 2.0 * R1;
      const thetaHalf = clamp(state.shoulder.angularSpan * 0.55, 0.12, 1.35);
      const halfHeight = Math.max(0.15, state.shoulder.verticalStretch) * R1 * 0.95;
      const cameraDistance = R1 * (1.7 + 3.0 * (1.0 - clamp(state.shoulder.cameraDistance, 0, 2) / 1.2));
      const cameraPos = [R1 + cameraDistance, 0.0, 0.15];
      const viewDir = subVec3([0.0, 0.0, 0.0], cameraPos);
      const focalPx = 0.95 * Math.max(w, h);
      const { right, up, fwd } = buildCameraBasisJS(viewDir, [0, 0, 1], degToRad(state.shoulder.zRotationDeg));
      const cx = (w - 1) / 2;
      const cy = (h - 1) / 2;
      const Cx = cameraPos[0], Cy = cameraPos[1], Cz = cameraPos[2];

      for (let y = 0; y < h; y++) {
        const yCam = -(y - cy);
        for (let x = 0; x < w; x++) {
          const xCam = x - cx;
          let D = addVec3(addVec3(scaleVec3(right, xCam), scaleVec3(up, yCam)), scaleVec3(fwd, focalPx));
          D = normalizeVec3(D);
          const Dx = D[0], Dy = D[1], Dz = D[2];
          const A = Dx * Dx + Dy * Dy;
          const B = 2.0 * (Cx * Dx + Cy * Dy);
          const Cxy = Cx * Cx + Cy * Cy;
          let gray = 255;
          if (A > 1e-12) {
            const disc = B * B - 4.0 * A * (Cxy - R1 * R1);
            if (disc > 0.0) {
              const sd = Math.sqrt(disc);
              let tIn = (-B - sd) / (2.0 * A);
              let tOut = (-B + sd) / (2.0 * A);
              if (tOut > 1e-6) {
                tIn = Math.max(tIn, 1e-6);
                let prevT = tIn;
                let prevF = 1.0;
                let hit = false;
                let lo = tIn;
                let hi = tOut;
                const steps = 36;
                for (let i = 0; i <= steps; i++) {
                  const t = tIn + (tOut - tIn) * (i / steps);
                  const z = Cz + t * Dz;
                  const prof = bottleProfileJS(z, R1, R2, L);
                  const F = A * t * t + B * t + Cxy - prof.r * prof.r;
                  if (i > 0 && prevF > 0 && F <= 0) {
                    lo = prevT;
                    hi = t;
                    hit = true;
                    break;
                  }
                  prevT = t;
                  prevF = F;
                }
                if (hit) {
                  for (let it = 0; it < 10; it++) {
                    const tm = 0.5 * (lo + hi);
                    const z = Cz + tm * Dz;
                    const prof = bottleProfileJS(z, R1, R2, L);
                    const Fm = A * tm * tm + B * tm + Cxy - prof.r * prof.r;
                    if (Fm > 0) lo = tm;
                    else hi = tm;
                  }
                  const t = 0.5 * (lo + hi);
                  const Px = Cx + t * Dx;
                  const Py = Cy + t * Dy;
                  const Pz = Cz + t * Dz;
                  const theta = Math.atan2(Py, Px);
                  const uCm = R1 * theta;
                  const prof = bottleProfileJS(Pz, R1, R2, L);
                  let Nx = Px, Ny = Py, Nz = -prof.r * prof.dr;
                  const nn = Math.max(Math.hypot(Nx, Ny, Nz), 1e-12);
                  Nx /= nn; Ny /= nn; Nz /= nn;
                  const facing = ((Cx - Px) * Nx + (Cy - Py) * Ny + (Cz - Pz) * Nz) > 0.0;
                  if (facing && uCm >= -thetaHalf * R1 && uCm <= thetaHalf * R1 && Pz >= -halfHeight && Pz <= halfHeight) {
                    const uNorm = (uCm / R1 + thetaHalf) / (2.0 * thetaHalf);
                    const vNorm = (halfHeight - Pz) / (2.0 * halfHeight);
                    const sx = clamp(uNorm * (w - 1), 0, w - 1);
                    const sy = clamp(vNorm * (h - 1), 0, h - 1);
                    gray = sampleGrayBilinear(imageData, sx, sy, 255);
                  }
                }
              }
            }
          }
          setGrayPixel(dst, (y * w + x) * 4, gray);
        }
      }
      return out;
    }

    function crumpleDisplacement(xn, yn) {
      const amp = state.crumpled.amplitude;
      const freq = state.crumpled.frequency;
      const z1 = Math.sin(freq * 5.7 * xn + 1.3 * Math.sin(freq * 2.1 * yn));
      const z2 = 0.55 * Math.sin(freq * 4.2 * (xn + yn) + 1.7);
      const z3 = 0.35 * Math.sin(freq * 8.0 * (xn - 0.35 * yn) - 0.6);
      const height = amp * (z1 + z2 + z3) / 1.9;
      const gx = amp * (5.7 * Math.cos(freq * 5.7 * xn + 1.3 * Math.sin(freq * 2.1 * yn)) + 1.45 * Math.cos(freq * 4.2 * (xn + yn) + 1.7));
      const gy = amp * (1.3 * 2.1 * Math.cos(freq * 2.1 * yn) * Math.cos(freq * 5.7 * xn + 1.3 * Math.sin(freq * 2.1 * yn)) + 1.45 * Math.cos(freq * 4.2 * (xn + yn) + 1.7));
      return { height, gx, gy };
    }

    function applyCrumpledProjection(imageData) {
      const w = imageData.width;
      const h = imageData.height;
      const out = new ImageData(w, h);
      const dst = out.data;
      const cx = (w - 1) / 2;
      const cy = (h - 1) / 2;
      const roll = degToRad(state.crumpled.zRotationDeg);
      const cr = Math.cos(-roll);
      const sr = Math.sin(-roll);
      const persp = state.crumpled.perspective;
      const twist = state.crumpled.twist;
      const shade = state.crumpled.shade;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          let xn = (x - cx) / cx;
          let yn = (y - cy) / cy;
          const xr = cr * xn - sr * yn;
          const yr = sr * xn + cr * yn;
          xn = xr; yn = yr;
          const d = crumpleDisplacement(xn, yn);
          const twistAng = twist * d.height;
          const ct = Math.cos(twistAng);
          const st = Math.sin(twistAng);
          const xw = ct * xn - st * yn;
          const yw = st * xn + ct * yn;
          const denom = Math.max(1.0 + persp * d.height + 0.08 * persp * yw, 0.15);
          const sx = (xw / denom) * cx + cx;
          const sy = (yw / denom) * cy + cy;
          let gray = sampleGrayBilinear(imageData, sx, sy, 255);
          const light = clamp(1.0 - shade * 0.30 * (Math.abs(d.gx) + Math.abs(d.gy)), 0.55, 1.18);
          gray = 255 - (255 - gray) * light;
          setGrayPixel(dst, (y * w + x) * 4, gray);
        }
      }
      return out;
    }

    function applyCurrentProjection() {
      if (!state.sourceImageData) return;
      const mode = state.projectionModes[state.projectionIndex];
      let result;
      if (mode === "Affine") result = applyAffineProjection(state.sourceImageData);
      else if (mode === "Perspective") result = applyPerspectiveProjection(state.sourceImageData);
      else if (mode === "Cylindrical") result = applyCylindricalProjection(state.sourceImageData);
      else if (mode === "Shoulder") result = applyShoulderProjection(state.sourceImageData);
      else result = applyCrumpledProjection(state.sourceImageData);
      state.displayedImageData = result;
      state.displayedCtx.putImageData(result, 0, 0);
      redrawMainCanvas();
      if (state.autocorrEnabled) schedulePreviewRender();
    }

    function redrawMainCanvas() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (state.displayedImageData) ctx.putImageData(state.displayedImageData, 0, 0);
      if (state.autocorrEnabled) {
        const half = Math.floor(state.patchSize / 2);
        const p = getActivePatchCenter();
        const x = Math.round(p.x) - half;
        const y = Math.round(p.y) - half;
        ctx.save();
        ctx.strokeStyle = state.lockedPatch ? "#22c55e" : "#00bcd4";
        ctx.lineWidth = state.lockedPatch ? 3 : 2;
        ctx.strokeRect(x + 0.5, y + 0.5, state.patchSize, state.patchSize);
        ctx.restore();
      }
    }

    // =========================================================
    // LOCAL GEOMETRY FOR THEORETICAL PEAKS
    // =========================================================
    function mat2MulVec(M, v) {
      return [M[0][0] * v[0] + M[0][1] * v[1], M[1][0] * v[0] + M[1][1] * v[1]];
    }

    function mat2Inv(M, eps = 1e-12) {
      const a = M[0][0], b = M[0][1], c = M[1][0], d = M[1][1];
      const det = a * d - b * c;
      if (Math.abs(det) < eps) return null;
      return [[d / det, -b / det], [-c / det, a / det]];
    }

    function mapDisplayToSource(x, y) {
      const mode = state.projectionModes[state.projectionIndex];
      if (mode === "Affine") return mapDisplayToSourceAffine(x, y);
      if (mode === "Perspective") return mapDisplayToSourcePerspective(x, y);
      if (mode === "Cylindrical") return mapDisplayToSourceCylindrical(x, y);
      return { x, y };
    }

    function mapDisplayToSourceAffine(x, y) {
      const w = state.size;
      const h = state.size;
      const cx = w / 2;
      const cy = h / 2;
      const zRot = degToRad(state.affine.rotationDeg);
      const A = [[state.affine.scaleX, state.affine.shearX], [state.affine.shearY, state.affine.scaleY]];
      const R = [[Math.cos(zRot), -Math.sin(zRot)], [Math.sin(zRot), Math.cos(zRot)]];
      const M = [
        [R[0][0] * A[0][0] + R[0][1] * A[1][0], R[0][0] * A[0][1] + R[0][1] * A[1][1]],
        [R[1][0] * A[0][0] + R[1][1] * A[1][0], R[1][0] * A[0][1] + R[1][1] * A[1][1]]
      ];
      const Minv = mat2Inv(M);
      if (!Minv) return null;
      const srcLocal = mat2MulVec(Minv, [x - cx, y - cy]);
      return { x: srcLocal[0] + cx, y: srcLocal[1] + cy };
    }

    function mapDisplayToSourcePerspective(x, y) {
      const w = state.size;
      const h = state.size;
      const cx = w / 2;
      const cy = h / 2;
      const tiltX = state.perspective.tiltX;
      const tiltY = state.perspective.tiltY;
      const focalScale = Math.max(0.05, state.perspective.focalScale);
      const zRot = degToRad(state.perspective.zRotationDeg);
      const xn = (x - cx) / cx;
      const yn = (y - cy) / cy;
      const p = rotate2D(xn, yn, -zRot);
      const xr = p.x;
      const yr = p.y;
      const denomX = 1 + tiltX * yr;
      const denomY = 1 + tiltY * xr;
      if (Math.abs(denomX) < 1e-9 || Math.abs(denomY) < 1e-9) return null;
      return { x: ((xr / focalScale) / denomX) * cx + cx, y: ((yr / focalScale) / denomY) * cy + cy };
    }

    function mapDisplayToSourceCylindrical(x, y) {
      const w = state.size;
      const h = state.size;
      const zRot = degToRad(state.cylindrical.zRotationDeg);
      const radius = 1.0;
      const thetaHalf = clamp(state.cylindrical.curvature * 0.55, 0.15, 1.25);
      const halfHeight = Math.max(0.15, state.cylindrical.verticalStretch) * radius * 0.85;
      const cameraDistance = radius * (1.4 + 2.8 * (1.0 - clamp(state.cylindrical.perspectiveDrop, 0, 2)));
      const cameraPos = [radius + cameraDistance, 0.0, 0.0];
      const viewDir = subVec3([0.0, 0.0, 0.0], cameraPos);
      const focalPx = 0.95 * Math.max(w, h);
      const { right, up, fwd } = buildCameraBasisJS(viewDir, [0, 0, 1], zRot);
      const cx = (w - 1) / 2;
      const cy = (h - 1) / 2;
      const xCam = x - cx;
      const yCam = -(y - cy);
      let D = addVec3(addVec3(scaleVec3(right, xCam), scaleVec3(up, yCam)), scaleVec3(fwd, focalPx));
      D = normalizeVec3(D);
      const Cx = cameraPos[0], Cy = cameraPos[1], Cz = cameraPos[2];
      const Dx = D[0], Dy = D[1], Dz = D[2];
      const a = Dx * Dx + Dy * Dy;
      const b = 2.0 * (Cx * Dx + Cy * Dy);
      const c = Cx * Cx + Cy * Cy - radius * radius;
      if (a <= 1e-12) return null;
      const disc = b * b - 4.0 * a * c;
      if (disc <= 0.0) return null;
      const sqrtDisc = Math.sqrt(disc);
      const t1 = (-b - sqrtDisc) / (2.0 * a);
      const t2 = (-b + sqrtDisc) / (2.0 * a);
      let t = Infinity;
      if (t1 > 1e-6 && t2 > 1e-6) t = Math.min(t1, t2);
      else if (t1 > 1e-6) t = t1;
      else if (t2 > 1e-6) t = t2;
      if (!Number.isFinite(t)) return null;
      const Px = Cx + t * Dx;
      const Py = Cy + t * Dy;
      const Pz = Cz + t * Dz;
      const theta = Math.atan2(Py, Px);
      const insideAngular = theta >= -thetaHalf && theta <= thetaHalf;
      const insideVertical = Pz >= -halfHeight && Pz <= halfHeight;
      const Nx = Math.cos(theta);
      const Ny = Math.sin(theta);
      const facing = ((Cx - Px) * Nx + (Cy - Py) * Ny) > 0.0;
      if (!insideAngular || !insideVertical || !facing) return null;
      const uNorm = (theta + thetaHalf) / (2.0 * thetaHalf);
      const vNorm = (halfHeight - Pz) / (2.0 * halfHeight);
      return { x: clamp(uNorm * (w - 1), 0, w - 1), y: clamp(vNorm * (h - 1), 0, h - 1) };
    }

    function numericalJacobianDisplayToSource(x, y) {
      const eps = 1.0;
      const px1 = mapDisplayToSource(x + eps, y);
      const px0 = mapDisplayToSource(x - eps, y);
      const py1 = mapDisplayToSource(x, y + eps);
      const py0 = mapDisplayToSource(x, y - eps);
      if (!px1 || !px0 || !py1 || !py0) return null;
      return [
        [(px1.x - px0.x) / (2 * eps), (py1.x - py0.x) / (2 * eps)],
        [(px1.y - px0.y) / (2 * eps), (py1.y - py0.y) / (2 * eps)]
      ];
    }

    function sourceToDisplayJacobianAt(x, y) {
      const JdisplayToSource = numericalJacobianDisplayToSource(x, y);
      if (!JdisplayToSource) return null;
      return mat2Inv(JdisplayToSource);
    }

    function getTextureShiftVectorsSourcePx() {
      const k = degToRad(state.texture.angleShiftDeg);
      const U = [0, Math.round(state.texture.normShift)];
      const V = [Math.round(state.texture.normShift * Math.sin(k)), Math.round(state.texture.normShift * Math.cos(k))];
      return { U, V };
    }

    function getTheoreticalPeakInfo(acW, acH, displayX, displayY) {
      const J = sourceToDisplayJacobianAt(displayX, displayY);
      if (!J) return { peaks: [], U_ref_rc: null, V_ref_rc: null };
      const { U, V } = getTextureShiftVectorsSourcePx();
      const JU = mat2MulVec(J, U);
      const JV = mat2MulVec(J, V);
      const JW = mat2MulVec(J, [U[0] - V[0], U[1] - V[1]]);
      const cx = (acW - 1) / 2.0;
      const cy = (acH - 1) / 2.0;
      const peaks = [
        { name: "+JU", vec: JU, color: "#ff3030" },
        { name: "-JU", vec: [-JU[0], -JU[1]], color: "#ff3030" },
        { name: "+JV", vec: JV, color: "#00ff60" },
        { name: "-JV", vec: [-JV[0], -JV[1]], color: "#00ff60" },
        { name: "+J(U-V)", vec: JW, color: "#fff000" },
        { name: "-J(U-V)", vec: [-JW[0], -JW[1]], color: "#fff000" }
      ].map((p) => ({ name: p.name, x: cx + p.vec[0], y: cy + p.vec[1], color: p.color }));
      return {
        peaks,
        // références en convention [row, col] centrée, comme dans find_hexagon
        U_ref_rc: [JU[1], JU[0]],
        V_ref_rc: [JV[1], JV[0]]
      };
    }

    // =========================================================
    // AUTOCORRELATION + PORT JS DE find_hexagon
    // =========================================================
    function extractPatchGrayResampled(imageData, cx, cy, patchSize, targetSize) {
      const out = new Float64Array(targetSize * targetSize);
      const half = patchSize / 2;
      let k = 0;
      for (let j = 0; j < targetSize; j++) {
        const v = (j + 0.5) / targetSize;
        const yy = cy - half + v * patchSize;
        for (let i = 0; i < targetSize; i++) {
          const u = (i + 0.5) / targetSize;
          const xx = cx - half + u * patchSize;
          out[k++] = sampleGrayBilinear(imageData, xx, yy, 255);
        }
      }
      let mean = 0;
      for (let i = 0; i < out.length; i++) mean += out[i];
      mean /= Math.max(out.length, 1);
      for (let i = 0; i < out.length; i++) out[i] -= mean;
      return out;
    }

    function computeAutocorrelation2D(grayPatch, n) {
      const out = new Float64Array(n * n);
      const center = Math.floor(n / 2);
      for (let dy = -center; dy <= center; dy++) {
        for (let dx = -center; dx <= center; dx++) {
          let sum = 0.0;
          let energyA = 0.0;
          let energyB = 0.0;
          for (let y = 0; y < n; y++) {
            const yy = y + dy;
            if (yy < 0 || yy >= n) continue;
            for (let x = 0; x < n; x++) {
              const xx = x + dx;
              if (xx < 0 || xx >= n) continue;
              const a = grayPatch[y * n + x];
              const b = grayPatch[yy * n + xx];
              sum += a * b;
              energyA += a * a;
              energyB += b * b;
            }
          }
          const denom = Math.sqrt(Math.max(energyA * energyB, 1e-12));
          out[(dy + center) * n + (dx + center)] = sum / denom;
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

    function sampleArrayBilinearWrap(R, n, r, c) {
      let rr = ((r % n) + n) % n;
      let cc = ((c % n) + n) % n;
      const r0 = Math.floor(rr) % n;
      const c0 = Math.floor(cc) % n;
      const r1 = (r0 + 1) % n;
      const c1 = (c0 + 1) % n;
      const ar = rr - Math.floor(rr);
      const ac = cc - Math.floor(cc);
      const v00 = R[r0 * n + c0];
      const v10 = R[r1 * n + c0];
      const v01 = R[r0 * n + c1];
      const v11 = R[r1 * n + c1];
      const v0 = v00 * (1 - ac) + v01 * ac;
      const v1 = v10 * (1 - ac) + v11 * ac;
      return v0 * (1 - ar) + v1 * ar;
    }

    function torusDistance(p, q, n) {
      const dr0 = Math.abs(p[0] - q[0]);
      const dc0 = Math.abs(p[1] - q[1]);
      const dr = Math.min(dr0, n - dr0);
      const dc = Math.min(dc0, n - dc0);
      return Math.hypot(dr, dc);
    }

    function toCenteredOffset(p, n, center) {
      let dr = p[0] - center[0];
      let dc = p[1] - center[1];
      if (dr > n / 2) dr -= n;
      if (dr < -n / 2) dr += n;
      if (dc > n / 2) dc -= n;
      if (dc < -n / 2) dc += n;
      return [dr, dc];
    }

    function refinePeakSubpixel3x3(R, n, r, c) {
      if (r <= 0 || r >= n - 1 || c <= 0 || c >= n - 1) return [r, c];
      const center = R[r * n + c];
      const up = R[(r - 1) * n + c];
      const down = R[(r + 1) * n + c];
      const left = R[r * n + (c - 1)];
      const right = R[r * n + (c + 1)];
      const denomR = up - 2 * center + down;
      const denomC = left - 2 * center + right;
      let offR = 0;
      let offC = 0;
      if (Math.abs(denomR) > 1e-12) offR = 0.5 * (up - down) / denomR;
      if (Math.abs(denomC) > 1e-12) offC = 0.5 * (left - right) / denomC;
      offR = clamp(offR, -1, 1);
      offC = clamp(offC, -1, 1);
      return [r + offR, c + offC];
    }

    function detectCandidatesSubpixelJS(R, n, kwargs) {
      const k = Math.max(2, Math.floor(kwargs.k ?? 80));
      const nmsSize = Math.max(3, Math.floor(kwargs.nmsSize ?? 9));
      const rad = Math.floor(nmsSize / 2);
      const excludeCenterRadius = Number(kwargs.excludeCenterRadius ?? 7.0);
      const minSeparation = Number(kwargs.minSeparation ?? 3.0);
      const refineSubpixel = kwargs.refineSubpixel !== false;
      const center = [n / 2.0, n / 2.0];
      const cy = center[0];
      const cx = center[1];
      const candidates = [];

      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          const distCenter = Math.hypot(r - cy, c - cx);
          if (distCenter < excludeCenterRadius) continue;
          const val = R[r * n + c];
          let localMax = true;
          let localMin = Infinity;
          for (let dr = -rad; dr <= rad; dr++) {
            for (let dc = -rad; dc <= rad; dc++) {
              const rr = (r + dr + n) % n;
              const cc = (c + dc + n) % n;
              const vv = R[rr * n + cc];
              if (vv > val) localMax = false;
              if (vv < localMin) localMin = vv;
            }
          }
          if (!localMax) continue;
          candidates.push({ r, c, prom: val - localMin, value: val });
        }
      }

      candidates.sort((a, b) => b.prom - a.prom);
      const kept = [];
      for (const cand of candidates) {
        if (cand.prom <= 0) continue;
        const p = [cand.r, cand.c];
        if (kept.every((q) => torusDistance(p, q, n) >= minSeparation)) {
          const refined = refineSubpixel ? refinePeakSubpixel3x3(R, n, cand.r, cand.c) : [cand.r, cand.c];
          kept.push(refined);
        }
        if (kept.length >= k) break;
      }
      return kept;
    }

    function energyUVSimpleJS(R, n, uPos, vPos, kwargs) {
      const center = [n / 2.0, n / 2.0];
      const uOff = toCenteredOffset(uPos, n, center);
      const vOff = toCenteredOffset(vPos, n, center);
      const wOff = [uOff[0] - vOff[0], uOff[1] - vOff[1]];
      const wPos = [center[0] + wOff[0], center[1] + wOff[1]];
      const E = 2.0 * (
        sampleArrayBilinearWrap(R, n, uPos[0], uPos[1]) +
        sampleArrayBilinearWrap(R, n, vPos[0], vPos[1]) +
        sampleArrayBilinearWrap(R, n, wPos[0], wPos[1])
      );
      return { E, wPos, wOff };
    }

    function bestPairMaxEnergyJS(R, n, positions, kwargs) {
      if (!positions || positions.length < 2) return null;
      const center = [n / 2.0, n / 2.0];
      const minDist = Number(kwargs.minDist ?? 3.0);
      const antipodalTol = Number(kwargs.antipodalTol ?? 2.0);
      const angleMinDeg = Number(kwargs.angleMinDeg ?? 12.0);
      const wExcludeCenterRadius = Number(kwargs.wExcludeCenterRadius ?? kwargs.excludeCenterRadius ?? 7.0);
      const sinMin = Math.sin(degToRad(angleMinDeg));
      let best = null;
      let bestE = -Infinity;

      for (let i = 0; i < positions.length - 1; i++) {
        const ui = positions[i];
        for (let j = i + 1; j < positions.length; j++) {
          const vj = positions[j];
          if (torusDistance(ui, vj, n) < minDist) continue;
          const uOff = toCenteredOffset(ui, n, center);
          const vOff = toCenteredOffset(vj, n, center);
          if (Math.hypot(uOff[0] + vOff[0], uOff[1] + vOff[1]) < antipodalTol) continue;
          const nu = Math.hypot(uOff[0], uOff[1]);
          const nv = Math.hypot(vOff[0], vOff[1]);
          if (nu < 1e-9 || nv < 1e-9) continue;
          const sinang = Math.abs(uOff[0] * vOff[1] - uOff[1] * vOff[0]) / (nu * nv);
          if (sinang < sinMin) continue;
          const e = energyUVSimpleJS(R, n, ui, vj, kwargs);
          const wDist = Math.hypot(e.wOff[0], e.wOff[1]);
          if (wExcludeCenterRadius > 0 && wDist < wExcludeCenterRadius) continue;
          if (e.E > bestE) {
            bestE = e.E;
            best = { uPos: ui, vPos: vj, wPos: e.wPos, E: e.E };
          }
        }
      }
      return best;
    }

    function cos2(a, b) {
      const na = Math.hypot(a[0], a[1]);
      const nb = Math.hypot(b[0], b[1]);
      if (na < 1e-9 || nb < 1e-9) return 0;
      return (a[0] * b[0] + a[1] * b[1]) / (na * nb);
    }

    function orientUVByRefs(uOff, vOff, wOff, U_ref_rc, V_ref_rc) {
      if (!U_ref_rc || !V_ref_rc) return { u: uOff, v: vOff, w: wOff };
      const cands = [
        { u: uOff, v: vOff },
        { u: [-uOff[0], -uOff[1]], v: vOff },
        { u: uOff, v: [-vOff[0], -vOff[1]] },
        { u: [-uOff[0], -uOff[1]], v: [-vOff[0], -vOff[1]] }
      ];
      let best = cands[0];
      let bestScore = -Infinity;
      for (const cand of cands) {
        const score = cos2(cand.u, U_ref_rc) + cos2(cand.v, V_ref_rc);
        if (score > bestScore) { bestScore = score; best = cand; }
      }
      const Wref = [U_ref_rc[0] - V_ref_rc[0], U_ref_rc[1] - V_ref_rc[1]];
      const wSame = cos2(wOff, Wref) >= 0 ? wOff : [-wOff[0], -wOff[1]];
      return { u: best.u, v: best.v, w: wSame };
    }

    function findHexagonJS(R, n, kwargs, U_ref_rc = null, V_ref_rc = null) {
      const refined = detectCandidatesSubpixelJS(R, n, kwargs);
      if (refined.length < 2) return null;
      const best = bestPairMaxEnergyJS(R, n, refined, kwargs);
      if (!best) return null;
      const center = [n / 2.0, n / 2.0];
      const uC = toCenteredOffset(best.uPos, n, center);
      const vC = toCenteredOffset(best.vPos, n, center);
      const wC = toCenteredOffset(best.wPos, n, center);
      const oriented = orientUVByRefs(uC, vC, wC, U_ref_rc, V_ref_rc);
      return {
        u_fin: oriented.u,
        v_fin: oriented.v,
        w_fin: oriented.w,
        energy_final: best.E,
        refined_peaks: refined,
        hex6_centered: [
          oriented.u,
          [-oriented.u[0], -oriented.u[1]],
          oriented.v,
          [-oriented.v[0], -oriented.v[1]],
          oriented.w,
          [-oriented.w[0], -oriented.w[1]]
        ]
      };
    }

    function hexResultToPreviewPeaks(res, n) {
      if (!res) return [];
      const cx = (n - 1) / 2.0;
      const cy = (n - 1) / 2.0;
      const items = [
        { name: "F+U", off: res.u_fin, color: "#ff9999" },
        { name: "F-U", off: [-res.u_fin[0], -res.u_fin[1]], color: "#ff9999" },
        { name: "F+V", off: res.v_fin, color: "#99ff99" },
        { name: "F-V", off: [-res.v_fin[0], -res.v_fin[1]], color: "#99ff99" },
        { name: "F+W", off: res.w_fin, color: "#ffff99" },
        { name: "F-W", off: [-res.w_fin[0], -res.w_fin[1]], color: "#ffff99" }
      ];
      // off is [dr, dc], canvas uses x=col, y=row
      return items.map((p) => ({ name: p.name, x: cx + p.off[1], y: cy + p.off[0], color: p.color }));
    }

    function runStableHexagonJS(fullPatch, patchSize, targetSize, displayX, displayY, theoreticalInfo) {
      const kwargs = state.peakDetection;
      const minPs = Math.max(16, Math.floor(kwargs.minPs ?? 40));
      const maxPs = Math.min(Math.floor(kwargs.maxPs ?? patchSize), patchSize);
      const step = Math.max(1, Math.floor(kwargs.step ?? 4));
      const stableSeqLen = Math.max(2, Math.floor(kwargs.stableSeqLen ?? 3));
      const stableTol = Number(kwargs.stableTol ?? 1.0);
      let lastPts6 = null;
      let runLen = 0;
      const stable = [];
      let best = null;
      let bestD = Infinity;

      function buildSubPatchFromFull(ps) {
        const n = targetSize;
        const out = new Float64Array(n * n);
        const scale = ps / patchSize;
        const halfN = n / 2;
        let idx = 0;
        for (let r = 0; r < n; r++) {
          for (let c = 0; c < n; c++) {
            const srcR = halfN + (r - halfN) * scale;
            const srcC = halfN + (c - halfN) * scale;
            out[idx++] = samplePatchBilinear(fullPatch, n, srcR, srcC);
          }
        }
        let mean = 0;
        for (let i = 0; i < out.length; i++) mean += out[i];
        mean /= Math.max(out.length, 1);
        for (let i = 0; i < out.length; i++) out[i] -= mean;
        return out;
      }

      for (let ps = minPs; ps <= maxPs; ps += step) {
        const patch = buildSubPatchFromFull(ps);
        const ac = computeAutocorrelation2D(patch, targetSize);
        const res = findHexagonJS(ac, targetSize, kwargs, theoreticalInfo.U_ref_rc, theoreticalInfo.V_ref_rc);
        if (!res) {
          lastPts6 = null;
          runLen = 0;
          stable.length = 0;
          continue;
        }
        const pts6 = res.hex6_centered.map((o) => [o[1], o[0]]); // [dc, dr]
        if (lastPts6) {
          let dmax = 0;
          for (let i = 0; i < 6; i++) {
            dmax = Math.max(dmax, Math.hypot(pts6[i][0] - lastPts6[i][0], pts6[i][1] - lastPts6[i][1]));
          }
          if (dmax < bestD) {
            bestD = dmax;
            best = res;
          }
          if (dmax <= stableTol) {
            runLen += 1;
            stable.push(res);
            if (runLen >= stableSeqLen) return res;
          } else {
            runLen = 1;
            stable.length = 0;
            stable.push(res);
          }
        } else {
          runLen = 1;
          stable.length = 0;
          stable.push(res);
        }
        lastPts6 = pts6;
      }
      return best;
    }

    function samplePatchBilinear(patch, n, r, c) {
      if (r < 0 || r > n - 1 || c < 0 || c > n - 1) return 0;
      const r0 = Math.floor(r);
      const c0 = Math.floor(c);
      const r1 = Math.min(r0 + 1, n - 1);
      const c1 = Math.min(c0 + 1, n - 1);
      const ar = r - r0;
      const ac = c - c0;
      const v00 = patch[r0 * n + c0];
      const v10 = patch[r1 * n + c0];
      const v01 = patch[r0 * n + c1];
      const v11 = patch[r1 * n + c1];
      const v0 = v00 * (1 - ac) + v01 * ac;
      const v1 = v10 * (1 - ac) + v11 * ac;
      return v0 * (1 - ar) + v1 * ar;
    }

    function drawPeakOverlayOnPreview(foundPeaks, acW, acH, detectionInfo) {
      if (!acorrCtx || !acorrCanvas) return;

      const sx = acorrCanvas.width / acW;
      const sy = acorrCanvas.height / acH;

      // On garde uniquement le centre de l’autocorrélation + les pics trouvés.
      // Les pics théoriques et les candidats intermédiaires ne sont plus affichés.
      // IMPORTANT: p.x/p.y are source-pixel indices in the small autocorr image.
      // Since we upscale with imageSmoothing=false, pixel i is displayed as the block
      // [i*s, (i+1)*s]. The visual center is therefore (i + 0.5) * s.
      // Without this +0.5 shift, circles look systematically shifted from bright blobs.
      const cx0 = (((acW - 1) / 2.0) + 0.5) * sx;
      const cy0 = (((acH - 1) / 2.0) + 0.5) * sy;
      drawCircle(acorrCtx, cx0, cy0, 5, "#00ffff", 2);
      drawText(acorrCtx, "0", cx0 + 6, cy0 + 12, "#00ffff");

      foundPeaks.forEach((p) => {
        const px = (p.x + 0.5) * sx;
        const py = (p.y + 0.5) * sy;

        if (px < 0 || px >= acorrCanvas.width || py < 0 || py >= acorrCanvas.height) {
          return;
        }

        drawCircle(acorrCtx, px, py, 6, p.color, 2);
        drawText(acorrCtx, p.name, px + 7, py - 7, p.color);
      });

      if (detectionInfo && detectionInfo.energy_final !== undefined) {
        drawText(
          acorrCtx,
          `E=${Number(detectionInfo.energy_final).toFixed(3)}`,
          8,
          acorrCanvas.height - 10,
          "#ffffff"
        );
      }
    }

    function renderAutocorrelationAt(x, y) {
      if (!state.autocorrEnabled || !state.displayedImageData || !acorrCanvas || !acorrCtx) return;

      const patchSize = state.patchSize;
      const computeSize = Math.min(state.previewComputeSize, patchSize);
      const cx = x;
      const cy = y;

      const patch = extractPatchGrayResampled(state.displayedImageData, cx, cy, patchSize, computeSize);
      const ac = computeAutocorrelation2D(patch, computeSize);
      const displayField = state.displayMode === "laplacian" ? computeLaplacian2D(ac, computeSize, computeSize) : ac;
      const contrasted01 = applyDisplayContrastRobust(displayField, computeSize, computeSize, state.previewContrast, state.displayMode);
      const gray = float01ToUint8(contrasted01);
      const img = createImageDataFromGray(gray, computeSize, computeSize);

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = computeSize;
      tempCanvas.height = computeSize;
      const tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true });
      tempCtx.putImageData(img, 0, 0);

      acorrCtx.clearRect(0, 0, acorrCanvas.width, acorrCanvas.height);
      acorrCtx.imageSmoothingEnabled = false;
      acorrCtx.drawImage(tempCanvas, 0, 0, acorrCanvas.width, acorrCanvas.height);
      drawCross(acorrCtx, acorrCanvas.width / 2, acorrCanvas.height / 2, "#00ffff", 5, 1);

      if (state.peaksEnabled) {
        const theoreticalInfo = getTheoreticalPeakInfo(computeSize, computeSize, cx, cy);
        let detection = null;
        if (state.peakDetection.useStablePatch) {
          detection = runStableHexagonJS(patch, patchSize, computeSize, cx, cy, theoreticalInfo);
        } else {
          detection = findHexagonJS(ac, computeSize, state.peakDetection, theoreticalInfo.U_ref_rc, theoreticalInfo.V_ref_rc);
        }
        state.lastDetection = detection;
        const foundPeaks = hexResultToPreviewPeaks(detection, computeSize);
        drawPeakOverlayOnPreview(foundPeaks, computeSize, computeSize, detection);
      }

      if (acorrModeLabel) {
        acorrModeLabel.textContent = state.displayMode === "laplacian" ? "Laplacian of Autocorrelation" : "Autocorrelation";
      }
      if (patchSizeLabel) patchSizeLabel.textContent = `Patch: ${patchSize} px`;
      if (patchSizeInline) patchSizeInline.textContent = patchSize;
      redrawMainCanvas();
    }

    // =========================================================
    // PARAMETER ACTIONS
    // =========================================================
    function resetAllParams() {
      state.texture = { ...DEFAULTS.texture };
      state.affine = { ...DEFAULTS.affine };
      state.perspective = { ...DEFAULTS.perspective };
      state.cylindrical = { ...DEFAULTS.cylindrical };
      state.shoulder = { ...DEFAULTS.shoulder };
      state.crumpled = { ...DEFAULTS.crumpled };
      state.patchSize = 90;
      state.previewContrast = 2.2;
      state.displayMode = "autocorr";
      state.peaksEnabled = false;
      state.projectionIndex = 0;
      state.lockedPatch = false;
      state.mouseX = state.size / 2;
      state.mouseY = state.size / 2;
      state.lockedPatchX = state.mouseX;
      state.lockedPatchY = state.mouseY;
      state.lastDetection = null;
      syncControlsFromState();
      renderGeneratedTexture();
      if (state.autocorrEnabled) {
        const p = getActivePatchCenter();
        renderAutocorrelationAt(p.x, p.y);
      } else {
        redrawMainCanvas();
      }
    }

    function updatePreviewContrast(delta) {
      state.previewContrast = clamp(Math.round((state.previewContrast + delta) * 10) / 10, 0.2, 8.0);
      if (contrastSlider) contrastSlider.value = String(state.previewContrast);
      refreshControlLabels();
      if (state.autocorrEnabled) schedulePreviewRender();
    }

    function cycleProjectionMode() {
      state.projectionIndex = (state.projectionIndex + 1) % state.projectionModes.length;
      refreshProjectionPanels();
      applyCurrentProjection();
    }

    // =========================================================
    // EVENTS
    // =========================================================
    if (btnGenerate) {
      btnGenerate.addEventListener("click", () => {
        updateStateFromControls();
        renderGeneratedTexture();
      });
    }

    if (btnProjection) {
      btnProjection.addEventListener("click", () => cycleProjectionMode());
    }

    if (btnAutocorr) {
      btnAutocorr.addEventListener("click", () => {
        if (!state.autocorrEnabled) state.displayMode = "autocorr";
        state.autocorrEnabled = !state.autocorrEnabled;
        if (!state.autocorrEnabled) state.peaksEnabled = false;
        refreshAutocorrStateUI();
        refreshPeakStateUI();
        if (state.autocorrEnabled) {
          const p = getActivePatchCenter();
          renderAutocorrelationAt(p.x, p.y);
        } else {
          redrawMainCanvas();
        }
      });
    }

    if (btnDetectPeaks) {
      btnDetectPeaks.addEventListener("click", () => {
        state.peaksEnabled = !state.peaksEnabled;
        if (state.peaksEnabled && !state.autocorrEnabled) {
          state.autocorrEnabled = true;
          state.displayMode = "autocorr";
        }
        refreshAutocorrStateUI();
        refreshPeakStateUI();
        const p = getActivePatchCenter();
        renderAutocorrelationAt(p.x, p.y);
      });
    }

    if (btnResetParams) btnResetParams.addEventListener("click", () => resetAllParams());

    if (contrastSlider) {
      contrastSlider.addEventListener("input", () => {
        state.previewContrast = parseFloat(contrastSlider.value);
        refreshControlLabels();
        if (state.autocorrEnabled) schedulePreviewRender();
      });
    }

    if (patchSizeControl) {
      patchSizeControl.addEventListener("input", () => {
        updateStateFromControls();
        refreshControlLabels();
        if (state.autocorrEnabled) schedulePreviewRender();
        else redrawMainCanvas();
      });
    }

    [texOccupancy, texDilation, texAngle, texShift, texBlur].forEach((el) => {
      if (!el) return;
      el.addEventListener("input", () => {
        updateStateFromControls();
        renderGeneratedTexture();
      });
    });

    controlIds.forEach((id) => {
      if (!controls[id]) return;
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
        if (!state.lockedPatch) {
          updateAutocorrPreviewPosition(event.clientX, event.clientY);
          schedulePreviewRender();
        } else {
          redrawMainCanvas();
        }
      } else {
        redrawMainCanvas();
      }
    });

    canvas.addEventListener("mouseenter", (event) => {
      canvasHovered = true;
      if (state.autocorrEnabled) {
        if (acorrPreview) acorrPreview.style.display = "block";
        if (state.lockedPatch) {
          updateAutocorrPreviewPositionFromCanvasPoint(state.lockedPatchX, state.lockedPatchY);
          renderAutocorrelationAt(state.lockedPatchX, state.lockedPatchY);
        } else {
          updateAutocorrPreviewPosition(event.clientX, event.clientY);
          renderAutocorrelationAt(state.mouseX, state.mouseY);
        }
      }
    });

    canvas.addEventListener("contextmenu", (event) => {
      if (!state.autocorrEnabled) return;
      event.preventDefault();
      state.lockedPatch = false;
      updateAutocorrPreviewPosition(event.clientX, event.clientY);
      redrawMainCanvas();
      schedulePreviewRender();
    });

    canvas.addEventListener("click", (event) => {
      if (!state.autocorrEnabled) return;
      const pos = getCanvasMousePos(event, canvas);
      state.lockedPatch = true;
      state.lockedPatchX = pos.x;
      state.lockedPatchY = pos.y;
      updateAutocorrPreviewPositionFromCanvasPoint(state.lockedPatchX, state.lockedPatchY);
      renderAutocorrelationAt(state.lockedPatchX, state.lockedPatchY);
    });

    canvas.addEventListener("mouseleave", () => {
      canvasHovered = false;
      if (state.autocorrEnabled && acorrPreview && !state.lockedPatch) acorrPreview.style.display = "none";
      redrawMainCanvas();
    });

    canvas.addEventListener(
      "wheel",
      (event) => {
        if (!state.autocorrEnabled) return;
        event.preventDefault();
        const step = event.deltaY < 0 ? 4 : -4;
        let next = clamp(state.patchSize + step, 32, 140);
        if (next % 2 !== 0) {
          next += step > 0 ? 1 : -1;
          next = clamp(next, 32, 140);
        }
        state.patchSize = next;
        if (patchSizeControl) patchSizeControl.value = String(state.patchSize);
        refreshControlLabels();
        schedulePreviewRender();
      },
      { passive: false }
    );

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
      } else if (event.key === "Escape") {
        event.preventDefault();
        state.lockedPatch = false;
        redrawMainCanvas();
        schedulePreviewRender();
      }
    });

    window.addEventListener("resize", () => {
      if (state.autocorrEnabled) schedulePreviewRender();
    });


    // =========================================================
    // EDITABLE SLIDER VALUES
    // =========================================================
    function enableEditableSliderValues() {
      const pairs = [
        [valOccupancy, texOccupancy], [valDilation, texDilation], [valAngle, texAngle],
        [valShift, texShift], [valBlur, texBlur], [valPatchSlider, patchSizeControl],
        [values.aRot, controls["param-a-rot"]], [values.aScaleX, controls["param-a-scalex"]],
        [values.aScaleY, controls["param-a-scaley"]], [values.aShearX, controls["param-a-shearx"]],
        [values.aShearY, controls["param-a-sheary"]], [values.pTiltX, controls["param-p-tiltx"]],
        [values.pTiltY, controls["param-p-tilty"]], [values.pFocal, controls["param-p-focal"]],
        [values.pZRot, controls["param-p-zrot"]], [values.cCurv, controls["param-c-curv"]],
        [values.cDrop, controls["param-c-drop"]], [values.cZRot, controls["param-c-zrot"]],
        [values.cVStretch, controls["param-c-vstretch"]], [values.sSpan, controls["param-s-span"]],
        [values.sCamera, controls["param-s-camera"]], [values.sNeck, controls["param-s-neck"]],
        [values.sShoulder, controls["param-s-shoulder"]], [values.sRoll, controls["param-s-roll"]],
        [values.sVStretch, controls["param-s-vstretch"]], [values.rAmp, controls["param-r-amp"]],
        [values.rFreq, controls["param-r-freq"]], [values.rPersp, controls["param-r-persp"]],
        [values.rRoll, controls["param-r-roll"]], [values.rTwist, controls["param-r-twist"]],
        [values.rShade, controls["param-r-shade"]], [contrastValue, contrastSlider]
      ];

      pairs.forEach(([label, slider]) => {
        if (!label || !slider) return;
        label.setAttribute("contenteditable", "true");
        label.setAttribute("title", "Click to type a value, then press Enter");

        label.addEventListener("focus", () => {
          const range = document.createRange();
          range.selectNodeContents(label);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        });

        function commit() {
          const raw = String(label.textContent || "").replace("°", "").replace("px", "").replace("×", "").trim();
          const v = Number.parseFloat(raw.replace(",", "."));
          if (!Number.isFinite(v)) {
            refreshControlLabels();
            return;
          }
          const min = Number.parseFloat(slider.min);
          const max = Number.parseFloat(slider.max);
          const vv = clamp(v, Number.isFinite(min) ? min : v, Number.isFinite(max) ? max : v);
          slider.value = String(vv);
          slider.dispatchEvent(new Event("input", { bubbles: true }));
        }

        label.addEventListener("keydown", (event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            label.blur();
          }
          event.stopPropagation();
        });
        label.addEventListener("blur", commit);
      });
    }

    // =========================================================
    // INIT
    // =========================================================
    syncControlsFromState();
    enableEditableSliderValues();
    refreshPeakStateUI();
    renderGeneratedTexture();
  });
})();
