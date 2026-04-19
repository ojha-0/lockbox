const path = require('path');
const fs = require('fs');
const { prisma } = require('../utils/prisma');
const { logActivity } = require('../utils/activityLogger');
const { runOcrOnFile } = require('../utils/ocr');
const { parseByDocType } = require('../utils/ocrParsers');
const { fullName } = require('../utils/userShape');

// Slot-id (UI) → OCR parser key. For non-image files we skip OCR.
const OCR_DOCTYPE_MAP = {
  passport: 'passport',
  national_id: 'national_id',
  citizenship: 'citizenship',
  citizenship_front: 'citizenship',
  citizenship_back: 'citizenship',
  drivers_license: 'drivers_license',
  pan_card: 'pan_card',
};

const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { documentType, documentLabel } = req.body;

    const document = await prisma.document.create({
      data: {
        userId: req.user.id,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        filePath: req.file.path,
        documentType: documentType || null,
        documentLabel: documentLabel || null,
        verificationStatus: 'PENDING_VERIFICATION',
      },
    });

    await logActivity({
      actorUserId: req.user.id,
      targetUserId: req.user.id,
      targetDocumentId: document.id,
      action: 'DOCUMENT_UPLOAD',
      entityType: 'DOCUMENT',
      description: `${fullName(req.user.firstName, req.user.lastName)} uploaded document "${document.originalName}"`,
    });

    // Inline OCR for images. Failures are non-fatal — the upload still succeeds.
    let ocrFields = {};
    let ocrSkipped = false;
    const parserKey = OCR_DOCTYPE_MAP[documentType];
    if (parserKey && req.file.mimetype.startsWith('image/')) {
      try {
        const text = await runOcrOnFile(req.file.path);
        ocrFields = parseByDocType(parserKey, text);
      } catch {
        ocrFields = {};
      }
    } else if (parserKey) {
      ocrSkipped = true; // non-image (PDF/Word) — OCR not attempted
    }

    res.status(201).json({ document, ocrFields, ocrSkipped });
  } catch (err) {
    // Clean up file if DB write fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(err);
  }
};

const getMyDocuments = async (req, res, next) => {
  try {
    const documents = await prisma.document.findMany({
      where: { userId: req.user.id },
      orderBy: { uploadedAt: 'desc' },
    });
    res.json({ documents });
  } catch (err) {
    next(err);
  }
};

const getDocumentById = async (req, res, next) => {
  try {
    const document = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!document) return res.status(404).json({ error: 'Document not found' });
    res.json({ document });
  } catch (err) {
    next(err);
  }
};

const deleteDocument = async (req, res, next) => {
  try {
    const document = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!document) return res.status(404).json({ error: 'Document not found' });

    // Remove file from disk
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    await prisma.document.delete({ where: { id: document.id } });

    // If this was the photo currently promoted to the user's avatar, clear it
    // so we don't leave a dangling URL pointing at a deleted file.
    const avatarUrl = `/uploads/${document.fileName}`;
    if (req.user.profilePicture === avatarUrl) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { profilePicture: null },
      });
    }

    await logActivity({
      actorUserId: req.user.id,
      targetUserId: req.user.id,
      action: 'DOCUMENT_DELETE',
      entityType: 'DOCUMENT',
      description: `${fullName(req.user.firstName, req.user.lastName)} deleted document "${document.originalName}"`,
    });

    res.json({ message: 'Document deleted' });
  } catch (err) {
    next(err);
  }
};

const downloadDocument = async (req, res, next) => {
  try {
    const document = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!document) return res.status(404).json({ error: 'Document not found' });

    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    await logActivity({
      actorUserId: req.user.id,
      targetUserId: req.user.id,
      targetDocumentId: document.id,
      action: 'DOCUMENT_DOWNLOAD',
      entityType: 'DOCUMENT',
      description: `${fullName(req.user.firstName, req.user.lastName)} downloaded document "${document.originalName}"`,
    });

    res.download(document.filePath, document.originalName);
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadDocument, getMyDocuments, getDocumentById, deleteDocument, downloadDocument };
