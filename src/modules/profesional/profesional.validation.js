function validateVerificationCode(codigo) {
  if (!codigo) {
    throw new Error("El código del negocio es obligatorio");
  }

  const codigoNormalizado = codigo.trim().toUpperCase();

  if (!codigoNormalizado) {
    throw new Error("El código del negocio es obligatorio");
  }

  return codigoNormalizado;
}

function validateRegistroProfesional(data, file) {
  if (!data) {
    throw new Error("Los datos del registro son obligatorios");
  }

  if (!data.negocioId) {
    throw new Error("El negocio es obligatorio");
  }

  if (!data.profesional) {
    throw new Error("Los datos del profesional son obligatorios");
  }

  if (!data.membresia) {
    throw new Error("Los datos de la membresía son obligatorios");
  }

  if (!file) {
    throw new Error("El comprobante de pago es obligatorio");
  }

  const profesional = data.profesional;
  const membresia = data.membresia;

  if (!profesional.nombres?.trim()) {
    throw new Error("Los nombres del profesional son obligatorios");
  }

  if (!profesional.apellidos?.trim()) {
    throw new Error("Los apellidos del profesional son obligatorios");
  }

  if (!profesional.telefono?.trim()) {
    throw new Error("El teléfono del profesional es obligatorio");
  }

  if (!profesional.sexo) {
    throw new Error("El sexo del profesional es obligatorio");
  }

  if (!profesional.password) {
    throw new Error("La contraseña es obligatoria");
  }

  if (profesional.password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres");
  }

  if (!profesional.tipo_profesional_id) {
    throw new Error("El tipo de profesional es obligatorio");
  }

  if (!membresia.fecha_inicio) {
    throw new Error("La fecha de inicio de la membresía es obligatoria");
  }

  if (!membresia.fecha_fin) {
    throw new Error("La fecha de fin de la membresía es obligatoria");
  }

  if (
    membresia.monto === undefined ||
    membresia.monto === null ||
    Number(membresia.monto) <= 0
  ) {
    throw new Error("El monto de la membresía debe ser mayor a cero");
  }

  return true;
}

// =====================================================
// VALIDAR PROFESIONAL
// =====================================================

const validarProfesional = (req, res, next) => {
  try {
    // ===================================================
    // PROFESIONAL DESDE JWT
    // ===================================================

    const profesionalId = Number(req.usuario?.profesional_id);

    if (!Number.isInteger(profesionalId) || profesionalId <= 0) {
      return res.status(401).json({
        ok: false,
        message: "El usuario no tiene un profesional asociado",
      });
    }

    req.profesionalId = profesionalId;

    // ===================================================
    // DATOS
    // ===================================================

    const nombre =
      typeof req.body.nombre === "string" ? req.body.nombre.trim() : "";

    const descripcion =
      typeof req.body.descripcion === "string"
        ? req.body.descripcion.trim()
        : "";

    const fechaTrabajo =
      typeof req.body.fecha_trabajo === "string"
        ? req.body.fecha_trabajo.trim()
        : "";

    const lema = typeof req.body.lema === "string" ? req.body.lema.trim() : "";

    // ===================================================
    // NOMBRE
    // ===================================================

    if (!nombre) {
      return res.status(400).json({
        ok: false,
        message: "El nombre del profesional es obligatorio",
      });
    }

    if (nombre.length > 150) {
      return res.status(400).json({
        ok: false,
        message: "El nombre no puede superar los 150 caracteres",
      });
    }

    // ===================================================
    // FECHA DE TRABAJO
    // ===================================================

    if (fechaTrabajo) {
      const formatoFecha = /^\d{4}-\d{2}-\d{2}$/;

      if (!formatoFecha.test(fechaTrabajo)) {
        return res.status(400).json({
          ok: false,
          message: "La fecha de trabajo no tiene un formato válido",
        });
      }

      const fecha = new Date(`${fechaTrabajo}T00:00:00`);

      if (Number.isNaN(fecha.getTime())) {
        return res.status(400).json({
          ok: false,
          message: "La fecha de trabajo no es válida",
        });
      }
    }

    // ===================================================
    // LEMA
    // ===================================================

    if (lema.length > 250) {
      return res.status(400).json({
        ok: false,
        message: "El lema no puede superar los 250 caracteres",
      });
    }

    // ===================================================
    // TIPOS
    // ===================================================

    let tipos = [];

    if (
      req.body.tipos !== undefined &&
      req.body.tipos !== null &&
      req.body.tipos !== ""
    ) {
      try {
        tipos =
          typeof req.body.tipos === "string"
            ? JSON.parse(req.body.tipos)
            : req.body.tipos;
      } catch (error) {
        return res.status(400).json({
          ok: false,
          message: "El campo tipos no contiene un JSON válido",
        });
      }
    }

    if (!Array.isArray(tipos)) {
      return res.status(400).json({
        ok: false,
        message: "Los tipos del profesional deben ser un arreglo",
      });
    }

    // ===================================================
    // MÁXIMO 3
    // ===================================================

    if (tipos.length > 3) {
      return res.status(400).json({
        ok: false,
        message: "El profesional puede tener máximo 3 especialidades",
      });
    }

    // ===================================================
    // NORMALIZAR IDS
    // ===================================================

    tipos = tipos.map(Number);

    // ===================================================
    // IDS VÁLIDOS
    // ===================================================

    if (tipos.some((id) => !Number.isInteger(id) || id <= 0)) {
      return res.status(400).json({
        ok: false,
        message: "Uno o más tipos de profesional no son válidos",
      });
    }

    // ===================================================
    // DUPLICADOS
    // ===================================================

    if (new Set(tipos).size !== tipos.length) {
      return res.status(400).json({
        ok: false,
        message: "No puedes seleccionar el mismo tipo más de una vez",
      });
    }

    // ===================================================
    // ARCHIVOS
    // ===================================================

    const archivos = req.files || {};

    const foto = archivos.foto?.[0] || null;

    const portada = archivos.portada?.[0] || null;

    const qr = archivos.qr?.[0] || null;

    // ===================================================
    // NORMALIZAR ELIMINACIONES
    // ===================================================

    const eliminarFoto =
      String(req.body.eliminar_foto || "").toLowerCase() === "true";

    const eliminarPortada =
      String(req.body.eliminar_portada || "").toLowerCase() === "true";

    const eliminarQr =
      String(req.body.eliminar_qr || "").toLowerCase() === "true";

    // ===================================================
    // NO SE PUEDE SUBIR Y ELIMINAR A LA VEZ
    // ===================================================

    if (foto && eliminarFoto) {
      return res.status(400).json({
        ok: false,
        message: "No puedes subir y eliminar la foto al mismo tiempo",
      });
    }

    if (portada && eliminarPortada) {
      return res.status(400).json({
        ok: false,
        message: "No puedes subir y eliminar la portada al mismo tiempo",
      });
    }

    if (qr && eliminarQr) {
      return res.status(400).json({
        ok: false,
        message: "No puedes subir y eliminar el QR al mismo tiempo",
      });
    }

    // ===================================================
    // DATOS NORMALIZADOS
    // ===================================================

    req.profesionalData = {
      nombre,
      descripcion,
      fecha_trabajo: fechaTrabajo || null,
      lema: lema || null,

      tipos,

      foto,
      portada,
      qr,

      eliminar_foto: eliminarFoto,
      eliminar_portada: eliminarPortada,
      eliminar_qr: eliminarQr,
    };

    next();
  } catch (error) {
    console.error("Error validarProfesional:", error);

    return res.status(400).json({
      ok: false,
      message: "Datos del profesional inválidos",
    });
  }
};

const validarProfesionalId = (profesionalId) => {
  const id = Number(profesionalId);

  if (!Number.isInteger(id) || id <= 0) {
    const error = new Error("ID de profesional inválido");
    error.status = 400;
    throw error;
  }

  return id;
};

// profesional.validation.js
const obtenerProfesionalesSchema = {
  query: {}
}

const validarObtenerProfesionales = (req, res, next) => {
  try {
    next()
  } catch (error) {
    return res.status(400).json({
      ok: false,
      message: 'Solicitud inválida'
    })
  }
}

module.exports = {
  obtenerProfesionalesSchema,
  validarObtenerProfesionales,

  validarProfesionalId,
  validarProfesional,
  validateRegistroProfesional,
  validateVerificationCode,
};
