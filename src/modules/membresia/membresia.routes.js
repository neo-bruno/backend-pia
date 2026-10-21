const express = require("express");
const router = express.Router();

const controller = require("./membresia.controller");
const { verifyToken } = require("../../middlewares/auth.middleware");
const { allowRoles } = require("../../middlewares/role.middleware");
const upload = require("../../middlewares/comprobante.upload");

// Todas las rutas requieren sesión de profesional ADMIN.
router.use(verifyToken, allowRoles("ADMIN"));

// Consultas.
router.get("/mis-membresias", controller.getMisMembresias);
router.get("/qr-gerencia", controller.getQrGerenciaMembresia);

// El envío del comprobante inicia la renovación.
// :id es la membresía de origen, NO el ID del pago.
router.post(
	"/:id/comprobante-renovacion",
	upload.single("comprobante"),
	controller.enviarComprobanteRenovacion,
);

module.exports = router;
