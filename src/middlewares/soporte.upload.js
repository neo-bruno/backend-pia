const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../../uploads/soporte");

console.log("🔥 SOPORTE UPLOAD CARGADO:", __filename);

// Crear carpeta si no existe
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, {
		recursive: true,
	});
}

// ============================================================
// ALMACENAMIENTO
// ============================================================

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, uploadDir);
	},

	filename: (req, file, cb) => {
		const extension = path.extname(file.originalname).toLowerCase();

		const nombre = path
			.basename(file.originalname, path.extname(file.originalname))
			.replace(/[^a-zA-Z0-9-_]/g, "_");

		cb(null, `${Date.now()}-${nombre}${extension}`);
	},
});

// ============================================================
// VALIDACIÓN DE ARCHIVOS
// ============================================================

const fileFilter = (req, file, cb) => {
	const tiposPermitidos = [
		"image/jpeg",
		"image/png",
		"image/webp",
		"application/pdf",
	];

	if (tiposPermitidos.includes(file.mimetype)) {
		cb(null, true);
	} else {
		cb(
			new Error(
				"Tipo de archivo no permitido. Solo se aceptan JPG, PNG, WEBP o PDF.",
			),
			false,
		);
	}
};

// ============================================================
// CONFIGURACIÓN MULTER
// ============================================================

const upload = multer({
	storage,
	fileFilter,
	limits: {
		fileSize: 5 * 1024 * 1024,
		files: 5,
	},
});

module.exports = upload;
