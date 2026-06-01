// server/middleware/upload.js
const multer = require("multer");
const path = require("path");

// Configurare stocare pe disc
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Folderul unde se salvează
  },
  filename: function (req, file, cb) {
    // Redenumim fișierul ca să fie unic (timestamp + extensie)
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "property-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// Filtrare fișiere (doar imagini)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Doar fișiere imagine sunt permise!"));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limita 5MB
  fileFilter: fileFilter,
});

module.exports = upload;
