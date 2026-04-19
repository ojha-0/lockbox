const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Org logos are uploaded alongside regular avatars under /uploads/avatars.
// They're written before we know the User id (created in the same request),
// so the filename has to stand alone without a user id prefix.
const LOGO_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
const LOGO_MAX = 5 * 1024 * 1024; // 5MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(
      __dirname,
      '..',
      '..',
      process.env.UPLOAD_DIR || 'uploads',
      'avatars'
    );
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    const unique = `org-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});

const fileFilter = (req, file, cb) => {
  if (LOGO_MIME.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Logo must be an image (JPG, PNG, WebP, GIF, SVG).'), false);
};

const uploadOrgLogo = multer({ storage, fileFilter, limits: { fileSize: LOGO_MAX } });

module.exports = { uploadOrgLogo };
