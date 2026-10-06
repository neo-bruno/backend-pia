const pool = require("../../database/pool");

// ============================================================
// OBTENER CONDICIÓN
// ============================================================

const getConditionById = async (condicionId) => {
  const query = `
    SELECT
      id,
      nombre,
      descripcion,
      requiere_adelanto,
      monto_adelanto,
      porcentaje_adelanto,
      permite_reprogramar,
      permite_cancelar,
      limite_horas_reprogramacion,
      limite_horas_cancelacion,
      created_at,
      updated_at
    FROM condicion
    WHERE id = $1
  `;

  const { rows } = await pool.query(query, [condicionId]);

  return rows[0] || null;
};

// ============================================================
// CREAR
// ============================================================

const createCondition = async (condicion) => {
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
    RETURNING *
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

  const { rows } = await pool.query(query, values);

  return rows[0];
};

// ============================================================
// EDITAR
// ============================================================

const updateCondition = async (condicionId, condicion) => {
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
    RETURNING *
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

  const { rows } = await pool.query(query, values);

  return rows[0] || null;
};

module.exports = {
  getConditionById,
  createCondition,
  updateCondition,
};
