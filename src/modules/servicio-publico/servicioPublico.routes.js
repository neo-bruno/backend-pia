const express = require("express");

const controller = require("./servicioPublico.controller");
const { validarServicioId, validarProfesionalId } = require("./servicioPublico.validation");

const router = express.Router();

router.get("/:servicioId", validarServicioId, controller.getServicesById);
router.get('/profesional/:profesionalId', validarProfesionalId, controller.getServicesByProfessionalId)

module.exports = router;
