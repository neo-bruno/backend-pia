const express = require("express");
const router = express.Router();

const controller = require("./evaluacionPublico.controller");

// GET /api/evaluacion-publico/:id
router.get("/:id", controller.getEvaluacionParaCliente);

module.exports = router;
