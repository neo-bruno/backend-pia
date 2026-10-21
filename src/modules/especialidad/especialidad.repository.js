const pool = require("../../database/pool");

async function getNegocioByUsuarioId(usuarioId) {
	const sql = `
		SELECT n.id
		FROM usuario u
		INNER JOIN profesional pr
			ON pr.persona_id = u.persona_id
		INNER JOIN profesional_negocio pn
			ON pn.profesional_id = pr.id
		INNER JOIN negocio n
			ON n.id = pn.negocio_id
		WHERE u.id = $1
		ORDER BY n.id
		LIMIT 1
	`;

	const { rows } = await pool.query(sql, [usuarioId]);
	return rows[0] || null;
}

async function listar(negocioId, incluirInactivas = true) {
	const sql = `
		SELECT
			id,
			negocio_id,
			nombre,
			icono,
			estado,
			created_at,
			updated_at
		FROM especialidad
		WHERE negocio_id = $1
		  AND ($2::boolean = TRUE OR estado = 'ACTIVO')
		ORDER BY
			CASE WHEN estado = 'ACTIVO' THEN 0 ELSE 1 END,
			nombre ASC
	`;

	const { rows } = await pool.query(sql, [negocioId, incluirInactivas]);

	return rows;
}

async function crear(negocioId, datos) {
	const sql = `
		INSERT INTO especialidad (
			negocio_id,
			nombre,
			icono
		)
		VALUES ($1, $2, $3)
		RETURNING *
	`;

	const { rows } = await pool.query(sql, [
		negocioId,
		datos.nombre,
		datos.icono,
	]);

	return rows[0];
}

async function actualizar(negocioId, id, datos) {
	const sql = `
		UPDATE especialidad
		SET
			nombre = $1,
			icono = $2,
			updated_at = NOW()
		WHERE negocio_id = $3
		  AND id = $4
		RETURNING *
	`;

	const { rows } = await pool.query(sql, [
		datos.nombre,
		datos.icono,
		negocioId,
		id,
	]);

	return rows[0] || null;
}

async function cambiarEstado(negocioId, id, estado) {
	const sql = `
		UPDATE especialidad
		SET
			estado = $1,
			updated_at = NOW()
		WHERE negocio_id = $2
		  AND id = $3
		RETURNING *
	`;

	const { rows } = await pool.query(sql, [estado, negocioId, id]);

	return rows[0] || null;
}

async function eliminar(negocioId, id) {
	const sql = `
		DELETE FROM especialidad
		WHERE negocio_id = $1
		  AND id = $2
		RETURNING id
	`;

	const { rows } = await pool.query(sql, [negocioId, id]);
	return rows[0] || null;
}

module.exports = {
	getNegocioByUsuarioId,
	listar,
	crear,
	actualizar,
	cambiarEstado,
	eliminar,
};
