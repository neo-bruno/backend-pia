const service = require("./profesional.service");

async function getVerificationCode(req, res) {
  try {
    const { codigo } = req.params;

    const negocio = await service.verifyBusinessCode(codigo);

    return res.status(200).json({
      ok: true,
      negocio,
    });
  } catch (error) {
    console.error("Error al verificar código de negocio:", error);

    return res.status(400).json({
      ok: false,
      mensaje: error.message,
    });
  }
}

async function saveProfessional(req, res) {
  // console.log("SAVE PROFESIONAL:", req.body);

  try {
    let profesional;
    let membresia;

    // ==============================
    // PROFESIONAL
    // ==============================
    try {
      profesional = JSON.parse(req.body.profesional);
    } catch (error) {
      // console.error("ERROR PARSE PROFESIONAL:", error);
      // console.error("req.body.profesional:", req.body.profesional);

      return res.status(400).json({
        ok: false,
        mensaje: "Los datos del profesional no tienen un formato válido",
      });
    }

    // ==============================
    // MEMBRESÍA
    // ==============================
    try {
      membresia = JSON.parse(req.body.membresia);
    } catch (error) {
      console.error("ERROR PARSE MEMBRESÍA:", error);
      console.error("req.body.membresia:", req.body.membresia);

      return res.status(400).json({
        ok: false,
        mensaje: "Los datos de la membresía no tienen un formato válido",
      });
    }

    const data = {
      negocioId: req.body.negocioId,
      profesional,
      membresia,
    };

    const resultado = await service.saveProfessional(data, req.file);

    return res.status(201).json({
      ok: true,
      mensaje: "El registro del profesional fue enviado correctamente",
      data: resultado,
    });
  } catch (error) {
    console.error("Error al registrar profesional:", error);

    return res.status(400).json({
      ok: false,
      mensaje: error.message || "No se pudo registrar el profesional",
    });
  }
}

// =====================================================
// ACTUALIZAR PERFIL PROFESIONAL
// =====================================================

const updateProfesional = async (req, res) => {
  try {
    const profesionalId =
      req.profesionalId || Number(req.usuario?.profesional_id);

    if (!Number.isInteger(profesionalId) || profesionalId <= 0) {
      return res.status(401).json({
        ok: false,
        message: "El usuario no tiene un profesional asociado",
      });
    }

    const data = await service.updateProfesional(
      profesionalId,
      req.profesionalData,
    );

    return res.status(200).json({
      ok: true,
      message: "Perfil profesional actualizado correctamente",
      data,
    });
  } catch (error) {
    console.error("Error updateProfesional:", error);

    return res.status(error.status || 500).json({
      ok: false,
      message: error.message || "Error al actualizar el profesional",
      ...(error.detalle && {
        detalle: error.detalle,
      }),
    });
  }
};

const getDataProfessional = async (req, res) => {
  try {
    const profesionalId = req.usuario?.profesional_id;

    if (!profesionalId) {
      return res.status(400).json({
        ok: false,
        message: "El usuario no tiene un profesional asociado",
      });
    }

    const data = await service.getDataProfessional(profesionalId);

    return res.status(200).json({
      ok: true,
      data,
    });
  } catch (error) {
    console.error("ERROR GET DATA PROFESSIONAL:", error);

    return res.status(error.status || 500).json({
      ok: false,
      message: error.message || "Error al obtener los datos del profesional",
    });
  }
};

// profesional.controller.js
const getProfessionals = async (req, res) => {
  try {
    const profesionales = await service.getProfessionals();

    return res.status(200).json({
      ok: true,
      data: profesionales,
    });
  } catch (error) {
    console.error("Error al obtener profesionales:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al obtener los profesionales",
      error: error.message,
    });
  }
};

// =====================================================
// OBTENER PROFESIONAL POR SLUG
// =====================================================
async function getProfessionalBySlug(req, res) {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({
        ok: false,
        message: "El slug del profesional es requerido",
      });
    }

    const data = await service.getProfessionalBySlug(slug);

    if (!data) {
      return res.status(404).json({
        ok: false,
        message: "Profesional no encontrado",
      });
    }

    return res.json({
      ok: true,
      data,
    });
  } catch (error) {
    console.error("Error al obtener profesional por slug:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al obtener el profesional",
      error: error.message,
    });
  }
}

module.exports = {
  getProfessionalBySlug,

  getProfessionals,

  getDataProfessional,

  updateProfesional,
  saveProfessional,
  getVerificationCode,
};
