const multer = require('multer');
const path = require('path');
const fs = require('fs');

const AVATAR_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const AVATAR_MAX = 5 * 1024 * 1024; // 5MB

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
    const ext = path.extname(file.originalname);
    const unique = `${req.user.id}-${Date.now()}${ext}`;
    cb(null, unique);
  },
});

const fileFilter = (req, file, cb) => {
  if (AVATAR_MIME.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Avatar must be an image (JPG, PNG, WebP, GIF).'), false);
};

const uploadAvatar = multer({ storage, fileFilter, limits: { fileSize: AVATAR_MAX } });

module.exports = { uploadAvatar };
