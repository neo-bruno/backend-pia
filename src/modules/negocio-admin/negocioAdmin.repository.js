const pool = require("../../database/pool");

// ============================================================
// OBTENER NEGOCIO DEL ADMINISTRADOR AUTENTICADO
// ============================================================

async function getNegocioByUsuarioId(usuarioId) {
	const sql = `
    SELECT
      n.id,
      n.tipo_negocio_id,
      tn.nombre AS tipo_negocio_nombre,
      n.slug,
      n.codigo,
      n.nombre,
      n.descripcion,
      n.telefono,
      n.departamento,
      n.municipio,
      n.zona,
      n.direccion,
      n.latitud,
      n.longitud,
      n.logo,
      n.portada,
      n.eslogan,
      n.informacion,
      n.recomendacion,
      n.estado,
      n.created_at,
      n.updated_at
    FROM usuario u
    INNER JOIN profesional pr
      ON pr.persona_id = u.persona_id
    INNER JOIN profesional_negocio pn
      ON pn.profesional_id = pr.id
    INNER JOIN negocio n
      ON n.id = pn.negocio_id
    INNER JOIN tipo_negocio tn
      ON tn.id = n.tipo_negocio_id
    WHERE u.id = $1
    ORDER BY n.id
    LIMIT 1
  `;

	const { rows } = await pool.query(sql, [usuarioId]);

	return rows[0] || null;
}

// ============================================================
// VERIFICAR TIPO DE NEGOCIO ACTIVO
// ============================================================

async function getTipoNegocioById(tipoNegocioId) {
	const sql = `
    SELECT id, nombre
    FROM tipo_negocio
    WHERE id = $1
      AND activo = TRUE
    LIMIT 1
  `;

	const { rows } = await pool.query(sql, [tipoNegocioId]);

	return rows[0] || null;
}

// ============================================================
// VERIFICAR SLUG ÚNICO
// ============================================================

async function existsSlug(slug, negocioId) {
	const sql = `
    SELECT 1
    FROM negocio
    WHERE slug = $1
      AND id <> $2
    LIMIT 1
  `;

	const { rows } = await pool.query(sql, [slug, negocioId]);

	return rows.length > 0;
}

// ============================================================
// ACTUALIZAR DATOS GENERALES DEL NEGOCIO
// ============================================================

async function updateNegocio(negocioId, datos) {
	const sql = `
    UPDATE negocio
    SET
      tipo_negocio_id = $1,
      nombre = $2,
      slug = $3,
      descripcion = $4,
      telefono = $5,
      departamento = $6,
      municipio = $7,
      zona = $8,
      direccion = $9,
      latitud = $10,
      longitud = $11,
      updated_at = NOW()
    WHERE id = $12
    RETURNING
      id,
      tipo_negocio_id,
      nombre,
      slug,
      codigo,
      descripcion,
      telefono,
      departamento,
      municipio,
      zona,
      direccion,
      latitud,
      longitud,
      logo,
      portada,
      eslogan,
      informacion,
      recomendacion,
      estado,
      created_at,
      updated_at
  `;

	const valores = [
		datos.tipo_negocio_id,
		datos.nombre,
		datos.slug,
		datos.descripcion,
		datos.telefono,
		datos.departamento,
		datos.municipio,
		datos.zona,
		datos.direccion,
		datos.latitud,
		datos.longitud,
		negocioId,
	];

	const { rows } = await pool.query(sql, valores);

	return rows[0] || null;
}

// ============================================================
// ACTUALIZAR PRESENTACIÓN DE LA PÁGINA PÚBLICA
// ============================================================

async function updatePaginaNegocio(negocioId, datos) {
	const sql = `
    UPDATE negocio
    SET
      eslogan = $1,
      informacion = $2,
      recomendacion = $3,
      updated_at = NOW()
    WHERE id = $4
    RETURNING
      id,
      nombre,
      slug,
      logo,
      portada,
      eslogan,
      informacion,
      recomendacion,
      updated_at
  `;

	const valores = [
		datos.eslogan,
		datos.informacion,
		datos.recomendacion,
		negocioId,
	];

	const { rows } = await pool.query(sql, valores);

	return rows[0] || null;
}

// ============================================================
// LISTAR TIPOS DE NEGOCIO ACTIVOS
// ============================================================

async function getTiposNegocio() {
	const sql = `
    SELECT id, nombre
    FROM tipo_negocio
    WHERE activo = TRUE
    ORDER BY nombre ASC
  `;

	const { rows } = await pool.query(sql);

	return rows;
}

// ============================================================
// ACTUALIZAR PORTADA Y LOGO DEL NEGOCIO
// ============================================================

async function updateImagenesNegocio(negocioId, datos) {
	const sql = `
    UPDATE negocio
    SET
      portada = COALESCE($1, portada),
      logo = COALESCE($2, logo),
      updated_at = NOW()
    WHERE id = $3
    RETURNING
      id,
      nombre,
      slug,
      logo,
      portada,
      updated_at
  `;

	const valores = [datos.portada ?? null, datos.logo ?? null, negocioId];

	const { rows } = await pool.query(sql, valores);

	return rows[0] || null;
}

module.exports = {
	getNegocioByUsuarioId,
	getTipoNegocioById,
	updateNegocio,
	updatePaginaNegocio,
	getTiposNegocio,
	existsSlug,
	updateImagenesNegocio,
};
