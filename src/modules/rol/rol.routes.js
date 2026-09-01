const express = require("express");
const controller = require("./rol.controller");

const router = express.Router();

router.get("/", controller.listar);
router.get("/:id", controller.buscarPorId);

module.exports = router;
