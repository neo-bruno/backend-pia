const express = require("express");
const router = express.Router();
const controller = require("./clienteAdmin.controller");

const { verifyToken } = require("../../middlewares/auth.middleware");
const { allowRoles } = require("../../middlewares/role.middleware");

// LISTA DE CLIENTES
router.get("/", verifyToken, allowRoles("ADMIN"), controller.getClientes);

// HISTORIAL DEL CLIENTE
router.get("/:clienteId/historial", verifyToken, allowRoles("ADMIN"), controller.getHistorialCliente);

// SEGMENTACIÓN DEL CLIENTE
router.get("/:clienteId/segmentacion", verifyToken, allowRoles("ADMIN"), controller.getSegmentacionCliente);

// PROMOCIONES ASIGNADAS
router.get("/:clienteId/promociones", verifyToken, allowRoles("ADMIN"), controller.getPromocionesCliente);

// DESCUENTOS ASIGNADOS
router.get("/:clienteId/descuentos", verifyToken, allowRoles("ADMIN"), controller.getDescuentosCliente);

module.exports = router;
