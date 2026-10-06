const service = require("./cliente.service");

// =====================================================
// AUTENTICAR CLIENTE
// =====================================================

const autenticarCliente = async (req, res) => {
  try {
    const resultado = await service.autenticarCliente(req.body);

    return res.status(200).json({
      ok: true,
      data: resultado,
    });
  } catch (error) {
    console.error("Error al autenticar cliente:", error);

    return res.status(error.status || 500).json({
      ok: false,
      mensaje: error.message || "Error interno del servidor",
    });
  }
};

// =====================================================
// PERFIL CLIENTE AUTENTICADO
// =====================================================

const getPerfil = async (req, res) => {
  try {
    const token = req.headers["x-cliente-token"];

    if (!token) {
      return res.status(401).json({
        ok: false,
        mensaje: "Token de cliente no proporcionado",
      });
    }

    const cliente = await service.getPerfil(token);

    return res.status(200).json({
      ok: true,
      data: cliente,
    });
  } catch (error) {
    console.error("Error al obtener perfil del cliente:", error);

    return res.status(error.status || 500).json({
      ok: false,
      mensaje: error.message || "Error al obtener el perfil",
    });
  }
};

// =====================================================
// EDITAR PERFIL CLIENTE
// =====================================================

const actualizarPerfil = async (req, res) => {
  try {
    const token = req.headers["x-cliente-token"];

    if (!token) {
      return res.status(401).json({
        ok: false,
        mensaje: "Token de cliente no proporcionado",
      });
    }

    const cliente = await service.actualizarPerfil(token, req.body);

    return res.status(200).json({
      ok: true,
      mensaje: "Perfil actualizado correctamente",
      data: cliente,
    });
  } catch (error) {
    console.error("Error al actualizar perfil del cliente:", error);

    return res.status(error.status || 500).json({
      ok: false,
      mensaje: error.message || "Error al actualizar el perfil",
    });
  }
};

// =====================================================
// BUSCAR CLIENTE POR TELÉFONO
// =====================================================

const findClientByPhone = async (req, res) => {
  try {
    const { telefono } = req.params;

    console.log("TELEFONO: ", telefono);

    const cliente = await service.findClientByPhone(telefono);

    if (!cliente) {
      return res.status(200).json({
        success: true,
        existe: false,
        cliente: null,
      });
    }

    return res.status(200).json({
      success: true,
      existe: true,

      cliente: {
        id: cliente.id,
        persona_id: cliente.persona_id,
        telefono: cliente.telefono,
        nombre: cliente.nombre,
        sexo: cliente.sexo,
        fecha_nacimiento: cliente.fecha_nacimiento,
      },
    });
  } catch (error) {
    console.error("Error al buscar cliente:", error);

    return res.status(500).json({
      success: false,
      message: "Ocurrió un error al buscar el cliente.",
    });
  }
};

// =====================================================
// LOGIN / REGISTRO CLIENTE
// =====================================================

async function loginRegisterClient(req, res) {
  try {
    console.log("📥 LOGIN / REGISTRO CLIENTE:", req.body);

    const datosCliente = await service.loginRegisterClient(req.body);

    return res.status(200).json({
      ok: true,

      mensaje: datosCliente.nuevo
        ? "Cliente registrado correctamente"
        : "Cliente autenticado correctamente",

      data: datosCliente,
    });
  } catch (error) {
    console.error("❌ ERROR LOGIN/REGISTRO CLIENTE:", error);

    const status = error.status || 500;

    return res.status(status).json({
      ok: false,
      mensaje: error.message || "Error al procesar el cliente",
    });
  }
}

module.exports = {
  loginRegisterClient,
  findClientByPhone,
  autenticarCliente,
  getPerfil,
  actualizarPerfil,
};
