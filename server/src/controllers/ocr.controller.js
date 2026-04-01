const fs = require('fs');
const { runOcrOnFile } = require('../utils/ocr');
const { parseByDocType } = require('../utils/ocrParsers');

// Standalone OCR endpoint — kept for debugging / manual re-OCR.
// The main upload route (/documents/upload) already returns ocrFields inline.
const runOcr = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { documentType } = req.body || {};
    if (!documentType) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'documentType is required' });
    }

    if (!req.file.mimetype.startsWith('image/')) {
      fs.unlinkSync(req.file.path);
      return res.json({
        fields: {},
        text: '',
        skipped: true,
        reason: 'OCR only supported for image uploads (JPG, PNG, WebP).',
      });
    }

    const text = await runOcrOnFile(req.file.path);
    const fields = parseByDocType(documentType, text);

    try { fs.unlinkSync(req.file.path); } catch { /* ignore */ }

    res.json({ fields, text });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch { /* ignore */ }
    }
    next(err);
  }
};

module.exports = { runOcr };
