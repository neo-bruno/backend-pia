const bcrypt = require("bcrypt");
const pool = require("../../database/pool");
const repository = require("./profesionalPublico.repository");

const {
  validateRegistroProfesional,
  validateVerificationCode,
} = require("./profesionalPublico.validation");

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
// OBTENER RESEÑAS DE UN PROFESIONAL
// =====================================================
async function getResenasProfesional(profesionalId) {
  const [resumen, resenas] = await Promise.all([
    repository.getResumenResenasProfesional(profesionalId),
    repository.getResenasProfesional(profesionalId),
  ]);

  return {
    promedio: Number(resumen?.promedio || 0),
    total_resenas: Number(resumen?.total_resenas || 0),

    distribucion: {
      5: Number(resumen?.estrellas_5 || 0),
      4: Number(resumen?.estrellas_4 || 0),
      3: Number(resumen?.estrellas_3 || 0),
      2: Number(resumen?.estrellas_2 || 0),
      1: Number(resumen?.estrellas_1 || 0),
    },

    resenas: resenas.map((resena) => ({
      ...resena,
      puntaje: Number(resena.puntaje || 0),
    })),
  };
}

module.exports = {
  getProfessionals,
  getProfessionalBySlug,
  verifyBusinessCode,
  saveProfessional,

  getResenasProfesional,
};
