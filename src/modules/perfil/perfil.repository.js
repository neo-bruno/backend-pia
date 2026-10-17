const pool = require("../../database/pool");

// =====================================================
// OBTENER PERFIL DEL ADMINISTRADOR Y PROFESIONAL
// =====================================================

const getPerfilByUsuarioId = async (usuarioId) => {
	const query = `
    SELECT
      u.id AS usuario_id,
      u.persona_id,
      u.rol_id,
      u.telefono AS usuario_telefono,
      u.estado AS usuario_estado,

      p.nombre,
      p.telefono AS persona_telefono,
      p.sexo,
      p.fecha_nacimiento,

      pr.id AS profesional_id,
      pr.slug,
      pr.foto,
      pr.portada,
      pr.fecha_trabajo,
      pr.descripcion,
      pr.lema,
      pr.pago_qr,
      pr.estado AS profesional_estado,
      pr.estado_funciones

    FROM usuario u

    INNER JOIN persona p
      ON p.id = u.persona_id

    LEFT JOIN profesional pr
      ON pr.persona_id = p.id

    WHERE u.id = $1
    LIMIT 1
  `;

	const result = await pool.query(query, [usuarioId]);

	return result.rows[0] || null;
};

// =====================================================
// ACTUALIZAR PERFIL PERSONAL Y PROFESIONAL
// =====================================================

const actualizarPerfil = async (usuarioId, datos) => {
	const client = await pool.connect();

	try {
		await client.query("BEGIN");

		const usuarioQuery = `
      SELECT
        u.id,
        u.persona_id,
        pr.id AS profesional_id
      FROM usuario u
      INNER JOIN persona p
        ON p.id = u.persona_id
      LEFT JOIN profesional pr
        ON pr.persona_id = p.id
      WHERE u.id = $1
      FOR UPDATE OF u, p
    `;

		const usuarioResult = await client.query(usuarioQuery, [usuarioId]);

		if (usuarioResult.rowCount === 0) {
			const error = new Error("Usuario no encontrado.");
			error.status = 404;
			throw error;
		}

		const usuario = usuarioResult.rows[0];

		// -----------------------------------------------
		// ACTUALIZAR DATOS PERSONALES
		// -----------------------------------------------

		await client.query(
			`
        UPDATE persona
        SET
          nombre = $1,
          telefono = $2,
          sexo = $3,
          fecha_nacimiento = $4,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
      `,
			[
				datos.nombre,
				datos.telefono,
				datos.sexo || null,
				datos.fecha_nacimiento || null,
				usuario.persona_id,
			],
		);

		// -----------------------------------------------
		// ACTUALIZAR TELÉFONO DEL USUARIO
		// -----------------------------------------------

		await client.query(
			`
        UPDATE usuario
        SET
          telefono = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `,
			[datos.telefono, usuarioId],
		);

		// -----------------------------------------------
		// ACTUALIZAR DATOS PROFESIONALES
		// -----------------------------------------------

		if (usuario.profesional_id) {
			const valores = [
				datos.fecha_trabajo || null,
				datos.descripcion ?? null,
				datos.lema ?? null,
			];

			let fotoSql = "";

			if (datos.foto) {
				valores.push(`/uploads/profesionales/${datos.foto.filename}`);
				fotoSql = `, foto = $${valores.length}`;
			}

			valores.push(usuario.profesional_id);

			await client.query(
				`
          UPDATE profesional
          SET
            fecha_trabajo = $1,
            descripcion = $2,
            lema = $3
            ${fotoSql},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $${valores.length}
        `,
				valores,
			);
		} else if (datos.foto) {
			const error = new Error(
				"El usuario no tiene un perfil profesional asociado para guardar la fotografía.",
			);
			error.status = 400;
			throw error;
		}

		await client.query("COMMIT");

		return await getPerfilByUsuarioId(usuarioId);
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
};

module.exports = {
	getPerfilByUsuarioId,
	actualizarPerfil,
};
