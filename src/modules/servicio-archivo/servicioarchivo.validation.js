const validarServicioId = (id) => {
  const servicioId = Number(id);

  if (!Number.isInteger(servicioId) || servicioId <= 0) {
    const error = new Error("El ID del servicio no es válido");

    error.status = 400;

    throw error;
  }

  return servicioId;
};

const validarArchivoId = (id) => {
  const archivoId = Number(id);

  if (!Number.isInteger(archivoId) || archivoId <= 0) {
    const error = new Error("El ID del archivo no es válido");

    error.status = 400;

    throw error;
  }

  return archivoId;
};

const validarOrden = (orden) => {
  const valor = Number(orden);

  if (!Number.isInteger(valor) || valor <= 0) {
    const error = new Error(
      "El orden debe ser un número entero mayor que cero",
    );

    error.status = 400;

    throw error;
  }

  return valor;
};

const MIME_FOTOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];

const MIME_VIDEOS_PERMITIDOS = ["video/mp4", "video/webm", "video/quicktime"];

const MAX_FOTOS_POR_SERVICIO = 5;
const MAX_VIDEOS_POR_SERVICIO = 2;

const validarId = (id, nombre = "ID") => {
  const valor = Number(id);

  if (!Number.isInteger(valor) || valor <= 0) {
    const error = new Error(`${nombre} no es válido`);
    error.status = 400;
    throw error;
  }

  return valor;
};

const validarFotos = (fotos) => {
  if (!Array.isArray(fotos)) {
    const error = new Error("Las fotos deben ser un arreglo");
    error.status = 400;
    throw error;
  }

  if (fotos.length === 0) {
    const error = new Error("Debe seleccionar al menos una foto");
    error.status = 400;
    throw error;
  }

  for (const foto of fotos) {
    if (!MIME_FOTOS_PERMITIDOS.includes(foto.mimetype)) {
      const error = new Error(
        `El archivo "${foto.originalname}" no es una imagen válida`,
      );
      error.status = 400;
      throw error;
    }
  }

  return true;
};

const validarVideos = (videos) => {
  if (!Array.isArray(videos)) {
    const error = new Error("Los videos deben ser un arreglo");
    error.status = 400;
    throw error;
  }

  if (videos.length === 0) {
    const error = new Error("Debe seleccionar al menos un video");
    error.status = 400;
    throw error;
  }

  for (const video of videos) {
    if (!MIME_VIDEOS_PERMITIDOS.includes(video.mimetype)) {
      const error = new Error(
        `El archivo "${video.originalname}" no es un video válido`,
      );
      error.status = 400;
      throw error;
    }
  }

  return true;
};

module.exports = {
  validarServicioId,
  validarArchivoId,
  validarOrden,

  MIME_FOTOS_PERMITIDOS,
  MIME_VIDEOS_PERMITIDOS,
  MAX_FOTOS_POR_SERVICIO,
  MAX_VIDEOS_POR_SERVICIO,
  validarId,
  validarFotos,
  validarVideos,
  validarOrden,
};
