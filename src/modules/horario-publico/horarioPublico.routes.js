const express = require("express");

const controller = require("./horarioPublico.controller");
const { validarHorarioPublico } = require("./horarioPublico.validation");

const router = express.Router();

router.get("/:profesionalId", validarHorarioPublico, controller.getAvailableSchedule);
router.get("/:profesionalId/:servicioId", validarHorarioPublico, controller.getAvailableSchedule);

module.exports = router;
