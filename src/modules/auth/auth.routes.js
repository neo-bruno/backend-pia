const express = require("express");

const controller = require("./auth.controller");
const { validarLogin } = require("./auth.validation");
const { validate } = require("../../middlewares/validation.middleware");

const router = express.Router();

router.post("/login", validate(validarLogin), controller.login);

module.exports = router;
