const express = require("express");
const controller = require("./gerencia.controller");

const router = express.Router();

router.get("/", controller.getManagement);

module.exports = router;
