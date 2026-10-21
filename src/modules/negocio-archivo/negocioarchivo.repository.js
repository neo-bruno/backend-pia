const pool = require("../../database/pool");

// ============================================================
// TRANSACCIONES
// ============================================================

async function transaction(callback) {
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
}

// ============================================================
// NEGOCIO DEL ADMINISTRADOR AUTENTICADO
// ============================================================

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

// ============================================================
// CREAR REGISTRO EN ARCHIVO
// ============================================================

async function createFile(client, file) {
	const url = `/uploads/negocios/${file.filename}`;

	const sql = `
    INSERT INTO archivo (
      nombre,
      url,
      tipo,
      mime_type,
      tamano_bytes,
      created_at,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
    RETURNING
      id,
      nombre,
      url,
      tipo,
      mime_type,
      tamano_bytes,
      created_at
  `;

	const tipo = file.mimetype.startsWith("image/") ? "FOTO" : "VIDEO";

	const valores = [file.originalname, url, tipo, file.mimetype, file.size];

	const { rows } = await client.query(sql, valores);
	return rows[0];
}

// ============================================================
// REGISTRAR RELACIÓN CON EL NEGOCIO
// ============================================================

async function createBusinessFile(
	client,
	negocioId,
	archivoId,
	tipo,
	orden,
	principal,
) {
	if (principal) {
		await client.query(
			`UPDATE negocio_archivo
       SET principal = FALSE
       WHERE negocio_id = $1 AND tipo = 'FOTO'`,
			[negocioId],
		);
	}

	const sql = `
    INSERT INTO negocio_archivo (
      negocio_id,
      archivo_id,
      tipo,
      orden,
      principal
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;

	const { rows } = await client.query(sql, [
		negocioId,
		archivoId,
		tipo,
		orden,
		principal,
	]);

	return rows[0];
}

// ============================================================
// CONTAR ARCHIVOS POR TIPO
// ============================================================

async function countFilesByType(negocioId, tipo) {
	const sql = `
    SELECT COUNT(*)::int AS cantidad
    FROM negocio_archivo
    WHERE negocio_id = $1
      AND tipo = $2
  `;

	const { rows } = await pool.query(sql, [negocioId, tipo]);
	return rows[0].cantidad;
}

// ============================================================
// ÚLTIMO ORDEN POR TIPO
// ============================================================

async function getLastOrder(negocioId, tipo) {
	const sql = `
    SELECT COALESCE(MAX(orden), 0)::int AS orden
    FROM negocio_archivo
    WHERE negocio_id = $1
      AND tipo = $2
  `;

	const { rows } = await pool.query(sql, [negocioId, tipo]);
	return rows[0].orden;
}

// ============================================================
// LISTAR GALERÍA
// ============================================================

async function getFilesByBusiness(negocioId) {
	const sql = `
    SELECT
      na.id AS negocio_archivo_id,
      na.negocio_id,
      na.archivo_id,
      na.tipo,
      na.orden,
      na.principal,
      a.nombre,
      a.url,
      a.mime_type,
      a.tamano_bytes,
      a.created_at
    FROM negocio_archivo na
    INNER JOIN archivo a
      ON a.id = na.archivo_id
    WHERE na.negocio_id = $1
    ORDER BY
      CASE WHEN na.tipo = 'FOTO' THEN 0 ELSE 1 END,
      na.orden ASC,
      na.id ASC
  `;

	const { rows } = await pool.query(sql, [negocioId]);
	return rows;
}

// ============================================================
// OBTENER ARCHIVO DE LA GALERÍA
// ============================================================

async function getBusinessFile(negocioId, relacionId) {
	const sql = `
    SELECT
      na.id AS negocio_archivo_id,
      na.negocio_id,
      na.archivo_id,
      na.tipo,
      na.orden,
      na.principal,
      a.url
    FROM negocio_archivo na
    INNER JOIN archivo a
      ON a.id = na.archivo_id
    WHERE na.negocio_id = $1
      AND na.id = $2
    LIMIT 1
  `;

	const { rows } = await pool.query(sql, [negocioId, relacionId]);
	return rows[0] || null;
}

// ============================================================
// FOTO PRINCIPAL
// ============================================================

async function setPrincipal(negocioId, relacionId) {
	return transaction(async (client) => {
		const archivo = await getBusinessFile(negocioId, relacionId);

		if (!archivo || archivo.tipo !== "FOTO") {
			return null;
		}

		await client.query(
			`UPDATE negocio_archivo
       SET principal = FALSE
       WHERE negocio_id = $1 AND tipo = 'FOTO'`,
			[negocioId],
		);

		const { rows } = await client.query(
			`UPDATE negocio_archivo
       SET principal = TRUE
       WHERE negocio_id = $1 AND id = $2
       RETURNING *`,
			[negocioId, relacionId],
		);

		return rows[0] || null;
	});
}

// ============================================================
// ACTUALIZAR ORDEN
// ============================================================

async function updateOrder(negocioId, relacionId, orden) {
	const sql = `
    UPDATE negocio_archivo
    SET orden = $1
    WHERE negocio_id = $2
      AND id = $3
    RETURNING *
  `;

	const { rows } = await pool.query(sql, [orden, negocioId, relacionId]);

	return rows[0] || null;
}

// ============================================================
// ELIMINAR RELACIÓN, SIN BORRAR ARCHIVO COMPARTIDO
// ============================================================

async function deleteBusinessFile(negocioId, relacionId) {
	const sql = `
    DELETE FROM negocio_archivo
    WHERE negocio_id = $1
      AND id = $2
    RETURNING archivo_id
  `;

	const { rows } = await pool.query(sql, [negocioId, relacionId]);

	return rows[0] || null;
}

module.exports = {
	transaction,
	getNegocioByUsuarioId,
	createFile,
	createBusinessFile,
	countFilesByType,
	getLastOrder,
	getFilesByBusiness,
	getBusinessFile,
	setPrincipal,
	updateOrder,
	deleteBusinessFile,
};
