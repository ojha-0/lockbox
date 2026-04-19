import { useEffect, useRef, useState } from 'react';
import { Check, Loader2, RotateCcw, ShieldCheck, X } from 'lucide-react';

// face-api + TFJS is large (~1.3 MB), so we defer loading it until the modal
// is actually opened. `faceapi` is populated by the lazy import below.
let faceapi = null;

// ─────────────────────────────────────────────────────────────
// Face-gated capture flow.
//
// The user must show a centered, roughly-frontal face for several consecutive
// detection frames before we snap the still that'll be used as their profile
// photo. No upload path — only a live capture passing the gate is accepted.
// ─────────────────────────────────────────────────────────────

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model';

// Module-level promise so all instances share a single model load.
let modelsPromise = null;
async function ensureModels() {
  if (!modelsPromise) {
    modelsPromise = (async () => {
      if (!faceapi) {
        faceapi = await import('@vladmandic/face-api');
      }
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
      ]);
    })();
  }
  return modelsPromise;
}

const DETECT_MS = 180;            // detection tick cadence
const FACE_STABLE_FRAMES = 6;     // consecutive good frames to lock in "face present"

const STEP = {
  LOADING:    'loading',
  FIND_FACE:  'find_face',
  REVIEW:     'review',
};

const STEP_HINT = {
  [STEP.LOADING]:   'Loading face detection…',
  [STEP.FIND_FACE]: 'Show your face inside the oval.',
  [STEP.REVIEW]:    'Liveness check passed.',
};

export default function PhotoCaptureModal({ open, onClose, onCapture }) {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);     // full-res — for the final JPEG
  const streamRef = useRef(null);
  const stepRef   = useRef(STEP.LOADING);   // mirror of `step` for the detection loop
  const faceStreakRef  = useRef(0);
  const rafRef         = useRef(null);

  const [step, setStep]     = useState(STEP.LOADING);
  const [error, setError]   = useState('');
  const [subHint, setSubHint] = useState('');
  const [preview, setPreview] = useState(null);
  const [busy, setBusy]       = useState(false);
  const [progress, setProgress] = useState(0); // 0..1 ring fill

  // Keep `stepRef` in sync so the detection tick reads the latest step
  useEffect(() => { stepRef.current = step; }, [step]);

  // ── Open: load models, start camera, start detection loop ──
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    setError(''); setPreview(null); setSubHint(''); setProgress(0);
    faceStreakRef.current = 0;
    setStep(STEP.LOADING);

    (async () => {
      try {
        await ensureModels();
        if (cancelled) return;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setStep(STEP.FIND_FACE);
        startDetectionLoop();
      } catch (e) {
        if (cancelled) return;
        setError(
          e?.name === 'NotAllowedError'
            ? 'Camera permission denied. Allow access in your browser settings.'
            : (e?.message || 'Could not start camera or load face models.')
        );
      }
    })();

    return () => {
      cancelled = true;
      stopDetectionLoop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function startDetectionLoop() {
    let last = 0;
    const tick = async (now) => {
      rafRef.current = requestAnimationFrame(tick);
      if (now - last < DETECT_MS) return;
      last = now;
      const v = videoRef.current;
      if (!v || v.readyState < 2 || v.videoWidth === 0) return;
      if (stepRef.current !== STEP.FIND_FACE) return;

      let result = null;
      try {
        result = await faceapi
          .detectSingleFace(v, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.45 }))
          .withFaceLandmarks(true); // true = tiny 68-pt net
      } catch {
        return;
      }

      handleFrame(result);
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  function stopDetectionLoop() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }

  function handleFrame(result) {
    if (stepRef.current !== STEP.FIND_FACE) return;

    if (!result) {
      faceStreakRef.current = 0;
      setSubHint('No face detected yet — move into the oval.');
      setProgress(0);
      return;
    }

    const { detection } = result;
    const box = detection?.box;
    const v = videoRef.current;
    if (!box || !v) return;

    // Require the face to occupy a reasonable chunk of the frame and sit near
    // the horizontal center — rejects tiny faces and faces peeking in from the
    // side of the camera.
    const widthFrac = box.width / v.videoWidth;
    const cx = (box.x + box.width / 2) / v.videoWidth;
    const centered = widthFrac >= 0.18 && widthFrac <= 0.75 && cx > 0.25 && cx < 0.75;

    if (centered) {
      faceStreakRef.current = Math.min(FACE_STABLE_FRAMES, faceStreakRef.current + 1);
      setProgress(faceStreakRef.current / FACE_STABLE_FRAMES);
      setSubHint('Hold still…');
      if (faceStreakRef.current >= FACE_STABLE_FRAMES) {
        captureFrontPhoto();
        setProgress(0);
        setStep(STEP.REVIEW);
      }
    } else {
      faceStreakRef.current = 0;
      setProgress(0);
      setSubHint('Move closer and center your face in the oval.');
    }
  }

  function captureFrontPhoto() {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;
    const w = v.videoWidth || 640;
    const h = v.videoHeight || 480;
    c.width = w; c.height = h;
    c.getContext('2d').drawImage(v, 0, 0, w, h);
    setPreview(c.toDataURL('image/jpeg', 0.92));
  }

  function retake() {
    faceStreakRef.current = 0;
    setPreview(null);
    setSubHint('');
    setProgress(0);
    setStep(STEP.FIND_FACE);
  }

  function confirm() {
    if (!preview || !canvasRef.current) return;
    setBusy(true);
    canvasRef.current.toBlob((blob) => {
      if (!blob) { setBusy(false); return; }
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      onCapture(file);
      setBusy(false);
      onClose();
    }, 'image/jpeg', 0.92);
  }

  if (!open) return null;

  const inReview = step === STEP.REVIEW;
  const mainHint = error ? '' : STEP_HINT[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-gray-700" />
            <h3 className="text-sm font-semibold text-gray-800">Liveness check</h3>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        <div className="relative bg-black aspect-video flex items-center justify-center">
          {error ? (
            <p className="text-sm text-white/90 p-6 text-center">{error}</p>
          ) : inReview && preview ? (
            <img src={preview} alt="captured" className="max-h-full max-w-full object-contain" />
          ) : (
            <>
              {/* Mirror so users see themselves as in a mirror. face-api reads
                  the raw stream, not the mirrored display. */}
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              {step === STEP.LOADING && (
                <div className="absolute inset-0 flex items-center justify-center text-white/80 text-sm">
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Loading face detection…
                </div>
              )}

              {/* Oval face guide; highlights when the step is actively making progress */}
              {step !== STEP.LOADING && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div
                    className={`w-48 h-60 rounded-[50%] border-2 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] transition-colors ${
                      progress > 0 ? 'border-green-400' : 'border-white/70'
                    }`}
                  />
                </div>
              )}

              {/* Status banner */}
              {step !== STEP.LOADING && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 max-w-[90%] px-3 py-1.5 bg-black/60 text-white text-xs rounded-full backdrop-blur text-center">
                  {mainHint}
                </div>
              )}
              {step !== STEP.LOADING && subHint && (
                <div className="absolute top-11 left-1/2 -translate-x-1/2 max-w-[90%] px-2.5 py-1 bg-black/45 text-white/80 text-[11px] rounded-full backdrop-blur">
                  {subHint}
                </div>
              )}

              {/* Step progress bar */}
              {step !== STEP.LOADING && (
                <div className="absolute bottom-3 left-4 right-4 h-1.5 bg-white/25 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-400 transition-[width] duration-100"
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </div>
              )}
            </>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="px-5 py-4 flex items-center justify-end gap-2 bg-gray-50">
          {inReview ? (
            <>
              <button type="button" onClick={retake} className="btn-secondary px-4 inline-flex items-center gap-1.5">
                <RotateCcw size={13} /> Retake
              </button>
              <button type="button" onClick={confirm} disabled={busy} className="btn-primary px-5 inline-flex items-center gap-1.5">
                <Check size={14} /> Use photo
              </button>
            </>
          ) : (
            <button type="button" onClick={onClose} className="btn-secondary px-4">Cancel</button>
          )}
        </div>
      </div>
    </div>
  );
}
