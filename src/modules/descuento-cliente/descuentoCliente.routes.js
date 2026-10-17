const express = require("express");
const controller = require("./descuentoCliente.controller");

const router = express.Router();

// GET /api/descuento-cliente/mis-descuentos
router.get("/mis-descuentos", controller.getMisDescuentos);

// GET /api/descuento-cliente/profesional/:profesionalId
router.get("/profesional/:profesionalId", controller.getDescuentosDelProfesional,);

// GET /api/descuento-cliente/servicio/:servicioId/disponibilidad
router.get("/servicio/:servicioId/disponibilidad", controller.verificarDescuentosPorServicio,);

// POST /api/descuento-cliente/validar-codigo
router.post("/validar-codigo", controller.validarCodigoDescuento);

module.exports = router;
