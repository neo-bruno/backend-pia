const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../../uploads/negocios");

if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true });
}

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

const MIME_PERMITIDOS = [
	"image/jpeg",
	"image/png",
	"image/webp",
	"video/mp4",
	"video/webm",
	"video/quicktime",
];

const fileFilter = (req, file, cb) => {
	if (MIME_PERMITIDOS.includes(file.mimetype)) {
		return cb(null, true);
	}

	cb(
		new Error(
			"Tipo de archivo no permitido. Solo se aceptan JPG, PNG, WEBP, MP4, WEBM o MOV.",
		),
		false,
	);
};

const upload = multer({
	storage,
	fileFilter,
	limits: {
		fileSize: 20 * 1024 * 1024,
		files: 5,
	},
});

module.exports = upload;
