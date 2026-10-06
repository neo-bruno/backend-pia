const pool = require("../../database/pool");

// ============================================================
// LISTAR ARCHIVOS
// ============================================================

const getFilesByService = async (servicioId) => {
  const query = `
    SELECT
      sa.id,
      sa.servicio_id,
      sa.archivo_id,
      sa.tipo,
      sa.orden,
      sa.principal,

      a.nombre,
      a.url,
      a.mime_type,
      a.tamano_bytes,
      a.created_at,
      a.updated_at

    FROM servicio_archivo sa

    INNER JOIN archivo a
      ON a.id = sa.archivo_id

    WHERE sa.servicio_id = $1

    ORDER BY
      sa.tipo ASC,
      sa.orden ASC,
      sa.id ASC
  `;

  const { rows } = await pool.query(query, [servicioId]);

  return rows;
};

// ============================================================
// OBTENER ARCHIVO
// ============================================================

const getFileById = async (archivoId) => {
  const query = `
    SELECT
      sa.id,
      sa.servicio_id,
      sa.archivo_id,
      sa.tipo,
      sa.orden,
      sa.principal,

      a.nombre,
      a.url,
      a.mime_type,
      a.tamano_bytes

    FROM servicio_archivo sa

    INNER JOIN archivo a
      ON a.id = sa.archivo_id

    WHERE sa.id = $1
  `;

  const { rows } = await pool.query(query, [archivoId]);

  return rows[0] || null;
};

// ============================================================
// MARCAR PRINCIPAL
// ============================================================
//
// IMPORTANTE:
// - NO modifica el orden.
// - NO mueve la foto.
// - Solamente cambia principal.
// ============================================================

const setPrincipal = async (archivoId, servicioId) => {
  console.log("🔥🔥🔥 SET PRINCIPAL EJECUTADO");
  console.log("🔥 archivoId:", archivoId);
  console.log("🔥 servicioId:", servicioId);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ----------------------------------------------------------
    // 1. Verificar que la foto existe y pertenece al servicio
    // ----------------------------------------------------------

    const fotoResult = await client.query(
      `
        SELECT
          id,
          servicio_id,
          archivo_id,
          tipo,
          orden
        FROM servicio_archivo
        WHERE id = $1
          AND servicio_id = $2
          AND tipo = 'FOTO'
        FOR UPDATE
      `,
      [archivoId, servicioId],
    );

    if (!fotoResult.rows.length) {
      throw new Error("La foto no existe o no pertenece al servicio");
    }

    // ----------------------------------------------------------
    // 2. Quitar principal a todas las fotos
    // ----------------------------------------------------------

    await client.query(
      `
        UPDATE servicio_archivo
        SET principal = FALSE
        WHERE servicio_id = $1
          AND tipo = 'FOTO'
      `,
      [servicioId],
    );

    // ----------------------------------------------------------
    // 3. Marcar la seleccionada como principal
    //
    // IMPORTANTE:
    // NO tocamos orden.
    // ----------------------------------------------------------

    const resultado = await client.query(
      `
        UPDATE servicio_archivo
        SET principal = TRUE
        WHERE id = $1
          AND servicio_id = $2
          AND tipo = 'FOTO'
        RETURNING
          id,
          servicio_id,
          archivo_id,
          tipo,
          orden,
          principal
      `,
      [archivoId, servicioId],
    );

    if (!resultado.rows.length) {
      throw new Error("No se pudo establecer la imagen principal");
    }

    await client.query("COMMIT");

    return resultado.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// ============================================================
// ACTUALIZAR ORDEN DE FOTO
// ============================================================
//
// IMPORTANTE:
// - Solamente cambia orden.
// - NO cambia principal.
// ============================================================

const updateOrder = async (archivoId, orden) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ----------------------------------------------------------
    // 1. Obtener archivo
    // ----------------------------------------------------------

    const actualResult = await client.query(
      `
        SELECT
          id,
          servicio_id,
          tipo,
          orden,
          principal
        FROM servicio_archivo
        WHERE id = $1
        FOR UPDATE
      `,
      [archivoId],
    );

    if (!actualResult.rows.length) {
      throw new Error("El archivo del servicio no existe");
    }

    const archivoActual = actualResult.rows[0];

    const servicioId = archivoActual.servicio_id;
    const tipo = archivoActual.tipo;
    const ordenActual = Number(archivoActual.orden);
    const nuevoOrden = Number(orden);

    // ----------------------------------------------------------
    // 2. Si no cambia el orden
    // ----------------------------------------------------------

    if (ordenActual === nuevoOrden) {
      await client.query("COMMIT");
      return archivoActual;
    }

    // ----------------------------------------------------------
    // 3. Obtener todos los archivos del mismo tipo
    // ----------------------------------------------------------

    const archivosResult = await client.query(
      `
        SELECT
          id,
          orden,
          principal
        FROM servicio_archivo
        WHERE servicio_id = $1
          AND tipo = $2
        ORDER BY
          orden ASC,
          id ASC
        FOR UPDATE
      `,
      [servicioId, tipo],
    );

    const archivos = archivosResult.rows;

    const cantidadArchivos = archivos.length;

    // ----------------------------------------------------------
    // 4. Validar orden
    // ----------------------------------------------------------

    if (nuevoOrden < 1 || nuevoOrden > cantidadArchivos) {
      throw new Error(`El orden debe estar entre 1 y ${cantidadArchivos}`);
    }

    // ----------------------------------------------------------
    // 5. Sacar temporalmente los archivos de sus órdenes
    //
    // Evita conflicto con:
    // UNIQUE(servicio_id, tipo, orden)
    // ----------------------------------------------------------

    for (let i = 0; i < archivos.length; i++) {
      await client.query(
        `
          UPDATE servicio_archivo
          SET orden = $1
          WHERE id = $2
        `,
        [-(i + 1), archivos[i].id],
      );
    }

    // ----------------------------------------------------------
    // 6. Encontrar archivo movido
    // ----------------------------------------------------------

    const archivoMovido = archivos.find(
      (archivo) => Number(archivo.id) === Number(archivoId),
    );

    if (!archivoMovido) {
      throw new Error("No se encontró el archivo que se desea mover");
    }

    // ----------------------------------------------------------
    // 7. Quitar archivo de su posición
    // ----------------------------------------------------------

    const archivosRestantes = archivos.filter(
      (archivo) => Number(archivo.id) !== Number(archivoId),
    );

    // ----------------------------------------------------------
    // 8. Insertarlo en la nueva posición
    // ----------------------------------------------------------

    archivosRestantes.splice(nuevoOrden - 1, 0, archivoMovido);

    // ----------------------------------------------------------
    // 9. Reconstruir únicamente el orden
    //
    // IMPORTANTE:
    // Conservamos principal exactamente como estaba.
    // ----------------------------------------------------------

    for (let i = 0; i < archivosRestantes.length; i++) {
      await client.query(
        `
          UPDATE servicio_archivo
          SET orden = $1
          WHERE id = $2
        `,
        [i + 1, archivosRestantes[i].id],
      );
    }

    // ----------------------------------------------------------
    // 10. Obtener resultado
    // ----------------------------------------------------------

    const resultado = await client.query(
      `
        SELECT
          id,
          servicio_id,
          archivo_id,
          tipo,
          orden,
          principal
        FROM servicio_archivo
        WHERE id = $1
      `,
      [archivoId],
    );

    if (!resultado.rows.length) {
      throw new Error(
        "No se pudo obtener el archivo después de actualizar el orden",
      );
    }

    await client.query("COMMIT");

    return resultado.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// ============================================================
// ELIMINAR RELACIÓN Y ARCHIVO
// ============================================================
//
// REGLA:
// Si eliminamos la principal:
//
//     Foto 1 ⭐
//     Foto 2
//     Foto 3
//
// pasa a:
//
//     Foto 2 ⭐
//     Foto 3
//
// La principal será la primera foto por orden.
//
// Si eliminamos una foto que NO es principal,
// la principal permanece intacta.
// ============================================================

const deleteFile = async (archivoId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ----------------------------------------------------------
    // 1. Obtener información de la relación
    // ----------------------------------------------------------

    const relacionResult = await client.query(
      `
        SELECT
          id,
          servicio_id,
          archivo_id,
          tipo,
          orden,
          principal
        FROM servicio_archivo
        WHERE id = $1
        FOR UPDATE
      `,
      [archivoId],
    );

    if (!relacionResult.rows.length) {
      throw new Error("El archivo del servicio no existe");
    }

    const relacion = relacionResult.rows[0];

    const archivoIdReal = relacion.archivo_id;
    const servicioId = relacion.servicio_id;
    const tipo = relacion.tipo;
    const eraPrincipal = relacion.principal === true;

    // ----------------------------------------------------------
    // 2. Eliminar relación
    // ----------------------------------------------------------

    await client.query(
      `
        DELETE FROM servicio_archivo
        WHERE id = $1
      `,
      [archivoId],
    );

    // ----------------------------------------------------------
    // 3. Eliminar archivo físico de BD
    // ----------------------------------------------------------

    await client.query(
      `
        DELETE FROM archivo
        WHERE id = $1
      `,
      [archivoIdReal],
    );

    // ----------------------------------------------------------
    // 4. Si NO es una FOTO, terminamos
    // ----------------------------------------------------------

    if (tipo !== "FOTO") {
      await client.query("COMMIT");
      return;
    }

    // ----------------------------------------------------------
    // 5. Obtener fotos restantes
    // ----------------------------------------------------------

    const fotosResult = await client.query(
      `
        SELECT
          id,
          orden,
          principal
        FROM servicio_archivo
        WHERE servicio_id = $1
          AND tipo = 'FOTO'
        ORDER BY
          orden ASC,
          id ASC
        FOR UPDATE
      `,
      [servicioId],
    );

    const fotos = fotosResult.rows;

    // ----------------------------------------------------------
    // 6. Si no quedan fotos
    // ----------------------------------------------------------

    if (!fotos.length) {
      await client.query("COMMIT");
      return;
    }

    // ----------------------------------------------------------
    // 7. Reordenar las fotos restantes
    //
    // Primero usamos valores negativos para evitar
    // conflictos con UNIQUE(servicio_id, tipo, orden)
    // ----------------------------------------------------------

    for (let i = 0; i < fotos.length; i++) {
      await client.query(
        `
          UPDATE servicio_archivo
          SET orden = $1
          WHERE id = $2
        `,
        [-(i + 1), fotos[i].id],
      );
    }

    // ----------------------------------------------------------
    // 8. Determinar si actualmente existe una principal
    // ----------------------------------------------------------

    const existePrincipal = fotos.some((foto) => foto.principal === true);

    // ----------------------------------------------------------
    // 9. Reconstruir orden
    //
    // Si eliminamos la principal, la primera queda principal.
    //
    // Si no eliminamos la principal, conservamos la existente.
    //
    // Si por alguna inconsistencia no existe principal,
    // también recuperamos la primera.
    // ----------------------------------------------------------

    const debeAsignarPrincipal = eraPrincipal || !existePrincipal;

    for (let i = 0; i < fotos.length; i++) {
      const foto = fotos[i];

      let principal;

      if (debeAsignarPrincipal) {
        principal = i === 0;
      } else {
        principal = foto.principal === true;
      }

      await client.query(
        `
          UPDATE servicio_archivo
          SET
            orden = $1,
            principal = $2
          WHERE id = $3
        `,
        [i + 1, principal, foto.id],
      );
    }

    // ----------------------------------------------------------
    // 10. Confirmar
    // ----------------------------------------------------------

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// ============================================================
// VERIFICAR SERVICIO DEL PROFESIONAL
// ============================================================

const getServiceByProfessional = async (servicioId, profesionalId) => {
  const query = `
    SELECT
      id,
      profesional_id
    FROM servicio
    WHERE id = $1
      AND profesional_id = $2
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [servicioId, profesionalId]);

  return rows[0] || null;
};

// ============================================================
// CONTAR FOTOS
// ============================================================

const countPhotosByService = async (servicioId) => {
  const query = `
    SELECT COUNT(*)::INTEGER AS cantidad
    FROM servicio_archivo
    WHERE servicio_id = $1
      AND tipo = 'FOTO'
  `;

  const { rows } = await pool.query(query, [servicioId]);

  return rows[0]?.cantidad || 0;
};

// ============================================================
// OBTENER ÚLTIMO ORDEN DE FOTOS
// ============================================================

const getLastPhotoOrder = async (servicioId) => {
  const query = `
    SELECT
      COALESCE(MAX(orden), 0)::INTEGER AS orden
    FROM servicio_archivo
    WHERE servicio_id = $1
      AND tipo = 'FOTO'
  `;

  const { rows } = await pool.query(query, [servicioId]);

  return rows[0]?.orden || 0;
};

// ============================================================
// VERIFICAR SI EXISTE FOTO PRINCIPAL
// ============================================================

const hasPrincipalPhoto = async (servicioId) => {
  const query = `
    SELECT EXISTS (
      SELECT 1
      FROM servicio_archivo
      WHERE servicio_id = $1
        AND tipo = 'FOTO'
        AND principal = TRUE
    ) AS existe
  `;

  const { rows } = await pool.query(query, [servicioId]);

  return rows[0]?.existe === true;
};

// ============================================================
// CREAR ARCHIVO
// ============================================================

const createFile = async (client, archivo) => {
  const tipo = "SERVICIO";

  const url = `/uploads/servicios/${archivo.filename}`;

  const query = `
    INSERT INTO archivo (
      nombre,
      url,
      tipo,
      mime_type,
      tamano_bytes
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;

  const values = [
    archivo.originalname,
    url,
    tipo,
    archivo.mimetype,
    archivo.size,
  ];

  const { rows } = await client.query(query, values);

  return rows[0];
};

// ============================================================
// CREAR RELACIÓN SERVICIO - ARCHIVO
// ============================================================
//
// REGLA:
// - Si ya existe una principal, la nueva NO será principal.
// - Si no existe ninguna principal:
//
//      si existen fotos anteriores:
//          la primera anterior será principal.
//
//      si es la primera foto:
//          la nueva será principal.
//
// Esto evita que una foto nueva robe la principal existente.
// ============================================================

const createServiceFile = async (
  client,
  servicioId,
  archivoId,
  tipo,
  orden,
  principal,
) => {
  let principalFinal = Boolean(principal);

  if (tipo === "FOTO") {
    // --------------------------------------------------------
    // Verificar si ya existe una foto principal
    // --------------------------------------------------------

    const principalResult = await client.query(
      `
        SELECT id
        FROM servicio_archivo
        WHERE servicio_id = $1
          AND tipo = 'FOTO'
          AND principal = TRUE
        LIMIT 1
      `,
      [servicioId],
    );

    const existePrincipal = principalResult.rows.length > 0;

    if (existePrincipal) {
      // Nunca cambiar la principal existente
      principalFinal = false;
    } else {
      // ------------------------------------------------------
      // No existe principal.
      //
      // Verificamos si ya existen fotos.
      // ------------------------------------------------------

      const fotosResult = await client.query(
        `
          SELECT
            id,
            orden
          FROM servicio_archivo
          WHERE servicio_id = $1
            AND tipo = 'FOTO'
          ORDER BY
            orden ASC,
            id ASC
          LIMIT 1
        `,
        [servicioId],
      );

      if (fotosResult.rows.length > 0) {
        // Ya existen fotos.
        // La primera existente será principal.
        principalFinal = false;

        await client.query(
          `
            UPDATE servicio_archivo
            SET principal = TRUE
            WHERE id = $1
          `,
          [fotosResult.rows[0].id],
        );
      } else {
        // Es la primera foto del servicio
        principalFinal = true;
      }
    }
  }

  const query = `
    INSERT INTO servicio_archivo (
      servicio_id,
      archivo_id,
      tipo,
      orden,
      principal
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;

  const values = [servicioId, archivoId, tipo, orden, principalFinal];

  const { rows } = await client.query(query, values);

  return rows[0];
};

// ============================================================
// CONTAR VIDEOS
// ============================================================

const countVideosByService = async (servicioId) => {
  const query = `
    SELECT COUNT(*)::INTEGER AS cantidad
    FROM servicio_archivo
    WHERE servicio_id = $1
      AND tipo = 'VIDEO'
  `;

  const { rows } = await pool.query(query, [servicioId]);

  return rows[0]?.cantidad || 0;
};

// ============================================================
// OBTENER ÚLTIMO ORDEN DE VIDEOS
// ============================================================

const getLastVideoOrder = async (servicioId) => {
  const query = `
    SELECT
      COALESCE(MAX(orden), 0)::INTEGER AS orden
    FROM servicio_archivo
    WHERE servicio_id = $1
      AND tipo = 'VIDEO'
  `;

  const { rows } = await pool.query(query, [servicioId]);

  return rows[0]?.orden || 0;
};

// ============================================================
// TRANSACCIÓN
// ============================================================

const transaction = async (callback) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const resultado = await callback(client);

    await client.query("COMMIT");

    return resultado;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  getServiceByProfessional,

  countPhotosByService,
  getLastPhotoOrder,
  hasPrincipalPhoto,

  createFile,
  createServiceFile,

  getFilesByService,
  getFileById,

  setPrincipal,
  updateOrder,
  deleteFile,

  transaction,

  countVideosByService,
  getLastVideoOrder,
};
