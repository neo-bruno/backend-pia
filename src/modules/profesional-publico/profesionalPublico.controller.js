const service = require("./profesionalPublico.service");

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
// OBTENER RESEÑAS DE UN PROFESIONAL
// =====================================================
async function getResenasProfesional(req, res) {
  try {
    const profesionalId = Number(req.params.profesionalId);

    if (!Number.isInteger(profesionalId) || profesionalId <= 0) {
      return res.status(400).json({
        ok: false,
        message: "El ID del profesional no es válido",
      });
    }

    const data = await service.getResenasProfesional(profesionalId);

    return res.status(200).json({
      ok: true,
      data,
    });
  } catch (error) {
    console.error("Error al obtener reseñas del profesional:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al obtener las reseñas",
      error: error.message,
    });
  }
}

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

async function saveProfessional(req, res) {
  console.log("SAVE PROFESIONAL:", req.body);

  try {
    let profesional;
    let membresia;

    // ==============================
    // PROFESIONAL
    // ==============================
    try {
      profesional = JSON.parse(req.body.profesional);
    } catch (error) {
      console.error("ERROR PARSE PROFESIONAL:", error);
      console.error("req.body.profesional:", req.body.profesional);

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

module.exports = {
  getProfessionals,
  getVerificationCode,
  getProfessionalBySlug,
  saveProfessional,
  getResenasProfesional,
};
