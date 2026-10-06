const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../../uploads/servicios");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);

    const nombre = path
      .basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9-_]/g, "_");

    cb(null, `${Date.now()}-${nombre}${extension}`);
  },
});

const fileFilter = (req, file, cb) => {
  const imagenesPermitidas = ["image/jpeg", "image/png", "image/webp"];

  const videosPermitidos = ["video/mp4", "video/webm", "video/quicktime"];

  if (
    imagenesPermitidas.includes(file.mimetype) ||
    videosPermitidos.includes(file.mimetype)
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Tipo de archivo no permitido. Solo se aceptan JPG, PNG, WEBP, MP4, WEBM o MOV.",
      ),
      false,
    );
  }
};

const upload = multer({
  storage,

  fileFilter,

  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

module.exports = upload;
