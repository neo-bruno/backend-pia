const express = require("express");
const controller = require("./reservaPublico.controller");
const upload = require("../../middlewares/comprobante.upload");

const router = express.Router();

// CREAR / CONFIRMAR RESERVA
router.post("/", upload.single("comprobante"), controller.confirmReservation);

// RESERVAS PRÓXIMAS DEL CLIENTE
router.get("/", controller.getReservations);

// HISTORIAL DE RESERVAS
router.get("/historial", controller.getReservationHistory);

// CANCELAR RESERVA
router.patch("/:id/cancelar", controller.cancelReservation);

// DETALLE DE UNA RESERVA
router.get("/:id", controller.getReservationById);

module.exports = router;
