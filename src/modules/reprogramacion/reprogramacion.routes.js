const express = require("express");
const controller = require("./reprogramacion.controller");

const router = express.Router();

router.get("/condiciones/:reservaId", controller.getCondiciones);
router.get("/disponibilidad/:reservaId", controller.getDisponibilidad);
router.post("/", controller.confirmarReprogramacion);

module.exports = router;
