const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { upload } = require('../middleware/upload.middleware');
const {
  uploadDocument,
  getMyDocuments,
  getDocumentById,
  deleteDocument,
  downloadDocument,
} = require('../controllers/document.controller');
const { runOcr } = require('../controllers/ocr.controller');

router.use(authenticate);

router.get('/', getMyDocuments);
router.post('/upload', upload.single('file'), uploadDocument);
router.post('/ocr', upload.single('file'), runOcr);
router.get('/:id', getDocumentById);
router.delete('/:id', deleteDocument);
router.get('/:id/download', downloadDocument);

module.exports = router;
