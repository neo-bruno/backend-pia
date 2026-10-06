const service = require("./slot.service");

// =====================================================
// OBTENER SLOTS
// =====================================================
const getSlots = async (req, res) => {
  try {
    const profesionalId =
      req.profesionalId || Number(req.usuario?.profesional_id);

    if (!Number.isInteger(profesionalId) || profesionalId <= 0) {
      return res.status(401).json({
        ok: false,
        message: "El usuario no tiene un profesional asociado",
      });
    }

    const data = await service.getSlots(profesionalId);

    return res.status(200).json({
      ok: true,

      message: "Slots obtenidos correctamente",

      data,
    });
  } catch (error) {
    console.error("Error getSlots:", error);

    return res.status(error.status || 500).json({
      ok: false,

      message: error.message || "Error al obtener los slots",
    });
  }
};

// slot.controller.js
// =====================================================
// GUARDAR SLOTS
// =====================================================
const saveSlots = async (req, res) => {
  try {
    console.log("========== BODY REAL RECIBIDO ==========");
    console.log(JSON.stringify(req.body, null, 2));
    console.log("=========================================");

    const profesionalId = req.usuario?.profesional_id;

    if (!profesionalId) {
      return res.status(401).json({
        ok: false,

        message: "El usuario no tiene un profesional asociado",
      });
    }

    const slots = req.slots;    
    console.log("========================================");
console.log("CONTROLLER SAVE SLOT");
console.log("PID:", process.pid);
console.log("FILE:", __filename);
console.log("BODY RECIBIDO:");
console.log(JSON.stringify(req.body, null, 2));
console.log("========================================");
    const data = await service.saveSlots(profesionalId, slots);

    return res.status(200).json({
      ok: true,

      message: "Slots guardados correctamente",

      data,
    });
  } catch (error) {
    console.error("Error saveSlots:", error);

    return res.status(error.status || 500).json({
      ok: false,

      message: error.message || "Error al guardar los slots",

      ...(error.detalle && {
        detalle: error.detalle,
      }),
    });
  }
};

module.exports = {
  saveSlots,
  getSlots,
};
