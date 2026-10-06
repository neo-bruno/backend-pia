const express = require("express");
const controller = require("./reservaPublico.controller");
const upload = require("../../middlewares/comprobante.upload");

const router = express.Router();

// =====================================================
// CREAR / CONFIRMAR RESERVA
// =====================================================

router.post("/", upload.single("comprobante"), controller.confirmReservation);

// =====================================================
// RESERVAS DEL CLIENTE
// =====================================================

router.get("/", controller.getReservations);

// =====================================================
// DETALLE DE UNA RESERVA
// =====================================================

router.get("/:id", controller.getReservationById);

module.exports = router;
