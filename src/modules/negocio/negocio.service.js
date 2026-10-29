const bcrypt = require("bcrypt");
const crypto = require("crypto");
const pool = require("../../database/pool");
const { validateRegistroNegocio } = require("./negocio.validation");
const repository = require("./negocio.repository");

function generarCodigoNegocio() {
  const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  let codigo = "NEG-";

  for (let i = 0; i < 8; i++) {
    const indice = crypto.randomInt(0, caracteres.length);
    codigo += caracteres[indice];
  }

  return codigo;
}

const getBusiness = async () => {
  return await repository.getBusiness();
};

/******************************************************
 * REGISTRAR EL NEGOCIO Y PROFESIONAL
 ******************************************************/
async function saveBusinessProfession(data, file) {
  validateRegistroNegocio(data);

  if (!file) {
    throw new Error("El comprobante de pago es obligatorio");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // =====================================================
    // 1. TIPO DE NEGOCIO
    // =====================================================

    let tipoNegocio = await repository.getTipoNegocioById(
      client,
      data.negocio.tipo_negocio_id,
    );

    /*
     * Si el ID existe, lo usamos.
     *
     * Si no existe, necesitamos los datos para crear
     * el nuevo tipo.
     */

    if (!tipoNegocio) {
      if (!data.negocio.tipo_negocio) {
        throw new Error(
          "El tipo de negocio no existe y no se proporcionaron datos para crearlo",
        );
      }

      tipoNegocio = await repository.createTipoNegocio(
        client,
        data.negocio.tipo_negocio,
      );

      data.negocio.tipo_negocio_id = tipoNegocio.id;
    }

    if (!tipoNegocio.activo) {
      throw new Error("El tipo de negocio seleccionado está inactivo");
    }

    // =====================================================
    // 2. TIPO DE PROFESIONAL
    // =====================================================

    let tipoProfesional = await repository.getTipoProfesionalById(
      client,
      data.profesional.tipo_profesional_id,
    );

    if (!tipoProfesional) {
      if (!data.profesional.tipo_profesional) {
        throw new Error(
          "El tipo de profesional no existe y no se proporcionaron datos para crearlo",
        );
      }

      tipoProfesional = await repository.createTipoProfesional(
        client,
        data.profesional.tipo_profesional,
      );

      data.profesional.tipo_profesional_id = tipoProfesional.id;
    }

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
    // 4. METODO DE PAGO QR
    // =====================================================
    const metodoPagoQR = await repository.getMetodoPagoQR(client);

    if (!metodoPagoQR) {
      throw new Error("No existe un método de pago QR activo");
    }

    // =====================================================
    // 5. GERENCIA
    // =====================================================
    const gerencia = await repository.getGerenciaActiva(client);

    if (!gerencia) {
      throw new Error("No existe una gerencia activa para recibir pagos");
    }

    // =====================================================
    // 5. GENERAR SLUG
    // =====================================================

    let slugBase = repository.slugify(data.negocio.nombre);

    if (!slugBase) {
      throw new Error("No se pudo generar el slug del negocio");
    }

    let slug = slugBase;
    let contador = 1;

    while (await repository.existsSlug(client, slug)) {
      contador++;

      slug = `${slugBase}-${contador}`;
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
    // 10. PROFESIONAL - TIPO PROFESIONAL
    // =====================================================

    const profesionalTipo = await repository.createProfesionalTipo(
      client,
      profesional.id,
      tipoProfesional.id,
    );

    // =====================================================
    // 11. NEGOCIO
    // =====================================================
    let codigoNegocio;

    do {
      codigoNegocio = generarCodigoNegocio();
    } while (await repository.existsCodigoNegocio(client, codigoNegocio));

    const negocio = await repository.createNegocio(
      client,
      data.negocio,
      slug,
      codigoNegocio,
    );

    // =====================================================
    // 12. PROFESIONAL - NEGOCIO
    // =====================================================

    const profesionalNegocio = await repository.createProfesionalNegocio(
      client,
      negocio.id,
      profesional.id,
    );

    // =====================================================
    // 13. MEMBRESIA
    // =====================================================

    const membresia = await repository.createMembresia(
      client,
      profesionalNegocio.id,
      data.membresia,
    );

    // =====================================================
    // 14. ARCHIVO DEL COMPROBANTE
    // =====================================================

    const archivo = await repository.createArchivo(client, file);

    // =====================================================
    // 15. PAGO QR
    // =====================================================

    const pago = await repository.createPago(
      client,
      metodoPagoQR.id,
      profesional.id,
      membresia.id,
      data.membresia.monto,
    );

    // =====================================================
    // 16. COMPROBANTE
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
      negocio,
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


const getBusinessBySlug = async (slug) => {
  if (!slug || typeof slug !== "string" || !slug.trim()) {
    throw new Error("El slug del negocio es obligatorio");
  }

  return repository.getBusinessBySlug(slug.trim());
};


module.exports = {
  saveBusinessProfession,
  getBusiness,
  getBusinessBySlug,
};
