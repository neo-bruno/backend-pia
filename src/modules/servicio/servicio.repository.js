const pool = require("../../database/pool");

// ============================================================
// CREAR SERVICIO
// ============================================================

const createService = async (client, profesionalId, servicio) => {
  const query = `
    INSERT INTO servicio (
      profesional_id,
      nombre,
      descripcion,
      duracion,
      precio
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;

  const values = [
    profesionalId,
    servicio.nombre,
    servicio.descripcion,
    servicio.duracion,
    servicio.precio,
  ];

  const { rows } = await client.query(query, values);

  return rows[0];
};

// ============================================================
// CREAR CONDICIÓN
// ============================================================

const createCondition = async (client, condicion) => {
  const query = `
    INSERT INTO condicion (
      nombre,
      descripcion,
      requiere_adelanto,
      monto_adelanto,
      porcentaje_adelanto,
      permite_reprogramar,
      permite_cancelar,
      limite_horas_reprogramacion,
      limite_horas_cancelacion
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7,
      $8,
      $9
    )
    RETURNING *;
  `;

  const values = [
    condicion.nombre,
    condicion.descripcion,
    condicion.requiere_adelanto,
    condicion.monto_adelanto,
    condicion.porcentaje_adelanto,
    condicion.permite_reprogramar,
    condicion.permite_cancelar,
    condicion.limite_horas_reprogramacion,
    condicion.limite_horas_cancelacion,
  ];

  const { rows } = await client.query(query, values);

  return rows[0];
};

// ============================================================
// RELACION SERVICIO - CONDICIÓN
// ============================================================

const createServiceCondition = async (client, servicioId, condicionId) => {
  const query = `
    INSERT INTO servicio_condicion (
      servicio_id,
      condicion_id
    )
    VALUES ($1, $2)
    RETURNING *;
  `;

  const values = [servicioId, condicionId];

  const { rows } = await client.query(query, values);

  return rows[0];
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
// RELACION SERVICIO - ARCHIVO
// ============================================================

const createServiceFile = async (
  client,
  servicioId,
  archivoId,
  tipo,
  orden,
  principal,
) => {
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

  const values = [servicioId, archivoId, tipo, orden, principal];

  const { rows } = await client.query(query, values);

  return rows[0];
};

// ============================================================
// OBTENER SERVICIOS
// ============================================================

const getServicesByProfessionalId = async (profesionalId) => {
  const query = `
    SELECT
      s.id,
      s.profesional_id,
      s.nombre,
      s.descripcion,
      s.duracion,
      s.precio,
      s.estado,
      s.created_at,
      s.updated_at,

      (
        SELECT jsonb_build_object(
          'id', c.id,
          'nombre', c.nombre,
          'descripcion', c.descripcion,
          'requiere_adelanto',
            c.requiere_adelanto,
          'monto_adelanto',
            c.monto_adelanto,
          'porcentaje_adelanto',
            c.porcentaje_adelanto,
          'permite_reprogramar',
            c.permite_reprogramar,
          'permite_cancelar',
            c.permite_cancelar,
          'limite_horas_reprogramacion',
            c.limite_horas_reprogramacion,
          'limite_horas_cancelacion',
            c.limite_horas_cancelacion
        )

        FROM servicio_condicion sc

        INNER JOIN condicion c
          ON c.id = sc.condicion_id

        WHERE sc.servicio_id = s.id

        LIMIT 1
      ) AS condicion,

      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', sa.id,
              'archivo_id', a.id,
              'nombre', a.nombre,
              'url', a.url,
              'tipo', sa.tipo,
              'mime_type', a.mime_type,
              'tamano_bytes', a.tamano_bytes,
              'orden', sa.orden,
              'principal', sa.principal
            )
            ORDER BY
              CASE
                WHEN sa.tipo = 'FOTO' AND sa.principal = TRUE THEN 0
                WHEN sa.tipo = 'FOTO' THEN 1
                ELSE 2
              END,
              sa.orden ASC,
              sa.id ASC
          )
          FROM servicio_archivo sa

          INNER JOIN archivo a
            ON a.id = sa.archivo_id

          WHERE sa.servicio_id = s.id
        ),
        '[]'::jsonb
      ) AS archivos

    FROM servicio s

    WHERE s.profesional_id = $1

    ORDER BY s.created_at DESC;
  `;

  const { rows } = await pool.query(query, [profesionalId]);

  return rows;
};

// ============================================================
// OBTENER UN SERVICIO
// ============================================================

const getServiceByIdForProfessional = async (profesionalId, servicioId) => {
  const query = `
    SELECT
      s.id,
      s.profesional_id,
      s.nombre,
      s.descripcion,
      s.duracion,
      s.precio,
      s.estado,
      s.created_at,
      s.updated_at,

      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', c.id,
              'nombre', c.nombre,
              'descripcion', c.descripcion,
              'requiere_adelanto',
                c.requiere_adelanto,
              'monto_adelanto',
                c.monto_adelanto,
              'porcentaje_adelanto',
                c.porcentaje_adelanto,
              'permite_reprogramar',
                c.permite_reprogramar,
              'permite_cancelar',
                c.permite_cancelar,
              'limite_horas_reprogramacion',
                c.limite_horas_reprogramacion,
              'limite_horas_cancelacion',
                c.limite_horas_cancelacion
            )
            ORDER BY c.id
          )
          FROM servicio_condicion sc

          INNER JOIN condicion c
            ON c.id = sc.condicion_id

          WHERE sc.servicio_id = s.id
        ),
        '[]'::jsonb
      ) AS condiciones,

      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', sa.id,
              'archivo_id', a.id,
              'nombre', a.nombre,
              'url', a.url,
              'tipo', sa.tipo,
              'mime_type', a.mime_type,
              'tamano_bytes', a.tamano_bytes,
              'orden', sa.orden,
              'principal', sa.principal
            )
            ORDER BY
              CASE
                WHEN sa.tipo = 'FOTO' AND sa.principal = TRUE THEN 0
                WHEN sa.tipo = 'FOTO' THEN 1
                ELSE 2
              END,
              sa.orden ASC,
              sa.id ASC
          )
          FROM servicio_archivo sa

          INNER JOIN archivo a
            ON a.id = sa.archivo_id

          WHERE sa.servicio_id = s.id
        ),
        '[]'::jsonb
      ) AS archivos

    FROM servicio s

    WHERE s.id = $1
      AND s.profesional_id = $2

    LIMIT 1;
  `;

  const { rows } = await pool.query(query, [servicioId, profesionalId]);

  return rows[0] || null;
};

// ============================================================
// EDITAR SERVICIO
// ============================================================

const updateService = async (profesionalId, servicioId, servicio, client) => {
  const query = `
    UPDATE servicio
    SET
      nombre = $1,
      descripcion = $2,
      duracion = $3,
      precio = $4,
      updated_at = CURRENT_TIMESTAMP

    WHERE id = $5
      AND profesional_id = $6

    RETURNING *;
  `;

  const values = [
    servicio.nombre,
    servicio.descripcion,
    servicio.duracion,
    servicio.precio,
    servicioId,
    profesionalId,
  ];

  const executor = client || pool;

  const { rows } = await executor.query(query, values);

  return rows[0] || null;
};

// ============================================================
// ACTUALIZAR CONDICIÓN DEL SERVICIO
// ============================================================

const updateServiceCondition = async (servicioId, condicion, client) => {
  // ----------------------------------------------------------
  // SI LA CONDICIÓN YA EXISTE
  // ----------------------------------------------------------

  if (condicion.id) {
    const updateQuery = `
      UPDATE condicion
      SET
        nombre = $1,
        descripcion = $2,
        requiere_adelanto = $3,
        monto_adelanto = $4,
        porcentaje_adelanto = $5,
        permite_reprogramar = $6,
        permite_cancelar = $7,
        limite_horas_reprogramacion = $8,
        limite_horas_cancelacion = $9

      WHERE id = $10

      RETURNING *;
    `;

    const updateValues = [
      condicion.nombre,
      condicion.descripcion,
      condicion.requiere_adelanto,
      condicion.monto_adelanto,
      condicion.porcentaje_adelanto,
      condicion.permite_reprogramar,
      condicion.permite_cancelar,
      condicion.limite_horas_reprogramacion,
      condicion.limite_horas_cancelacion,
      condicion.id,
    ];

    const { rows } = await client.query(updateQuery, updateValues);

    if (!rows.length) {
      const error = new Error("La condición indicada no existe");

      error.status = 404;

      throw error;
    }

    // --------------------------------------------------------
    // ASEGURAR QUE LA CONDICIÓN ESTÉ RELACIONADA
    // CON ESTE SERVICIO
    // --------------------------------------------------------

    const relacionQuery = `
      SELECT id
      FROM servicio_condicion
      WHERE servicio_id = $1
      LIMIT 1;
    `;

    const relacionResult = await client.query(relacionQuery, [servicioId]);

    if (!relacionResult.rows.length) {
      const insertarRelacionQuery = `
        INSERT INTO servicio_condicion (
          servicio_id,
          condicion_id
        )
        VALUES ($1, $2)
        RETURNING *;
      `;

      await client.query(insertarRelacionQuery, [servicioId, condicion.id]);
    } else {
      const actualizarRelacionQuery = `
        UPDATE servicio_condicion
        SET condicion_id = $1
        WHERE servicio_id = $2;
      `;

      await client.query(actualizarRelacionQuery, [condicion.id, servicioId]);
    }

    return rows[0];
  }

  // ----------------------------------------------------------
  // SI ES UNA CONDICIÓN NUEVA
  // ----------------------------------------------------------

  const nuevaCondicionQuery = `
    INSERT INTO condicion (
      nombre,
      descripcion,
      requiere_adelanto,
      monto_adelanto,
      porcentaje_adelanto,
      permite_reprogramar,
      permite_cancelar,
      limite_horas_reprogramacion,
      limite_horas_cancelacion
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7,
      $8,
      $9
    )
    RETURNING *;
  `;

  const nuevaCondicionValues = [
    condicion.nombre,
    condicion.descripcion,
    condicion.requiere_adelanto,
    condicion.monto_adelanto,
    condicion.porcentaje_adelanto,
    condicion.permite_reprogramar,
    condicion.permite_cancelar,
    condicion.limite_horas_reprogramacion,
    condicion.limite_horas_cancelacion,
  ];

  const { rows: nuevasCondiciones } = await client.query(
    nuevaCondicionQuery,
    nuevaCondicionValues,
  );

  const nuevaCondicion = nuevasCondiciones[0];

  // ----------------------------------------------------------
  // ELIMINAR RELACIÓN ANTERIOR
  // ----------------------------------------------------------

  await client.query(
    `
      DELETE FROM servicio_condicion
      WHERE servicio_id = $1;
    `,
    [servicioId],
  );

  // ----------------------------------------------------------
  // CREAR NUEVA RELACIÓN
  // ----------------------------------------------------------

  await client.query(
    `
      INSERT INTO servicio_condicion (
        servicio_id,
        condicion_id
      )
      VALUES ($1, $2);
    `,
    [servicioId, nuevaCondicion.id],
  );

  return nuevaCondicion;
};

// ============================================================
// ELIMINAR RELACIÓN SERVICIO - CONDICIÓN
// ============================================================

const removeServiceCondition = async (servicioId, client) => {
  const query = `
    DELETE FROM servicio_condicion
    WHERE servicio_id = $1;
  `;

  await client.query(query, [servicioId]);
};

// ============================================================
// ACTUALIZAR ESTADO
// ============================================================

const updateServiceStatus = async (profesionalId, servicioId, estado) => {
  const query = `
    UPDATE servicio
    SET
      estado = $1,
      updated_at = CURRENT_TIMESTAMP

    WHERE id = $2
      AND profesional_id = $3

    RETURNING *;
  `;

  const values = [estado, servicioId, profesionalId];

  const { rows } = await pool.query(query, values);

  return rows[0] || null;
};

// ============================================================
// SERVICIOS POR NEGOCIO
// ============================================================

const buscarServiciosPorNegocio = async (client, negocioId) => {
  const query = `
    SELECT
      s.id,
      s.nombre,
      s.descripcion,
      s.duracion,
      s.precio,

      p.id AS profesional_id,
      per.nombre AS profesional_nombre

    FROM servicio s

    INNER JOIN profesional p
      ON p.id = s.profesional_id

    INNER JOIN persona per
      ON per.id = p.persona_id

    INNER JOIN profesional_negocio pn
      ON pn.profesional_id = p.id

    WHERE pn.negocio_id = $1
      AND pn.acceso = 'ACEPTADO'
      AND pn.estado = 'HABILITADO'
      AND s.estado = 'HABILITADO'
      AND p.estado = 'ACTIVO'
      AND p.estado_funciones = 'HABILITADO'

    ORDER BY s.nombre ASC;
  `;

  const { rows } = await client.query(query, [negocioId]);

  return rows;
};

// ============================================================
// TRANSACCIÓN
// ============================================================

const transaction = async (callback) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await callback(client);

    await client.query("COMMIT");

    return result;
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
  buscarServiciosPorNegocio,

  createService,
  createCondition,
  createServiceCondition,

  createFile,
  createServiceFile,

  getServicesByProfessionalId,
  getServiceByIdForProfessional,

  updateService,
  updateServiceStatus,
  updateServiceCondition,
  removeServiceCondition,

  transaction,
};
