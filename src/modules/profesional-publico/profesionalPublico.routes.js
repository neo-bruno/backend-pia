const express = require("express");
const controller = require("./profesionalPublico.controller");

const upload = require("../../middlewares/profesional.upload");
const router = express.Router();

// ==========================================
// BÚSQUEDAS Y LISTADOS PÚBLICOS
// ==========================================
router.get("/busqueda", controller.buscarProfessionals);
router.get("/todos", controller.getProfessionals);

// ==========================================
// CONSULTAS POR IDENTIFICADOR
// ==========================================
router.get("/verificar-codigo/:codigo", controller.getVerificationCode);
router.get("/buscar/slug/:slug", controller.getProfessionalBySlug);
router.get("/:profesionalId/resenas", controller.getResenasProfesional);

// ==========================================
// REGISTRO
// ==========================================
router.post("/", upload.single("comprobante"), controller.saveProfessional);

module.exports = router;
