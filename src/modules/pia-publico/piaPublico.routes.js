const express = require("express");
const router = express.Router();

const controller = require("./piaPublico.controller");
const validation = require("./piaPublico.validation");

// ==========================================
// BÚSQUEDAS PÚBLICAS
// ==========================================
router.get("/busqueda/negocios", validation.validarConsultaNegocios, controller.buscarNegocios);

router.get("/busqueda/servicios", validation.validarConsultaServicios, controller.buscarServicios);

// Listado público de negocios con filtros
router.get("/negocios", validation.validarConsultaNegocios, controller.getNegocios);

// Servicios con descuentos públicos vigentes para el banner
router.get("/servicios/descuentos", controller.getServiciosConDescuentoPublico);

// Listado público de servicios
router.get("/servicios", validation.validarConsultaServicios, controller.getServicios);

module.exports = router;
