import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, MapPin, Shield, BookOpen, CreditCard, Car, Receipt, Camera,
  Upload, X, CheckCircle, Loader2, Clock, AlertCircle, RotateCcw, Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import LockboxLogo from '../../components/common/LockboxLogo';
import PhotoCaptureModal from '../../components/common/PhotoCaptureModal';
import { formatFileSize } from '../../utils/format';
import { loadForm, saveForm } from '../../utils/formStorage';
import { adToBs, bsToAd } from '../../utils/nepaliDate';

// Fields persisted to the server-side UserPersonalDetails entity. Given/family
// name are stored on the User row itself, not here.
const PERSONAL_DETAILS_FIELDS = [
  'gender', 'dateOfBirthAD', 'dobBS', 'bloodGroup',
  'birthAddress', 'permanentAddress', 'temporaryAddress',
  'citizenshipNumber', 'citizenshipType', 'citizenshipIssuingDistrict',
  'citizenshipIssueDate', 'citizenshipIssuingOfficer',
  'passportNumber', 'nationality', 'passportIssueDate', 'passportExpiryDate',
  'nin',
  'dlLicenseNumber', 'dlCategory', 'dlIssueDate', 'dlExpiryDate', 'dlLicenseOffice',
  'panNumber', 'panRegisteredOffice',
];

function loadData() {
  const p  = loadForm('passport');
  const n  = loadForm('national_id');
  const c  = loadForm('citizenship');
  const d  = loadForm('drivers_license');
  const fullName = n.fullName || c.fullName || d.fullName || '';
  const parts    = fullName.trim().split(' ');

  const permAddr = d.permanentAddress || '';
  const tempAddr = d.temporaryAddress || '';

  const pan = loadForm('pan_card');
  return {
    givenName:                  p.givenNames  || (parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0]) || '',
    familyName:                 p.surname     || (parts.length > 1 ? parts[parts.length - 1] : '') || '',
    gender:                     p.gender      || n.gender  || '',
    dateOfBirthAD:              p.dateOfBirth || n.dobAD   || d.dateOfBirth || '',
    dobBS:                      n.dobBS       || '',
    phone:                      d.phone       || '',
    bloodGroup:                 d.bloodGroup  || '',
    birthAddress:               p.placeOfBirth || c.placeOfBirthDistrict || '',
    permanentAddress:           permAddr,
    temporaryAddress:           tempAddr,
    sameAsPermanent:            !!permAddr && permAddr === tempAddr,
    citizenshipNumber:          n.citizenshipNumber || d.citizenshipNumber || c.certNumber || '',
    citizenshipType:            d.citizenshipType   || '',
    citizenshipIssuingDistrict: c.issueDistrict  || d.citizenshipIssueDistrict || '',
    citizenshipIssueDate:       c.issueDate    || d.citizenshipIssueDate || '',
    citizenshipIssuingOfficer:  c.issuingOfficer || '',
    passportNumber:             p.passportNumber || '',
    nationality:                p.nationality   || 'Nepali',
    passportIssueDate:          p.issueDate     || '',
    passportExpiryDate:         p.expiryDate    || '',
    nin:                        n.nin           || '',
    dlLicenseNumber:            d.licenseNumber  || '',
    dlCategory:                 d.category       || '',
    dlIssueDate:                d.licenseIssueDate  || '',
    dlExpiryDate:               d.licenseExpiryDate || '',
    dlLicenseOffice:            d.licenseOffice  || '',
    panNumber:                  pan.panNumber        || '',
    panRegisteredOffice:        pan.registeredOffice || '',
  };
}

function saveData(data) {
  const fullName = [data.givenName, data.familyName].filter(Boolean).join(' ');
  // Dates are stored as dd/mm/yyyy; decompose DOB for citizenship key
  const [dobDay = '', dobMonth = '', dobYear = ''] = (data.dateOfBirthAD || '').split('/');
  const effectiveTempAddress = data.sameAsPermanent ? data.permanentAddress : data.temporaryAddress;

  saveForm('passport', {
    givenNames:     data.givenName,
    surname:        data.familyName,
    passportNumber: data.passportNumber,
    nationality:    data.nationality,
    dateOfBirth:    data.dateOfBirthAD,
    gender:         data.gender,
    issueDate:      data.passportIssueDate,
    expiryDate:     data.passportExpiryDate,
    placeOfBirth:   data.birthAddress,
  });

  saveForm('national_id', {
    nin:               data.nin,
    fullName,
    dobBS:             data.dobBS,
    dobAD:             data.dateOfBirthAD,
    gender:            data.gender,
    citizenshipNumber: data.citizenshipNumber,
  });

  saveForm('citizenship', {
    fullName,
    gender:               data.gender,
    dobYear, dobMonth, dobDay,
    placeOfBirthDistrict: data.birthAddress,
    permDistrict:         '',
    permMunicipality:     '',
    permWard:             '',
    certNumber:           data.citizenshipNumber,
    issueDate:            data.citizenshipIssueDate,
    issueDistrict:        data.citizenshipIssuingDistrict,
    issuingOfficer:       data.citizenshipIssuingOfficer,
  });

  saveForm('drivers_license', {
    fullName,
    dateOfBirth:              data.dateOfBirthAD,
    gender:                   data.gender,
    phone:                    data.phone,
    bloodGroup:               data.bloodGroup,
    permanentAddress:         data.permanentAddress,
    temporaryAddress:         effectiveTempAddress,
    citizenshipNumber:        data.citizenshipNumber,
    citizenshipType:          data.citizenshipType,
    citizenshipIssueDate:     data.citizenshipIssueDate,
    citizenshipIssueDistrict: data.citizenshipIssuingDistrict,
    licenseNumber:            data.dlLicenseNumber,
    category:                 data.dlCategory,
    licenseIssueDate:         data.dlIssueDate,
    licenseExpiryDate:        data.dlExpiryDate,
    licenseOffice:            data.dlLicenseOffice,
  });

  saveForm('pan_card', {
    fullName,
    panNumber:         data.panNumber,
    registeredOffice:  data.panRegisteredOffice,
    citizenshipNumber: data.citizenshipNumber,
    issueDistrict:     data.citizenshipIssuingDistrict,
  });
}

// ─── Shared primitives ───
function Field({ label, children, span2 = false }) {
  return (
    <div className={span2 ? 'col-span-2' : ''}>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, ...rest }) {
  return (
    <input
      className="input"
      value={value}
      onChange={e => onChange(e.target.value)}
      {...rest}
    />
  );
}

// Text input pre-configured for dd/mm/yyyy date entry
function DateInput({ value, onChange, placeholder = 'dd/mm/yyyy' }) {
  return (
    <Input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      maxLength={10}
    />
  );
}

function Select({ value, onChange, options }) {
  return (
    <select className="input" value={value} onChange={e => onChange(e.target.value)}>
      <option value="">Select</option>
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function SectionCard({ icon: Icon, title, children }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 bg-gray-50">
        <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
          <Icon size={14} className="text-gray-600" />
        </div>
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="px-5 py-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── File upload slot ───
const ACCEPTED = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.webp';

const DOC_SLOTS = [
  { id: 'user_photo',        label: 'Your Photo', camera: true, cameraOnly: true, imageOnly: true, required: true },
  { id: 'passport',          label: 'Passport' },
  { id: 'national_id',       label: 'National ID' },
  { id: 'citizenship_front', label: 'Citizenship — Front' },
  { id: 'citizenship_back',  label: 'Citizenship — Back' },
  { id: 'drivers_license',   label: "Driver's License" },
  { id: 'pan_card',          label: 'PAN Card' },
];

const SLOT_DOCTYPE = {
  user_photo:        'user_photo',
  passport:          'passport',
  national_id:       'national_id',
  citizenship_front: 'citizenship',
  citizenship_back:  'citizenship',
  drivers_license:   'drivers_license',
  pan_card:          'pan_card',
};

function FileSlot({ slotId, label, file, uploaded, serverStatus, ocrBusy, camera, cameraOnly, required, onSelect, onCapture, onRemove }) {
  // Just-uploaded in this session
  if (uploaded) {
    return (
      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
        <CheckCircle size={15} className="text-green-500 flex-shrink-0" />
        <p className="text-sm text-green-700 font-medium flex-1 truncate">{label} — uploaded</p>
      </div>
    );
  }

  // Already on the server: VERIFIED
  if (serverStatus === 'VERIFIED' && !file) {
    return (
      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
        <CheckCircle size={15} className="text-green-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-green-700 font-medium truncate">{label}</p>
          <p className="text-xs text-green-600">Verified</p>
        </div>
        <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 rounded-full flex-shrink-0">
          Completed
        </span>
      </div>
    );
  }

  // Already on the server: PENDING_VERIFICATION
  if (serverStatus === 'PENDING_VERIFICATION' && !file) {
    return (
      <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
        <Clock size={15} className="text-amber-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-amber-700 font-medium truncate">{label}</p>
          <p className="text-xs text-amber-600">Awaiting verification</p>
        </div>
        <span className="px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700 rounded-full flex-shrink-0">
          Pending
        </span>
      </div>
    );
  }

  // Already on the server: DECLINED — allow reupload
  if (serverStatus === 'DECLINED' && !file) {
    return (
      <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
        <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-red-700 font-medium truncate">{label}</p>
          <p className="text-xs text-red-600">Declined — please reupload</p>
        </div>
        <button
          type="button"
          onClick={() => onSelect(slotId)}
          className="px-3 py-1 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex-shrink-0 inline-flex items-center gap-1"
        >
          <RotateCcw size={12} />
          Reupload
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 border-2 border-dashed border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
      <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
        {camera
          ? <Camera size={13} className="text-gray-400" />
          : <Upload size={13} className="text-gray-400" />}
      </div>
      <div className="flex-1 min-w-0">
        {file ? (
          <>
            <p className="text-xs font-medium text-gray-700 truncate">{file.name}</p>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              {formatFileSize(file.size)}
              {ocrBusy && (
                <span className="inline-flex items-center gap-1 text-blue-600">
                  <Loader2 size={10} className="animate-spin" />
                  Extracting fields…
                </span>
              )}
            </p>
          </>
        ) : (
          <>
            <p className="text-xs font-medium text-gray-600">
              {label}
              {required && <span className="ml-1 text-red-500">*</span>}
            </p>
            <p className="text-xs text-gray-400">
              {cameraOnly
                ? 'Live camera capture with liveness check — no uploads'
                : camera
                  ? 'JPG or PNG — take a photo or upload'
                  : 'PDF, JPG, PNG — max 10 MB'}
            </p>
          </>
        )}
      </div>
      {file ? (
        <button type="button" onClick={() => onRemove(slotId)} className="text-gray-400 hover:text-red-500 transition-colors">
          <X size={15} />
        </button>
      ) : (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {camera && (
            <button
              type="button"
              onClick={() => onCapture(slotId)}
              className="px-3 py-1 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-black transition-colors inline-flex items-center gap-1"
            >
              <Camera size={12} />
              Take Photo
            </button>
          )}
          {!cameraOnly && (
            <button
              type="button"
              onClick={() => onSelect(slotId)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                camera
                  ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  : 'bg-gray-900 text-white hover:bg-black'
              }`}
            >
              {camera ? 'Upload' : 'Browse'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────
export default function UploadDocumentPage() {
  const navigate  = useNavigate();
  const fileRef   = useRef(null);
  const { user, updateUser } = useAuth();

  const [form, setForm]           = useState(() => loadData());
  const [saved, setSaved]         = useState(false);
  const [saving, setSaving]       = useState(false);
  const [files, setFiles]         = useState({});
  const [uploaded, setUploaded]   = useState({});
  const [serverDocs, setServerDocs] = useState({}); // slotId -> { status }
  const [activeSlot, setActiveSlot] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [ocrBusy, setOcrBusy]     = useState({});     // slotId -> bool (during upload)
  const [cameraSlot, setCameraSlot] = useState(null); // slotId currently using camera modal

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  // Hydrate from server — firstName/lastName from User, phone from User,
  // everything else from UserPersonalDetails. Server wins over localStorage.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/users/personal-details');
        const pd = data?.personalDetails || {};
        setForm(prev => {
          const next = { ...prev };
          if (user?.firstName) next.givenName  = user.firstName;
          if (user?.lastName)  next.familyName = user.lastName;
          // Phone from signup auto-populates the Personal Details section.
          // We still allow the form/localStorage value to override if present.
          if (user?.phone && !next.phone) next.phone = user.phone;
          for (const k of PERSONAL_DETAILS_FIELDS) {
            if (pd[k] != null && pd[k] !== '') next[k] = pd[k];
          }
          next.sameAsPermanent = !!next.permanentAddress && next.permanentAddress === next.temporaryAddress;
          return next;
        });
      } catch {
        /* non-fatal — fall back to localStorage */
      }
      if (!cancelled) { /* no-op, kept for future side effects */ }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Date-of-birth BS↔AD auto-sync ─────────────────────────
  // When the user enters a complete dd/mm/yyyy in one field, auto-populate
  // the other via the Nepali calendar converter. Only triggers for fully
  // valid dates so users can still type freely.
  const setAdDob = (v) => {
    setForm(prev => {
      const next = { ...prev, dateOfBirthAD: v };
      const converted = adToBs(v);
      if (converted) next.dobBS = converted;
      return next;
    });
  };
  const setBsDob = (v) => {
    setForm(prev => {
      const next = { ...prev, dobBS: v };
      const converted = bsToAd(v);
      if (converted) next.dateOfBirthAD = converted;
      return next;
    });
  };

  // Fetch server-side documents to surface verified / pending / declined status per slot.
  const refreshServerDocs = async () => {
    try {
      const r = await api.get('/documents');
      const list = r.data?.documents || r.data || [];
      const labelToSlot = Object.fromEntries(DOC_SLOTS.map(s => [s.label, s.id]));
      const map = {};
      for (const d of list) {
        // Match primarily by the documentLabel we sent at upload; fall back to documentType.
        const slotId = labelToSlot[d.documentLabel] || d.documentType;
        if (!slotId || !DOC_SLOTS.some(s => s.id === slotId)) continue;
        const existing = map[slotId];
        // Prefer the most recent record per slot
        if (!existing || new Date(d.uploadedAt || 0) > new Date(existing.uploadedAt || 0)) {
          map[slotId] = { status: d.verificationStatus, uploadedAt: d.uploadedAt, id: d.id };
        }
      }
      setServerDocs(map);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => { refreshServerDocs(); }, []);

  // ── Save personal info ──
  const persistToServer = async () => {
    const firstName = (form.givenName || '').trim();
    const lastName  = (form.familyName || '').trim();
    if (!firstName) {
      toast.error('Given name is required');
      return false;
    }

    const effectiveTempAddress = form.sameAsPermanent ? form.permanentAddress : form.temporaryAddress;
    const payload = {};
    for (const k of PERSONAL_DETAILS_FIELDS) {
      payload[k] = k === 'temporaryAddress' ? (effectiveTempAddress ?? '') : (form[k] ?? '');
    }

    const profileRes = await api.put('/users/profile', { firstName, lastName });
    updateUser(profileRes.data?.user || { firstName, lastName });
    await api.put('/users/personal-details', payload);
    return true;
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const ok = await persistToServer();
      if (!ok) return;
      saveData(form); // keep localStorage snapshot for other pages
      setSaved(true);
      toast.success('Information saved!');
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not save information');
    } finally {
      setSaving(false);
    }
  };

  // ── File handling ──
  const handleSelectFile = (slotId) => {
    setActiveSlot(slotId);
    if (fileRef.current) {
      fileRef.current.value = '';
      const slot = DOC_SLOTS.find(s => s.id === slotId);
      fileRef.current.accept = slot?.imageOnly ? 'image/*' : ACCEPTED;
      fileRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { toast.error('File must be under 10 MB'); return; }
    const slot = DOC_SLOTS.find(s => s.id === activeSlot);
    if (slot?.imageOnly && !f.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    setFiles(prev => ({ ...prev, [activeSlot]: f }));
  };

  // Camera-capture flow: open webcam modal, then drop the resulting File into
  // the same `files` map used by the regular upload button.
  const handleOpenCamera  = (slotId) => setCameraSlot(slotId);
  const handleCloseCamera = () => setCameraSlot(null);
  const handlePhotoCaptured = (file) => {
    if (!cameraSlot) return;
    setFiles(prev => ({ ...prev, [cameraSlot]: file }));
  };

  const removeFile = (slotId) =>
    setFiles(prev => { const n = { ...prev }; delete n[slotId]; return n; });

  // Merge OCR fields into the form without overwriting anything the user typed.
  // Returns how many empty fields were filled in.
  const mergeOcrFields = (fields) => {
    const keys = Object.keys(fields || {}).filter(k => fields[k] != null && fields[k] !== '');
    if (!keys.length) return 0;
    let filled = 0;
    setForm(prev => {
      const next = { ...prev };
      filled = 0;
      for (const k of keys) {
        if (!next[k] || String(next[k]).trim() === '') {
          next[k] = fields[k];
          filled += 1;
        }
      }
      return next;
    });
    return filled;
  };

  // Treat the photo as satisfied if it already exists on the server (any status)
  // or if the user has a freshly-selected file waiting to go up.
  const photoProvided =
    !!files.user_photo || !!uploaded.user_photo || !!serverDocs.user_photo;

  const handleUploadAll = async () => {
    const pending = DOC_SLOTS.filter(s => files[s.id] && !uploaded[s.id]);
    if (!pending.length) { toast.error('No files selected to upload'); return; }
    if (!photoProvided) {
      toast.error('Please take or upload your photo before submitting');
      return;
    }
    saveData(form);
    try { await persistToServer(); } catch { /* non-fatal — upload still proceeds */ }
    setUploading(true);
    let totalFilled = 0;
    let anyScanned = false;
    try {
      for (const slot of pending) {
        const file = files[slot.id];
        const fd = new FormData();
        fd.append('file', file);
        fd.append('documentType', slot.id);
        fd.append('documentLabel', slot.label);

        // Flag the slot as OCR-busy so the row shows a scanning indicator.
        const isImage = file.type.startsWith('image/');
        if (isImage) setOcrBusy(prev => ({ ...prev, [slot.id]: true }));

        const r = await api.post('/documents/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        setUploaded(prev => ({ ...prev, [slot.id]: true }));
        if (isImage) setOcrBusy(prev => { const n = { ...prev }; delete n[slot.id]; return n; });

        if (isImage && r.data?.ocrFields) {
          anyScanned = true;
          totalFilled += mergeOcrFields(r.data.ocrFields);
        }
      }
      const base = `${pending.length} file${pending.length > 1 ? 's' : ''} uploaded`;
      if (totalFilled > 0) {
        toast.success(`${base} — auto-filled ${totalFilled} field${totalFilled > 1 ? 's' : ''}. Review and save below.`);
      } else if (anyScanned) {
        toast.success(`${base}. Couldn't read any new fields — please type them below.`);
      } else {
        toast.success(`${base}!`);
      }
      refreshServerDocs();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      setOcrBusy({});
    }
  };

  const pendingCount = DOC_SLOTS.filter(s => files[s.id] && !uploaded[s.id]).length;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Upload Documents</h1>

      <input ref={fileRef} type="file" accept={ACCEPTED} className="hidden" onChange={handleFileChange} />

      <PhotoCaptureModal
        open={!!cameraSlot}
        onClose={handleCloseCamera}
        onCapture={handlePhotoCaptured}
      />

      {/* ── OCR info banner ── */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100 text-blue-800">
        <Sparkles size={15} className="flex-shrink-0 mt-0.5" />
        <p className="text-xs leading-relaxed">
          A live photo of yourself is required alongside your documents. Use
          <b> Take Photo</b> to capture one with your camera — position your
          face inside the oval and hold still for a moment while we confirm
          the face. Uploaded images aren't accepted for this field. After
          upload we'll scan any photo documents and auto-fill the fields below
          — always review and retype any wrong values before clicking
          <b> Save Information</b>.
        </p>
      </div>

      {/* ── File uploads (shown first) ── */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-800">Upload Files</h2>
          <span className="text-xs text-gray-400">PDF, JPG, PNG — max 10 MB each</span>
        </div>
        <div className="p-5 space-y-2">
          {DOC_SLOTS.map(slot => (
            <FileSlot
              key={slot.id}
              slotId={slot.id}
              label={slot.label}
              file={files[slot.id]}
              uploaded={!!uploaded[slot.id]}
              serverStatus={serverDocs[slot.id]?.status}
              ocrBusy={!!ocrBusy[slot.id]}
              camera={!!slot.camera}
              cameraOnly={!!slot.cameraOnly}
              required={!!slot.required}
              onSelect={handleSelectFile}
              onCapture={handleOpenCamera}
              onRemove={removeFile}
            />
          ))}
        </div>
        <div className="px-5 pb-5 flex items-center gap-3">
          <button
            type="button"
            onClick={handleUploadAll}
            disabled={uploading || pendingCount === 0}
            className="btn-primary px-6"
          >
            {uploading
              ? <><Loader2 size={14} className="animate-spin" />Uploading...</>
              : `Upload${pendingCount > 0 ? ` (${pendingCount})` : ''}`}
          </button>
          <button
            type="button"
            onClick={() => navigate('/documents')}
            className="btn-secondary px-6"
          >
            View My Documents
          </button>
        </div>
      </div>

      {/* ── 1. Personal Details ── */}
      <SectionCard icon={User} title="Personal Details">
        <Field label="Given Name">
          <Input placeholder="Given name" value={form.givenName} onChange={v => set('givenName', v)} />
        </Field>
        <Field label="Family Name">
          <Input placeholder="Family name" value={form.familyName} onChange={v => set('familyName', v)} />
        </Field>
        <Field label="Gender">
          <Select
            value={form.gender}
            onChange={v => set('gender', v)}
            options={[
              { value: 'Male',   label: 'Male' },
              { value: 'Female', label: 'Female' },
              { value: 'Other',  label: 'Other' },
            ]}
          />
        </Field>
        <Field label="Date of Birth (AD)">
          <DateInput value={form.dateOfBirthAD} onChange={setAdDob} />
        </Field>
        <Field label="Date of Birth (BS)">
          <DateInput value={form.dobBS} onChange={setBsDob} />
        </Field>
        <Field label="Phone Number">
          <Input type="tel" placeholder="+977 98XXXXXXXX" value={form.phone} onChange={v => set('phone', v)} />
        </Field>
        <Field label="Blood Group">
          <Select
            value={form.bloodGroup}
            onChange={v => set('bloodGroup', v)}
            options={[
              { value: 'A+',  label: 'A+' },  { value: 'A-',  label: 'A-' },
              { value: 'B+',  label: 'B+' },  { value: 'B-',  label: 'B-' },
              { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' },
              { value: 'O+',  label: 'O+' },  { value: 'O-',  label: 'O-' },
            ]}
          />
        </Field>
      </SectionCard>

      {/* ── 2. Address ── */}
      <SectionCard icon={MapPin} title="Address">
        <Field label="Birth Address" span2>
          <Input placeholder="City / district of birth" value={form.birthAddress} onChange={v => set('birthAddress', v)} />
        </Field>
        <Field label="Permanent Address" span2>
          <Input placeholder="Permanent address" value={form.permanentAddress} onChange={v => set('permanentAddress', v)} />
        </Field>

        {/* Same as permanent toggle */}
        <div className="col-span-2 flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => set('sameAsPermanent', !form.sameAsPermanent)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
              form.sameAsPermanent ? 'bg-gray-900' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                form.sameAsPermanent ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </button>
          <span className="text-sm text-gray-600">Temporary address same as permanent</span>
        </div>

        {!form.sameAsPermanent && (
          <Field label="Temporary Address" span2>
            <Input
              placeholder="Temporary / current address"
              value={form.temporaryAddress}
              onChange={v => set('temporaryAddress', v)}
            />
          </Field>
        )}
      </SectionCard>

      {/* ── 3. Citizenship Details ── */}
      <SectionCard icon={Shield} title="Citizenship Details">
        <Field label="Citizenship Number" span2>
          <Input placeholder="e.g. 66-01-70-02479" value={form.citizenshipNumber} onChange={v => set('citizenshipNumber', v)} />
        </Field>
        <Field label="Citizenship Type">
          <Select
            value={form.citizenshipType}
            onChange={v => set('citizenshipType', v)}
            options={[
              { value: 'By Descent', label: 'By Descent' },
              { value: 'By Birth',   label: 'By Birth' },
            ]}
          />
        </Field>
        <Field label="Issuing District">
          <Input placeholder="District" value={form.citizenshipIssuingDistrict} onChange={v => set('citizenshipIssuingDistrict', v)} />
        </Field>
        <Field label="Issue Date (BS)">
          <DateInput value={form.citizenshipIssueDate} onChange={v => set('citizenshipIssueDate', v)} />
        </Field>
        <Field label="Issuing Officer" span2>
          <Input placeholder="Name of issuing officer" value={form.citizenshipIssuingOfficer} onChange={v => set('citizenshipIssuingOfficer', v)} />
        </Field>
      </SectionCard>

      {/* ── 4. Passport ── */}
      <SectionCard icon={BookOpen} title="Passport">
        <Field label="Passport Number">
          <Input placeholder="e.g. PA1234567" value={form.passportNumber} onChange={v => set('passportNumber', v)} />
        </Field>
        <Field label="Nationality">
          <Input placeholder="Nepali" value={form.nationality} onChange={v => set('nationality', v)} />
        </Field>
        <Field label="Issue Date">
          <DateInput value={form.passportIssueDate} onChange={v => set('passportIssueDate', v)} />
        </Field>
        <Field label="Expiry Date">
          <DateInput value={form.passportExpiryDate} onChange={v => set('passportExpiryDate', v)} />
        </Field>
      </SectionCard>

      {/* ── 5. National ID ── */}
      <SectionCard icon={CreditCard} title="National ID">
        <Field label="National Identity Number" span2>
          <Input placeholder="e.g. 12345678901234" value={form.nin} onChange={v => set('nin', v)} />
        </Field>
      </SectionCard>

      {/* ── 6. Driver's License ── */}
      <SectionCard icon={Car} title="Driver's License">
        <Field label="License Number">
          <Input placeholder="e.g. 12-01-0-098765" value={form.dlLicenseNumber} onChange={v => set('dlLicenseNumber', v)} />
        </Field>
        <Field label="Category">
          <Input placeholder="e.g. A, B, C" value={form.dlCategory} onChange={v => set('dlCategory', v)} />
        </Field>
        <Field label="Date of Issue">
          <DateInput value={form.dlIssueDate} onChange={v => set('dlIssueDate', v)} />
        </Field>
        <Field label="Date of Expiry">
          <DateInput value={form.dlExpiryDate} onChange={v => set('dlExpiryDate', v)} />
        </Field>
        <Field label="License Office" span2>
          <Input placeholder="e.g. DoTM, Ekantakuna" value={form.dlLicenseOffice} onChange={v => set('dlLicenseOffice', v)} />
        </Field>
      </SectionCard>

      {/* ── 7. PAN Card ── */}
      <SectionCard icon={Receipt} title="PAN Card">
        <Field label="PAN Number">
          <Input placeholder="9-digit PAN number" value={form.panNumber} onChange={v => set('panNumber', v)} />
        </Field>
        <Field label="Registered Office">
          <Input placeholder="e.g. IRD, Lazimpat" value={form.panRegisteredOffice} onChange={v => set('panRegisteredOffice', v)} />
        </Field>
      </SectionCard>

      {/* ── Save button ── */}
      <div className="flex justify-end">
        <button type="button" onClick={handleSave} disabled={saving} className="btn-primary px-7">
          {saving
            ? <><Loader2 size={14} className="animate-spin" />Saving...</>
            : saved
              ? <><CheckCircle size={14} />Saved!</>
              : 'Save Information'}
        </button>
      </div>

      <div className="text-center py-4">
        <LockboxLogo variant="wordmark-dark" height={20} className="opacity-20 mx-auto" />
        <div className="flex justify-center gap-4 mt-2 text-xs text-gray-400">
          <span>Terms</span><span>·</span><span>Privacy</span><span>·</span><span>Docs</span><span>·</span><span>Help</span>
        </div>
      </div>
    </div>
  );
}
