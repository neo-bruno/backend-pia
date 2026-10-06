const express = require("express");
const controller = require("./cliente.controller");

const {
  validarAutenticarCliente,
  validarLoginRegisterCliente,
  validarBuscarCliente,
} = require("./cliente.validation");

const router = express.Router();

// =====================================================
// PERFIL CLIENTE AUTENTICADO
// IMPORTANTE: debe ir antes de /:telefono
// =====================================================

router.get("/perfil", controller.getPerfil);

// =====================================================
// EDITAR PERFIL CLIENTE
// =====================================================

router.put("/perfil", controller.actualizarPerfil);

// =====================================================
// AUTENTICAR CLIENTE
// =====================================================

router.post("/", validarAutenticarCliente, controller.autenticarCliente);

// =====================================================
// BUSCAR CLIENTE POR TELÉFONO
// =====================================================

router.get("/:telefono", controller.findClientByPhone);

// =====================================================
// LOGIN / REGISTRO CLIENTE
// =====================================================

router.post(
  "/login/register",
  validarLoginRegisterCliente,
  controller.loginRegisterClient,
);

module.exports = router;
