const express = require("express");

const controller = require("./soporte.controller");

const upload = require("../../middlewares/soporte.upload");
const { verifyToken } = require("../../middlewares/auth.middleware");
const { allowRoles } = require("../../middlewares/role.middleware");

const router = express.Router();

// ============================================================
// AYUDA PUBLICA: CATEGORIAS Y PREGUNTAS
// ============================================================

router.get("/categorias", controller.getCategories);
router.get("/preguntas", controller.getQuestions);
router.get("/preguntas/:id", controller.getQuestionById);

// ============================================================
// SOPORTE: CLIENTE
// ============================================================

router.post("/tickets", upload.array("archivos", 5), controller.createTicket);
router.get("/tickets", controller.getClientTickets);
router.get("/tickets/:id", controller.getClientTicketById);
// Enviar mensaje con archivos adjuntos
router.post("/tickets/:id/mensajes", upload.array("archivos", 5), controller.createClientMessage);

// ============================================================
// SOPORTE: ADMINISTRACION
// ============================================================

router.get(
	"/admin/tickets",
	verifyToken,
	allowRoles("ADMIN", "SUPERADMIN"),
	controller.getAdminTickets,
);

router.get(
	"/admin/tickets/:id",
	verifyToken,
	allowRoles("ADMIN", "SUPERADMIN"),
	controller.getAdminTicketById,
);

router.patch(
	"/admin/tickets/:id/estado",
	verifyToken,
	allowRoles("ADMIN", "SUPERADMIN"),
	controller.updateTicketStatus,
);

router.patch(
	"/admin/tickets/:id/asignar",
	verifyToken,
	allowRoles("ADMIN", "SUPERADMIN"),
	controller.assignTicket,
);

router.post(
	"/admin/tickets/:id/mensajes",
	verifyToken,
	allowRoles("ADMIN", "SUPERADMIN"),
	controller.createAdminMessage,
);

module.exports = router;
