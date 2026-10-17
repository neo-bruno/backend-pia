const express = require("express");
const router = express.Router();

const controller = require("./segmentacion.controller");
const validation = require("./segmentacion.validation");

const { verifyToken } = require("../../middlewares/auth.middleware");
const { allowRoles } = require("../../middlewares/role.middleware");

router.get("/", verifyToken, allowRoles("ADMIN"), controller.getSegmentacion);
router.get("/cliente/:clienteId", verifyToken, allowRoles("ADMIN"), validation.validarClienteId, controller.getSegmentacionCliente);
router.get("/cliente/:clienteId/historial", verifyToken, allowRoles("ADMIN"), validation.validarClienteId, controller.getHistorialSegmentacionCliente);

module.exports = router;
