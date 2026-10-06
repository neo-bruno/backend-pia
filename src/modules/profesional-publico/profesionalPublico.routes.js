const express = require("express");
const controller = require("./profesionalPublico.controller");

const upload = require("../../middlewares/profesional.upload");
const router = express.Router();

router.get('/todos', controller.getProfessionals)
router.get("/verificar-codigo/:codigo", controller.getVerificationCode);
router.get('/buscar/slug/:slug', controller.getProfessionalBySlug)

router.post("/", upload.single("comprobante"), controller.saveProfessional);

module.exports = router;
