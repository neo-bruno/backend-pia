const fs = require("fs/promises");

const repository = require("./servicioarchivo.repository");

const {
  validarId,
  validarFotos,
  validarVideos,
  validarOrden,
  MAX_FOTOS_POR_SERVICIO,
  MAX_VIDEOS_POR_SERVICIO,
} = require("./servicioarchivo.validation");

// ============================================================
// ELIMINAR ARCHIVOS FÍSICOS
// ============================================================

const eliminarArchivosFisicos = async (archivos) => {
  for (const archivo of archivos) {
    try {
      await fs.unlink(archivo.path);
    } catch (error) {
      if (error.code !== "ENOENT") {
        console.error(
          "No se pudo eliminar archivo físico:",
          archivo.path,
          error,
        );
      }
    }
  }
};

// ============================================================
// AGREGAR FOTOS A SERVICIO
// ============================================================

const createFile = async ({ servicioId, profesionalId, fotos }) => {
  servicioId = validarId(servicioId, "El ID del servicio");

  profesionalId = validarId(profesionalId, "El ID del profesional");

  validarFotos(fotos);

  // ----------------------------------------------------------
  // VERIFICAR QUE EL SERVICIO PERTENECE AL PROFESIONAL
  // ----------------------------------------------------------

  const servicio = await repository.getServiceByProfessional(
    servicioId,
    profesionalId,
  );

  if (!servicio) {
    const error = new Error(
      "El servicio no existe o no pertenece al profesional autenticado",
    );

    error.status = 404;

    throw error;
  }

  // ----------------------------------------------------------
  // CONTAR FOTOS ACTUALES
  // ----------------------------------------------------------

  const cantidadActual = await repository.countPhotosByService(servicioId);

  const cantidadNueva = fotos.length;

  if (cantidadActual + cantidadNueva > MAX_FOTOS_POR_SERVICIO) {
    const disponibles = MAX_FOTOS_POR_SERVICIO - cantidadActual;

    const error = new Error(
      disponibles <= 0
        ? "El servicio ya tiene el máximo de 5 fotos permitidas"
        : `Solo puedes agregar ${disponibles} foto(s) más`,
    );

    error.status = 400;

    throw error;
  }

  // ----------------------------------------------------------
  // ORDEN INICIAL
  // ----------------------------------------------------------

  let orden = await repository.getLastPhotoOrder(servicioId);

  // ----------------------------------------------------------
  // VERIFICAR FOTO PRINCIPAL
  // ----------------------------------------------------------

  const yaTienePrincipal = await repository.hasPrincipalPhoto(servicioId);

  const archivosSubidos = [];

  try {
    const resultado = await repository.transaction(async (client) => {
      const archivosGuardados = [];

      for (const foto of fotos) {
        orden++;

        const principal = !yaTienePrincipal && archivosGuardados.length === 0;

        const archivo = await repository.createFile(client, foto);

        const relacion = await repository.createServiceFile(
          client,
          servicioId,
          archivo.id,
          "FOTO",
          orden,
          principal,
        );

        archivosSubidos.push(foto);

        archivosGuardados.push({
          archivo,
          relacion,
        });
      }

      return archivosGuardados;
    });

    return resultado;
  } catch (error) {
    await eliminarArchivosFisicos(
      archivosSubidos.length ? archivosSubidos : fotos,
    );

    throw error;
  }
};

// ============================================================
// LISTAR
// ============================================================

const getFilesByService = async (servicioId) => {
  servicioId = validarId(servicioId, "El ID del servicio");

  return await repository.getFilesByService(servicioId);
};

// ============================================================
// ELIMINAR
// ============================================================

const deleteFile = async (archivoId) => {
  archivoId = validarId(archivoId, "El ID del archivo");

  const archivo = await repository.getFileById(archivoId);

  if (!archivo) {
    const error = new Error("El archivo no existe");

    error.status = 404;

    throw error;
  }

  await repository.deleteFile(archivoId);

  if (archivo.url) {
    const ruta = archivo.url.startsWith("/")
      ? archivo.url.substring(1)
      : archivo.url;

    try {
      await fs.unlink(ruta);
    } catch (error) {
      if (error.code !== "ENOENT") {
        console.error("No se pudo eliminar archivo físico:", ruta, error);
      }
    }
  }

  return true;
};

// ============================================================
// PRINCIPAL
// ============================================================

const setPrincipal = async (archivoId) => {
  archivoId = validarId(archivoId, "El ID del archivo");

  const archivo = await repository.getFileById(archivoId);

  if (!archivo) {
    const error = new Error("El archivo no existe");

    error.status = 404;

    throw error;
  }

  if (archivo.tipo !== "FOTO") {
    const error = new Error("Solamente una foto puede ser principal");

    error.status = 400;

    throw error;
  }

  return await repository.setPrincipal(archivoId, archivo.servicio_id);
};

// ============================================================
// ORDEN
// ============================================================

const updateOrder = async (archivoId, orden) => {
  archivoId = validarId(archivoId, "El ID del archivo");

  orden = validarOrden(orden);

  const archivo = await repository.getFileById(archivoId);

  if (!archivo) {
    const error = new Error("El archivo no existe");

    error.status = 404;

    throw error;
  }

  console.log("archivoId --> ", archivoId, orden);

  return await repository.updateOrder(archivoId, orden);
};

const createFileVideo = async ({ servicioId, profesionalId, videos }) => {
  servicioId = validarId(servicioId, "El ID del servicio");

  profesionalId = validarId(profesionalId, "El ID del profesional");

  validarVideos(videos);

  const servicio = await repository.getServiceByProfessional(
    servicioId,
    profesionalId,
  );

  if (!servicio) {
    const error = new Error(
      "El servicio no existe o no pertenece al profesional autenticado",
    );

    error.status = 404;

    throw error;
  }

  const cantidadActual = await repository.countVideosByService(servicioId);

  const cantidadNueva = videos.length;

  if (cantidadActual + cantidadNueva > MAX_VIDEOS_POR_SERVICIO) {
    const disponibles = MAX_VIDEOS_POR_SERVICIO - cantidadActual;

    const error = new Error(
      disponibles <= 0
        ? "El servicio ya tiene el máximo de 2 videos permitidos"
        : `Solo puedes agregar ${disponibles} video(s) más`,
    );

    error.status = 400;

    throw error;
  }

  let orden = await repository.getLastVideoOrder(servicioId);

  const archivosSubidos = [];

  try {
    const resultado = await repository.transaction(async (client) => {
      const videosGuardados = [];

      for (const video of videos) {
        orden++;

        const archivo = await repository.createFile(client, video);

        const relacion = await repository.createServiceFile(
          client,
          servicioId,
          archivo.id,
          "VIDEO",
          orden,
          false,
        );

        archivosSubidos.push(video);

        videosGuardados.push({
          archivo,
          relacion,
        });
      }

      return videosGuardados;
    });

    return resultado;
  } catch (error) {
    await eliminarArchivosFisicos(
      archivosSubidos.length ? archivosSubidos : videos,
    );

    throw error;
  }
};

module.exports = {
  createFile,
  createFileVideo,
  getFilesByService,
  deleteFile,
  setPrincipal,
  updateOrder,
};
