const express = require("express");
const router = express.Router();

const controller = require("./descuentoServicio.controller");

const { verifyToken } = require("../../middlewares/auth.middleware");
const { allowRoles } = require("../../middlewares/role.middleware");

router.use(verifyToken);
router.use(allowRoles("ADMIN"));

// Listar servicios y su asociación con un descuento.
router.get("/:descuentoId/servicios", controller.listarServiciosPorDescuento);

// Sincronizar asociaciones seleccionadas.
router.put("/:descuentoId/servicios", controller.guardarAsociaciones);

module.exports = router;
