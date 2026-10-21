const express = require("express");
const controller = require("./historial.controller");

const { verifyToken } = require("../../middlewares/auth.middleware");
const { allowRoles } = require("../../middlewares/role.middleware");

const router = express.Router();

// Historial del cliente móvil.
router.get("/cliente", controller.obtenerHistorialCliente);

// Historial del profesional autenticado.
router.get("/profesional", verifyToken, allowRoles("ADMIN", "SUPERADMIN"), controller.obtenerHistorialProfesional);

module.exports = router;
