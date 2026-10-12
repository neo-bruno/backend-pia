const express = require("express");

const router = express.Router();

const controller = require("./comprobanteAdmin.controller");
const { validarCambioEstadoComprobante, } = require("./comprobanteAdmin.validation");

const { verifyToken } = require("../../middlewares/auth.middleware");

const { allowRoles } = require("../../middlewares/role.middleware");

// ============================================================
// OBTENER COMPROBANTE
// ============================================================
router.get("/:id", verifyToken, allowRoles("ADMIN"), controller.getComprobante);

// ============================================================
// CAMBIAR ESTADO
// ============================================================
router.patch("/:id/estado", verifyToken, allowRoles("ADMIN"), validarCambioEstadoComprobante, controller.cambiarEstado);

module.exports = router;
