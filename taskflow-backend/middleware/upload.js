const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const AppError = require('../utils/AppError');
// changed
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

// Make sure the folder exists (a fresh local clone does not have it,
// and multer would fail with a 500 error on the first upload).
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Only these file types may be attached. Both the extension AND the type the
// browser reports must be on the list. .html/.js/.svg/.exe are NOT allowed,
// because they can run code if someone opens them.
const ALLOWED_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp',
  '.pdf', '.txt', '.csv',
  '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
]);

const ALLOWED_MIME_TYPES = new Set([
  'image/png', 'image/jpeg', 'image/gif', 'image/webp',
  'application/pdf', 'text/plain', 'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // Random name on disk avoids collisions and path traversal via the
    // original filename - the human-readable name is kept separately in Mongo.
    const uniqueName = crypto.randomBytes(16).toString('hex') + path.extname(file.originalname).toLowerCase();
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(new AppError('This file type is not allowed. Use images, PDF, text, CSV or Office files.', 400));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB - generous enough for screenshots/PDFs, not video files
});

module.exports = upload;
module.exports.UPLOAD_DIR = UPLOAD_DIR;
