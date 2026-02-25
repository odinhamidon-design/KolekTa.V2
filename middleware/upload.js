/**
 * upload.js — Multer disk storage middleware
 *
 * Saves uploaded files to public/uploads/<category>/ and returns
 * the relative URL path (/uploads/<category>/<filename>) for storage
 * in the database. This replaces the old approach of base64-encoding
 * files and embedding them directly in MongoDB documents.
 *
 * Usage:
 *   const { complaintUpload } = require('../middleware/upload');
 *   router.post('/submit', complaintUpload.array('photos', 3), ...);
 *   // req.files[i].path  → absolute path on disk
 *   // req.files[i].webPath → '/uploads/complaints/<filename>' (stored in DB)
 */

const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

/**
 * Build a multer instance that saves to `public/uploads/<category>/`
 * and attaches a `webPath` property to each file for convenient DB storage.
 */
function makeUploader(category) {
    let dest = path.join(__dirname, '..', 'public', 'uploads', category);

    // Ensure directory exists at module load time (and on cold starts)
    try {
        fs.mkdirSync(dest, { recursive: true });
    } catch (err) {
        console.warn(`Could not create upload dir for ${category} (expected on Vercel/read-only environments)`);
        if (process.env.VERCEL) {
            dest = path.join('/tmp', 'uploads', category);
            try { fs.mkdirSync(dest, { recursive: true }); } catch (e) { }
        }
    }

    const storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, dest),
        filename: (req, file, cb) => {
            const unique = crypto.randomBytes(8).toString('hex');
            const ext = path.extname(file.originalname).toLowerCase();
            cb(null, `${Date.now()}-${unique}${ext}`);
        }
    });

    const upload = multer({
        storage,
        limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
        fileFilter: (req, file, cb) => {
            const allowed = /jpeg|jpg|png|gif|webp/;
            if (allowed.test(file.mimetype) && allowed.test(path.extname(file.originalname).toLowerCase().slice(1))) {
                cb(null, true);
            } else {
                cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed'));
            }
        }
    });

    // Patch: attach webPath after multer processes the file so routes can
    // simply read `file.webPath` instead of reconstructing the URL manually.
    function patchWebPaths(req, res, next) {
        if (req.files) {
            for (const file of req.files) {
                file.webPath = `/uploads/${category}/${file.filename}`;
            }
        }
        if (req.file) {
            req.file.webPath = `/uploads/${category}/${req.file.filename}`;
        }
        next();
    }

    return {
        /** Upload multiple files (up to maxCount) */
        array: (fieldName, maxCount) => [upload.array(fieldName, maxCount), patchWebPaths],
        /** Upload a single file */
        single: (fieldName) => [upload.single(fieldName), patchWebPaths]
    };
}

// Pre-built uploaders for each feature area
const complaintUpload = makeUploader('complaints');

module.exports = { complaintUpload, makeUploader };
