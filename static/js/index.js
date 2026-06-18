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

    const btnSyntheticTests = document.getElementById("btn-synthetic-tests");
    const btnRealTests = document.getElementById("btn-real-tests");
    const realUploadPanel = document.getElementById("real-upload-panel");
    const dropReferenceImage = document.getElementById("drop-reference-image");
    const dropDeformedImage = document.getElementById("drop-deformed-image");
    const inputReferenceImage = document.getElementById("input-reference-image");
    const inputDeformedImage = document.getElementById("input-deformed-image");
    const referenceUploadStatus = document.getElementById("reference-upload-status");
    const deformedUploadStatus = document.getElementById("deformed-upload-status");

    const acorrPreview = document.getElementById("acorr-preview");
    const acorrCanvas = document.getElementById("acorr-canvas");
    const acorrCtx = acorrCanvas
      ? acorrCanvas.getContext("2d", { willReadFrequently: true })
      : null;

    const btnGenerate = document.getElementById("btn-generate-texture");
    const btnProjection = document.getElementById("btn-change-projection");
    const btnAutocorr = document.getElementById("btn-toggle-autocorr");
    const btnResetParams = document.getElementById("btn-reset-params");
    const btnValidateAffinity = document.getElementById("btn-validate-affinity");
    const btnToggleRectification = document.getElementById("btn-toggle-rectification");
    const btnTogglePatchView = document.getElementById("btn-toggle-patch-view");
    const btnShowTriangulation = document.getElementById("btn-show-triangulation");
    const btnSavePeaksDetails = document.getElementById("btn-save-peaks-details");
    const btnClearAffinities = document.getElementById("btn-clear-affinities");

    let btnDetectPeaks = document.getElementById("btn-detect-peaks");
    let peaksStateLabel = document.getElementById("peaks-state-label");
    const validatedAffinityCount = document.getElementById("validated-affinity-count");
    const rectificationStateLabel = document.getElementById("rectification-state-label");
    const currentAffinityCond = document.getElementById("current-affinity-cond");
    const validationStateLabel = document.getElementById("validation-state-label");
    const patchViewPanel = document.getElementById("patch-view-panel");
    const patchViewGrid = document.getElementById("patch-view-grid");
    const patchViewSummary = document.getElementById("patch-view-summary");

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
    const panelTwoPlanes = document.getElementById("panel-two-planes");

    const controlIds = [
      "param-a-rot", "param-a-scalex", "param-a-scaley", "param-a-shearx", "param-a-sheary",
      "param-p-tiltx", "param-p-tilty", "param-p-focal",
      "param-c-curv", "param-c-drop", "param-c-zrot", "param-c-vstretch",
      "param-s-span", "param-s-camera", "param-s-neck", "param-s-shoulder", "param-s-roll", "param-s-vstretch",
      "param-r-amp", "param-r-freq", "param-r-persp", "param-r-roll", "param-r-twist", "param-r-shade",
      "param-tp-fold", "param-tp-viewx", "param-tp-viewy", "param-tp-viewz", "param-tp-focal", "param-tp-camera"
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
      rShade: document.getElementById("val-r-shade"),
      tpFold: document.getElementById("val-tp-fold"),
      tpViewX: document.getElementById("val-tp-viewx"),
      tpViewY: document.getElementById("val-tp-viewy"),
      tpViewZ: document.getElementById("val-tp-viewz"),
      tpFocal: document.getElementById("val-tp-focal"),
      tpCamera: document.getElementById("val-tp-camera")
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
        angleViewXDeg: 30,
        angleViewYDeg: 0,
        focal: 1000
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
      },
      twoPlanes: {
        foldAngleDeg: 115,
        viewXDeg: 12,
        viewYDeg: -28,
        viewZDeg: 0,
        focalScale: 1.00,
        cameraDistance: 3.00
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
      testMode: "synthetic",
      realReferenceImageData: null,
      realDeformedImageData: null,
      patchSize: 90,
      previewContrast: 2.2,
      autocorrEnabled: false,
      peaksEnabled: false,
      projectionModes: ["Affine", "Perspective", "Cylindrical", "Shoulder", "Crumpled", "Two Planes"],
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
      twoPlanes: { ...DEFAULTS.twoPlanes },
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

      lastDetection: null,

      // Manual rectification workflow. Each validated item stores one user-accepted
      // local deformation matrix M such that observed_peak ≈ M * reference_peak.
      // The rectified view uses the average of all manually validated matrices.
      validatedAffinities: [],
      rectificationEnabled: false,
      differenceEnabled: false,
      patchViewEnabled: false,
      rectificationImageData: null,
      differenceImageData: null,
      rectificationTransform: null,
      globalHomography: null,
      globalHomographyInfo: null,
      lastAffinityEstimate: null,
      sourceGrayCache: null,
      sourcePhaseReferenceCache: null,

      // Triangular mesh visualization.
      // It is built from manually validated anchors. Each anchor gives:
      //   - a local patch size that worked in that region,
      //   - a local matrix M such that deformed_offset ≈ M * reference_offset,
      //   - a matched reference center from phase correlation.
      triangulationEnabled: false,
      triangulationData: null,
      triangulationOptions: {
        gridRadius: 18,          // number of U/V steps around the average reference center
        maxTriangles: 2400,      // safety limit for browser performance
        idwPower: 2.0,           // inverse-distance weighting for local interpolation
        detectStride: 3,         // optional local peak re-detection every N grid vertices
        maxDetectionChecks: 120, // safety limit for extra peak checks
        minConfidence: 0.15,

        // REAL TESTS ONLY:
        // In real-image mode the triangulation must NOT reuse the synthetic
        // periodic lattice (U,V). It is drawn as a regular image-space mesh
        // covering the whole uploaded test canvas.
        realGridMargin: 0,
        realGridDivisions: 100
      }
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
    // TEST MODE + REAL IMAGE UPLOADS
    // =========================================================
    function resetGeometryResults(message = "Ready") {
      state.lastDetection = null;
      state.lastAffinityEstimate = null;
      state.validatedAffinities = [];
      state.rectificationEnabled = false;
      state.differenceEnabled = false;
      state.patchViewEnabled = false;
      state.rectificationImageData = null;
      state.differenceImageData = null;
      state.rectificationTransform = null;
      state.globalHomography = null;
      state.globalHomographyInfo = null;
      state.triangulationEnabled = false;
      state.triangulationData = null;
      state.lockedPatch = false;
      setValidationMessage(message);
      refreshRectificationUI();
      renderValidatedPatchesPanel();
    }

    function updateTestModeUI() {
      const isReal = state.testMode === "real";
      document.body.classList.toggle("real-tests-mode", isReal);
      if (realUploadPanel) realUploadPanel.classList.toggle("is-active", isReal);
      if (btnSyntheticTests) {
        btnSyntheticTests.classList.toggle("is-active", !isReal);
        btnSyntheticTests.classList.toggle("is-dark", !isReal);
        btnSyntheticTests.classList.toggle("is-light", isReal);
      }
      if (btnRealTests) {
        btnRealTests.classList.toggle("is-active", isReal);
        btnRealTests.classList.toggle("is-dark", isReal);
        btnRealTests.classList.toggle("is-light", !isReal);
      }
      if (projectionModeLabel) projectionModeLabel.textContent = isReal ? "Real image" : state.projectionModes[state.projectionIndex];
    }

    function setTestMode(mode) {
      const nextMode = mode === "real" ? "real" : "synthetic";
      if (state.testMode === nextMode) return;
      state.testMode = nextMode;
      resetGeometryResults(nextMode === "real" ? "Load the reference and deformed images" : "Ready");
      updateTestModeUI();

      if (nextMode === "synthetic") {
        applyCurrentProjection();
      } else {
        if (state.realReferenceImageData) {
          state.sourceImageData = state.realReferenceImageData;
          state.sourceCtx.putImageData(state.sourceImageData, 0, 0);
        }
        if (state.realDeformedImageData) {
          state.displayedImageData = state.realDeformedImageData;
          state.displayedCtx.putImageData(state.displayedImageData, 0, 0);
        }
        redrawMainCanvas();
      }
    }

    function imageFileToSquareImageData(file) {
      return new Promise((resolve, reject) => {
        if (!file || !file.type || !file.type.startsWith("image/")) {
          reject(new Error("Please choose an image file."));
          return;
        }
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Could not read this file."));
        reader.onload = () => {
          const img = new Image();
          img.onerror = () => reject(new Error("Could not decode this image."));
          img.onload = () => {
            const c = document.createElement("canvas");
            c.width = state.size;
            c.height = state.size;
            const cctx = c.getContext("2d", { willReadFrequently: true });
            cctx.fillStyle = "white";
            cctx.fillRect(0, 0, c.width, c.height);

            const scale = Math.min(c.width / img.width, c.height / img.height);
            const dw = Math.max(1, Math.round(img.width * scale));
            const dh = Math.max(1, Math.round(img.height * scale));
            const dx = Math.round((c.width - dw) / 2);
            const dy = Math.round((c.height - dh) / 2);
            cctx.imageSmoothingEnabled = true;
            cctx.imageSmoothingQuality = "high";
            cctx.drawImage(img, dx, dy, dw, dh);

            const rgba = cctx.getImageData(0, 0, c.width, c.height);
            const data = rgba.data;
            for (let i = 0; i < data.length; i += 4) {
              const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
              data[i] = gray;
              data[i + 1] = gray;
              data[i + 2] = gray;
              data[i + 3] = 255;
            }
            resolve(rgba);
          };
          img.src = String(reader.result || "");
        };
        reader.readAsDataURL(file);
      });
    }

    async function loadRealImage(file, role) {
      try {
        const imgData = await imageFileToSquareImageData(file);
        resetGeometryResults("Real image loaded. Continue with autocorrelation and peak detection.");
        state.sourceGrayCache = null;
        state.sourcePhaseReferenceCache = null;

        if (role === "reference") {
          state.realReferenceImageData = imgData;
          state.sourceImageData = imgData;
          state.sourceCtx.putImageData(imgData, 0, 0);
          if (referenceUploadStatus) referenceUploadStatus.textContent = `${file.name} loaded`;
        } else {
          state.realDeformedImageData = imgData;
          state.displayedImageData = imgData;
          state.displayedCtx.putImageData(imgData, 0, 0);
          if (deformedUploadStatus) deformedUploadStatus.textContent = `${file.name} loaded`;
        }

        state.testMode = "real";
        updateTestModeUI();
        if (state.autocorrEnabled) {
          const p = getActivePatchCenter();
          renderAutocorrelationAt(p.x, p.y);
        }
        redrawMainCanvas();
      } catch (err) {
        setValidationMessage(err && err.message ? err.message : "Image loading failed");
      }
    }

    function setupDropzone(dropzone, input, role) {
      if (!dropzone || !input) return;

      input.addEventListener("change", () => {
        const file = input.files && input.files[0];
        if (file) loadRealImage(file, role);
      });

      ["dragenter", "dragover"].forEach((eventName) => {
        dropzone.addEventListener(eventName, (event) => {
          event.preventDefault();
          event.stopPropagation();
          dropzone.classList.add("is-dragover");
        });
      });

      ["dragleave", "drop"].forEach((eventName) => {
        dropzone.addEventListener(eventName, (event) => {
          event.preventDefault();
          event.stopPropagation();
          dropzone.classList.remove("is-dragover");
        });
      });

      dropzone.addEventListener("drop", (event) => {
        const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
        if (file) loadRealImage(file, role);
      });
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

    function setValidationMessage(message) {
      if (validationStateLabel) validationStateLabel.textContent = message;
    }

    function refreshRectificationUI() {
      if (validatedAffinityCount) validatedAffinityCount.textContent = String(state.validatedAffinities.length);
      if (rectificationStateLabel) {
        rectificationStateLabel.textContent = state.rectificationEnabled
          ? "RECTIFIED"
          : (state.differenceEnabled ? "DIFFERENCE" : "OFF");
      }
      if (btnToggleRectification) {
        btnToggleRectification.classList.toggle("is-info", !state.rectificationEnabled && !state.differenceEnabled);
        btnToggleRectification.classList.toggle("is-danger", state.rectificationEnabled);
        btnToggleRectification.classList.toggle("is-warning", state.differenceEnabled);
        const textSpan = btnToggleRectification.querySelector("span:last-child");
        if (textSpan) {
          textSpan.textContent = state.rectificationEnabled
            ? "Show Difference"
            : (state.differenceEnabled ? "Show Deformed" : "Rectify");
        }
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
      if (panelTwoPlanes) panelTwoPlanes.classList.toggle("is-active", mode === "Two Planes");
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

      if (values.pTiltX) values.pTiltX.textContent = `${Math.round(state.perspective.angleViewXDeg)}°`;
      if (values.pTiltY) values.pTiltY.textContent = `${Math.round(state.perspective.angleViewYDeg)}°`;
      if (values.pFocal) values.pFocal.textContent = `${Math.round(state.perspective.focal)}`;

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

      if (values.tpFold) values.tpFold.textContent = `${state.twoPlanes.foldAngleDeg}°`;
      if (values.tpViewX) values.tpViewX.textContent = `${state.twoPlanes.viewXDeg}°`;
      if (values.tpViewY) values.tpViewY.textContent = `${state.twoPlanes.viewYDeg}°`;
      if (values.tpViewZ) values.tpViewZ.textContent = `${state.twoPlanes.viewZDeg}°`;
      if (values.tpFocal) values.tpFocal.textContent = state.twoPlanes.focalScale.toFixed(2);
      if (values.tpCamera) values.tpCamera.textContent = state.twoPlanes.cameraDistance.toFixed(2);

      if (contrastValue) contrastValue.textContent = `${state.previewContrast.toFixed(1)}×`;
      if (patchSizeLabel) patchSizeLabel.textContent = `Patch: ${state.patchSize} px`;
      if (patchSizeInline) patchSizeInline.textContent = state.patchSize;
      refreshPeakStateUI();
      refreshRectificationUI();
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

      if (controls["param-p-tiltx"]) controls["param-p-tiltx"].value = String(state.perspective.angleViewXDeg);
      if (controls["param-p-tilty"]) controls["param-p-tilty"].value = String(state.perspective.angleViewYDeg);
      if (controls["param-p-focal"]) controls["param-p-focal"].value = String(state.perspective.focal);

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

      if (controls["param-tp-fold"]) controls["param-tp-fold"].value = String(state.twoPlanes.foldAngleDeg);
      if (controls["param-tp-viewx"]) controls["param-tp-viewx"].value = String(state.twoPlanes.viewXDeg);
      if (controls["param-tp-viewy"]) controls["param-tp-viewy"].value = String(state.twoPlanes.viewYDeg);
      if (controls["param-tp-viewz"]) controls["param-tp-viewz"].value = String(state.twoPlanes.viewZDeg);
      if (controls["param-tp-focal"]) controls["param-tp-focal"].value = String(state.twoPlanes.focalScale);
      if (controls["param-tp-camera"]) controls["param-tp-camera"].value = String(state.twoPlanes.cameraDistance);

      if (contrastSlider) contrastSlider.value = String(state.previewContrast);

      refreshControlLabels();
      refreshProjectionPanels();
      refreshAutocorrStateUI();
      refreshPeakStateUI();
      refreshRectificationUI();
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

      if (controls["param-p-tiltx"]) state.perspective.angleViewXDeg = parseFloat(controls["param-p-tiltx"].value);
      if (controls["param-p-tilty"]) state.perspective.angleViewYDeg = parseFloat(controls["param-p-tilty"].value);
      if (controls["param-p-focal"]) state.perspective.focal = parseFloat(controls["param-p-focal"].value);

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

      if (controls["param-tp-fold"]) state.twoPlanes.foldAngleDeg = parseInt(controls["param-tp-fold"].value, 10);
      if (controls["param-tp-viewx"]) state.twoPlanes.viewXDeg = parseInt(controls["param-tp-viewx"].value, 10);
      if (controls["param-tp-viewy"]) state.twoPlanes.viewYDeg = parseInt(controls["param-tp-viewy"].value, 10);
      if (controls["param-tp-viewz"]) state.twoPlanes.viewZDeg = parseInt(controls["param-tp-viewz"].value, 10);
      if (controls["param-tp-focal"]) state.twoPlanes.focalScale = parseFloat(controls["param-tp-focal"].value);
      if (controls["param-tp-camera"]) state.twoPlanes.cameraDistance = parseFloat(controls["param-tp-camera"].value);

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
      state.sourceGrayCache = null;
      state.sourcePhaseReferenceCache = null;
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

    function solveLinearSystem(A, b) {
      const n = A.length;
      const M = A.map((row, i) => row.slice().concat([b[i]]));
      for (let col = 0; col < n; col++) {
        let pivot = col;
        for (let r = col + 1; r < n; r++) {
          if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
        }
        if (Math.abs(M[pivot][col]) < 1e-12 || !Number.isFinite(M[pivot][col])) return null;
        if (pivot !== col) {
          const tmp = M[pivot];
          M[pivot] = M[col];
          M[col] = tmp;
        }
        const piv = M[col][col];
        for (let c = col; c <= n; c++) M[col][c] /= piv;
        for (let r = 0; r < n; r++) {
          if (r === col) continue;
          const f = M[r][col];
          if (f === 0) continue;
          for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
        }
      }
      return M.map((row) => row[n]);
    }

    function homographyFromFourPointPairs(srcPts, dstPts) {
      if (!srcPts || !dstPts || srcPts.length !== 4 || dstPts.length !== 4) return null;
      const A = [];
      const b = [];
      for (let i = 0; i < 4; i++) {
        const x = srcPts[i][0], y = srcPts[i][1];
        const u = dstPts[i][0], v = dstPts[i][1];
        A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
        b.push(u);
        A.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
        b.push(v);
      }
      const h = solveLinearSystem(A, b);
      if (!h) return null;
      return [
        [h[0], h[1], h[2]],
        [h[3], h[4], h[5]],
        [h[6], h[7], 1.0]
      ];
    }

    function buildPerspectiveHomography(width, height) {
      const angleVueX = degToRad(state.perspective.angleViewXDeg || 0);
      const angleVueY = degToRad(state.perspective.angleViewYDeg || 0);
      const focal = Math.max(1e-6, Number(state.perspective.focal) || 1000);
      const zOffset = 2.0;

      const points3D = [
        [-1.0, -1.0, 0.0],
        [ 1.0, -1.0, 0.0],
        [-1.0,  1.0, 0.0],
        [ 1.0,  1.0, 0.0]
      ];

      const cx = Math.cos(angleVueX), sx = Math.sin(angleVueX);
      const cy = Math.cos(angleVueY), sy = Math.sin(angleVueY);

      const Rx = [
        [1, 0, 0],
        [0, cx, -sx],
        [0, sx, cx]
      ];
      const Ry = [
        [cy, 0, sy],
        [0, 1, 0],
        [-sy, 0, cy]
      ];
      const R = mat3Mul(Rx, Ry);

      const projected = points3D.map((pt) => {
        const q = mat3MulVec(R, [pt[0], pt[1], pt[2]]);
        const denom = q[2] + zOffset;
        return [q[0] * focal / denom, q[1] * focal / denom];
      });

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      projected.forEach((p) => {
        minX = Math.min(minX, p[0]);
        maxX = Math.max(maxX, p[0]);
        minY = Math.min(minY, p[1]);
        maxY = Math.max(maxY, p[1]);
      });

      const spanX = Math.max(1e-9, maxX - minX);
      const spanY = Math.max(1e-9, maxY - minY);
      const scale = Math.min(width / spanX, height / spanY);
      const offsetX = (width - scale * spanX) / 2 - scale * minX;
      const offsetY = (height - scale * spanY) / 2 - scale * minY;

      const dstPts = projected.map((p) => [p[0] * scale + offsetX, p[1] * scale + offsetY]);
      const srcPts = [
        [0, 0],
        [width, 0],
        [0, height],
        [width, height]
      ];

      const H = homographyFromFourPointPairs(srcPts, dstPts);
      const Hinv = H ? invert3x3(H) : null;
      return { H, Hinv, srcPts, dstPts, zOffset, focal };
    }

    function applyPerspectiveProjection(imageData) {
      const w = imageData.width;
      const h = imageData.height;
      const out = new ImageData(w, h);
      const dst = out.data;
      const grayBorder = Math.round(computeMeanGray(imageData));
      const hom = buildPerspectiveHomography(w, h);
      const Hinv = hom.Hinv;
      if (!Hinv) return imageData;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const src = applyHomographyPoint(Hinv, [x, y]);
          const di = (y * w + x) * 4;
          const gray = sampleGrayBilinear(imageData, src[0], src[1], grayBorder);
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


    function rotateVecX(v, a) {
      const c = Math.cos(a), s = Math.sin(a);
      return [v[0], c * v[1] - s * v[2], s * v[1] + c * v[2]];
    }

    function rotateVecY(v, a) {
      const c = Math.cos(a), s = Math.sin(a);
      return [c * v[0] + s * v[2], v[1], -s * v[0] + c * v[2]];
    }

    function rotateVecZ(v, a) {
      const c = Math.cos(a), s = Math.sin(a);
      return [c * v[0] - s * v[1], s * v[0] + c * v[1], v[2]];
    }

    function rotateVecEulerXYZ(v, ax, ay, az) {
      // Object/view rotation used by the two-plane projection.
      // Order: X then Y then Z, which is intuitive for independent sliders.
      return rotateVecZ(rotateVecY(rotateVecX(v, ax), ay), az);
    }

    function twoPlaneBasis(side) {
      // Source coordinates are normalized: s in [-1, 1] horizontally,
      // t in [-1, 1] vertically. The two planes are hinged at s = 0.
      // foldAngleDeg = 180 gives a flat plane. Smaller values fold the two
      // halves toward the camera like an open book.
      const foldAngle = clamp(state.twoPlanes.foldAngleDeg, 40, 180);
      const delta = degToRad((180.0 - foldAngle) * 0.5);
      const sideAngle = side < 0 ? delta : -delta;
      const ax = degToRad(state.twoPlanes.viewXDeg);
      const ay = degToRad(state.twoPlanes.viewYDeg);
      const az = degToRad(state.twoPlanes.viewZDeg);

      const eS0 = rotateVecY([1, 0, 0], sideAngle);
      const eT0 = [0, -1, 0];
      const eS = normalizeVec3(rotateVecEulerXYZ(eS0, ax, ay, az));
      const eT = normalizeVec3(rotateVecEulerXYZ(eT0, ax, ay, az));
      const normal = normalizeVec3(crossVec3(eS, eT));
      return { eS, eT, normal };
    }

    function rayToTwoPlanesSource(x, y, w, h) {
      const cx = (w - 1) / 2;
      const cy = (h - 1) / 2;
      const focalPx = Math.max(0.05, state.twoPlanes.focalScale) * Math.max(w, h);
      const cameraDistance = Math.max(0.5, state.twoPlanes.cameraDistance);
      const C = [0, 0, cameraDistance];
      const D = normalizeVec3([x - cx, -(y - cy), -focalPx]);
      let best = null;

      for (const side of [-1, 1]) {
        const basis = twoPlaneBasis(side);
        const denom = dotVec3(basis.normal, D);
        if (Math.abs(denom) < 1e-9) continue;

        // The hinge passes through the origin, so the plane origin is O = (0,0,0).
        const rayT = -dotVec3(basis.normal, C) / denom;
        if (rayT <= 1e-6) continue;

        const P = addVec3(C, scaleVec3(D, rayT));
        const sCoord = dotVec3(P, basis.eS);
        const tCoord = dotVec3(P, basis.eT);

        const inSide = side < 0
          ? (sCoord >= -1.0 && sCoord <= 0.0)
          : (sCoord >= 0.0 && sCoord <= 1.0);
        if (!inSide || tCoord < -1.0 || tCoord > 1.0) continue;

        if (!best || rayT < best.rayT) {
          best = { rayT, s: sCoord, t: tCoord, side, basis, point: P };
        }
      }

      if (!best) return null;
      return {
        x: clamp((best.s + 1.0) * 0.5 * (w - 1), 0, w - 1),
        y: clamp((best.t + 1.0) * 0.5 * (h - 1), 0, h - 1),
        side: best.side,
        point: best.point,
        normal: best.basis.normal
      };
    }

    function applyTwoPlanesProjection(imageData) {
      const w = imageData.width;
      const h = imageData.height;
      const out = new ImageData(w, h);
      const dst = out.data;
      const cameraDistance = Math.max(0.5, state.twoPlanes.cameraDistance);
      const C = [0, 0, cameraDistance];

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const hit = rayToTwoPlanesSource(x, y, w, h);
          let gray = 255;
          if (hit) {
            gray = sampleGrayBilinear(imageData, hit.x, hit.y, 255);

            // Very light shading makes the fold readable without changing the
            // autocorrelation peak positions too aggressively.
            const toCam = normalizeVec3(subVec3(C, hit.point));
            const shade = clamp(0.72 + 0.28 * Math.abs(dotVec3(hit.normal, toCam)), 0.65, 1.0);
            gray = 255 - (255 - gray) * shade;
          }
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
      else if (mode === "Crumpled") result = applyCrumpledProjection(state.sourceImageData);
      else if (mode === "Two Planes") result = applyTwoPlanesProjection(state.sourceImageData);
      else result = state.sourceImageData;
      state.displayedImageData = result;
      state.displayedCtx.putImageData(result, 0, 0);
      recomputeRectification();
      redrawMainCanvas();
      if (state.autocorrEnabled) schedulePreviewRender();
    }



    // =========================================================
    // TRIANGULAR MESH FROM VALIDATED AUTOCORRELATION ANCHORS
    // =========================================================
    function isFinitePoint(p) {
      return p && Number.isFinite(p.x) && Number.isFinite(p.y);
    }

    function matrixDistance2(A, B) {
      if (!A || !B) return Infinity;
      let s = 0;
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
          const d = A[r][c] - B[r][c];
          s += d * d;
        }
      }
      return Math.sqrt(s);
    }

    function applyMat2(M, vx, vy) {
      return {
        x: M[0][0] * vx + M[0][1] * vy,
        y: M[1][0] * vx + M[1][1] * vy
      };
    }

    function solveBasisCoords(U, V, dx, dy) {
      const det = U[0] * V[1] - U[1] * V[0];
      if (Math.abs(det) < 1e-12) return null;
      return {
        a: ( dx * V[1] - dy * V[0]) / det,
        b: (-dx * U[1] + dy * U[0]) / det
      };
    }

    function averageMatrices(M1, M2) {
      if (!M1 && !M2) return null;
      if (!M1) return [[M2[0][0], M2[0][1]], [M2[1][0], M2[1][1]]];
      if (!M2) return [[M1[0][0], M1[0][1]], [M1[1][0], M1[1][1]]];
      return [
        [(M1[0][0] + M2[0][0]) * 0.5, (M1[0][1] + M2[0][1]) * 0.5],
        [(M1[1][0] + M2[1][0]) * 0.5, (M1[1][1] + M2[1][1]) * 0.5]
      ];
    }

    function computeConsistentAnchorLattice() {
      const rawAnchors = (state.validatedAffinities || []).filter((a) =>
        a && a.M && isFinitePoint(a.center)
      );
      if (!rawAnchors.length) return null;

      const refs = getTextureShiftVectorsSourcePx();
      const U = [refs.U[0], refs.U[1]];
      const V = [refs.V[0], refs.V[1]];

      // We must not use the raw phase-correlation reference centers directly,
      // because the texture is periodic and different validated patches can snap
      // to different equivalent cells. We therefore rebuild a consistent lattice
      // indexing (i, j) from the relative geometry between validated anchors.
      const assigned = [];
      const remaining = rawAnchors.map((a, idx) => ({ ...a, _rawIndex: idx }));

      const base = remaining.shift();
      const baseRef = base.referenceCenter && isFinitePoint(base.referenceCenter)
        ? { x: base.referenceCenter.x, y: base.referenceCenter.y }
        : { x: state.size * 0.5, y: state.size * 0.5 };

      assigned.push({
        ...base,
        gridI: 0,
        gridJ: 0,
        referenceCenterConsistent: { x: baseRef.x, y: baseRef.y }
      });

      while (remaining.length) {
        let bestPair = null;
        for (let r = 0; r < remaining.length; r++) {
          const cand = remaining[r];
          for (let a = 0; a < assigned.length; a++) {
            const anchor = assigned[a];
            const ddx = cand.center.x - anchor.center.x;
            const ddy = cand.center.y - anchor.center.y;
            const dist = Math.hypot(ddx, ddy);
            if (!bestPair || dist < bestPair.dist) {
              bestPair = { candIndex: r, anchorIndex: a, dist };
            }
          }
        }
        if (!bestPair) break;

        const cand = remaining.splice(bestPair.candIndex, 1)[0];
        const anchor = assigned[bestPair.anchorIndex];
        const ddx = cand.center.x - anchor.center.x;
        const ddy = cand.center.y - anchor.center.y;

        const Mavg = averageMatrices(anchor.M, cand.M) || anchor.M || cand.M;
        const Minv = mat2Inv(Mavg) || mat2Inv(anchor.M) || mat2Inv(cand.M);
        if (!Minv) continue;

        const dRefApprox = applyMat2(Minv, ddx, ddy);
        const coeff = solveBasisCoords(U, V, dRefApprox.x, dRefApprox.y);
        if (!coeff) continue;

        const di = Math.round(coeff.a);
        const dj = Math.round(coeff.b);
        const gi = anchor.gridI + di;
        const gj = anchor.gridJ + dj;

        assigned.push({
          ...cand,
          gridI: gi,
          gridJ: gj,
          referenceCenterConsistent: {
            x: baseRef.x + gi * U[0] + gj * V[0],
            y: baseRef.y + gi * U[1] + gj * V[1]
          }
        });
      }

      return { anchors: assigned, U, V, baseRef };
    }

    function weightedLocalModelAtLattice(gridI, gridJ, latticeInfo) {
      if (!latticeInfo || !latticeInfo.anchors || !latticeInfo.anchors.length) return null;
      const anchors = latticeInfo.anchors;
      const U = latticeInfo.U;
      const V = latticeInfo.V;
      const baseRef = latticeInfo.baseRef;
      const power = Number(state.triangulationOptions.idwPower || 2.0);

      let sw = 0;
      let patchSize = 0;
      let mappedX = 0;
      let mappedY = 0;
      const M = [[0, 0], [0, 0]];

      for (const a of anchors) {
        const di = gridI - a.gridI;
        const dj = gridJ - a.gridJ;
        const d = Math.hypot(di, dj);
        const w = d < 1e-6 ? 1e9 : 1.0 / Math.pow(d, power);
        const deltaRefX = di * U[0] + dj * V[0];
        const deltaRefY = di * U[1] + dj * V[1];
        const pred = applyMat2(a.M, deltaRefX, deltaRefY);

        sw += w;
        patchSize += w * Number(a.patchSize || state.patchSize);
        mappedX += w * (a.center.x + pred.x);
        mappedY += w * (a.center.y + pred.y);
        for (let r = 0; r < 2; r++) {
          for (let c = 0; c < 2; c++) M[r][c] += w * a.M[r][c];
        }
      }

      if (sw <= 0) return null;
      patchSize = patchSize / sw;
      M[0][0] /= sw; M[0][1] /= sw; M[1][0] /= sw; M[1][1] /= sw;
      mappedX /= sw;
      mappedY /= sw;

      let ps = Math.round(clamp(patchSize, 32, 140));
      if (ps % 2 !== 0) ps += 1;
      ps = clamp(ps, 32, 140);

      return {
        refX: baseRef.x + gridI * U[0] + gridJ * V[0],
        refY: baseRef.y + gridI * U[1] + gridJ * V[1],
        x: mappedX,
        y: mappedY,
        M,
        patchSize: ps,
        weightSum: sw
      };
    }

    function computeHexagonDetectionAtPoint(cx, cy, patchSize) {
      if (!state.displayedImageData) return null;
      const ps = Math.round(clamp(patchSize || state.patchSize, 32, 140));
      const computeSize = Math.min(state.previewComputeSize, ps);
      const patch = extractPatchGrayResampled(state.displayedImageData, cx, cy, ps, computeSize);
      const ac = computeAutocorrelation2D(patch, computeSize);
      const theoreticalInfo = getTheoreticalPeakInfo(computeSize, computeSize, cx, cy);
      return findHexagonJS(
        ac,
        computeSize,
        state.peakDetection,
        theoreticalInfo.U_ref_rc,
        theoreticalInfo.V_ref_rc
      );
    }

    function estimateAffinityAtPointUsingPredictedModel(cx, cy, patchSize, predictedM) {
      const detection = computeHexagonDetectionAtPoint(cx, cy, patchSize);
      if (!detection || !detection.u_fin || !detection.v_fin || !detection.w_fin) return null;

      const computeSize = Math.min(state.previewComputeSize, patchSize);
      const scale = patchSize / computeSize;
      const ordered6 = buildOrdered6CandidatesXY(detection, scale);
      const refs = getTextureShiftVectorsSourcePx();
      const Uref = [refs.U[0], refs.U[1]];
      const Vref = [refs.V[0], refs.V[1]];
      const idxPairs = [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0]];

      let best = null;
      for (const [i, j] of idxPairs) {
        const M = solve2x2ForColumns(Uref, Vref, ordered6[i].vec, ordered6[j].vec);
        if (!M) continue;
        const score = -matrixDistance2(M, predictedM);
        if (!best || score > best.score) {
          best = {
            M,
            score,
            pairName: `${ordered6[i].label}, ${ordered6[j].label}`,
            detection
          };
        }
      }
      return best;
    }

    function buildRealImageTriangulation() {
      const anchors = (state.validatedAffinities || []).filter((a) =>
        a && isFinitePoint(a.center)
      );

      const margin = Math.max(0, Math.floor(state.triangulationOptions.realGridMargin || 0));
      const x0 = margin;
      const y0 = margin;
      const x1 = state.size - margin;
      const y1 = state.size - margin;

      const maxTriangles = Math.max(50, Math.floor(state.triangulationOptions.maxTriangles || 2400));
      const requestedDivisions = Math.floor(state.triangulationOptions.realGridDivisions || 34);
      const safeDivisions = Math.floor(Math.sqrt(maxTriangles / 2));
      const n = Math.max(4, Math.min(requestedDivisions, safeDivisions));

      const vertices = [];
      const index = new Map();
      const keyOf = (i, j) => `${i},${j}`;

      for (let j = 0; j <= n; j++) {
        const y = y0 + (y1 - y0) * (j / n);
        for (let i = 0; i <= n; i++) {
          const x = x0 + (x1 - x0) * (i / n);
          const id = vertices.length;
          index.set(keyOf(i, j), id);
          vertices.push({
            id,
            i,
            j,
            refX: x,
            refY: y,
            x,
            y,
            patchSize: state.patchSize,
            checked: false,
            localPair: null
          });
        }
      }

      const triangles = [];
      for (let j = 0; j < n; j++) {
        for (let i = 0; i < n; i++) {
          const aId = index.get(keyOf(i, j));
          const bId = index.get(keyOf(i + 1, j));
          const cId = index.get(keyOf(i, j + 1));
          const dId = index.get(keyOf(i + 1, j + 1));

          if (((i + j) & 1) === 0) {
            triangles.push([aId, bId, cId]);
            triangles.push([bId, dId, cId]);
          } else {
            triangles.push([aId, bId, dId]);
            triangles.push([aId, dId, cId]);
          }
        }
      }

      return {
        vertices,
        triangles: triangles.slice(0, maxTriangles),
        anchors: anchors.length,
        origin: { x: x0, y: y0 },
        checkedDetections: 0,
        nominalStep: (x1 - x0) / n,
        mode: "real-image-grid",
        bounds: { x0, y0, x1, y1 },
        consistentAnchors: anchors.map((a, idx) => ({
          x: a.center.x,
          y: a.center.y,
          gridI: idx,
          gridJ: 0
        }))
      };
    }

    function buildTriangulationFromValidatedAffinities() {
      if (state.testMode === "real") {
        return buildRealImageTriangulation();
      }

      const latticeInfo = computeConsistentAnchorLattice();
      if (!latticeInfo || !latticeInfo.anchors || latticeInfo.anchors.length < 1) {
        setValidationMessage("Validate at least one patch before triangulation");
        return null;
      }

      const anchors = latticeInfo.anchors;
      const U = latticeInfo.U;
      const V = latticeInfo.V;
      const radius = Math.max(3, Math.floor(state.triangulationOptions.gridRadius || 18));
      const vertices = [];
      const index = new Map();
      const keyOf = (i, j) => `${i},${j}`;
      const maxChecks = Math.max(0, Math.floor(state.triangulationOptions.maxDetectionChecks || 0));
      const detectStride = Math.max(1, Math.floor(state.triangulationOptions.detectStride || 3));
      let checks = 0;

      let avgM = [[0, 0], [0, 0]];
      for (const a of anchors) {
        avgM[0][0] += a.M[0][0]; avgM[0][1] += a.M[0][1];
        avgM[1][0] += a.M[1][0]; avgM[1][1] += a.M[1][1];
      }
      avgM[0][0] /= anchors.length; avgM[0][1] /= anchors.length;
      avgM[1][0] /= anchors.length; avgM[1][1] /= anchors.length;
      const mU = applyMat2(avgM, U[0], U[1]);
      const mV = applyMat2(avgM, V[0], V[1]);
      const mW = applyMat2(avgM, U[0] - V[0], U[1] - V[1]);
      const nominalStep = Math.max(4, Math.min(Math.hypot(mU.x, mU.y), Math.hypot(mV.x, mV.y), Math.hypot(mW.x, mW.y)));
      const edgeMax = 2.6 * nominalStep;

      // Center the lattice sweep on the barycenter of validated anchor indices.
      let i0 = 0, j0 = 0;
      for (const a of anchors) {
        i0 += a.gridI;
        j0 += a.gridJ;
      }
      i0 = Math.round(i0 / anchors.length);
      j0 = Math.round(j0 / anchors.length);

      for (let di = -radius; di <= radius; di++) {
        for (let dj = -radius; dj <= radius; dj++) {
          const gi = i0 + di;
          const gj = j0 + dj;
          const model = weightedLocalModelAtLattice(gi, gj, latticeInfo);
          if (!model) continue;

          let x = model.x;
          let y = model.y;
          let localPair = null;
          let checked = false;

          if (checks < maxChecks && (((di + radius) % detectStride === 0) && ((dj + radius) % detectStride === 0))) {
            const local = estimateAffinityAtPointUsingPredictedModel(x, y, model.patchSize, model.M);
            checked = true;
            checks += 1;
            if (local && Number.isFinite(local.score)) {
              localPair = local.pairName;
            }
          }

          if (x < -30 || x > state.size + 30 || y < -30 || y > state.size + 30) continue;
          const id = vertices.length;
          index.set(keyOf(gi, gj), id);
          vertices.push({
            id,
            i: gi,
            j: gj,
            refX: model.refX,
            refY: model.refY,
            x,
            y,
            patchSize: model.patchSize,
            checked,
            localPair
          });
        }
      }

      function edgeLen(a, b) {
        return Math.hypot(a.x - b.x, a.y - b.y);
      }

      function triArea2(a, b, c) {
        return Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));
      }

      const triangles = [];
      const maxTriangles = Math.max(50, Math.floor(state.triangulationOptions.maxTriangles || 2400));
      for (let di = -radius; di < radius; di++) {
        for (let dj = -radius; dj < radius; dj++) {
          const gi = i0 + di;
          const gj = j0 + dj;
          const aId = index.get(keyOf(gi, gj));
          const bId = index.get(keyOf(gi + 1, gj));
          const cId = index.get(keyOf(gi, gj + 1));
          const dId = index.get(keyOf(gi + 1, gj + 1));

          const tryPush = (pId, qId, rId) => {
            if (pId == null || qId == null || rId == null) return;
            const p = vertices[pId], q = vertices[qId], r = vertices[rId];
            if (!p || !q || !r) return;
            const l1 = edgeLen(p, q);
            const l2 = edgeLen(q, r);
            const l3 = edgeLen(r, p);
            if (l1 > edgeMax || l2 > edgeMax || l3 > edgeMax) return;
            if (triArea2(p, q, r) < 1.0) return;
            triangles.push([pId, qId, rId]);
          };

          // Two triangles per lattice cell (parallelogram spanned by U and V).
          // Alternate the diagonal for a cleaner and more stable visual mesh.
          if (((gi + gj) & 1) === 0) {
            tryPush(aId, bId, cId);
            tryPush(bId, dId, cId);
          } else {
            tryPush(aId, bId, dId);
            tryPush(aId, dId, cId);
          }

          if (triangles.length >= maxTriangles) break;
        }
        if (triangles.length >= maxTriangles) break;
      }

      return {
        vertices,
        triangles,
        anchors: anchors.length,
        origin: { x: latticeInfo.baseRef.x, y: latticeInfo.baseRef.y },
        checkedDetections: checks,
        nominalStep,
        consistentAnchors: anchors.map((a) => ({
          x: a.center.x,
          y: a.center.y,
          gridI: a.gridI,
          gridJ: a.gridJ
        }))
      };
    }

    function refreshTriangulation() {
      if (!state.triangulationEnabled) {
        state.triangulationData = null;
        redrawMainCanvas();
        return;
      }

      const mesh = buildTriangulationFromValidatedAffinities();
      if (!mesh || !mesh.vertices.length || !mesh.triangles.length) {
        state.triangulationEnabled = false;
        state.triangulationData = null;
        setValidationMessage("Triangulation failed: not enough valid local anchors");
      } else {
        state.triangulationData = mesh;
        if (mesh.mode === "real-image-grid") {
          setValidationMessage(`Real-image triangulation: ${mesh.triangles.length} triangles covering the uploaded test image | anchors: ${mesh.anchors}`);
        } else {
          setValidationMessage(`Triangulation: ${mesh.triangles.length} triangles from ${mesh.anchors} validated anchors`);
        }
      }
      refreshRectificationUI();
      redrawMainCanvas();
    }

    function drawTriangulationOverlay() {
      if (!state.triangulationEnabled || !state.triangulationData) return;
      if (state.rectificationEnabled || state.differenceEnabled) return;

      const mesh = state.triangulationData;
      const vertices = mesh.vertices || [];
      const triangles = mesh.triangles || [];
      if (!vertices.length || !triangles.length) return;

      ctx.save();

      // Triangle edges (green as requested)
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = "rgba(34, 197, 94, 0.78)";
      for (const tri of triangles) {
        const a = vertices[tri[0]], b = vertices[tri[1]], c = vertices[tri[2]];
        if (!a || !b || !c) continue;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.lineTo(c.x, c.y);
        ctx.closePath();
        ctx.stroke();
      }

      // Small green dots for sampled vertices where the local hexagon was checked.
      ctx.fillStyle = "rgba(22, 163, 74, 0.95)";
      for (const v of vertices) {
        if (!v.checked) continue;
        ctx.beginPath();
        ctx.arc(v.x, v.y, 2.5, 0, 2 * Math.PI);
        ctx.fill();
      }

      ctx.font = "bold 13px Inter, Arial, sans-serif";
      ctx.textBaseline = "top";
      const label = mesh.mode === "real-image-grid"
        ? `Real image grid: ${triangles.length} triangles | anchors: ${mesh.anchors}`
        : `Triangulation: ${triangles.length} triangles | anchors: ${mesh.anchors}`;
      const pad = 7;
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = "rgba(15, 23, 42, 0.82)";
      ctx.fillRect(12, 12, tw + 2 * pad, 28);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(label, 12 + pad, 18);
      ctx.restore();
    }

    function drawValidatedAffinityMarkers() {
      if (!state.validatedAffinities || !state.validatedAffinities.length) return;
      ctx.save();
      ctx.font = "bold 12px Inter, Arial, sans-serif";
      ctx.textBaseline = "middle";
      state.validatedAffinities.forEach((item, idx) => {
        if (!item || !item.center) return;
        const x = item.center.x;
        const y = item.center.y;
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(37, 99, 235, 0.92)";
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
        ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.fillText(String(idx + 1), x + 11, y);
      });
      ctx.restore();
    }

    function redrawMainCanvas() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let imgToDraw = state.displayedImageData;
      if (state.rectificationEnabled && state.rectificationImageData) imgToDraw = state.rectificationImageData;
      else if (state.differenceEnabled && state.differenceImageData) imgToDraw = state.differenceImageData;
      if (imgToDraw) ctx.putImageData(imgToDraw, 0, 0);

      drawTriangulationOverlay();
      drawValidatedAffinityMarkers();

      // Patch overlay: visible only on the deformed view, because validation is done
      // on the deformed image. The center cross is drawn explicitly so the locked
      // patch position stays easy to read.
      if (state.autocorrEnabled && !state.rectificationEnabled && !state.differenceEnabled) {
        const half = Math.floor(state.patchSize / 2);
        const p = getActivePatchCenter();
        const x = Math.round(p.x) - half;
        const y = Math.round(p.y) - half;
        ctx.save();
        ctx.strokeStyle = state.lockedPatch ? "#22c55e" : "#00bcd4";
        ctx.fillStyle = state.lockedPatch ? "#22c55e" : "#00bcd4";
        ctx.lineWidth = state.lockedPatch ? 3 : 2;
        ctx.strokeRect(x + 0.5, y + 0.5, state.patchSize, state.patchSize);

        // Center marker of the active / locked patch.
        const cx = Math.round(p.x) + 0.5;
        const cy = Math.round(p.y) + 0.5;
        ctx.beginPath();
        ctx.moveTo(cx - 9, cy);
        ctx.lineTo(cx + 9, cy);
        ctx.moveTo(cx, cy - 9);
        ctx.lineTo(cx, cy + 9);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
      }
    }

    // =========================================================
    // MANUAL AFFINITY VALIDATION + RECTIFICATION
    // =========================================================
    function solve2x2ForColumns(Uref, Vref, Uobs, Vobs) {
      const a = Uref[0], b = Vref[0], c = Uref[1], d = Vref[1];
      const det = a * d - b * c;
      if (Math.abs(det) < 1e-9) return null;
      const Rinv = [[d / det, -b / det], [-c / det, a / det]];
      const O = [[Uobs[0], Vobs[0]], [Uobs[1], Vobs[1]]];
      return [
        [O[0][0] * Rinv[0][0] + O[0][1] * Rinv[1][0], O[0][0] * Rinv[0][1] + O[0][1] * Rinv[1][1]],
        [O[1][0] * Rinv[0][0] + O[1][1] * Rinv[1][0], O[1][0] * Rinv[0][1] + O[1][1] * Rinv[1][1]]
      ];
    }

    function getDisplayedDetectionForValidation() {
      const p = getActivePatchCenter();
      const patchSize = state.patchSize;
      const computeSize = Math.min(state.previewComputeSize, patchSize);
      if (state.lastDetection && state.lastDetection.u_fin && state.lastDetection.v_fin && state.lastDetection.w_fin) {
        return { detection: state.lastDetection, computeSize, center: p };
      }
      return { detection: null, computeSize, center: p };
    }

    function angleXY(v) {
      return Math.atan2(v[1], v[0]);
    }

    function sortHexagonByAngle(peaks) {
      return peaks.slice().sort((a, b) => angleXY(a.vec) - angleXY(b.vec));
    }

    function buildObservedHexagonPeaksXY(detection, scale) {
      const U = [detection.u_fin[1] * scale, detection.u_fin[0] * scale];
      const V = [detection.v_fin[1] * scale, detection.v_fin[0] * scale];
      const W = [detection.w_fin[1] * scale, detection.w_fin[0] * scale];
      return [
        { label: "+Udet", shortLabel: "+U", index: 0, vec: U },
        { label: "+Vdet", shortLabel: "+V", index: 1, vec: V },
        { label: "+Wdet", shortLabel: "+W", index: 2, vec: W },
        { label: "-Udet", shortLabel: "-U", index: 3, vec: [-U[0], -U[1]] },
        { label: "-Vdet", shortLabel: "-V", index: 4, vec: [-V[0], -V[1]] },
        { label: "-Wdet", shortLabel: "-W", index: 5, vec: [-W[0], -W[1]] }
      ];
    }

    function buildReferenceHexagonPeaksXY(Uref, Vref) {
      const Wref = [Uref[0] - Vref[0], Uref[1] - Vref[1]];
      return [
        { label: "+Uref", shortLabel: "+U", refKey: "+U", vec: Uref },
        { label: "+Vref", shortLabel: "+V", refKey: "+V", vec: Vref },
        { label: "+Wref", shortLabel: "+W", refKey: "+W", vec: Wref },
        { label: "-Uref", shortLabel: "-U", refKey: "-U", vec: [-Uref[0], -Uref[1]] },
        { label: "-Vref", shortLabel: "-V", refKey: "-V", vec: [-Vref[0], -Vref[1]] },
        { label: "-Wref", shortLabel: "-W", refKey: "-W", vec: [-Wref[0], -Wref[1]] }
      ];
    }

    function buildOrdered6CandidatesXY(detection, scale) {
      // Kept for export/debug compatibility. This is the circular order used by
      // the older implementation, not the assignment rule used for validation.
      const U = [detection.u_fin[1] * scale, detection.u_fin[0] * scale];
      const V = [detection.v_fin[1] * scale, detection.v_fin[0] * scale];
      const W = [detection.w_fin[1] * scale, detection.w_fin[0] * scale];
      return [
        { label: "+U", vec: U },
        { label: "+V", vec: V },
        { label: "-W", vec: [-W[0], -W[1]] },
        { label: "-U", vec: [-U[0], -U[1]] },
        { label: "-V", vec: [-V[0], -V[1]] },
        { label: "+W", vec: W }
      ];
    }

    function buildOrderPreservingAffinityCandidates(observedPeaks, Uref, Vref) {
      const refSorted = sortHexagonByAngle(buildReferenceHexagonPeaksXY(Uref, Vref));
      const obsSorted = sortHexagonByAngle(observedPeaks);
      const candidates = [];

      // Your colleague's assignment observation: if there is no reflection and no
      // aliasing, the observed deformed hexagon keeps the same circular order and
      // same rotation sense as the original hexagon, up to a cyclic shift. Hence
      // there are only six cyclic assignments to test.
      for (let shift = 0; shift < 6; shift++) {
        const map = new Map();
        const assignment = [];
        for (let k = 0; k < 6; k++) {
          const refPeak = refSorted[k];
          const obsPeak = obsSorted[(k + shift) % 6];
          map.set(refPeak.refKey, obsPeak);
          assignment.push({
            ref: refPeak.shortLabel,
            obs: obsPeak.shortLabel,
            refAngle: angleXY(refPeak.vec),
            obsAngle: angleXY(obsPeak.vec)
          });
        }

        const obsForU = map.get("+U");
        const obsForV = map.get("+V");
        if (!obsForU || !obsForV) continue;
        const M = solve2x2ForColumns(Uref, Vref, obsForU.vec, obsForV.vec);
        if (!M) continue;

        candidates.push({
          orderShift: shift,
          assignment,
          Uobs: obsForU.vec,
          Vobs: obsForV.vec,
          pairIndices: [obsForU.index, obsForV.index],
          pairName: `${obsForU.shortLabel}→+U, ${obsForV.shortLabel}→+V`,
          assignmentMode: "order_preserving_same_rotation_sense"
        });
      }
      return candidates;
    }

    function extractGrayPatchArray(imageData, cx, cy, patchSize) {
      const out = new Float64Array(patchSize * patchSize);
      const half = patchSize / 2;
      let k = 0;
      for (let j = 0; j < patchSize; j++) {
        const yy = cy - half + (j + 0.5);
        for (let i = 0; i < patchSize; i++) {
          const xx = cx - half + (i + 0.5);
          out[k++] = sampleGrayBilinear(imageData, xx, yy, 255);
        }
      }
      return out;
    }

    function rectifyPatchWithMatrix(imageData, cx, cy, patchSize, M) {
      const out = new Float64Array(patchSize * patchSize);
      const half = patchSize / 2;
      let k = 0;
      for (let j = 0; j < patchSize; j++) {
        const dy = (j + 0.5) - half;
        for (let i = 0; i < patchSize; i++) {
          const dx = (i + 0.5) - half;
          const sx = cx + M[0][0] * dx + M[0][1] * dy;
          const sy = cy + M[1][0] * dx + M[1][1] * dy;
          out[k++] = sampleGrayBilinear(imageData, sx, sy, 255);
        }
      }
      return out;
    }


    function makePatchCanvasFromGrayArray(gray, patchSize, displaySize = 128) {
      const c = document.createElement("canvas");
      c.width = Math.max(32, Math.min(256, Math.round(displaySize)));
      c.height = c.width;
      const cctx = c.getContext("2d", { willReadFrequently: true });
      const img = new ImageData(c.width, c.height);
      for (let y = 0; y < c.height; y++) {
        const sy = ((y + 0.5) / c.height) * patchSize - 0.5;
        const y0 = Math.floor(sy);
        const y1 = Math.min(patchSize - 1, Math.max(0, y0 + 1));
        const fy = sy - y0;
        const yy0 = Math.min(patchSize - 1, Math.max(0, y0));
        for (let x = 0; x < c.width; x++) {
          const sx = ((x + 0.5) / c.width) * patchSize - 0.5;
          const x0 = Math.floor(sx);
          const x1 = Math.min(patchSize - 1, Math.max(0, x0 + 1));
          const fx = sx - x0;
          const xx0 = Math.min(patchSize - 1, Math.max(0, x0));
          const v00 = gray[yy0 * patchSize + xx0] ?? 255;
          const v10 = gray[yy0 * patchSize + x1] ?? 255;
          const v01 = gray[y1 * patchSize + xx0] ?? 255;
          const v11 = gray[y1 * patchSize + x1] ?? 255;
          const v0 = v00 * (1 - fx) + v10 * fx;
          const v1 = v01 * (1 - fx) + v11 * fx;
          const v = clamp(v0 * (1 - fy) + v1 * fy, 0, 255);
          const idx = (y * c.width + x) * 4;
          img.data[idx] = v;
          img.data[idx + 1] = v;
          img.data[idx + 2] = v;
          img.data[idx + 3] = 255;
        }
      }
      cctx.putImageData(img, 0, 0);
      return c;
    }

    function appendPatchThumb(parent, label, gray, patchSize) {
      const wrap = document.createElement("div");
      wrap.className = "patch-thumb-wrap";
      const canvasThumb = makePatchCanvasFromGrayArray(gray, patchSize, 128);
      const caption = document.createElement("div");
      caption.textContent = label;
      wrap.appendChild(canvasThumb);
      wrap.appendChild(caption);
      parent.appendChild(wrap);
    }

    function refreshPatchViewButton() {
      if (!btnTogglePatchView) return;
      btnTogglePatchView.classList.toggle("is-link", state.patchViewEnabled);
      btnTogglePatchView.classList.toggle("is-light", !state.patchViewEnabled);
      const textSpan = btnTogglePatchView.querySelector("span:last-child");
      if (textSpan) textSpan.textContent = state.patchViewEnabled ? "Hide Rectified Patches" : "Show Rectified Patches";
    }

    function renderValidatedPatchesPanel() {
      if (!patchViewPanel || !patchViewGrid) return;
      patchViewPanel.classList.toggle("is-active", state.patchViewEnabled);
      refreshPatchViewButton();
      patchViewGrid.innerHTML = "";

      if (!state.patchViewEnabled) return;

      const n = state.validatedAffinities.length;
      if (patchViewSummary) {
        patchViewSummary.textContent = n
          ? `${n} validated patch${n > 1 ? "es" : ""}. Each row shows the best matching reference crop found in the whole reference image, the deformed patch, and the locally rectified patch.`
          : "No validated patch yet.";
      }

      if (!n) {
        const empty = document.createElement("div");
        empty.className = "patch-card";
        empty.textContent = "Validate at least one affinity to see its local rectification.";
        patchViewGrid.appendChild(empty);
        return;
      }

      state.validatedAffinities.forEach((item, idx) => {
        const patchSize = item.patchSize || state.patchSize;
        if (!item.sourcePatch || !item.deformedPatch || !item.rectifiedPatch) return;

        const card = document.createElement("div");
        card.className = "patch-card";

        const title = document.createElement("div");
        title.className = "patch-card-title";
        title.textContent = `Patch ${idx + 1}`;

        const meta = document.createElement("div");
        meta.className = "patch-card-meta";
        const cx = item.center ? item.center.x.toFixed(1) : "?";
        const cy = item.center ? item.center.y.toFixed(1) : "?";
        const score = Number.isFinite(item.phaseScore) ? item.phaseScore.toFixed(4) : "n/a";
        const rcx = item.referenceCenter ? item.referenceCenter.x.toFixed(1) : "?";
        const rcy = item.referenceCenter ? item.referenceCenter.y.toFixed(1) : "?";
        const srcx = item.referenceCenterSeed ? item.referenceCenterSeed.x.toFixed(1) : "?";
        const srcy = item.referenceCenterSeed ? item.referenceCenterSeed.y.toFixed(1) : "?";
        meta.textContent = `def center=(${cx}, ${cy}) · matched ref center=(${rcx}, ${rcy}) · seed ref center=(${srcx}, ${srcy}) · size=${patchSize}px · pair=${item.pairName || "?"} · phase corr=${score}`;

        const triplet = document.createElement("div");
        triplet.className = "patch-triplet";
        appendPatchThumb(triplet, "reference (best full-image match)", item.sourcePatch, patchSize);
        appendPatchThumb(triplet, "deformed", item.deformedPatch, patchSize);
        appendPatchThumb(triplet, "rectified", item.rectifiedPatch, patchSize);

        card.appendChild(title);
        card.appendChild(meta);
        card.appendChild(triplet);
        patchViewGrid.appendChild(card);
      });
    }

    function nextPow2(n) {
      let p = 1;
      while (p < n) p <<= 1;
      return p;
    }

    function fft1d(re, im, inverse = false) {
      const n = re.length;
      let j = 0;
      for (let i = 1; i < n; i++) {
        let bit = n >> 1;
        while (j & bit) { j ^= bit; bit >>= 1; }
        j ^= bit;
        if (i < j) {
          let tr = re[i]; re[i] = re[j]; re[j] = tr;
          let ti = im[i]; im[i] = im[j]; im[j] = ti;
        }
      }
      for (let len = 2; len <= n; len <<= 1) {
        const ang = 2 * Math.PI / len * (inverse ? 1 : -1);
        const wlenCos = Math.cos(ang);
        const wlenSin = Math.sin(ang);
        for (let i = 0; i < n; i += len) {
          let wCos = 1.0, wSin = 0.0;
          for (let j2 = 0; j2 < len / 2; j2++) {
            const uRe = re[i + j2], uIm = im[i + j2];
            const vRe0 = re[i + j2 + len / 2], vIm0 = im[i + j2 + len / 2];
            const vRe = vRe0 * wCos - vIm0 * wSin;
            const vIm = vRe0 * wSin + vIm0 * wCos;
            re[i + j2] = uRe + vRe;
            im[i + j2] = uIm + vIm;
            re[i + j2 + len / 2] = uRe - vRe;
            im[i + j2 + len / 2] = uIm - vIm;
            const nwCos = wCos * wlenCos - wSin * wlenSin;
            const nwSin = wCos * wlenSin + wSin * wlenCos;
            wCos = nwCos; wSin = nwSin;
          }
        }
      }
      if (inverse) {
        for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
      }
    }

    function fft2d(re, im, w, h, inverse = false) {
      const rowRe = new Float64Array(w);
      const rowIm = new Float64Array(w);
      for (let y = 0; y < h; y++) {
        const off = y * w;
        for (let x = 0; x < w; x++) { rowRe[x] = re[off + x]; rowIm[x] = im[off + x]; }
        fft1d(rowRe, rowIm, inverse);
        for (let x = 0; x < w; x++) { re[off + x] = rowRe[x]; im[off + x] = rowIm[x]; }
      }
      const colRe = new Float64Array(h);
      const colIm = new Float64Array(h);
      for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
          const idx = y * w + x;
          colRe[y] = re[idx]; colIm[y] = im[idx];
        }
        fft1d(colRe, colIm, inverse);
        for (let y = 0; y < h; y++) {
          const idx = y * w + x;
          re[idx] = colRe[y]; im[idx] = colIm[y];
        }
      }
    }

    function phaseCorrelationScoreArrays(a, b, w, h) {
      const N = nextPow2(Math.max(w, h));
      const size = N * N;
      const ar = new Float64Array(size), ai = new Float64Array(size);
      const br = new Float64Array(size), bi = new Float64Array(size);
      let meanA = 0.0, meanB = 0.0;
      for (let i = 0; i < a.length; i++) meanA += a[i];
      for (let i = 0; i < b.length; i++) meanB += b[i];
      meanA /= Math.max(1, a.length);
      meanB /= Math.max(1, b.length);
      for (let y = 0; y < h; y++) {
        const wy = 0.5 - 0.5 * Math.cos((2 * Math.PI * y) / Math.max(1, h - 1));
        for (let x = 0; x < w; x++) {
          const wx = 0.5 - 0.5 * Math.cos((2 * Math.PI * x) / Math.max(1, w - 1));
          const win = wx * wy;
          const idx0 = y * w + x;
          const idx = y * N + x;
          ar[idx] = (a[idx0] - meanA) * win;
          br[idx] = (b[idx0] - meanB) * win;
        }
      }
      fft2d(ar, ai, N, N, false);
      fft2d(br, bi, N, N, false);
      const cr = new Float64Array(size), ci = new Float64Array(size);
      for (let i = 0; i < size; i++) {
        const re = ar[i] * br[i] + ai[i] * bi[i];
        const im = ai[i] * br[i] - ar[i] * bi[i];
        const mag = Math.hypot(re, im);
        if (mag > 1e-12) {
          cr[i] = re / mag;
          ci[i] = im / mag;
        } else {
          cr[i] = 0.0;
          ci[i] = 0.0;
        }
      }
      fft2d(cr, ci, N, N, true);
      let best = -Infinity;
      for (let i = 0; i < size; i++) {
        const v = Math.hypot(cr[i], ci[i]);
        if (v > best) best = v;
      }
      return best;
    }

    function getSourceGrayArray() {
      if (!state.sourceImageData) return null;
      if (state.sourceGrayCache && state.sourceGrayCache.width === state.sourceImageData.width && state.sourceGrayCache.height === state.sourceImageData.height) {
        return state.sourceGrayCache.gray;
      }
      const w = state.sourceImageData.width;
      const h = state.sourceImageData.height;
      const out = new Float64Array(w * h);
      const data = state.sourceImageData.data;
      for (let i = 0, k = 0; i < data.length; i += 4, k++) {
        out[k] = data[i];
      }
      state.sourceGrayCache = { width: w, height: h, gray: out };
      return out;
    }

    function buildWindowedReferenceFFTCache() {
      if (!state.sourceImageData) return null;
      const w = state.sourceImageData.width;
      const h = state.sourceImageData.height;
      const N = nextPow2(Math.max(w, h));
      const cached = state.sourcePhaseReferenceCache;
      if (cached && cached.width === w && cached.height === h && cached.N === N) return cached;

      const gray = getSourceGrayArray();
      const size = N * N;
      const re = new Float64Array(size);
      const im = new Float64Array(size);

      let mean = 0.0;
      for (let i = 0; i < gray.length; i++) mean += gray[i];
      mean /= Math.max(1, gray.length);

      for (let y = 0; y < h; y++) {
        const wy = 0.5 - 0.5 * Math.cos((2 * Math.PI * y) / Math.max(1, h - 1));
        for (let x = 0; x < w; x++) {
          const wx = 0.5 - 0.5 * Math.cos((2 * Math.PI * x) / Math.max(1, w - 1));
          const idx0 = y * w + x;
          const idx = y * N + x;
          re[idx] = (gray[idx0] - mean) * wx * wy;
        }
      }

      fft2d(re, im, N, N, false);
      state.sourcePhaseReferenceCache = { width: w, height: h, N, re, im };
      return state.sourcePhaseReferenceCache;
    }

    function phaseCorrelatePatchAgainstWholeReference(patchGray, patchW, patchH) {
      const refCache = buildWindowedReferenceFFTCache();
      if (!refCache || !state.sourceImageData) return null;

      const refW = refCache.width;
      const refH = refCache.height;
      const N = refCache.N;
      const size = N * N;

      const br = new Float64Array(size);
      const bi = new Float64Array(size);

      let meanPatch = 0.0;
      for (let i = 0; i < patchGray.length; i++) meanPatch += patchGray[i];
      meanPatch /= Math.max(1, patchGray.length);

      for (let y = 0; y < patchH; y++) {
        const wy = 0.5 - 0.5 * Math.cos((2 * Math.PI * y) / Math.max(1, patchH - 1));
        for (let x = 0; x < patchW; x++) {
          const wx = 0.5 - 0.5 * Math.cos((2 * Math.PI * x) / Math.max(1, patchW - 1));
          const idx0 = y * patchW + x;
          const idx = y * N + x;
          br[idx] = (patchGray[idx0] - meanPatch) * wx * wy;
        }
      }

      fft2d(br, bi, N, N, false);

      const cr = new Float64Array(size);
      const ci = new Float64Array(size);
      for (let i = 0; i < size; i++) {
        const re = refCache.re[i] * br[i] + refCache.im[i] * bi[i];
        const im = refCache.im[i] * br[i] - refCache.re[i] * bi[i];
        const mag = Math.hypot(re, im);
        if (mag > 1e-12) {
          cr[i] = re / mag;
          ci[i] = im / mag;
        } else {
          cr[i] = 0.0;
          ci[i] = 0.0;
        }
      }

      fft2d(cr, ci, N, N, true);

      let best = -Infinity;
      let bestX = 0;
      let bestY = 0;
      for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
          const idx = y * N + x;
          const v = Math.hypot(cr[idx], ci[idx]);
          if (v > best) {
            best = v;
            bestX = x;
            bestY = y;
          }
        }
      }

      let shiftX = bestX;
      let shiftY = bestY;
      if (shiftX > N / 2) shiftX -= N;
      if (shiftY > N / 2) shiftY -= N;

      const centerX = shiftX + patchW / 2;
      const centerY = shiftY + patchH / 2;
      const matchedCenter = {
        x: clamp(centerX, 0, refW - 1),
        y: clamp(centerY, 0, refH - 1)
      };

      const matchedReferenceCrop = extractGrayPatchArray(
        state.sourceImageData,
        matchedCenter.x,
        matchedCenter.y,
        patchW
      );

      return {
        score: best,
        peakXY: [bestX, bestY],
        shiftXY: [shiftX, shiftY],
        matchedCenter,
        matchedReferenceCrop
      };
    }

    function mat2Det(M) {
      if (!M) return NaN;
      return M[0][0] * M[1][1] - M[0][1] * M[1][0];
    }

    function mat2Frobenius(M) {
      if (!M) return Infinity;
      return Math.sqrt(
        M[0][0] * M[0][0] + M[0][1] * M[0][1] +
        M[1][0] * M[1][0] + M[1][1] * M[1][1]
      );
    }

    function mat2RelativeDistance(M, R) {
      if (!M || !R) return Infinity;
      const d00 = M[0][0] - R[0][0];
      const d01 = M[0][1] - R[0][1];
      const d10 = M[1][0] - R[1][0];
      const d11 = M[1][1] - R[1][1];
      const num = Math.sqrt(d00*d00 + d01*d01 + d10*d10 + d11*d11);
      return num / (mat2Frobenius(R) + 1e-9);
    }

    function mat2ConditionNumberApprox(M) {
      if (!M) return Infinity;
      const a = M[0][0], b = M[0][1], c = M[1][0], d = M[1][1];
      const s1 = a*a + b*b + c*c + d*d;
      const det = a*d - b*c;
      const disc = Math.max(0, s1*s1 - 4*det*det);
      const lMax = 0.5 * (s1 + Math.sqrt(disc));
      const lMin = 0.5 * (s1 - Math.sqrt(disc));
      if (lMin <= 1e-12) return Infinity;
      return Math.sqrt(lMax / lMin);
    }

    function mat2Mean(mats) {
      const valid = (mats || []).filter(Boolean);
      if (!valid.length) return null;
      const M = [[0,0],[0,0]];
      for (const A of valid) {
        M[0][0] += A[0][0]; M[0][1] += A[0][1];
        M[1][0] += A[1][0]; M[1][1] += A[1][1];
      }
      M[0][0] /= valid.length; M[0][1] /= valid.length;
      M[1][0] /= valid.length; M[1][1] /= valid.length;
      return M;
    }

    function getValidatedMeanAffinity() {
      return mat2Mean((state.validatedAffinities || [])
        .filter((a) => a && a.M && Number.isFinite(mat2Det(a.M)) && mat2Det(a.M) > 0)
        .map((a) => a.M));
    }

    function getExpectedLocalForwardAffinity(center) {
      // In the interactive demo the deformation is synthetically generated, so
      // we can compute the expected local Jacobian source -> displayed image.
      // This is the strongest way to disambiguate the six autocorrelation peaks.
      if (center && typeof sourceToDisplayJacobianAt === "function") {
        const J = sourceToDisplayJacobianAt(center.x, center.y);
        if (J && Number.isFinite(mat2Det(J)) && Math.abs(mat2Det(J)) > 1e-9) return J;
      }
      const mean = getValidatedMeanAffinity();
      if (mean) return mean;
      return [[1, 0], [0, 1]];
    }

    function geometryPenaltyForCandidate(M, MExpected, MMean) {
      if (!M) return 1e9;
      const det = mat2Det(M);
      if (!Number.isFinite(det)) return 1e9;

      let penalty = 0;
      // Reject flips: the orientation of the lattice should not change.
      if (det <= 0) penalty += 1e6 + 1e5 * Math.abs(det);

      const cond = mat2ConditionNumberApprox(M);
      if (!Number.isFinite(cond)) penalty += 1e6;
      else if (cond > 8.0) penalty += (cond - 8.0) * 20.0;

      const colU = Math.hypot(M[0][1], M[1][1]); // M * (0, 1), proportional to Uref
      const colV = Math.hypot(M[0][0], M[1][0]); // M * (1, 0), proportional to Vref
      if (colU < 0.20 || colU > 4.50) penalty += 1e5;
      if (colV < 0.20 || colV > 4.50) penalty += 1e5;

      if (MExpected) penalty += 12.0 * mat2RelativeDistance(M, MExpected);
      if (MMean) penalty += 4.0 * mat2RelativeDistance(M, MMean);
      return penalty;
    }

    function chooseBestAffinityCandidate(candidates, center) {
      if (!candidates || !candidates.length) return null;
      const MExpected = getExpectedLocalForwardAffinity(center);
      const MMean = getValidatedMeanAffinity();
      const maxPhase = Math.max(...candidates.map((c) => Number(c.phaseScore) || 0), 1e-9);

      for (const c of candidates) {
        const phaseNorm = (Number(c.phaseScore) || 0) / maxPhase;
        const penalty = geometryPenaltyForCandidate(c.M, MExpected, MMean);
        // Geometry is intentionally dominant. Phase correlation is only a tie-breaker,
        // because the autocorrelation texture is periodic and phase scores are often ambiguous.
        c.geometryPenalty = penalty;
        c.distanceToExpected = MExpected ? mat2RelativeDistance(c.M, MExpected) : null;
        c.distanceToValidatedMean = MMean ? mat2RelativeDistance(c.M, MMean) : null;
        c.conditionNumber = mat2ConditionNumberApprox(c.M);
        c.det = mat2Det(c.M);
        c.phaseScoreNormalized = phaseNorm;
        c.selectionScore = -penalty + 0.25 * phaseNorm;
        c.selectionReferenceM = MExpected;
      }

      candidates.sort((a, b) => b.selectionScore - a.selectionScore);
      return candidates[0];
    }

    function estimateCurrentAffinityFromDetection() {
      if (!state.displayedImageData || !state.sourceImageData) return null;
      const fresh = getDisplayedDetectionForValidation();
      const detection = fresh.detection;
      if (!detection || !detection.u_fin || !detection.v_fin || !detection.w_fin) {
        setValidationMessage("No displayed peaks");
        return null;
      }

      const computeSize = fresh.computeSize;
      const scale = state.patchSize / computeSize;
      const observedPeaks = buildObservedHexagonPeaksXY(detection, scale);
      const refs = getTextureShiftVectorsSourcePx();
      const Uref = [refs.U[0], refs.U[1]];
      const Vref = [refs.V[0], refs.V[1]];
      const center = { x: fresh.center.x, y: fresh.center.y };

      const refCenterMapped = mapDisplayToSource(center.x, center.y);
      const refCenterSeed = refCenterMapped || center;

      const deformedPatch = extractGrayPatchArray(
        state.displayedImageData,
        center.x,
        center.y,
        state.patchSize
      );
      const seedReferencePatch = extractGrayPatchArray(
        state.sourceImageData,
        refCenterSeed.x,
        refCenterSeed.y,
        state.patchSize
      );

      const assignmentCandidates = buildOrderPreservingAffinityCandidates(observedPeaks, Uref, Vref);
      const candidates = [];

      for (const baseCandidate of assignmentCandidates) {
        const Uobs = baseCandidate.Uobs;
        const Vobs = baseCandidate.Vobs;
        const M = solve2x2ForColumns(Uref, Vref, Uobs, Vobs);
        if (!M) continue;
        const Arect = mat2Inv(M);
        if (!Arect) continue;

        const rectifiedPatch = rectifyPatchWithMatrix(
          state.displayedImageData,
          center.x,
          center.y,
          state.patchSize,
          M
        );

        const wholeRefMatch = phaseCorrelatePatchAgainstWholeReference(
          rectifiedPatch,
          state.patchSize,
          state.patchSize
        );
        if (!wholeRefMatch) continue;

        candidates.push({
          pairIndices: baseCandidate.pairIndices,
          pairName: baseCandidate.pairName,
          orderShift: baseCandidate.orderShift,
          assignment: baseCandidate.assignment,
          assignmentMode: baseCandidate.assignmentMode,
          M,
          Arect,
          phaseScore: wholeRefMatch.score,
          rectifiedPatch,
          center: { ...center },
          referenceCenter: {
            x: wholeRefMatch.matchedCenter.x,
            y: wholeRefMatch.matchedCenter.y
          },
          referenceCenterSeed: { x: refCenterSeed.x, y: refCenterSeed.y },
          referencePeakXY: wholeRefMatch.peakXY,
          referenceShiftXY: wholeRefMatch.shiftXY,
          matchedReferenceCrop: wholeRefMatch.matchedReferenceCrop,
          sourcePatch: wholeRefMatch.matchedReferenceCrop || seedReferencePatch,
          deformedPatch,
          patchSize: state.patchSize,
          Uobs,
          Vobs,
          Uref,
          Vref,
          detection,
          observedPeaks,
          projectionMode: state.projectionModes[state.projectionIndex]
        });
      }

      if (!candidates.length) {
        setValidationMessage("No solvable affinity from displayed peaks");
        return null;
      }

      const best = chooseBestAffinityCandidate(candidates, center);
      if (!best) {
        setValidationMessage("No valid affinity candidate after geometric filtering");
        return null;
      }
      best.seedReferencePatch = seedReferencePatch;
      best.allCandidates = candidates;
      best.selectionMode = "order_preserving_assignment_then_geometry_expected_jacobian_then_phase_tiebreak";
      return best;
    }

    function homogeneous2(y) {
      return [y[0], y[1], 1.0];
    }

    function embedHomography6(h) {
      return [
        [h[0], h[1], 0.0],
        [h[2], h[3], 0.0],
        [h[4], h[5], 1.0]
      ];
    }

    function mat3Mul(A, B) {
      const C = Array.from({ length: 3 }, () => [0, 0, 0]);
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          let s = 0;
          for (let k = 0; k < 3; k++) s += A[i][k] * B[k][j];
          C[i][j] = s;
        }
      }
      return C;
    }

    function mat3MulVec(A, v) {
      return [
        A[0][0] * v[0] + A[0][1] * v[1] + A[0][2] * v[2],
        A[1][0] * v[0] + A[1][1] * v[1] + A[1][2] * v[2],
        A[2][0] * v[0] + A[2][1] * v[1] + A[2][2] * v[2]
      ];
    }

    function invert3x3(M, eps = 1e-12) {
      const a = M[0][0], b = M[0][1], c = M[0][2];
      const d = M[1][0], e = M[1][1], f = M[1][2];
      const g = M[2][0], h = M[2][1], i = M[2][2];
      const A = e * i - f * h;
      const B = -(d * i - f * g);
      const C = d * h - e * g;
      const D = -(b * i - c * h);
      const E = a * i - c * g;
      const F = -(a * h - b * g);
      const G = b * f - c * e;
      const H = -(a * f - c * d);
      const I = a * e - b * d;
      const det = a * A + b * B + c * C;
      if (Math.abs(det) < eps || !Number.isFinite(det)) return null;
      const invDet = 1.0 / det;
      return [
        [A * invDet, D * invDet, G * invDet],
        [B * invDet, E * invDet, H * invDet],
        [C * invDet, F * invDet, I * invDet]
      ];
    }

    function applyHomographyPoint(H, pt) {
      const p = mat3MulVec(H, [pt[0], pt[1], 1.0]);
      const w = Math.abs(p[2]) < 1e-12 ? 1e-12 : p[2];
      return [p[0] / w, p[1] / w];
    }

    function jacobianHomographyAtInput(H, x, y) {
      // Analytical Jacobian of the homography H at its input point (x,y).
      // This is the same convention as the Python function jacobian_homography(H,x,y):
      // H maps deformed coordinates toward rectified/reference coordinates, and the
      // observed local rectifying affinity Arect must satisfy J_H(y_i) ≈ Arect_i.
      const h11 = H[0][0], h12 = H[0][1], h13 = H[0][2];
      const h21 = H[1][0], h22 = H[1][1], h23 = H[1][2];
      const h31 = H[2][0], h32 = H[2][1], h33 = H[2][2];

      const den = h31 * x + h32 * y + h33;
      if (!Number.isFinite(den) || Math.abs(den) < 1e-12) {
        throw new Error("Invalid homography denominator");
      }

      const numU = h11 * x + h12 * y + h13;
      const numV = h21 * x + h22 * y + h23;
      const den2 = den * den;

      return [
        [
          (h11 * den - numU * h31) / den2,
          (h12 * den - numU * h32) / den2
        ],
        [
          (h21 * den - numV * h31) / den2,
          (h22 * den - numV * h32) / den2
        ]
      ];
    }

    function normalizePoints(ys) {
      let cx = 0.0, cy = 0.0;
      for (const p of ys) { cx += p[0]; cy += p[1]; }
      cx /= Math.max(1, ys.length); cy /= Math.max(1, ys.length);
      let d = 0.0;
      for (const p of ys) d += Math.hypot(p[0] - cx, p[1] - cy);
      d /= Math.max(1, ys.length);
      const s = d < 1e-12 ? 1.0 : Math.SQRT2 / d;
      const T = [[s, 0.0, -s * cx], [0.0, s, -s * cy], [0.0, 0.0, 1.0]];
      const Tinv = [[1/s, 0.0, cx], [0.0, 1/s, cy], [0.0, 0.0, 1.0]];
      const ysN = ys.map((p) => applyHomographyPoint(T, p));
      return { ysN, T, Tinv };
    }

    function denormalizeHomography(Hn, T) {
      const Tinv = invert3x3(T);
      if (!Tinv) return Hn;
      let H = mat3Mul(mat3Mul(Tinv, Hn), T);
      if (Math.abs(H[2][2]) > 1e-12) {
        const s = H[2][2];
        H = H.map((row) => row.map((v) => v / s));
      }
      return H;
    }

    function residualVectorHomography(h, As, ys) {
      const H = embedHomography6(h);
      const invH = invert3x3(H);
      const detH = H[0][0]*(H[1][1]*H[2][2]-H[1][2]*H[2][1]) - H[0][1]*(H[1][0]*H[2][2]-H[1][2]*H[2][0]) + H[0][2]*(H[1][0]*H[2][1]-H[1][1]*H[2][0]);
      if (!invH || !Number.isFinite(detH) || Math.abs(detH) < 1e-12) {
        return new Float64Array(4 * As.length).fill(1e6);
      }
      const out = new Float64Array(4 * As.length);
      let k = 0;
      for (let idx = 0; idx < As.length; idx++) {
        const Aobs = As[idx];
        const yi = ys[idx];
        try {
          const J = jacobianHomographyAtInput(H, yi[0], yi[1]);
          out[k++] = Aobs[0][0] - J[0][0];
          out[k++] = Aobs[0][1] - J[0][1];
          out[k++] = Aobs[1][0] - J[1][0];
          out[k++] = Aobs[1][1] - J[1][1];
        } catch (e) {
          out[k++] = 1e6; out[k++] = 1e6; out[k++] = 1e6; out[k++] = 1e6;
        }
      }
      return out;
    }

    function vecNorm(v) {
      let s = 0.0;
      for (let i = 0; i < v.length; i++) s += v[i] * v[i];
      return Math.sqrt(s);
    }

    function meanSquared(v) {
      let s = 0.0;
      for (let i = 0; i < v.length; i++) s += v[i] * v[i];
      return s / Math.max(1, v.length);
    }

    function solveLinearSystem(A, b) {
      const n = A.length;
      const M = A.map((row, i) => row.slice().concat([b[i]]));
      for (let k = 0; k < n; k++) {
        let piv = k;
        let best = Math.abs(M[k][k]);
        for (let i = k + 1; i < n; i++) {
          const v = Math.abs(M[i][k]);
          if (v > best) { best = v; piv = i; }
        }
        if (best < 1e-12) return null;
        if (piv !== k) { const tmp = M[k]; M[k] = M[piv]; M[piv] = tmp; }
        const diag = M[k][k];
        for (let j = k; j <= n; j++) M[k][j] /= diag;
        for (let i = 0; i < n; i++) {
          if (i === k) continue;
          const f = M[i][k];
          for (let j = k; j <= n; j++) M[i][j] -= f * M[k][j];
        }
      }
      return M.map((row) => row[n]);
    }

    function optimizeLeastSquaresHomographyJS(As, ys, maxIter = 120, usePointNormalization = false) {
      let ysOpt = ys.slice();
      let T = [[1,0,0],[0,1,0],[0,0,1]];
      if (usePointNormalization) {
        const norm = normalizePoints(ys);
        ysOpt = norm.ysN;
        T = norm.T;
      }
      let x = [1.0, 0.0, 0.0, 1.0, 0.0, 0.0];
      let lambda = 1e-2;
      let r = residualVectorHomography(x, As, ysOpt);
      let cost = meanSquared(r);
      for (let it = 0; it < maxIter; it++) {
        const m = r.length;
        const p = x.length;
        const J = Array.from({ length: m }, () => new Array(p).fill(0.0));
        for (let j = 0; j < p; j++) {
          const eps = 1e-5 * Math.max(1.0, Math.abs(x[j]));
          const xp = x.slice(); xp[j] += eps;
          const xm = x.slice(); xm[j] -= eps;
          const rp = residualVectorHomography(xp, As, ysOpt);
          const rm = residualVectorHomography(xm, As, ysOpt);
          for (let i = 0; i < m; i++) J[i][j] = (rp[i] - rm[i]) / (2 * eps);
        }
        const JTJ = Array.from({ length: p }, () => new Array(p).fill(0.0));
        const JTr = new Array(p).fill(0.0);
        for (let i = 0; i < m; i++) {
          for (let a = 0; a < p; a++) {
            JTr[a] += J[i][a] * r[i];
            for (let b = 0; b < p; b++) JTJ[a][b] += J[i][a] * J[i][b];
          }
        }
        for (let a = 0; a < p; a++) JTJ[a][a] += lambda;
        const rhs = JTr.map((v) => -v);
        const delta = solveLinearSystem(JTJ, rhs);
        if (!delta) break;
        const xTrial = x.map((v, i) => v + delta[i]);
        const rTrial = residualVectorHomography(xTrial, As, ysOpt);
        const costTrial = meanSquared(rTrial);
        if (costTrial < cost) {
          x = xTrial;
          r = rTrial;
          cost = costTrial;
          lambda *= 0.6;
          if (vecNorm(delta) < 1e-8) break;
        } else {
          lambda *= 2.5;
        }
      }
      const Hn = embedHomography6(x);
      const H = usePointNormalization ? denormalizeHomography(Hn, T) : Hn;
      const residualsFinal = residualVectorHomography([H[0][0], H[0][1], H[1][0], H[1][1], H[2][0], H[2][1]], As, ys);
      return {
        H_3x3: H,
        H_3x2: [[H[0][0], H[0][1]], [H[1][0], H[1][1]], [H[2][0], H[2][1]]],
        cost: meanSquared(residualsFinal),
        info: { success: true, iterations: maxIter, raw_result_x: x.slice() }
      };
    }

    function renderRectifiedWithHomography(H) {
      if (!state.displayedImageData || !H) return null;
      const Hinv = invert3x3(H);
      if (!Hinv) return null;
      const w = state.displayedImageData.width;
      const h = state.displayedImageData.height;
      const out = new ImageData(w, h);
      const dst = out.data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const src = applyHomographyPoint(Hinv, [x, y]);
          const gray = sampleGrayBilinear(state.displayedImageData, src[0], src[1], 255);
          setGrayPixel(dst, (y * w + x) * 4, gray);
        }
      }
      return out;
    }

    function makeDifferenceImage(imageA, imageB) {
      if (!imageA || !imageB || imageA.width !== imageB.width || imageA.height !== imageB.height) return null;
      const out = new ImageData(imageA.width, imageA.height);
      const n = imageA.width * imageA.height;
      for (let i = 0; i < n; i++) {
        const ia = i * 4;
        const ga = imageA.data[ia];
        const gb = imageB.data[ia];
        const d = Math.min(255, Math.abs(ga - gb) * 4.0);
        out.data[ia] = d;
        out.data[ia + 1] = d;
        out.data[ia + 2] = d;
        out.data[ia + 3] = 255;
      }
      return out;
    }

    function translationHomography(tx, ty) {
      return [
        [1.0, 0.0, tx],
        [0.0, 1.0, ty],
        [0.0, 0.0, 1.0]
      ];
    }

    function averageValidatedCenter() {
      let sx = 0.0;
      let sy = 0.0;
      const n = state.validatedAffinities.length;
      for (const item of state.validatedAffinities) {
        sx += item.center.x;
        sy += item.center.y;
      }
      return [sx / Math.max(1, n), sy / Math.max(1, n)];
    }

    function anchorHomographyAtSourcePoint(H, anchorDef, anchorRef) {
      // The Jacobian-only optimization estimates the local derivatives of the
      // rectifying map H: deformed -> reference, but it does not determine the
      // absolute translation robustly. We therefore impose one photometric
      // anchor consistent with the known projection used in the demo:
      //
      //     H(anchorDef) = anchorRef
      //
      // where anchorDef is the average validated center in the deformed image,
      // and anchorRef is its mapped position in the original texture.
      const q = applyHomographyPoint(H, anchorDef);
      const tx = anchorRef[0] - q[0];
      const ty = anchorRef[1] - q[1];
      const T = translationHomography(tx, ty);

      let Hanchored = mat3Mul(T, H);
      if (Math.abs(Hanchored[2][2]) > 1e-12) {
        const s = Hanchored[2][2];
        Hanchored = Hanchored.map((row) => row.map((v) => v / s));
      }
      return Hanchored;
    }

    function recomputeRectification() {
      state.rectificationTransform = null;
      state.globalHomography = null;
      state.globalHomographyInfo = null;
      state.rectificationImageData = null;
      state.differenceImageData = null;
      if (state.validatedAffinities.length < 3) {
        state.rectificationEnabled = false;
        state.differenceEnabled = false;
        refreshRectificationUI();
        return;
      }
      const As = state.validatedAffinities.map((item) => item.Arect);
      const ys = state.validatedAffinities.map((item) => [item.center.x, item.center.y]);

      // Do not normalize points here unless the local Jacobian targets are also
      // transformed consistently. Keeping pixel coordinates matches the Python
      // rectification-homography fit from local Arect matrices.
      const opt = optimizeLeastSquaresHomographyJS(As, ys, 120, false);

      const anchorDef = averageValidatedCenter();
      const anchorRefMapped = mapDisplayToSource(anchorDef[0], anchorDef[1]);
      const anchorRef = anchorRefMapped
        ? [anchorRefMapped.x, anchorRefMapped.y]
        : anchorDef;
      const Hanchored = anchorHomographyAtSourcePoint(opt.H_3x3, anchorDef, anchorRef);

      state.rectificationTransform = opt;
      state.globalHomography = Hanchored;
      state.globalHomographyInfo = opt.info;
      state.rectificationImageData = renderRectifiedWithHomography(Hanchored);
      state.differenceImageData = (state.rectificationImageData && state.sourceImageData)
        ? makeDifferenceImage(state.sourceImageData, state.rectificationImageData)
        : null;
      if (!state.rectificationImageData) {
        state.rectificationEnabled = false;
        state.differenceEnabled = false;
      }
      refreshRectificationUI();
    }

    function validateCurrentAffinity() {
      if (!state.autocorrEnabled) state.autocorrEnabled = true;
      if (!state.peaksEnabled) state.peaksEnabled = true;
      const p = getActivePatchCenter();
      renderAutocorrelationAt(p.x, p.y);
      const estimate = estimateCurrentAffinityFromDetection();
      state.lastAffinityEstimate = estimate;
      if (!estimate) {
        refreshRectificationUI();
        redrawMainCanvas();
        return;
      }
      state.validatedAffinities.push(estimate);
      const dExp = Number.isFinite(estimate.distanceToExpected) ? estimate.distanceToExpected.toFixed(3) : "?";
      const detMsg = Number.isFinite(estimate.det) ? estimate.det.toFixed(3) : "?";
      const shiftMsg = estimate.orderShift === undefined ? "?" : String(estimate.orderShift);
      setValidationMessage(`OK - ${estimate.pairName} | order shift=${shiftMsg} | phase=${estimate.phaseScore.toFixed(4)} | dJ=${dExp} | det=${detMsg}`);
      recomputeRectification();
      if (state.triangulationEnabled) {
        state.triangulationData = buildTriangulationFromValidatedAffinities();
      }
      refreshRectificationUI();
      renderValidatedPatchesPanel();
      redrawMainCanvas();
    }

    function clearValidatedAffinities() {
      state.validatedAffinities = [];
      state.rectificationEnabled = false;
      state.differenceEnabled = false;
      state.patchViewEnabled = false;
      state.rectificationImageData = null;
      state.differenceImageData = null;
      state.rectificationTransform = null;
      state.globalHomography = null;
      state.globalHomographyInfo = null;
      state.triangulationEnabled = false;
      state.triangulationData = null;
      setValidationMessage("Ready");
      refreshRectificationUI();
      renderValidatedPatchesPanel();
      redrawMainCanvas();
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
      if (mode === "Two Planes") return mapDisplayToSourceTwoPlanes(x, y);
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
      const hom = buildPerspectiveHomography(state.size, state.size);
      if (!hom || !hom.Hinv) return null;
      const p = applyHomographyPoint(hom.Hinv, [x, y]);
      return { x: p[0], y: p[1] };
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


    function mapDisplayToSourceTwoPlanes(x, y) {
      const hit = rayToTwoPlanesSource(x, y, state.size, state.size);
      if (!hit) return null;
      return { x: hit.x, y: hit.y };
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
        state.lastAffinityEstimate = estimateCurrentAffinityFromDetection();
        refreshRectificationUI();
        const foundPeaks = hexResultToPreviewPeaks(detection, computeSize);
        drawPeakOverlayOnPreview(foundPeaks, computeSize, computeSize, detection);
      }

      if (!state.peaksEnabled) {
        state.lastDetection = null;
        state.lastAffinityEstimate = null;
        refreshRectificationUI();
      }

      if (acorrModeLabel) {
        acorrModeLabel.textContent = state.displayMode === "laplacian" ? "Laplacian of Autocorrelation" : "Autocorrelation";
      }
      if (patchSizeLabel) patchSizeLabel.textContent = `Patch: ${patchSize} px`;
      if (patchSizeInline) patchSizeInline.textContent = patchSize;
      redrawMainCanvas();
    }


    // =========================================================
    // SAVE VALIDATED PEAK DETAILS
    // =========================================================
    function roundNumberForExport(v, digits = 6) {
      if (!Number.isFinite(v)) return null;
      const f = Math.pow(10, digits);
      return Math.round(v * f) / f;
    }

    function exportVec2(v, digits = 6) {
      if (!v || v.length < 2) return null;
      return [roundNumberForExport(Number(v[0]), digits), roundNumberForExport(Number(v[1]), digits)];
    }

    function exportPoint(p, digits = 6) {
      if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return null;
      return {
        x: roundNumberForExport(p.x, digits),
        y: roundNumberForExport(p.y, digits)
      };
    }

    function exportMat2(M, digits = 6) {
      if (!M || !M[0] || !M[1]) return null;
      return [exportVec2(M[0], digits), exportVec2(M[1], digits)];
    }

    function exportVec3(v, digits = 6) {
      if (!v || v.length < 3) return null;
      return [
        roundNumberForExport(Number(v[0]), digits),
        roundNumberForExport(Number(v[1]), digits),
        roundNumberForExport(Number(v[2]), digits)
      ];
    }

    function exportMat3(M, digits = 6) {
      if (!M || !M[0] || !M[1] || !M[2]) return null;
      return [
        exportVec3(M[0], digits),
        exportVec3(M[1], digits),
        exportVec3(M[2], digits)
      ];
    }

    function exportSafeNumber(value, digits = 6) {
      const n = Number(value);
      if (!Number.isFinite(n)) return null;
      return roundNumberForExport(n, digits);
    }

    function filenameSafeNumber(value, digits = 3) {
      const n = Number(value);
      if (!Number.isFinite(n)) return 'na';
      return n.toFixed(digits).replace('-', 'm').replace('.', 'p');
    }

    function sanitizeFilenamePart(str) {
      return String(str).trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-]/g, '_').replace(/_+/g, '_');
    }

    function getCurrentDeformationParameters() {
      const mode = state.projectionModes[state.projectionIndex] || 'Unknown';
      if (mode === 'Affine') {
        return {
          mode,
          parameters: {
            rotation_z_deg: exportSafeNumber(state.affine.rotationDeg),
            scale_x: exportSafeNumber(state.affine.scaleX),
            scale_y: exportSafeNumber(state.affine.scaleY),
            shear_x: exportSafeNumber(state.affine.shearX),
            shear_y: exportSafeNumber(state.affine.shearY)
          }
        };
      }
      if (mode === 'Perspective') {
        return {
          mode,
          parameters: {
            angle_vue_x_deg: exportSafeNumber(state.perspective.angleViewXDeg),
            angle_vue_y_deg: exportSafeNumber(state.perspective.angleViewYDeg),
            focal: exportSafeNumber(state.perspective.focal)
          }
        };
      }
      if (mode === 'Cylindrical') {
        return {
          mode,
          parameters: {
            angular_span: exportSafeNumber(state.cylindrical.curvature),
            camera_distance: exportSafeNumber(state.cylindrical.perspectiveDrop),
            camera_roll_deg: exportSafeNumber(state.cylindrical.zRotationDeg),
            label_height: exportSafeNumber(state.cylindrical.verticalStretch)
          }
        };
      }
      if (mode === 'Shoulder') {
        return {
          mode,
          parameters: {
            angular_span: exportSafeNumber(state.shoulder.angularSpan),
            camera_distance: exportSafeNumber(state.shoulder.cameraDistance),
            neck_radius: exportSafeNumber(state.shoulder.neckRadius),
            shoulder_length: exportSafeNumber(state.shoulder.shoulderLength),
            camera_roll_deg: exportSafeNumber(state.shoulder.zRotationDeg),
            label_height: exportSafeNumber(state.shoulder.verticalStretch)
          }
        };
      }
      if (mode === 'Crumpled') {
        return {
          mode,
          parameters: {
            crumple_amplitude: exportSafeNumber(state.crumpled.amplitude),
            crease_frequency: exportSafeNumber(state.crumpled.frequency),
            perspective: exportSafeNumber(state.crumpled.perspective),
            camera_roll_deg: exportSafeNumber(state.crumpled.zRotationDeg),
            twist: exportSafeNumber(state.crumpled.twist),
            shading: exportSafeNumber(state.crumpled.shade)
          }
        };
      }
      if (mode === 'Two Planes') {
        return {
          mode,
          parameters: {
            angle_between_planes_deg: exportSafeNumber(state.twoPlanes.foldAngleDeg),
            angle_vue_x_deg: exportSafeNumber(state.twoPlanes.viewXDeg),
            angle_vue_y_deg: exportSafeNumber(state.twoPlanes.viewYDeg),
            angle_vue_z_deg: exportSafeNumber(state.twoPlanes.viewZDeg),
            focal_scale: exportSafeNumber(state.twoPlanes.focalScale),
            camera_distance: exportSafeNumber(state.twoPlanes.cameraDistance)
          }
        };
      }
      return { mode, parameters: {} };
    }

    function buildDeformationFilenameBase() {
      const deform = getCurrentDeformationParameters();
      const parts = ['deformation', sanitizeFilenamePart(deform.mode).toLowerCase()];
      Object.entries(deform.parameters || {}).forEach(([key, value]) => {
        if (value === null || value === undefined) return;
        parts.push(`${sanitizeFilenamePart(key)}_${filenameSafeNumber(value)}`);
      });
      return parts.join('__');
    }

    function normalizeHomography3x3(H) {
      if (!H) return null;
      const h33 = Number(H[2] && H[2][2]);
      if (Number.isFinite(h33) && Math.abs(h33) > 1e-12) {
        return H.map((row) => row.map((v) => v / h33));
      }
      let norm = 0.0;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) norm += Number(H[r][c]) * Number(H[r][c]);
      }
      norm = Math.sqrt(norm);
      if (!Number.isFinite(norm) || norm < 1e-12) return H;
      return H.map((row) => row.map((v) => v / norm));
    }

    function frobeniusErrorHomographyWithoutTranslationColumn(A, B) {
      // Homographies are first normalized by H[2][2].
      // Then we compare only the first two columns:
      //
      //   [ h11 h12 | h13 ]
      //   [ h21 h22 | h23 ]
      //   [ h31 h32 | h33 ]
      //
      // The translation column [h13, h23, h33]^T is ignored.
      // The compared block is therefore:
      //
      //   [ h11 h12 ]
      //   [ h21 h22 ]
      //   [ h31 h32 ]
      //
      if (!A || !B) return null;
      const A1 = normalizeHomography3x3(A);
      const B1 = normalizeHomography3x3(B);

      let s = 0.0;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 2; c++) {
          const a = Number(A1[r][c]);
          const b = Number(B1[r][c]);
          if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
          const d = a - b;
          s += d * d;
        }
      }
      return Math.sqrt(s);
    }

    function computeMeanGray(imageData) {
      if (!imageData || !imageData.data || !imageData.data.length) return 255;
      let s = 0.0;
      const n = imageData.width * imageData.height;
      for (let i = 0; i < imageData.data.length; i += 4) s += imageData.data[i];
      return s / Math.max(1, n);
    }

    function computeGeometricDeformationError200x200(Htrue, Hestimated) {
      if (!Htrue || !Hestimated) return null;

      const crop = Math.min(200, state.size, state.size);
      const x0 = Math.floor((state.size - crop) / 2);
      const y0 = Math.floor((state.size - crop) / 2);

      let n = 0;
      let sum = 0.0;
      let sumSq = 0.0;
      let maxErr = 0.0;

      for (let y = y0; y < y0 + crop; y++) {
        for (let x = x0; x < x0 + crop; x++) {
          const pTrue = applyHomographyPoint(Htrue, [x, y]);
          const pEst = applyHomographyPoint(Hestimated, [x, y]);

          if (!pTrue || !pEst) continue;
          const dx = pEst[0] - pTrue[0];
          const dy = pEst[1] - pTrue[1];
          if (!Number.isFinite(dx) || !Number.isFinite(dy)) continue;

          const e = Math.sqrt(dx * dx + dy * dy);
          sum += e;
          sumSq += e * e;
          maxErr = Math.max(maxErr, e);
          n++;
        }
      }

      return {
        crop_size_px: crop,
        crop_origin_xy_in_source_image: { x: x0, y: y0 },
        compared_pixels: n,
        mean_transfer_error_px: roundNumberForExport(sum / Math.max(1, n)),
        rmse_transfer_error_px: roundNumberForExport(Math.sqrt(sumSq / Math.max(1, n))),
        max_transfer_error_px: roundNumberForExport(maxErr),
        convention: "central 200x200 source pixels are projected by H_true and H_estimated; error is Euclidean distance in the deformed image, in pixels"
      };
    }

    function computePixelRectificationError200x200() {
      const Htrue = computeTrueDeformationHomographySourceToDisplayed();
      const Hestimated = computeEstimatedDeformationHomographySourceToDisplayed();
      return computeGeometricDeformationError200x200(Htrue, Hestimated);
    }

    function computeTrueDeformationHomographySourceToDisplayed() {
      const mode = state.projectionModes[state.projectionIndex];
      const w = state.size;
      const h = state.size;
      if (mode === 'Affine') {
        const cx = w / 2;
        const cy = h / 2;
        const zRot = degToRad(state.affine.rotationDeg);
        const A = [[state.affine.scaleX, state.affine.shearX], [state.affine.shearY, state.affine.scaleY]];
        const R = [[Math.cos(zRot), -Math.sin(zRot)], [Math.sin(zRot), Math.cos(zRot)]];
        const M = [
          [R[0][0] * A[0][0] + R[0][1] * A[1][0], R[0][0] * A[0][1] + R[0][1] * A[1][1]],
          [R[1][0] * A[0][0] + R[1][1] * A[1][0], R[1][0] * A[0][1] + R[1][1] * A[1][1]]
        ];
        return [
          [M[0][0], M[0][1], cx - (M[0][0] * cx + M[0][1] * cy)],
          [M[1][0], M[1][1], cy - (M[1][0] * cx + M[1][1] * cy)],
          [0.0, 0.0, 1.0]
        ];
      }
      if (mode === 'Perspective') {
        const hom = buildPerspectiveHomography(w, h);
        return hom ? hom.H : null;
      }
      return null;
    }

    function computeEstimatedDeformationHomographySourceToDisplayed() {
      return state.globalHomography ? invert3x3(state.globalHomography) : null;
    }

    function computeGlobalHomographyComparison() {
      const Htrue = computeTrueDeformationHomographySourceToDisplayed();
      const Hrect = state.globalHomography || null;
      const Hest = computeEstimatedDeformationHomographySourceToDisplayed();
      return {
        true_deformation_homography_source_to_deformed: exportMat3(Htrue),
        estimated_rectifying_homography_deformed_to_source: exportMat3(Hrect),
        estimated_deformation_homography_source_to_deformed: exportMat3(Hest),
        frobenius_error_without_translation_column_true_vs_estimated_deformation_homography: roundNumberForExport(frobeniusErrorHomographyWithoutTranslationColumn(Htrue, Hest)),
        note: Htrue && Hest ? 'Frobenius norm computed after normalization by H[2][2], using only the first two columns of each homography; the translation column is ignored.' : 'Global homography comparison available only when both true and estimated homographies exist.'
      };
    }

    function makePeakPositionExport(item) {
      const detection = item && item.detection ? item.detection : null;
      const patchSize = Number(item && item.patchSize ? item.patchSize : state.patchSize);
      const computeSize = Math.min(state.previewComputeSize, patchSize);
      const scale = patchSize / computeSize;
      const cxCompute = (computeSize - 1) / 2.0;
      const cyCompute = (computeSize - 1) / 2.0;
      const cxPatch = (patchSize - 1) / 2.0;
      const cyPatch = (patchSize - 1) / 2.0;

      if (!detection || !detection.u_fin || !detection.v_fin || !detection.w_fin) {
        return {
          compute_size: computeSize,
          patch_size: patchSize,
          scale_patch_over_compute: roundNumberForExport(scale),
          peaks: []
        };
      }

      const shiftDefs = [
        { label: "+U", rc: detection.u_fin },
        { label: "-U", rc: [-detection.u_fin[0], -detection.u_fin[1]] },
        { label: "+V", rc: detection.v_fin },
        { label: "-V", rc: [-detection.v_fin[0], -detection.v_fin[1]] },
        { label: "+W = +(U-V)", rc: detection.w_fin },
        { label: "-W = -(U-V)", rc: [-detection.w_fin[0], -detection.w_fin[1]] }
      ];

      const peaks = shiftDefs.map((p) => {
        const rowShift = Number(p.rc[0]);
        const colShift = Number(p.rc[1]);
        const dxCompute = colShift;
        const dyCompute = rowShift;
        const dxPatch = dxCompute * scale;
        const dyPatch = dyCompute * scale;
        return {
          label: p.label,
          shift_rc_compute_px: [roundNumberForExport(rowShift), roundNumberForExport(colShift)],
          shift_xy_compute_px: [roundNumberForExport(dxCompute), roundNumberForExport(dyCompute)],
          position_xy_in_autocorr_compute_px: {
            x: roundNumberForExport(cxCompute + dxCompute),
            y: roundNumberForExport(cyCompute + dyCompute)
          },
          shift_xy_patch_px: [roundNumberForExport(dxPatch), roundNumberForExport(dyPatch)],
          position_xy_in_patch_scale_px: {
            x: roundNumberForExport(cxPatch + dxPatch),
            y: roundNumberForExport(cyPatch + dyPatch)
          }
        };
      });

      return {
        compute_size: computeSize,
        patch_size: patchSize,
        scale_patch_over_compute: roundNumberForExport(scale),
        center_autocorr_compute_px: {
          x: roundNumberForExport(cxCompute),
          y: roundNumberForExport(cyCompute)
        },
        center_patch_scale_px: {
          x: roundNumberForExport(cxPatch),
          y: roundNumberForExport(cyPatch)
        },
        peaks
      };
    }

    function makeValidatedPeaksExportPayload() {
      const refs = getTextureShiftVectorsSourcePx();
      const U = refs.U;
      const V = refs.V;
      const W = [U[0] - V[0], U[1] - V[1]];
      const deform = getCurrentDeformationParameters();

      return {
        export_version: 3,
        created_at: new Date().toISOString(),
        image_size_px: {
          width: state.size,
          height: state.size
        },
        projection_mode: deform.mode,
        deformation_parameters: deform.parameters,
        texture_parameters: {
          black_occupancy: state.texture.occupancy,
          dilation_radius: state.texture.dilation,
          shift_angle_deg: state.texture.angleShiftDeg,
          shift_norm_px: state.texture.normShift,
          gaussian_blur_sigma: state.texture.blurSigma
        },
        original_shifts_source_px: {
          convention: 'xy, in the undeformed/source texture',
          U: exportVec2(U),
          V: exportVec2(V),
          W_U_minus_V: exportVec2(W),
          minus_U: exportVec2([-U[0], -U[1]]),
          minus_V: exportVec2([-V[0], -V[1]]),
          minus_W: exportVec2([-W[0], -W[1]])
        },
        rectification_details: {
          validated_affinities_count: state.validatedAffinities.length,
          rectification_enabled: Boolean(state.rectificationEnabled),
          has_rectification_image: Boolean(state.rectificationImageData),
          geometric_deformation_error_200x200_px: computePixelRectificationError200x200(),
          global_homography_comparison: computeGlobalHomographyComparison(),
          rectification_solver_info: state.globalHomographyInfo || null
        },
        validated_count: state.validatedAffinities.length,
        validated_patches: state.validatedAffinities.map((item, idx) => ({
          id: idx + 1,
          deformed_patch_center_xy: exportPoint(item.center),
          matched_reference_center_xy: exportPoint(item.referenceCenter),
          seed_reference_center_xy: exportPoint(item.referenceCenterSeed),
          patch_size_px: item.patchSize || state.patchSize,
          selected_pair: item.pairName || null,
          selected_pair_indices_in_ordered_hexagon: item.pairIndices || null,
          assignment_mode: item.assignmentMode || null,
          order_preserving_cyclic_shift: item.orderShift === undefined ? null : item.orderShift,
          order_preserving_assignment: item.assignment || null,
          phase_correlation_score: roundNumberForExport(item.phaseScore),
          found_shifts_selected_xy_patch_px: {
            Uobs: exportVec2(item.Uobs),
            Vobs: exportVec2(item.Vobs)
          },
          original_shifts_used_for_affinity_xy_source_px: {
            Uref: exportVec2(item.Uref),
            Vref: exportVec2(item.Vref)
          },
          local_forward_affinity_M_source_to_deformed: exportMat2(item.M),
          local_rectification_A_inverse_deformed_to_source: exportMat2(item.Arect),
          reference_phase_peak_xy: exportVec2(item.referencePeakXY),
          reference_shift_xy: exportVec2(item.referenceShiftXY),
          detected_hexagon: makePeakPositionExport(item),
          detection_quality: item.detection ? {
            energy: roundNumberForExport(item.detection.energy ?? item.detection.E ?? item.detection.e_fin),
            score: roundNumberForExport(item.detection.score),
            ok: item.detection.ok === undefined ? null : Boolean(item.detection.ok)
          } : null
        }))
      };
    }

    function downloadTextFile(filename, text, mimeType = 'application/json') {
      const blob = new Blob([text], { type: `${mimeType};charset=utf-8` });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      window.setTimeout(() => {
        a.click();
        window.setTimeout(() => {
          URL.revokeObjectURL(url);
          if (a.parentNode) a.parentNode.removeChild(a);
        }, 500);
      }, 0);
    }

    function saveValidatedPeaksDetails() {
      if (!state.validatedAffinities || !state.validatedAffinities.length) {
        setValidationMessage('No validated peak to save. Validate at least one affinity first.');
        return;
      }
      const payload = makeValidatedPeaksExportPayload();
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const baseName = buildDeformationFilenameBase();
      const filename = `${baseName}__patches_${payload.validated_count}__${stamp}.json`;
      downloadTextFile(filename, JSON.stringify(payload, null, 2), 'application/json');
      setValidationMessage(`Download started: ${filename}`);
    }

    // =========================================================
    // PARAMETER ACTIONS
    // =========================================================
    function resetAllParams() {
      state.testMode = "synthetic";
      updateTestModeUI();
      state.texture = { ...DEFAULTS.texture };
      state.affine = { ...DEFAULTS.affine };
      state.perspective = { ...DEFAULTS.perspective };
      state.cylindrical = { ...DEFAULTS.cylindrical };
      state.shoulder = { ...DEFAULTS.shoulder };
      state.crumpled = { ...DEFAULTS.crumpled };
      state.twoPlanes = { ...DEFAULTS.twoPlanes };
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
      state.lastAffinityEstimate = null;
      state.validatedAffinities = [];
      state.rectificationEnabled = false;
      state.differenceEnabled = false;
      state.rectificationImageData = null;
      state.differenceImageData = null;
      state.rectificationTransform = null;
      state.globalHomography = null;
      state.globalHomographyInfo = null;
      state.triangulationEnabled = false;
      state.triangulationData = null;
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
    if (btnSyntheticTests) btnSyntheticTests.addEventListener("click", () => setTestMode("synthetic"));
    if (btnRealTests) btnRealTests.addEventListener("click", () => setTestMode("real"));
    setupDropzone(dropReferenceImage, inputReferenceImage, "reference");
    setupDropzone(dropDeformedImage, inputDeformedImage, "deformed");

    if (btnGenerate) {
      btnGenerate.addEventListener("click", () => {
        setTestMode("synthetic");
        clearValidatedAffinities();
        updateStateFromControls();
        renderGeneratedTexture();
      });
    }

    if (btnProjection) {
      btnProjection.addEventListener("click", () => {
        setTestMode("synthetic");
        clearValidatedAffinities();
        cycleProjectionMode();
      });
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

    if (btnValidateAffinity) {
      btnValidateAffinity.addEventListener("click", () => validateCurrentAffinity());
    }

    if (btnToggleRectification) {
      btnToggleRectification.addEventListener("click", () => {
        if (!state.rectificationImageData) recomputeRectification();
        if (!state.rectificationImageData) {
          setValidationMessage("Need at least 3 validated affinities");
          refreshRectificationUI();
          redrawMainCanvas();
          return;
        }
        if (!state.rectificationEnabled && !state.differenceEnabled) {
          state.rectificationEnabled = true;
          state.differenceEnabled = false;
        } else if (state.rectificationEnabled) {
          state.rectificationEnabled = false;
          state.differenceEnabled = true;
        } else {
          state.rectificationEnabled = false;
          state.differenceEnabled = false;
        }
        refreshRectificationUI();
        redrawMainCanvas();
      });
    }

    if (btnTogglePatchView) {
      btnTogglePatchView.addEventListener("click", () => {
        state.patchViewEnabled = !state.patchViewEnabled;
        renderValidatedPatchesPanel();
      });
    }

    if (btnShowTriangulation) {
      btnShowTriangulation.addEventListener("click", () => {
        state.rectificationEnabled = false;
        state.differenceEnabled = false;
        state.triangulationEnabled = !state.triangulationEnabled;
        refreshTriangulation();
      });
    }

    if (btnSavePeaksDetails) {
      btnSavePeaksDetails.addEventListener("click", () => saveValidatedPeaksDetails());
    }

    if (btnClearAffinities) {
      btnClearAffinities.addEventListener("click", () => clearValidatedAffinities());
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
        if (state.testMode !== "synthetic") return;
        clearValidatedAffinities();
        updateStateFromControls();
        renderGeneratedTexture();
      });
    });

    controlIds.forEach((id) => {
      if (!controls[id]) return;
      controls[id].addEventListener("input", () => {
        if (state.testMode !== "synthetic") return;
        clearValidatedAffinities();
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

      // Patch selection/validation is done on the deformed image.
      // When the user clicks a new patch, automatically leave Rectified/Difference view
      // so the green locked patch and its center marker are visible again.
      state.rectificationEnabled = false;
      state.differenceEnabled = false;
      refreshRectificationUI();

      updateAutocorrPreviewPositionFromCanvasPoint(state.lockedPatchX, state.lockedPatchY);
      renderAutocorrelationAt(state.lockedPatchX, state.lockedPatchY);
      redrawMainCanvas();
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
        [values.cCurv, controls["param-c-curv"]],
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
    updateTestModeUI();
    renderGeneratedTexture();
  });
})();
