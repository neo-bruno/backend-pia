const express = require("express");
const controller = require("./negocio.controller");
const upload = require("../../middlewares/negocio.upload");

const router = express.Router();

router.get("/", controller.getBusiness);
router.post('/', upload.single('comprobante'), controller.saveBusinessProfession);

module.exports = router;
