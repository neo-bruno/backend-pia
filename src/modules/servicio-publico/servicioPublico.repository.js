const pool = require("../../database/pool");

async function getServiceById(servicioId) {
	const query = `
      SELECT

        -- ==================================================
        -- SERVICIO
        -- ==================================================

        s.id,
        s.nombre,
        s.descripcion,
        s.duracion,
        s.precio,
        -- ==================================================
        -- DESCUENTO PÚBLICO VIGENTE
        -- ==================================================

        (descuento_publico.descuento_id IS NOT NULL)
          AS tiene_descuento,

        descuento_publico.descuento_id,
        descuento_publico.descuento_titulo,
        descuento_publico.descuento_monto,
        descuento_publico.descuento_porcentaje,
        descuento_publico.precio_final,
        descuento_publico.monto_descuento_calculado,
        s.estado,
        s.created_at,
        s.updated_at,

        -- ==================================================
        -- CALIFICACIÓN DEL SERVICIO
        -- ==================================================

        COALESCE(
          (
            SELECT ROUND(AVG(c.puntaje), 1)
            FROM calificacion c
            INNER JOIN evaluacion e
              ON e.id = c.evaluacion_id
            INNER JOIN tipo_calificacion tc
              ON tc.id = e.tipo_calificacion_id
            WHERE c.servicio_id = s.id
              AND tc.estado = 'ACTIVO'
              AND e.estado = 'HABILITADO'
              AND c.estado = 'ACTIVA'
          ),
          0
        ) AS servicio_calificacion,

        COALESCE(
          (
            SELECT COUNT(c.id)
            FROM calificacion c
            INNER JOIN evaluacion e
              ON e.id = c.evaluacion_id
            INNER JOIN tipo_calificacion tc
              ON tc.id = e.tipo_calificacion_id
            WHERE c.servicio_id = s.id
              AND tc.estado = 'ACTIVO'
              AND e.estado = 'HABILITADO'
              AND c.estado = 'ACTIVA'
          ),
          0
        ) AS servicio_cantidad_calificaciones,

        -- ==================================================
        -- ARCHIVOS DEL SERVICIO
        -- ==================================================

        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', a.id,
                'url', a.url,
                'tipo', sa.tipo,
                'orden', sa.orden,
                'nombre', a.nombre,
                'mime_type', a.mime_type,
                'principal', sa.principal,
                'tamano_bytes', a.tamano_bytes
              )
              ORDER BY
                sa.orden ASC,
                a.id ASC
            )
            FROM servicio_archivo sa
            INNER JOIN archivo a
              ON a.id = sa.archivo_id
            WHERE sa.servicio_id = s.id
          ),
          '[]'::json
        ) AS archivos,

        -- ==================================================
        -- CONDICIÓN
        -- ==================================================

        (
          SELECT json_build_object(
            'id', co.id,
            'nombre', co.nombre,
            'descripcion', co.descripcion,
            'requiere_adelanto', co.requiere_adelanto,
            'monto_adelanto', co.monto_adelanto,
            'porcentaje_adelanto', co.porcentaje_adelanto,
            'permite_reprogramar', co.permite_reprogramar,
            'permite_cancelar', co.permite_cancelar,
            'limite_horas_reprogramacion',
              co.limite_horas_reprogramacion,
            'limite_horas_cancelacion',
              co.limite_horas_cancelacion
          )
          FROM servicio_condicion sc
          INNER JOIN condicion co
            ON co.id = sc.condicion_id
          WHERE sc.servicio_id = s.id
          LIMIT 1
        ) AS condicion,

        -- ==================================================
        -- PROFESIONAL
        -- ==================================================

        p.id AS profesional_id,
        p.slug AS profesional_slug,
        p.foto AS profesional_foto,
        p.portada AS profesional_portada,
        p.fecha_trabajo AS profesional_fecha_trabajo,
        p.descripcion AS profesional_descripcion,
        p.lema AS profesional_lema,
        p.estado AS profesional_estado,
        p.estado_funciones AS profesional_estado_funciones,

        per.id AS persona_id,
        per.nombre AS profesional_nombre,
        per.telefono AS profesional_telefono,

        -- ==================================================
        -- EXPERIENCIA
        -- ==================================================

        GREATEST(
          DATE_PART(
            'year',
            AGE(CURRENT_DATE, p.fecha_trabajo)
          ),
          0
        )::INTEGER AS anios_experiencia,

        -- ==================================================
        -- CALIFICACIÓN ATENCIÓN
        -- Relación correcta:
        -- calificacion -> evaluacion -> tipo_calificacion
        -- ==================================================

        COALESCE(
          (
            SELECT ROUND(AVG(c.puntaje), 1)
            FROM calificacion c
            INNER JOIN evaluacion e
              ON e.id = c.evaluacion_id
            INNER JOIN tipo_calificacion tc
              ON tc.id = e.tipo_calificacion_id
            WHERE c.profesional_id = p.id
              AND tc.codigo = 'ATENCION'
              AND tc.estado = 'ACTIVO'
              AND e.estado = 'HABILITADO'
              AND c.estado = 'ACTIVA'
          ),
          0
        ) AS calificacion,

        COALESCE(
          (
            SELECT COUNT(c.id)
            FROM calificacion c
            INNER JOIN evaluacion e
              ON e.id = c.evaluacion_id
            INNER JOIN tipo_calificacion tc
              ON tc.id = e.tipo_calificacion_id
            WHERE c.profesional_id = p.id
              AND tc.codigo = 'ATENCION'
              AND tc.estado = 'ACTIVO'
              AND e.estado = 'HABILITADO'
              AND c.estado = 'ACTIVA'
          ),
          0
        ) AS cantidad_calificaciones,

        -- ==================================================
        -- TIPOS DE PROFESIONAL
        -- ==================================================

        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', tp.id,
                'nombre', tp.nombre,
                'descripcion', tp.descripcion
              )
              ORDER BY tp.id
            )
            FROM profesional_tipo_profesional ptp
            INNER JOIN tipo_profesional tp
              ON tp.id = ptp.tipo_profesional_id
            WHERE ptp.profesional_id = p.id
              AND tp.activo = TRUE
          ),
          '[]'::json
        ) AS tipos,

        -- ==================================================
        -- NEGOCIO
        -- ==================================================

        n.id AS negocio_id,
        n.nombre AS negocio_nombre,
        n.slug AS negocio_slug,
        n.telefono AS negocio_telefono,
        n.departamento,
        n.municipio,
        n.zona,
        n.direccion,
        n.latitud,
        n.longitud,
        n.logo AS negocio_logo

      FROM servicio s

      INNER JOIN profesional p
        ON p.id = s.profesional_id

      INNER JOIN persona per
        ON per.id = p.persona_id

      LEFT JOIN profesional_negocio pn
        ON pn.profesional_id = p.id
        AND pn.estado = 'HABILITADO'

      LEFT JOIN negocio n
        ON n.id = pn.negocio_id
      
      LEFT JOIN LATERAL (
        SELECT
          d.id AS descuento_id,
          d.titulo AS descuento_titulo,
          d.monto AS descuento_monto,
          d.porcentaje AS descuento_porcentaje,

          ROUND(
            GREATEST(
              s.precio -
              CASE
                WHEN d.monto IS NOT NULL AND d.monto > 0
                  THEN d.monto

                WHEN d.porcentaje IS NOT NULL
                  AND d.porcentaje > 0
                  THEN s.precio * d.porcentaje / 100.0

                ELSE 0
              END,
              0
            ),
            2
          ) AS precio_final,

          ROUND(
            LEAST(
              s.precio,
              CASE
                WHEN d.monto IS NOT NULL AND d.monto > 0
                  THEN d.monto

                WHEN d.porcentaje IS NOT NULL
                  AND d.porcentaje > 0
                  THEN s.precio * d.porcentaje / 100.0

                ELSE 0
              END
            ),
            2
          ) AS monto_descuento_calculado

        FROM descuento_servicio ds

        INNER JOIN descuento d
          ON d.id = ds.descuento_id

        WHERE ds.servicio_id = s.id
          AND ds.tipo_descuento = 'PUBLICO'
          AND ds.estado = 'ACTIVO'
          AND d.estado = 'ACTIVO'

          AND (d.negocio_id IS NULL OR d.negocio_id = n.id)
          AND (d.profesional_id IS NULL OR d.profesional_id = p.id)

          AND (d.fecha_inicio IS NULL OR d.fecha_inicio <= CURRENT_DATE)
          AND (d.fecha_fin IS NULL OR d.fecha_fin >= CURRENT_DATE)

        ORDER BY
          CASE
            WHEN d.monto IS NOT NULL AND d.monto > 0
              THEN GREATEST(s.precio - d.monto, 0)

            WHEN d.porcentaje IS NOT NULL AND d.porcentaje > 0
              THEN GREATEST(
                s.precio - (s.precio * d.porcentaje / 100.0),
                0
              )

            ELSE s.precio
          END ASC,
          d.id DESC

        LIMIT 1
      ) descuento_publico ON TRUE

      WHERE s.id = $1
        AND s.estado = 'HABILITADO'
        AND p.estado = 'ACTIVO'
        AND p.estado_funciones = 'HABILITADO'

      LIMIT 1;
  `;

	const result = await pool.query(query, [servicioId]);

	if (!result.rows.length) {
		return null;
	}

	const row = result.rows[0];

	return {
		servicio: {
			id: row.id,
			nombre: row.nombre,
			descripcion: row.descripcion,
			duracion: Number(row.duracion),
			precio: Number(row.precio),
			tiene_descuento: row.tiene_descuento === true,
			descuento_id: row.descuento_id != null ? Number(row.descuento_id) : null,
			descuento_titulo: row.descuento_titulo ?? null,
			descuento_monto:
				row.descuento_monto != null ? Number(row.descuento_monto) : null,
			descuento_porcentaje:
				row.descuento_porcentaje != null
					? Number(row.descuento_porcentaje)
					: null,
			precio_final:
				row.precio_final != null
					? Number(row.precio_final)
					: Number(row.precio),
			monto_descuento_calculado: Number(row.monto_descuento_calculado ?? 0),
			estado: row.estado,
			created_at: row.created_at,
			updated_at: row.updated_at,
			calificacion: Number(row.servicio_calificacion || 0),
			cantidad_calificaciones: Number(
				row.servicio_cantidad_calificaciones || 0,
			),
			archivos: row.archivos || [],
			condicion: row.condicion || null,
		},

		profesional: {
			id: row.profesional_id,
			persona_id: row.persona_id,
			nombre: row.profesional_nombre,
			telefono: row.profesional_telefono,
			slug: row.profesional_slug,
			foto: row.profesional_foto,
			portada: row.profesional_portada,
			fecha_trabajo: row.profesional_fecha_trabajo,
			descripcion: row.profesional_descripcion,
			lema: row.profesional_lema,
			estado: row.profesional_estado,
			estado_funciones: row.profesional_estado_funciones,

			anios_experiencia: Number(row.anios_experiencia || 0),
			calificacion: Number(row.calificacion || 0),
			cantidad_calificaciones: Number(row.cantidad_calificaciones || 0),
			tipos: row.tipos || [],
		},

		negocio: row.negocio_id
			? {
					id: row.negocio_id,
					nombre: row.negocio_nombre,
					slug: row.negocio_slug,
					telefono: row.negocio_telefono,
					departamento: row.departamento,
					municipio: row.municipio,
					zona: row.zona,
					direccion: row.direccion,
					latitud: row.latitud,
					longitud: row.longitud,
					logo: row.negocio_logo,
				}
			: null,
	};
}

const getServicesByProfessionalId = async (client, profesionalId) => {
	const query = `
    SELECT 
      s.id,
      s.profesional_id,
      s.nombre,
      s.descripcion,
      s.duracion,
      s.precio,
      s.estado,

      /* =========================================
         FOTO PRINCIPAL
      ========================================== */

      a.url AS foto,

      /* =========================================
         CONDICIÓN
      ========================================== */

      c.id AS condicion_id,
      c.nombre AS condicion_nombre,
      c.descripcion AS condicion_descripcion,

      c.requiere_adelanto,
      c.monto_adelanto,
      c.porcentaje_adelanto,

      c.permite_reprogramar,
      c.limite_horas_reprogramacion,

      c.permite_cancelar,
      c.limite_horas_cancelacion

    FROM servicio s

    LEFT JOIN servicio_archivo sa
      ON sa.servicio_id = s.id
      AND sa.principal = TRUE

    LEFT JOIN archivo a
      ON a.id = sa.archivo_id

    /* =========================================
       RELACIÓN SERVICIO → CONDICIÓN
    ========================================== */

    LEFT JOIN servicio_condicion sc
      ON sc.servicio_id = s.id

    LEFT JOIN condicion c
      ON c.id = sc.condicion_id

    WHERE s.profesional_id = $1
      AND s.estado = 'HABILITADO'

    ORDER BY
      s.id ASC
  `;

	const { rows } = await client.query(query, [profesionalId]);

	return rows;
};

module.exports = {
	getServiceById,
	getServicesByProfessionalId,
};
