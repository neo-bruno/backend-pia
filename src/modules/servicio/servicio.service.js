const pool = require("../../database/pool");
const fs = require("fs/promises");

const repository = require("./servicio.repository");

const {
  validarServicio,
  validarCondicion,
  validarArchivos,
  validarProfesionalId,
  validarServicioId,
  validarEstadoServicio,
} = require("./servicio.validation");

// ============================================================
// ELIMINAR ARCHIVOS FÍSICOS
// ============================================================

const eliminarArchivosFisicos = async (archivos) => {
  for (const archivo of archivos) {
    try {
      await fs.unlink(archivo.path);
    } catch (error) {
      if (error.code !== "ENOENT") {
        console.error("No se pudo eliminar archivo:", archivo.path, error);
      }
    }
  }
};

// ============================================================
// CREAR SERVICIO
// ============================================================

const saveService = async ({
  profesionalId,
  servicio,
  condicion,
  fotos,
  videos,
}) => {
  validarProfesionalId(profesionalId);

  const servicioValidado = validarServicio(servicio);
  const condicionValidada = validarCondicion(condicion);

  validarArchivos(fotos, videos);

  const archivosSubidos = [...fotos, ...videos];

  try {
    const resultado = await repository.transaction(async (client) => {
      // ------------------------------------------------------
      // 1. CREAR SERVICIO
      // ------------------------------------------------------

      const nuevoServicio = await repository.createService(
        client,
        profesionalId,
        servicioValidado,
      );

      // ------------------------------------------------------
      // 2. CREAR CONDICIÓN
      // ------------------------------------------------------

      let nuevaCondicion = null;

      if (condicionValidada) {
        nuevaCondicion = await repository.createCondition(
          client,
          condicionValidada,
        );

        await repository.createServiceCondition(
          client,
          nuevoServicio.id,
          nuevaCondicion.id,
        );
      }

      // ------------------------------------------------------
      // 3. GUARDAR FOTOS
      // ------------------------------------------------------

      const fotosGuardadas = [];

      for (let i = 0; i < fotos.length; i++) {
        const foto = fotos[i];

        const archivo = await repository.createFile(client, foto);

        const servicioArchivo = await repository.createServiceFile(
          client,
          nuevoServicio.id,
          archivo.id,
          "FOTO",
          i + 1,
          i === 0,
        );

        fotosGuardadas.push({
          archivo,
          relacion: servicioArchivo,
        });
      }

      // ------------------------------------------------------
      // 4. GUARDAR VIDEOS
      // ------------------------------------------------------

      const videosGuardados = [];

      for (let i = 0; i < videos.length; i++) {
        const video = videos[i];

        const archivo = await repository.createFile(client, video);

        const servicioArchivo = await repository.createServiceFile(
          client,
          nuevoServicio.id,
          archivo.id,
          "VIDEO",
          i + 1,
          false,
        );

        videosGuardados.push({
          archivo,
          relacion: servicioArchivo,
        });
      }

      // ------------------------------------------------------
      // 5. RESPUESTA
      // ------------------------------------------------------

      return {
        servicio: nuevoServicio,
        condicion: nuevaCondicion,
        fotos: fotosGuardadas,
        videos: videosGuardados,
      };
    });

    return resultado;
  } catch (error) {
    await eliminarArchivosFisicos(archivosSubidos);

    throw error;
  }
};

// ============================================================
// LISTAR SERVICIOS
// ============================================================

const getServices = async (profesionalId) => {
  validarProfesionalId(profesionalId);

  return await repository.getServicesByProfessionalId(profesionalId);
};

// ============================================================
// OBTENER SERVICIO POR ID
// ============================================================

const getServiceById = async (profesionalId, servicioId) => {
  validarProfesionalId(profesionalId);

  const id = validarServicioId(servicioId);

  const servicio = await repository.getServiceByIdForProfessional(
    profesionalId,
    id,
  );

  if (!servicio) {
    const error = new Error(
      "El servicio no existe o no pertenece al profesional autenticado",
    );

    error.status = 404;
    throw error;
  }

  return servicio;
};

// ============================================================
// EDITAR SERVICIO
// ============================================================
const updateService = async (profesionalId, servicioId, datos) => {
  validarProfesionalId(profesionalId);

  const id = validarServicioId(servicioId);

  // ============================================================
  // VALIDAR SERVICIO
  // ============================================================

  if (!datos || !datos.servicio) {
    const error = new Error("La información del servicio es obligatoria");

    error.status = 400;

    throw error;
  }

  const servicioValidado = validarServicio(datos.servicio);

  // ============================================================
  // VALIDAR CONDICIÓN
  // ============================================================

  let condicionValidada = null;

  if (datos.condicion) {
    condicionValidada = validarCondicion(datos.condicion);
  }

  // ============================================================
  // ACTUALIZAR TODO EN UNA SOLA TRANSACCIÓN
  // ============================================================

  const resultado = await repository.transaction(async (client) => {
    // --------------------------------------------------------
    // ACTUALIZAR SERVICIO
    // --------------------------------------------------------

    const servicioActualizado = await repository.updateService(
      profesionalId,
      id,
      servicioValidado,
      client,
    );

    if (!servicioActualizado) {
      const error = new Error(
        "El servicio no existe o no pertenece al profesional autenticado",
      );

      error.status = 404;

      throw error;
    }

    // --------------------------------------------------------
    // ACTUALIZAR CONDICIÓN
    // --------------------------------------------------------

    let condicionActualizada = null;

    if (condicionValidada) {
      condicionActualizada = await repository.updateServiceCondition(
        id,
        condicionValidada,
        client,
      );
    } else {
      // Si el servicio ya no requiere condición,
      // eliminamos solamente la relación.
      await repository.removeServiceCondition(id, client);
    }

    // --------------------------------------------------------
    // RESULTADO
    // --------------------------------------------------------

    return {
      servicio: servicioActualizado,
      condicion: condicionActualizada,
    };
  });

  return resultado;
};

// ============================================================
// ACTUALIZAR ESTADO
// ============================================================

const updateServiceStatus = async (profesionalId, servicioId, datos) => {
  validarProfesionalId(profesionalId);

  const id = validarServicioId(servicioId);

  const estado = validarEstadoServicio(datos?.estado);

  const servicioActualizado = await repository.updateServiceStatus(
    profesionalId,
    id,
    estado,
  );

  if (!servicioActualizado) {
    const error = new Error(
      "El servicio no existe o no pertenece al profesional autenticado",
    );

    error.status = 404;
    throw error;
  }

  return servicioActualizado;
};

// ============================================================
// SERVICIOS POR NEGOCIO
// ============================================================

const buscarServiciosPorNegocio = async (negocioId) => {
  if (!negocioId) {
    throw new Error("El negocio_id es obligatorio.");
  }

  const client = await pool.connect();

  try {
    const servicios = await repository.buscarServiciosPorNegocio(
      client,
      negocioId,
    );

    return servicios.map((servicio) => ({
      id: Number(servicio.id),
      nombre: servicio.nombre,
      descripcion: servicio.descripcion,
      duracion: Number(servicio.duracion),
      precio: Number(servicio.precio),

      profesional: {
        id: Number(servicio.profesional_id),
        nombre: servicio.profesional_nombre,
      },
    }));
  } finally {
    client.release();
  }
};

module.exports = {
  buscarServiciosPorNegocio,

  saveService,
  getServices,
  getServiceById,
  updateService,
  updateServiceStatus,
};
