const pool = require("../../database/pool");

// =====================================================
// CONSULTAS PÚBLICAS DE PIA
// =====================================================

// Construye filtros parametrizados para evitar inyección SQL.
const construirFiltrosNegocios = (filtros = {}) => {
	const condiciones = [];
	const parametros = [];

	const agregarParametro = (columna, valor) => {
		parametros.push(valor);
		condiciones.push(`${columna} = $${parametros.length}`);
	};

	if (filtros.departamento) {
		agregarParametro(
			"LOWER(n.departamento)",
			filtros.departamento.trim().toLowerCase(),
		);
	}

	if (filtros.municipio) {
		agregarParametro(
			"LOWER(n.municipio)",
			filtros.municipio.trim().toLowerCase(),
		);
	}

	if (filtros.tipoNegocioId) {
		agregarParametro("n.tipo_negocio_id", Number(filtros.tipoNegocioId));
	}

	if (filtros.buscar) {
		parametros.push(`%${filtros.buscar.trim().toLowerCase()}%`);
		const parametro = `$${parametros.length}`;

		condiciones.push(`
      (
        LOWER(n.nombre) LIKE ${parametro}
        OR LOWER(COALESCE(n.descripcion, '')) LIKE ${parametro}
        OR LOWER(COALESCE(n.zona, '')) LIKE ${parametro}
        OR LOWER(COALESCE(n.municipio, '')) LIKE ${parametro}
        OR LOWER(COALESCE(tn.nombre, '')) LIKE ${parametro}
      )
    `);
	}

	return {
		sql: condiciones.length ? `AND ${condiciones.join(" AND ")}` : "",
		parametros,
	};
};

// =====================================================
// CONDICIONES DE PUBLICACIÓN
// =====================================================
const SQL_NEGOCIOS_PUBLICADOS = `
  FROM negocio n

  INNER JOIN tipo_negocio tn
    ON tn.id = n.tipo_negocio_id
   AND tn.activo = TRUE

  LEFT JOIN LATERAL (
    SELECT a.url
    FROM negocio_archivo na

    INNER JOIN archivo a
      ON a.id = na.archivo_id

    WHERE na.negocio_id = n.id
      AND na.tipo = 'FOTO'
      AND na.principal = TRUE

    ORDER BY na.id DESC
    LIMIT 1
  ) foto_principal ON TRUE

    LEFT JOIN LATERAL (
      SELECT
        ROUND(AVG(c.puntaje), 1) AS rating,
        COUNT(*)::INTEGER AS resenas
      FROM calificacion c

      INNER JOIN evaluacion e
        ON e.id = c.evaluacion_id

      INNER JOIN tipo_calificacion tc
        ON tc.id = e.tipo_calificacion_id

      INNER JOIN historial h
        ON h.reserva_id = c.reserva_id

      WHERE h.negocio_id = n.id
        AND c.estado = 'ACTIVA'
        AND tc.objetivo = 'NEGOCIO'
    ) calificaciones ON TRUE

  WHERE n.estado = 'HABILITADO'

    AND EXISTS (
      SELECT 1
      FROM profesional_negocio pn

      INNER JOIN profesional p
        ON p.id = pn.profesional_id
       AND p.estado = 'ACTIVO'
       AND p.estado_funciones = 'HABILITADO'

      WHERE pn.negocio_id = n.id
        AND pn.estado = 'HABILITADO'

        AND EXISTS (
          SELECT 1
          FROM membresia m
          WHERE m.profesional_negocio_id = pn.id
            AND m.estado_pagado = TRUE
            AND m.fecha_inicio <= CURRENT_DATE
            AND m.fecha_fin >= CURRENT_DATE
        )
    )
`;

// =====================================================
// OBTENER NEGOCIOS PUBLICADOS
// =====================================================
const getNegociosPublicados = async (filtros = {}) => {
	const paginaSegura = Math.max(1, Number.parseInt(filtros.pagina, 10) || 1);

	const limiteSeguro = Math.min(
		50,
		Math.max(1, Number.parseInt(filtros.limite, 10) || 12),
	);

	const offset = (paginaSegura - 1) * limiteSeguro;

	const { sql: filtrosSQL, parametros } = construirFiltrosNegocios(filtros);

	const sqlBase = `
    ${SQL_NEGOCIOS_PUBLICADOS}
    ${filtrosSQL}
  `;

	const sqlDatos = `
    SELECT
      n.id,
      n.tipo_negocio_id,
      tn.nombre AS tipo_negocio,
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

      COALESCE(n.portada, foto_principal.url) AS imagen_portada,
      COALESCE(n.logo, foto_principal.url) AS imagen,
      
      COALESCE(calificaciones.rating, 0) AS rating,
      COALESCE(calificaciones.resenas, 0) AS resenas

    ${sqlBase}

    ORDER BY n.nombre ASC

    LIMIT $${parametros.length + 1}
    OFFSET $${parametros.length + 2}
  `;

	const sqlTotal = `
    SELECT COUNT(*)::INTEGER AS total
    ${sqlBase}
  `;

	const [resultadoDatos, resultadoTotal] = await Promise.all([
		pool.query(sqlDatos, [...parametros, limiteSeguro, offset]),
		pool.query(sqlTotal, parametros),
	]);

	const total = resultadoTotal.rows[0]?.total ?? 0;

	return {
		datos: resultadoDatos.rows,
		paginacion: {
			pagina: paginaSegura,
			limite: limiteSeguro,
			total,
			totalPaginas: Math.ceil(total / limiteSeguro),
		},
	};
};

/* =====================================================
   CONSTRUIR FILTROS DE SERVICIOS
   BÚSQUEDA FLEXIBLE POR TODAS LAS PALABRAS
===================================================== */
const construirFiltrosServicios = (filtros = {}) => {
	const condiciones = [];
	const parametros = [];

	const agregarParametro = (expresion, valor) => {
		parametros.push(valor);
		condiciones.push(`${expresion} $${parametros.length}`);
	};

	// -------------------------------------------------
	// FILTROS EXACTOS DE UBICACIÓN
	// -------------------------------------------------

	if (filtros.departamento) {
		agregarParametro(
			"LOWER(n.departamento) =",
			filtros.departamento.trim().toLowerCase(),
		);
	}

	if (filtros.municipio) {
		agregarParametro(
			"LOWER(n.municipio) =",
			filtros.municipio.trim().toLowerCase(),
		);
	}

	// -------------------------------------------------
	// FILTROS POR IDENTIFICADORES
	// -------------------------------------------------

	if (filtros.tipoNegocioId) {
		agregarParametro("n.tipo_negocio_id =", Number(filtros.tipoNegocioId));
	}

	if (filtros.negocioId) {
		agregarParametro("n.id =", Number(filtros.negocioId));
	}

	if (filtros.profesionalId) {
		agregarParametro("p.id =", Number(filtros.profesionalId));
	}

	// -------------------------------------------------
	// FILTRO POR PRECIO REAL PARA EL CLIENTE
	// Considera el descuento público vigente.
	// -------------------------------------------------

	const expresionPrecioFinal = `
		COALESCE(
			descuento_publico.precio_final,
			s.precio
		)
	`;

	if (filtros.precioMin !== undefined && filtros.precioMin !== "") {
		agregarParametro(`${expresionPrecioFinal} >=`, Number(filtros.precioMin));
	}

	if (filtros.precioMax !== undefined && filtros.precioMax !== "") {
		agregarParametro(`${expresionPrecioFinal} <=`, Number(filtros.precioMax));
	}

	// -------------------------------------------------
	// BÚSQUEDA FLEXIBLE
	// Cada palabra debe coincidir con algún campo.
	// Las palabras pueden aparecer en campos diferentes.
	// -------------------------------------------------

	if (filtros.buscar?.trim()) {
		const palabras = filtros.buscar
			.trim()
			.toLowerCase()
			.split(/\s+/)
			.filter(Boolean);

		const camposBusqueda = [
			"LOWER(COALESCE(s.nombre, ''))",
			"LOWER(COALESCE(s.descripcion, ''))",
			"LOWER(COALESCE(per.nombre, ''))",
			"LOWER(COALESCE(n.nombre, ''))",
			"LOWER(COALESCE(n.municipio, ''))",
			"LOWER(COALESCE(n.zona, ''))",
			"LOWER(COALESCE(n.departamento, ''))",
			"LOWER(COALESCE(tn.nombre, ''))",
		];

		const condicionesPalabras = palabras.map((palabra) => {
			parametros.push(`%${palabra}%`);

			const parametro = `$${parametros.length}`;

			const coincidencias = camposBusqueda.map(
				(campo) => `${campo} LIKE ${parametro}`,
			);

			return `(${coincidencias.join(" OR ")})`;
		});

		// Todas las palabras deben encontrarse,
		// aunque estén distribuidas entre distintos campos.
		condiciones.push(`(${condicionesPalabras.join(" AND ")})`);
	}

	return {
		sql: condiciones.length ? `AND ${condiciones.join(" AND ")}` : "",
		parametros,
	};
};

/* =====================================================
   CONDICIONES DE PUBLICACIÓN DE SERVICIOS
   INCLUYE DESCUENTOS PÚBLICOS VIGENTES
===================================================== */

const SQL_SERVICIOS_PUBLICADOS = `
  FROM servicio s

  INNER JOIN profesional p
    ON p.id = s.profesional_id
   AND p.estado = 'ACTIVO'
   AND p.estado_funciones = 'HABILITADO'

  INNER JOIN persona per
    ON per.id = p.persona_id

  INNER JOIN profesional_negocio pn
    ON pn.profesional_id = p.id
   AND pn.estado = 'HABILITADO'

  INNER JOIN negocio n
    ON n.id = pn.negocio_id
   AND n.estado = 'HABILITADO'

  INNER JOIN tipo_negocio tn
    ON tn.id = n.tipo_negocio_id
   AND tn.activo = TRUE

  LEFT JOIN LATERAL (
    SELECT a.url
    FROM servicio_archivo sa
    INNER JOIN archivo a
      ON a.id = sa.archivo_id
    WHERE sa.servicio_id = s.id
      AND sa.tipo = 'FOTO'
    ORDER BY sa.principal DESC, sa.orden ASC, sa.id DESC
    LIMIT 1
  ) foto_principal ON TRUE

  LEFT JOIN LATERAL (
    SELECT
      ROUND(AVG(c.puntaje), 1) AS rating,
      COUNT(DISTINCT c.id)::INTEGER AS resenas
    FROM calificacion c
    INNER JOIN evaluacion e
      ON e.id = c.evaluacion_id
    INNER JOIN tipo_calificacion tc
      ON tc.id = e.tipo_calificacion_id
    WHERE c.servicio_id = s.id
      AND c.estado = 'ACTIVA'
      AND e.estado = 'HABILITADO'
      AND tc.objetivo = 'SERVICIO'
      AND tc.estado = 'ACTIVO'
  ) calificaciones ON TRUE

  /* ================================================
     DESCUENTO PÚBLICO VIGENTE DEL SERVICIO
     ================================================ */

  LEFT JOIN LATERAL (
    SELECT
      d.id AS descuento_id,
      d.titulo AS descuento_titulo,
      d.monto AS descuento_monto,
      d.porcentaje AS descuento_porcentaje,

      ROUND(
        CASE
          WHEN d.monto IS NOT NULL
            THEN GREATEST(s.precio - d.monto, 0)
          WHEN d.porcentaje IS NOT NULL
            THEN GREATEST(
              s.precio - (s.precio * d.porcentaje / 100),
              0
            )
          ELSE s.precio
        END,
        2
      ) AS precio_final

    FROM descuento_servicio ds

    INNER JOIN descuento d
      ON d.id = ds.descuento_id

    WHERE ds.servicio_id = s.id
      AND ds.tipo_descuento = 'PUBLICO'
      AND ds.estado = 'ACTIVO'

      AND d.negocio_id = n.id
      AND d.profesional_id = p.id
      AND d.estado = 'ACTIVO'

      AND (
        d.fecha_inicio IS NULL
        OR d.fecha_inicio <= CURRENT_DATE
      )

      AND (
        d.fecha_fin IS NULL
        OR d.fecha_fin >= CURRENT_DATE
      )

    ORDER BY
      CASE
        WHEN d.monto IS NOT NULL
          THEN GREATEST(s.precio - d.monto, 0)
        WHEN d.porcentaje IS NOT NULL
          THEN GREATEST(
            s.precio - (s.precio * d.porcentaje / 100),
            0
          )
        ELSE s.precio
      END ASC,
      d.id DESC

    LIMIT 1
  ) descuento_publico ON TRUE

  WHERE s.estado = 'HABILITADO'

    AND EXISTS (
      SELECT 1
      FROM membresia m
      WHERE m.profesional_negocio_id = pn.id
        AND m.estado_pagado = TRUE
        AND m.estado = 'ACTIVO'
        AND m.fecha_inicio <= CURRENT_DATE
        AND m.fecha_fin >= CURRENT_DATE
    )
`;

/* =====================================================
   OBTENER SERVICIOS PÚBLICOS
===================================================== */

const getServiciosPublicados = async (filtros = {}) => {
	const pagina = Math.max(1, Number.parseInt(filtros.pagina, 10) || 1);

	const limite = Math.min(
		50,
		Math.max(1, Number.parseInt(filtros.limite, 10) || 12),
	);

	const offset = (pagina - 1) * limite;

	const { sql: filtrosSQL, parametros } = construirFiltrosServicios(filtros);

	const sqlBase = `
		${SQL_SERVICIOS_PUBLICADOS}
		${filtrosSQL}
	`;

	const sqlDatos = `
		SELECT
			s.id AS servicio_id,
			s.nombre AS servicio_nombre,
			s.descripcion AS servicio_descripcion,
			s.duracion,
			s.precio,

			/* =========================================
			   DESCUENTO PÚBLICO
			========================================= */

			descuento_publico.descuento_id,
			descuento_publico.descuento_titulo,
			descuento_publico.descuento_monto,
			descuento_publico.descuento_porcentaje,

			CASE
				WHEN descuento_publico.descuento_id IS NOT NULL
					THEN TRUE
				ELSE FALSE
			END AS tiene_descuento,

			COALESCE(
				descuento_publico.precio_final,
				s.precio
			) AS precio_final,

			CASE
				WHEN descuento_publico.descuento_id IS NOT NULL
					THEN ROUND(
						s.precio - descuento_publico.precio_final,
						2
					)
				ELSE 0
			END AS monto_descuento_calculado,

			/* =========================================
			   PROFESIONAL
			========================================= */

			p.id AS profesional_id,
			per.nombre AS profesional_nombre,
			p.slug AS profesional_slug,
			p.foto AS profesional_foto,

			/* =========================================
			   NEGOCIO
			========================================= */

			n.id AS negocio_id,
			n.nombre AS negocio_nombre,
			n.slug AS negocio_slug,
			n.tipo_negocio_id,
			tn.nombre AS tipo_negocio,
			n.departamento,
			n.municipio,
			n.zona,
			n.direccion,
			n.latitud,
			n.longitud,
			n.logo AS negocio_logo,

			/* =========================================
			   IMAGEN DEL SERVICIO
			========================================= */

			COALESCE(
				foto_principal.url,
				p.foto,
				n.logo,
				n.portada
			) AS imagen,

			/* =========================================
				CALIFICACIONES DEL SERVICIO
				Todas las calificaciones activas
			========================================= */

			COALESCE(
					(
							SELECT ROUND(AVG(c.puntaje), 1)
							FROM calificacion c
							WHERE c.servicio_id = s.id
								AND c.estado = 'ACTIVA'
					),
					0
			) AS rating,

			COALESCE(
					(
							SELECT COUNT(c.id)
							FROM calificacion c
							WHERE c.servicio_id = s.id
								AND c.estado = 'ACTIVA'
					),
					0
			) AS resenas

		${sqlBase}

		ORDER BY
			s.nombre ASC,
			n.nombre ASC

		LIMIT $${parametros.length + 1}
		OFFSET $${parametros.length + 2}
	`;

	const sqlTotal = `
		SELECT COUNT(*)::INTEGER AS total
		${sqlBase}
	`;

	const [resultadoDatos, resultadoTotal] = await Promise.all([
		pool.query(sqlDatos, [...parametros, limite, offset]),
		pool.query(sqlTotal, parametros),
	]);

	const total = resultadoTotal.rows[0]?.total ?? 0;

	return {
		datos: resultadoDatos.rows,

		paginacion: {
			pagina,
			limite,
			total,
			totalPaginas: Math.ceil(total / limite),
		},
	};
};

/* =====================================================
   SERVICIOS PARA EL BANNER DE DESCUENTOS PÚBLICOS
===================================================== */

const getServiciosConDescuentoPublico = async () => {
	const sql = `
		SELECT
			s.id AS servicio_id,
			s.nombre AS servicio_nombre,
			s.descripcion AS servicio_descripcion,
			s.duracion,
			s.precio,

			descuento_publico.descuento_id,
			descuento_publico.descuento_titulo,
			descuento_publico.descuento_monto,
			descuento_publico.descuento_porcentaje,

			TRUE AS tiene_descuento,

			descuento_publico.precio_final,

			ROUND(
				s.precio - descuento_publico.precio_final,
				2
			) AS monto_descuento_calculado,

			p.id AS profesional_id,
			per.nombre AS profesional_nombre,
			p.slug AS profesional_slug,
			p.foto AS profesional_foto,

			n.id AS negocio_id,
			n.nombre AS negocio_nombre,
			n.slug AS negocio_slug,
			n.tipo_negocio_id,
			tn.nombre AS tipo_negocio,
			n.departamento,
			n.municipio,
			n.zona,
			n.direccion,
			n.latitud,
			n.longitud,
			n.logo AS negocio_logo,

			COALESCE(
				foto_principal.url,
				p.foto,
				n.logo,
				n.portada
			) AS imagen,

			COALESCE(calificaciones.rating, 0) AS rating,
			COALESCE(calificaciones.resenas, 0) AS resenas

		${SQL_SERVICIOS_PUBLICADOS}

		  AND descuento_publico.descuento_id IS NOT NULL

		ORDER BY
			descuento_publico.precio_final ASC,
			s.nombre ASC

		LIMIT 8
	`;

	const resultado = await pool.query(sql);

	return resultado.rows;
};

module.exports = {
	getNegociosPublicados,
	getServiciosPublicados,
	getServiciosConDescuentoPublico,
};
