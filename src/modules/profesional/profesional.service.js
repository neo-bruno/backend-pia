const bcrypt = require("bcrypt");
const pool = require("../../database/pool");

const repository = require("./profesional.repository");

const {
  validateRegistroProfesional,
  validateVerificationCode,
  validarProfesionalId,
} = require("./profesional.validation");

async function verifyBusinessCode(codigo) {
  const codigoNormalizado = validateVerificationCode(codigo);

  const negocio = await repository.getNegocioByCodigo(codigoNormalizado);

  if (!negocio) {
    throw new Error("El código no es válido o el negocio no está activo");
  }

  return negocio;
}

async function saveProfessional(data, file) {
  validateRegistroProfesional(data, file);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // =====================================================
    // 1. VERIFICAR NEGOCIO
    // =====================================================

    const negocio = await repository.getNegocioById(client, data.negocioId);

    if (!negocio) {
      throw new Error("El negocio no existe");
    }

    if (negocio.estado !== "HABILITADO") {
      throw new Error(
        "El negocio no está habilitado para registrar profesionales",
      );
    }

    // =====================================================
    // 2. VERIFICAR / CREAR TIPO PROFESIONAL
    // =====================================================

    let tipoProfesional = null;

    // -----------------------------------------------------
    // 2.1 BUSCAR POR ID SI VIENE
    // -----------------------------------------------------

    if (data.profesional.tipo_profesional_id) {
      tipoProfesional = await repository.getTipoProfesionalById(
        client,
        data.profesional.tipo_profesional_id,
      );
    }

    // -----------------------------------------------------
    // 2.2 SI NO EXISTE, BUSCAR/CREAR POR NOMBRE
    // -----------------------------------------------------

    if (!tipoProfesional) {
      const tipoDatos = data.profesional.tipo_profesional;

      if (!tipoDatos?.nombre) {
        throw new Error(
          "El tipo de profesional no existe y no se proporcionaron los datos para crearlo",
        );
      }

      // Primero buscamos si ya existe por nombre
      tipoProfesional = await repository.getTipoProfesionalByNombre(
        client,
        tipoDatos.nombre,
      );

      // Si tampoco existe, lo creamos
      if (!tipoProfesional) {
        tipoProfesional = await repository.createTipoProfesional(
          client,
          tipoDatos,
        );
      }

      // Actualizamos el ID para utilizarlo posteriormente
      data.profesional.tipo_profesional_id = tipoProfesional.id;
    }

    // -----------------------------------------------------
    // 2.3 VERIFICAR QUE ESTÉ ACTIVO
    // -----------------------------------------------------

    if (!tipoProfesional.activo) {
      throw new Error("El tipo de profesional seleccionado está inactivo");
    }

    // =====================================================
    // 3. ROL ADMIN
    // =====================================================

    const rolAdmin = await repository.getRolAdmin(client);

    if (!rolAdmin) {
      throw new Error("No existe el rol ADMIN en la tabla rol");
    }

    // =====================================================
    // 4. MÉTODO DE PAGO QR
    // =====================================================

    const metodoPagoQR = await repository.getMetodoPagoQR(client);

    if (!metodoPagoQR) {
      throw new Error("No existe un método de pago QR activo");
    }

    // =====================================================
    // 5. GERENCIA ACTIVA
    // =====================================================

    const gerencia = await repository.getGerenciaActiva(client);

    if (!gerencia) {
      throw new Error("No existe una gerencia activa para recibir pagos");
    }

    // =====================================================
    // 6. PERSONA
    // =====================================================

    const persona = await repository.createPersona(client, data.profesional);

    // =====================================================
    // 7. PROFESIONAL
    // =====================================================
    const nombreProfesional = [
      data.profesional.nombres,
      data.profesional.apellidos,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    const slugBaseProfesional = repository.slugify(nombreProfesional);

    if (!slugBaseProfesional) {
      throw new Error("No se pudo generar el slug del profesional");
    }

    let slugProfesional = slugBaseProfesional;
    let contadorProfesional = 1;

    while (await repository.existsSlugProfesional(client, slugProfesional)) {
      contadorProfesional++;

      slugProfesional = `${slugBaseProfesional}-${contadorProfesional}`;
    }

    const profesional = await repository.createProfesional(
      client,
      persona.id,
      slugProfesional,
    );
    // =====================================================
    // 8. PASSWORD
    // =====================================================

    const passwordHash = await bcrypt.hash(data.profesional.password, 10);

    // =====================================================
    // 9. USUARIO
    // =====================================================

    const usuario = await repository.createUsuario(
      client,
      persona.id,
      rolAdmin.id,
      data.profesional.telefono,
      passwordHash,
    );

    // =====================================================
    // 10. TIPO PROFESIONAL
    // =====================================================

    const profesionalTipo = await repository.createProfesionalTipo(
      client,
      profesional.id,
      tipoProfesional.id,
    );

    // =====================================================
    // 11. PROFESIONAL - NEGOCIO
    // =====================================================

    const profesionalNegocio = await repository.createProfesionalNegocio(
      client,
      negocio.id,
      profesional.id,
    );

    // =====================================================
    // 12. MEMBRESÍA
    // =====================================================

    const membresia = await repository.createMembresia(
      client,
      profesionalNegocio.id,
      data.membresia,
    );

    // =====================================================
    // 13. ARCHIVO
    // =====================================================

    const archivo = await repository.createArchivo(client, file);

    // =====================================================
    // 14. PAGO
    // =====================================================

    const pago = await repository.createPago(
      client,
      metodoPagoQR.id,
      profesional.id,
      membresia.id,
      data.membresia.monto,
    );

    // =====================================================
    // 15. COMPROBANTE
    // =====================================================

    const comprobante = await repository.createComprobante(
      client,
      pago.id,
      archivo.id,
      gerencia.id,
    );

    // =====================================================
    // COMMIT
    // =====================================================

    await client.query("COMMIT");

    return {
      negocio: {
        id: negocio.id,
        codigo: negocio.codigo,
        nombre: negocio.nombre,
      },

      profesional: {
        id: profesional.id,
        persona_id: persona.id,
        nombre: persona.nombre,
        telefono: persona.telefono,
        estado: profesional.estado,
        estado_funciones: profesional.estado_funciones,
      },

      usuario: {
        id: usuario.id,
        rol_id: usuario.rol_id,
        telefono: usuario.telefono,
        estado: usuario.estado,
      },

      profesional_tipo: profesionalTipo,

      profesional_negocio: profesionalNegocio,

      membresia,

      pago: {
        id: pago.id,
        numero: pago.numero,
        monto: pago.monto,
        estado: pago.estado,
      },

      comprobante: {
        id: comprobante.id,
        archivo_id: comprobante.archivo_id,
        estado: comprobante.estado,
      },
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// =====================================================
// ACTUALIZAR PERFIL PROFESIONAL
// =====================================================
const updateProfesional = async (profesionalId, datos) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // =================================================
    // 1. BUSCAR PROFESIONAL
    // =================================================

    const profesional = await repository.obtenerProfesional(
      client,
      profesionalId,
    );

    if (!profesional) {
      const error = new Error("El profesional no existe");

      error.status = 404;

      throw error;
    }

    // =================================================
    // 2. ACTUALIZAR PERSONA
    // =================================================

    await repository.actualizarPersona(
      client,
      profesional.persona_id,
      datos.nombre,
    );

    // =================================================
    // 3. VALIDAR TIPOS
    // =================================================

    const tiposValidos = await repository.obtenerTiposValidos(
      client,
      datos.tipos,
    );

    if (tiposValidos.length !== datos.tipos.length) {
      const idsValidos = new Set(tiposValidos.map((tipo) => Number(tipo.id)));

      const idsInvalidos = datos.tipos.filter(
        (id) => !idsValidos.has(Number(id)),
      );

      const error = new Error(
        "Uno o más tipos de profesional no existen o están inactivos",
      );

      error.status = 400;

      error.detalle = {
        tipos_invalidos: idsInvalidos,
      };

      throw error;
    }

    // =================================================
    // 4. ACTUALIZAR PROFESIONAL
    // =================================================

    await repository.actualizarProfesional(client, profesionalId, datos);

    // =================================================
    // 5. SINCRONIZAR TIPOS
    // =================================================

    await repository.eliminarTipos(client, profesionalId);

    await repository.insertarTipos(client, profesionalId, datos.tipos);

    // =================================================
    // 6. OBTENER DATOS ACTUALIZADOS
    // =================================================

    const profesionalActualizado = await repository.obtenerProfesional(
      client,
      profesionalId,
    );

    const tipos = await repository.obtenerTiposProfesional(
      client,
      profesionalId,
    );

    // =================================================
    // 7. COMMIT
    // =================================================

    await client.query("COMMIT");

    // =================================================
    // 8. RESPUESTA
    // =================================================

    return {
      profesional: profesionalActualizado,
      tipos,
    };
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
};

const getDataProfessional = async (profesionalId) => {
  const id = validarProfesionalId(profesionalId);

  const client = await pool.connect();

  try {
    const profesional = await repository.getDataProfessional(client, id);

    if (!profesional) {
      const error = new Error("Profesional no encontrado");
      error.status = 404;
      throw error;
    }

    return {
      id: Number(profesional.id),
      persona_id: Number(profesional.persona_id),

      nombre: profesional.nombre,

      slug: profesional.slug,

      foto: profesional.foto,
      portada: profesional.portada,

      fecha_trabajo: profesional.fecha_trabajo,

      anios_experiencia: Number(profesional.anios_experiencia || 0),

      descripcion: profesional.descripcion || "",
      lema: profesional.lema || "",

      pago_qr: profesional.pago_qr,

      estado: profesional.estado,
      estado_funciones: profesional.estado_funciones,

      tipos: Array.isArray(profesional.tipos)
        ? profesional.tipos.map((tipo) => ({
            id: Number(tipo.id),
            nombre: tipo.nombre,
            descripcion: tipo.descripcion || "",
          }))
        : [],

      calificacion: Number(profesional.calificacion || 0),

      cantidad_calificaciones: Number(profesional.cantidad_calificaciones || 0),

      clientes_atendidos: Number(profesional.clientes_atendidos || 0),
    };
  } finally {
    client.release();
  }
};

// profesional.service.js
const getProfessionals = async () => {
  const profesionales = await repository.getProfessionals();

  return profesionales.map((profesional) => ({
    ...profesional,

    // ==========================================
    // DATOS PARA TARJETA PROFESIONAL
    // ==========================================

    imagen: profesional.foto,

    profesion:
      profesional.tipos_profesional?.[0]?.nombre || "Profesional de belleza",

    rating: Number(profesional.rating || 0).toFixed(1),

    reseñas: Number(profesional.resenas || 0),

    precio:
      profesional.precio_minimo !== null &&
      profesional.precio_minimo !== undefined
        ? `Bs. ${Number(profesional.precio_minimo).toFixed(0)}`
        : "Consultar",

    favorito: false,
  }));
};

// =====================================================
// OBTENER PROFESIONAL POR SLUG
// =====================================================
async function getProfessionalBySlug(slug) {
  const data = await repository.getProfessionalBySlug(slug);

  if (!data) {
    return null;
  }

  return {
    profesional: data.profesional,
    negocio: data.negocio,
    servicios: data.servicios || [],
    galeria: data.galeria || [],
  };
}

module.exports = {
  getProfessionalBySlug,

  getProfessionals,

  getDataProfessional,

  updateProfesional,
  saveProfessional,
  verifyBusinessCode,
};
