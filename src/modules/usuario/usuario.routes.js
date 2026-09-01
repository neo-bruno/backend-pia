const express = require("express");
const controller = require("./usuario.controller");

const { verifyToken } = require("../../middlewares/auth.middleware");
const { validate } = require("../../middlewares/validation.middleware");
const { validarCrear } = require("./usuario.validation");

const router = express.Router();

router.post("/", verifyToken, validate(validarCrear), controller.crear);

module.exports = router;
