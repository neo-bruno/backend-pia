const pool = require("../../database/pool");

// ============================================================
// VERIFICAR QUE EL SERVICIO PERTENECE AL PROFESIONAL
// ============================================================

const getServiceByProfessional = async (profesionalId, servicioId) => {
  const query = `
    SELECT
      s.id,
      s.profesional_id,
      s.nombre
    FROM servicio s
    WHERE s.id = $1
      AND s.profesional_id = $2
    LIMIT 1;
  `;

  const { rows } = await pool.query(query, [servicioId, profesionalId]);

  return rows[0] || null;
};

// ============================================================
// LISTAR CONDICIONES DEL SERVICIO
// ============================================================

const getConditionsByService = async (profesionalId, servicioId) => {
  const query = `
    SELECT
      sc.id AS servicio_condicion_id,

      c.id AS condicion_id,
      c.nombre,
      c.descripcion,
      c.requiere_adelanto,
      c.monto_adelanto,
      c.porcentaje_adelanto,
      c.permite_reprogramar,
      c.permite_cancelar,
      c.limite_horas_reprogramacion,
      c.limite_horas_cancelacion,
      c.created_at,
      c.updated_at

    FROM servicio_condicion sc

    INNER JOIN condicion c
      ON c.id = sc.condicion_id

    INNER JOIN servicio s
      ON s.id = sc.servicio_id

    WHERE sc.servicio_id = $1
      AND s.profesional_id = $2

    ORDER BY c.id ASC;
  `;

  const { rows } = await pool.query(query, [servicioId, profesionalId]);

  return rows;
};

// ============================================================
// OBTENER RELACIÓN
// ============================================================

const getServiceConditionById = async (profesionalId, relacionId) => {
  const query = `
    SELECT
      sc.id AS servicio_condicion_id,

      s.id AS servicio_id,
      s.profesional_id,
      s.nombre AS servicio_nombre,

      c.id AS condicion_id,
      c.nombre,
      c.descripcion,
      c.requiere_adelanto,
      c.monto_adelanto,
      c.porcentaje_adelanto,
      c.permite_reprogramar,
      c.permite_cancelar,
      c.limite_horas_reprogramacion,
      c.limite_horas_cancelacion,
      c.created_at,
      c.updated_at

    FROM servicio_condicion sc

    INNER JOIN servicio s
      ON s.id = sc.servicio_id

    INNER JOIN condicion c
      ON c.id = sc.condicion_id

    WHERE sc.id = $1
      AND s.profesional_id = $2

    LIMIT 1;
  `;

  const { rows } = await pool.query(query, [relacionId, profesionalId]);

  return rows[0] || null;
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
// CREAR RELACIÓN
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

  const { rows } = await client.query(query, [servicioId, condicionId]);

  return rows[0];
};

// ============================================================
// ACTUALIZAR CONDICIÓN
// ============================================================

const updateCondition = async (client, condicionId, condicion) => {
  const query = `
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
      limite_horas_cancelacion = $9,
      updated_at = CURRENT_TIMESTAMP

    WHERE id = $10

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
    condicionId,
  ];

  const { rows } = await client.query(query, values);

  return rows[0] || null;
};

// ============================================================
// ELIMINAR RELACIÓN
// ============================================================

const deleteServiceCondition = async (client, relacionId) => {
  const query = `
    DELETE FROM servicio_condicion
    WHERE id = $1
    RETURNING *;
  `;

  const { rows } = await client.query(query, [relacionId]);

  return rows[0] || null;
};

// ============================================================
// VERIFICAR SI LA CONDICIÓN SIGUE SIENDO USADA
// ============================================================

const conditionHasRelations = async (client, condicionId) => {
  const query = `
    SELECT EXISTS (
      SELECT 1
      FROM servicio_condicion
      WHERE condicion_id = $1
    ) AS usada;
  `;

  const { rows } = await client.query(query, [condicionId]);

  return rows[0].usada;
};

// ============================================================
// ELIMINAR CONDICIÓN
// ============================================================

const deleteCondition = async (client, condicionId) => {
  const query = `
    DELETE FROM condicion
    WHERE id = $1
    RETURNING *;
  `;

  const { rows } = await client.query(query, [condicionId]);

  return rows[0] || null;
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

module.exports = {
  getServiceByProfessional,
  getConditionsByService,
  getServiceConditionById,

  createCondition,
  createServiceCondition,

  updateCondition,

  deleteServiceCondition,
  conditionHasRelations,
  deleteCondition,

  transaction,
};
