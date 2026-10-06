const express = require("express");

const controller = require("./pagoCliente.controller");

const router = express.Router();

// =====================================================
// PAGOS DEL CLIENTE AUTENTICADO
// =====================================================

router.get("/", controller.getPagosCliente);
router.get('/:id', controller.getPagoClienteById)

module.exports = router;
