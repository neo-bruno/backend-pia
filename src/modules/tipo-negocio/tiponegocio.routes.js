const express = require("express");
const controller = require("./tiponegocio.controller");

const router = express.Router();

router.get("/", controller.listar);

module.exports = router;
