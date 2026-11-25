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
const createCondition = async (servicioId, condicion) => {
	const client = await pool.connect();

	try {
		await client.query("BEGIN");

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
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
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

		const { rows } = await client.query(query, values);
		const nuevaCondicion = rows[0];

		await client.query(
			`
        INSERT INTO servicio_condicion (servicio_id, condicion_id)
        VALUES ($1, $2)
      `,
			[servicioId, nuevaCondicion.id],
		);

		await client.query("COMMIT");

		return nuevaCondicion;
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
};

// ============================================================
// EDITAR
// ============================================================
const updateCondition = async (servicioId, condicionId, condicion) => {
	const client = await pool.connect();

	try {
		await client.query("BEGIN");

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

		const { rows } = await client.query(query, values);
		const condicionActualizada = rows[0];

		if (!condicionActualizada) {
			await client.query("ROLLBACK");
			return null;
		}

		// Crea la relación solo si todavía no existe.
		await client.query(
			`
        INSERT INTO servicio_condicion (servicio_id, condicion_id)
        SELECT $1, $2
        WHERE NOT EXISTS (
          SELECT 1
          FROM servicio_condicion
          WHERE servicio_id = $1
            AND condicion_id = $2
        )
      `,
			[servicioId, condicionId],
		);

		await client.query("COMMIT");

		return condicionActualizada;
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
};

module.exports = {
	getConditionById,
	createCondition,
	updateCondition,
};
