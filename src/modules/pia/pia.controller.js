const service = require("./pia.service");

const chat = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        ok: false,
        message: "El mensaje es obligatorio.",
      });
    }

    const usuario = req.usuario;

    const resultado = await service.chat({
      message: message.trim(),
      user: usuario,
    });

    return res.status(200).json({
      ok: true,
      data: resultado,
    });
  } catch (error) {
    console.error("Error en PIA Controller:", error);

    return res.status(500).json({
      ok: false,
      message: error.message || "Error interno del agente PIA.",
    });
  }
};

module.exports = {
  chat,
};
