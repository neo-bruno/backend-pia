const express = require("express");

const router = express.Router();

const controller = require("./pia.controller");

const {verifyToken} = require("../../middlewares/auth.middleware");

router.post("/chat", verifyToken, controller.chat);

module.exports = router;
