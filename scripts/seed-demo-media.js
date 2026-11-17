
/**
 * PIA DEMO - CARGA COMPLETA DE RECURSOS MULTIMEDIA
 *
 * Ejecutar desde backend-pia:
 * node scripts/seed-demo-media.js
 *
 * Registra:
 * - Logos de negocios.
 * - Portadas de profesionales.
 * - Galerías de negocios.
 * - Fotografías de servicios.
 * - Videos de servicios.
 *
 * Solo modifica registros DEMO.
 * No modifica el flujo normal de registro.
 * Permite ejecutar nuevamente sin duplicar relaciones.
 */

require("dotenv").config();

const fs = require("fs");
const path = require("path");

const pool = require("../src/database/pool");

const ROOT = path.resolve(__dirname, "..");

const CARPETAS = {
  logos: path.join(ROOT, "uploads/negocios/logos"),
  portadas: path.join(ROOT, "uploads/profesionales/portadas"),
  galerias: path.join(ROOT, "uploads/negocios/galeria"),
  fotosServicios: path.join(ROOT, "uploads/servicios/fotos"),
  videosServicios: path.join(ROOT, "uploads/servicios/videos"),
};

const URLS = {
  logos: "/uploads/negocios/logos",
  portadas: "/uploads/profesionales/portadas",
  galerias: "/uploads/negocios/galeria",
  fotosServicios: "/uploads/servicios/fotos",
  videosServicios: "/uploads/servicios/videos",
};

const EXTENSIONES_IMAGEN = /\.(jpg|jpeg|png|webp)$/i;
const EXTENSIONES_VIDEO = /\.(mp4|webm|mov)$/i;

// ============================================================
// UTILIDADES
// ============================================================

function listarArchivos(carpeta, expresion) {
  if (!fs.existsSync(carpeta)) {
    throw new Error(`No existe la carpeta: ${carpeta}`);
  }

  return fs
    .readdirSync(carpeta, { withFileTypes: true })
    .filter((item) => item.isFile() && expresion.test(item.name))
    .map((item) => item.name)
    .sort((a, b) =>
      a.localeCompare(b, "en", {
        numeric: true,
        sensitivity: "base",
      }),
    );
}

function crearUrl(base, nombre) {
  return `${base}/${encodeURIComponent(nombre)}`;
}

function obtenerMimeType(nombre) {
  const extension = path.extname(nombre).toLowerCase();

  const tipos = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
  };

  return tipos[extension] || "application/octet-stream";
}

function normalizarTexto(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function obtenerPalabras(texto) {
  const ignorar = new Set([
    "demo",
    "pia",
    "negocio",
    "galeria",
    "servicio",
    "interior",
    "foto",
    "video",
    "de",
    "del",
    "la",
    "el",
    "y",
    "para",
    "con",
  ]);

  return normalizarTexto(texto)
    .split(/\s+/)
    .filter((palabra) => palabra.length > 2 && !ignorar.has(palabra));
}

/**
 * Busca coincidencias entre el nombre del archivo
 * y el nombre del servicio.
 *
 * Si no encuentra coincidencia, utiliza distribución
 * secuencial para no dejar archivos sin registrar.
 */
function buscarServicioRelacionado(nombreArchivo, servicios) {
  const palabrasArchivo = obtenerPalabras(
    path.basename(nombreArchivo, path.extname(nombreArchivo)),
  );

  let mejorServicio = null;
  let mejorPuntaje = 0;

  for (const servicio of servicios) {
    const palabrasServicio = obtenerPalabras(servicio.nombre);

    const coincidencias = palabrasServicio.filter((palabra) =>
      palabrasArchivo.includes(palabra),
    ).length;

    if (coincidencias > mejorPuntaje) {
      mejorPuntaje = coincidencias;
      mejorServicio = servicio;
    }
  }

  return mejorServicio;
}

// ============================================================
// REGISTRAR ARCHIVO
// ============================================================

async function registrarArchivo(
  client,
  nombre,
  url,
  tipo,
) {
  const existente = await client.query(
    `SELECT id, tipo
     FROM archivo
     WHERE url = $1
     LIMIT 1`,
    [url],
  );

  if (existente.rows.length) {
    const archivo = existente.rows[0];

    if (archivo.tipo !== tipo) {
      throw new Error(
        `El archivo ${nombre} ya existe con tipo ${archivo.tipo}; se esperaba ${tipo}.`,
      );
    }

    return archivo.id;
  }

  const rutaFisica = path.join(
    ROOT,
    url.replace(/^\/uploads\//, "uploads/"),
  );

  if (!fs.existsSync(rutaFisica)) {
    throw new Error(`No se encuentra el archivo físico: ${rutaFisica}`);
  }

  const estadisticas = fs.statSync(rutaFisica);

  const resultado = await client.query(
    `INSERT INTO archivo (
       nombre,
       url,
       tipo,
       mime_type,
       tamano_bytes
     )
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [
      nombre,
      url,
      tipo,
      obtenerMimeType(nombre),
      estadisticas.size,
    ],
  );

  return resultado.rows[0].id;
}

// ============================================================
// RELACIONAR FOTOGRAFÍAS CON NEGOCIOS
// ============================================================

async function registrarGalerias(
  client,
  negocios,
  archivos,
) {
  const ordenes = new Map();

  let registrados = 0;

  for (let i = 0; i < archivos.length; i++) {
    const nombre = archivos[i];

    // Distribución equilibrada entre los 50 negocios.
    const negocio = negocios[i % negocios.length];

    const orden = (ordenes.get(negocio.id) || 0) + 1;

    const url = crearUrl(URLS.galerias, nombre);

    const archivoId = await registrarArchivo(
      client,
      nombre,
      url,
      "NEGOCIO",
    );

    await client.query(
      `INSERT INTO negocio_archivo (
         negocio_id,
         archivo_id,
         tipo,
         orden,
         principal
       )
       VALUES ($1, $2, 'FOTO', $3, $4)
       ON CONFLICT DO NOTHING`,
      [
        negocio.id,
        archivoId,
        orden,
        orden === 1,
      ],
    );

    ordenes.set(negocio.id, orden);
    registrados++;
  }

  return registrados;
}

// ============================================================
// RELACIONAR FOTOGRAFÍAS Y VIDEOS CON SERVICIOS
// ============================================================

async function registrarArchivosServicios(
  client,
  servicios,
  archivos,
  carpetaUrl,
  tipo,
) {
  if (!servicios.length && archivos.length) {
    throw new Error(
      `No existen servicios DEMO para registrar archivos de tipo ${tipo}.`,
    );
  }

  const ordenes = new Map();

  let registrados = 0;

  for (let i = 0; i < archivos.length; i++) {
    const nombre = archivos[i];

    // Primero intenta relacionar el archivo por nombre.
    let servicio = buscarServicioRelacionado(
      nombre,
      servicios,
    );

    // Si no hay coincidencia, distribuye secuencialmente.
    if (!servicio) {
      servicio = servicios[i % servicios.length];
    }

    const clave = `${servicio.id}-${tipo}`;

    const orden = (ordenes.get(clave) || 0) + 1;

    const url = crearUrl(carpetaUrl, nombre);

    const archivoId = await registrarArchivo(
      client,
      nombre,
      url,
      "SERVICIO",
    );

    await client.query(
      `INSERT INTO servicio_archivo (
         servicio_id,
         archivo_id,
         tipo,
         orden,
         principal
       )
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING`,
      [
        servicio.id,
        archivoId,
        tipo,
        orden,
        tipo === "FOTO" && orden === 1,
      ],
    );

    ordenes.set(clave, orden);
    registrados++;
  }

  return registrados;
}

// ============================================================
// PROCESO PRINCIPAL
// ============================================================

async function main() {
  const logos = listarArchivos(
    CARPETAS.logos,
    EXTENSIONES_IMAGEN,
  );

  const portadas = listarArchivos(
    CARPETAS.portadas,
    EXTENSIONES_IMAGEN,
  );

  const galerias = listarArchivos(
    CARPETAS.galerias,
    EXTENSIONES_IMAGEN,
  );

  const fotosServicios = listarArchivos(
    CARPETAS.fotosServicios,
    EXTENSIONES_IMAGEN,
  );

  const videosServicios = listarArchivos(
    CARPETAS.videosServicios,
    EXTENSIONES_VIDEO,
  );

  console.log("\n==================================");
  console.log("PIA DEMO - ARCHIVOS ENCONTRADOS");
  console.log("==================================");

  console.log({
    logos: logos.length,
    portadas: portadas.length,
    galerias: galerias.length,
    fotosServicios: fotosServicios.length,
    videosServicios: videosServicios.length,
  });

  // Validaciones de archivos obligatorios.
  if (logos.length !== 50) {
    throw new Error(
      `Se esperaban 50 logos y se encontraron ${logos.length}.`,
    );
  }

  if (portadas.length !== 120) {
    throw new Error(
      `Se esperaban 120 portadas y se encontraron ${portadas.length}.`,
    );
  }

  if (!galerias.length) {
    throw new Error("No se encontraron fotografías en negocios/galeria.");
  }

  if (!fotosServicios.length) {
    throw new Error("No se encontraron fotografías en servicios/fotos.");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      "SELECT pg_advisory_xact_lock(2026111201)",
    );

    // --------------------------------------------------------
    // NEGOCIOS DEMO
    // --------------------------------------------------------

    const resultadoNegocios = await client.query(`
      SELECT id, codigo, nombre
      FROM negocio
      WHERE codigo LIKE 'DEMO-PIA-%'
      ORDER BY codigo ASC
    `);

    const negocios = resultadoNegocios.rows;

    if (negocios.length !== 50) {
      throw new Error(
        `Se encontraron ${negocios.length} negocios DEMO; se esperaban 50.`,
      );
    }

    // --------------------------------------------------------
    // PROFESIONALES DEMO
    // --------------------------------------------------------

    const resultadoProfesionales = await client.query(`
      SELECT id, slug
      FROM profesional
      WHERE slug LIKE 'demo-pia-prof-%'
      ORDER BY slug ASC
    `);

    const profesionales = resultadoProfesionales.rows;

    if (profesionales.length !== 120) {
      throw new Error(
        `Se encontraron ${profesionales.length} profesionales DEMO; se esperaban 120.`,
      );
    }

    // --------------------------------------------------------
    // SERVICIOS DEMO
    // --------------------------------------------------------

    const resultadoServicios = await client.query(`
      SELECT
        s.id,
        s.nombre,
        s.profesional_id
      FROM servicio s
      INNER JOIN profesional p
        ON p.id = s.profesional_id
      WHERE p.slug LIKE 'demo-pia-prof-%'
      ORDER BY s.id ASC
    `);

    const servicios = resultadoServicios.rows;

    if (!servicios.length) {
      throw new Error(
        "No se encontraron servicios vinculados a profesionales DEMO.",
      );
    }

    console.log("\nREGISTROS DEMO:");
    console.log({
      negocios: negocios.length,
      profesionales: profesionales.length,
      servicios: servicios.length,
    });

    // ========================================================
    // 1. LOGOS DE NEGOCIOS
    // ========================================================

    for (let i = 0; i < negocios.length; i++) {
      const negocio = negocios[i];

      const url = crearUrl(
        URLS.logos,
        logos[i],
      );

      await client.query(
        `UPDATE negocio
         SET logo = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
           AND codigo LIKE 'DEMO-PIA-%'`,
        [url, negocio.id],
      );
    }

    // ========================================================
    // 2. PORTADAS DE PROFESIONALES
    // ========================================================

    for (let i = 0; i < profesionales.length; i++) {
      const profesional = profesionales[i];

      const url = crearUrl(
        URLS.portadas,
        portadas[i],
      );

      await client.query(
        `UPDATE profesional
         SET portada = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
           AND slug LIKE 'demo-pia-prof-%'`,
        [url, profesional.id],
      );
    }

    // ========================================================
    // 3. GALERÍAS DE NEGOCIOS
    // ========================================================

    const totalGalerias = await registrarGalerias(
      client,
      negocios,
      galerias,
    );

    // ========================================================
    // 4. FOTOGRAFÍAS DE SERVICIOS
    // ========================================================

    const totalFotosServicios =
      await registrarArchivosServicios(
        client,
        servicios,
        fotosServicios,
        URLS.fotosServicios,
        "FOTO",
      );

    // ========================================================
    // 5. VIDEOS DE SERVICIOS
    // ========================================================

    const totalVideosServicios =
      await registrarArchivosServicios(
        client,
        servicios,
        videosServicios,
        URLS.videosServicios,
        "VIDEO",
      );

    // ========================================================
    // COMMIT
    // ========================================================

    await client.query("COMMIT");

    console.log("\n==================================");
    console.log("CARGA MULTIMEDIA COMPLETADA");
    console.log("==================================");

    console.log({
      negociosConLogo: negocios.length,
      profesionalesConPortada: profesionales.length,
      fotografiasGaleria: totalGalerias,
      fotografiasServicios: totalFotosServicios,
      videosServicios: totalVideosServicios,
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error("\nERROR. SE REVERTIERON LOS CAMBIOS:");
    console.error(error.message);

    process.exitCode = 1;

  } finally {
    client.release();
    await pool.end();
  }
}

// ============================================================
// EJECUCIÓN
// ============================================================

main().catch(async (error) => {
  console.error("\nERROR INESPERADO:");
  console.error(error);

  await pool.end();

  process.exit(1);
});
