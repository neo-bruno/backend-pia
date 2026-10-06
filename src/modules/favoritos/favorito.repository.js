const pool = require("../../database/pool");

// ============================================================
// OBTENER CLIENTE POR TOKEN
// ============================================================

async function getClienteByToken(client, token) {
  const query = `
    SELECT
      id,
      persona_id,
      alias,
      telefono
    FROM cliente
    WHERE token = $1
    LIMIT 1
  `;

  const { rows } = await client.query(query, [token]);

  return rows[0] || null;
}

// ============================================================
// VERIFICAR SI EXISTE EL OBJETO
// ============================================================

async function verificarObjeto(client, tipo, id) {
  let query;
  let params = [id];

  switch (tipo) {
    case "NEGOCIO":
      query = `
        SELECT
          id
        FROM negocio
        WHERE id = $1
        LIMIT 1
      `;
      break;

    case "PROFESIONAL":
      query = `
        SELECT
          id
        FROM profesional
        WHERE id = $1
        LIMIT 1
      `;
      break;

    case "SERVICIO":
      query = `
        SELECT
          id
        FROM servicio
        WHERE id = $1
        LIMIT 1
      `;
      break;

    default:
      throw new Error("Tipo de favorito no válido.");
  }

  const { rows } = await client.query(query, params);

  return rows[0] || null;
}

// ============================================================
// CREAR FAVORITO
// ============================================================

async function crearFavorito(client, clienteId, tipo, id) {
  let query;
  let params;

  switch (tipo) {
    case "NEGOCIO":
      query = `
        INSERT INTO favorito (
          cliente_id,
          negocio_id
        )
        VALUES ($1, $2)
        ON CONFLICT (cliente_id, negocio_id)
        WHERE negocio_id IS NOT NULL
        DO NOTHING
        RETURNING
          id,
          cliente_id,
          negocio_id,
          profesional_id,
          servicio_id,
          created_at
      `;

      params = [clienteId, id];
      break;

    case "PROFESIONAL":
      query = `
        INSERT INTO favorito (
          cliente_id,
          profesional_id
        )
        VALUES ($1, $2)
        ON CONFLICT (cliente_id, profesional_id)
        WHERE profesional_id IS NOT NULL
        DO NOTHING
        RETURNING
          id,
          cliente_id,
          negocio_id,
          profesional_id,
          servicio_id,
          created_at
      `;

      params = [clienteId, id];
      break;

    case "SERVICIO":
      query = `
        INSERT INTO favorito (
          cliente_id,
          servicio_id
        )
        VALUES ($1, $2)
        ON CONFLICT (cliente_id, servicio_id)
        WHERE servicio_id IS NOT NULL
        DO NOTHING
        RETURNING
          id,
          cliente_id,
          negocio_id,
          profesional_id,
          servicio_id,
          created_at
      `;

      params = [clienteId, id];
      break;

    default:
      throw new Error("Tipo de favorito no válido.");
  }

  const { rows } = await client.query(query, params);

  if (rows.length) {
    return rows[0];
  }

  // Ya existía
  const existente = await obtenerFavoritoPorObjeto(client, clienteId, tipo, id);

  return existente;
}

// ============================================================
// OBTENER FAVORITO POR OBJETO
// ============================================================

async function obtenerFavoritoPorObjeto(client, clienteId, tipo, id) {
  let campo;

  switch (tipo) {
    case "NEGOCIO":
      campo = "negocio_id";
      break;

    case "PROFESIONAL":
      campo = "profesional_id";
      break;

    case "SERVICIO":
      campo = "servicio_id";
      break;

    default:
      throw new Error("Tipo de favorito no válido.");
  }

  const query = `
    SELECT
      id,
      cliente_id,
      negocio_id,
      profesional_id,
      servicio_id,
      created_at
    FROM favorito
    WHERE cliente_id = $1
      AND ${campo} = $2
    LIMIT 1
  `;

  const { rows } = await client.query(query, [clienteId, id]);

  return rows[0] || null;
}

// ============================================================
// ELIMINAR FAVORITO
// ============================================================

async function eliminarFavorito(client, clienteId, tipo, id) {
  let campo;

  switch (tipo) {
    case "NEGOCIO":
      campo = "negocio_id";
      break;

    case "PROFESIONAL":
      campo = "profesional_id";
      break;

    case "SERVICIO":
      campo = "servicio_id";
      break;

    default:
      throw new Error("Tipo de favorito no válido.");
  }

  const query = `
    DELETE FROM favorito
    WHERE cliente_id = $1
      AND ${campo} = $2
    RETURNING
      id,
      cliente_id,
      negocio_id,
      profesional_id,
      servicio_id,
      created_at
  `;

  const { rows } = await client.query(query, [clienteId, id]);

  return rows[0] || null;
}

// ============================================================
// OBTENER TODOS LOS FAVORITOS DEL CLIENTE
// ============================================================

async function obtenerFavoritosCliente(client, clienteId) {
  const query = `
    SELECT
      f.id AS favorito_id,
      f.created_at,
      'NEGOCIO' AS tipo,

      n.id AS negocio_id,
      n.nombre AS negocio_nombre,
      n.slug AS negocio_slug,
      n.codigo AS negocio_codigo,
      n.descripcion AS negocio_descripcion,
      n.telefono AS negocio_telefono,
      n.departamento AS negocio_departamento,
      n.municipio AS negocio_municipio,
      n.zona AS negocio_zona,
      n.direccion AS negocio_direccion,
      n.latitud AS negocio_latitud,
      n.longitud AS negocio_longitud,
      n.logo AS negocio_logo,
      n.portada AS negocio_portada,

      NULL::INTEGER AS profesional_id,
      NULL::VARCHAR AS profesional_slug,
      NULL::VARCHAR AS profesional_nombre,
      NULL::TEXT AS profesional_foto,
      NULL::TEXT AS profesional_portada,
      NULL::TEXT AS profesional_descripcion,
      NULL::VARCHAR AS profesional_lema,

      NULL::INTEGER AS servicio_id,
      NULL::VARCHAR AS servicio_nombre,
      NULL::TEXT AS servicio_descripcion,
      NULL::INTEGER AS servicio_duracion,
      NULL::NUMERIC AS servicio_precio,
      NULL::VARCHAR AS servicio_imagen

    FROM favorito f
    INNER JOIN negocio n
      ON n.id = f.negocio_id
    WHERE f.cliente_id = $1
      AND f.negocio_id IS NOT NULL

    UNION ALL

    SELECT
      f.id AS favorito_id,
      f.created_at,
      'PROFESIONAL' AS tipo,

      NULL::INTEGER AS negocio_id,
      NULL::VARCHAR AS negocio_nombre,
      NULL::VARCHAR AS negocio_slug,
      NULL::VARCHAR AS negocio_codigo,
      NULL::TEXT AS negocio_descripcion,
      NULL::VARCHAR AS negocio_telefono,
      NULL::VARCHAR AS negocio_departamento,
      NULL::VARCHAR AS negocio_municipio,
      NULL::VARCHAR AS negocio_zona,
      NULL::TEXT AS negocio_direccion,
      NULL::NUMERIC AS negocio_latitud,
      NULL::NUMERIC AS negocio_longitud,
      NULL::TEXT AS negocio_logo,
      NULL::TEXT AS negocio_portada,

      p.id AS profesional_id,
      p.slug AS profesional_slug,
      per.nombre AS profesional_nombre,
      p.foto AS profesional_foto,
      p.portada AS profesional_portada,
      p.descripcion AS profesional_descripcion,
      p.lema AS profesional_lema,

      NULL::INTEGER AS servicio_id,
      NULL::VARCHAR AS servicio_nombre,
      NULL::TEXT AS servicio_descripcion,
      NULL::INTEGER AS servicio_duracion,
      NULL::NUMERIC AS servicio_precio,
      NULL::VARCHAR AS servicio_imagen

    FROM favorito f
    INNER JOIN profesional p
      ON p.id = f.profesional_id
    INNER JOIN persona per
      ON per.id = p.persona_id
    WHERE f.cliente_id = $1
      AND f.profesional_id IS NOT NULL

    UNION ALL

    SELECT
      f.id AS favorito_id,
      f.created_at,
      'SERVICIO' AS tipo,

      NULL::INTEGER AS negocio_id,
      NULL::VARCHAR AS negocio_nombre,
      NULL::VARCHAR AS negocio_slug,
      NULL::VARCHAR AS negocio_codigo,
      NULL::TEXT AS negocio_descripcion,
      NULL::VARCHAR AS negocio_telefono,
      NULL::VARCHAR AS negocio_departamento,
      NULL::VARCHAR AS negocio_municipio,
      NULL::VARCHAR AS negocio_zona,
      NULL::TEXT AS negocio_direccion,
      NULL::NUMERIC AS negocio_latitud,
      NULL::NUMERIC AS negocio_longitud,
      NULL::TEXT AS negocio_logo,
      NULL::TEXT AS negocio_portada,

      p.id AS profesional_id,
      p.slug AS profesional_slug,
      per.nombre AS profesional_nombre,
      p.foto AS profesional_foto,
      p.portada AS profesional_portada,
      p.descripcion AS profesional_descripcion,
      p.lema AS profesional_lema,

      s.id AS servicio_id,
      s.nombre AS servicio_nombre,
      s.descripcion AS servicio_descripcion,
      s.duracion AS servicio_duracion,
      s.precio AS servicio_precio,

      archivo.url AS servicio_imagen

    FROM favorito f
    INNER JOIN servicio s
      ON s.id = f.servicio_id
    INNER JOIN profesional p
      ON p.id = s.profesional_id
    INNER JOIN persona per
      ON per.id = p.persona_id
    LEFT JOIN servicio_archivo sa
      ON sa.servicio_id = s.id
      AND sa.principal = TRUE
      AND sa.tipo = 'FOTO'
    LEFT JOIN archivo
      ON archivo.id = sa.archivo_id
    WHERE f.cliente_id = $1
      AND f.servicio_id IS NOT NULL

    ORDER BY created_at DESC
  `;

  const { rows } = await client.query(query, [clienteId]);

  return rows;
}

// ============================================================
// OBTENER ESTADO DE FAVORITO
// ============================================================

async function obtenerEstadoFavorito(client, clienteId, tipo, id) {
  const favorito = await obtenerFavoritoPorObjeto(client, clienteId, tipo, id);

  return {
    es_favorito: !!favorito,
    favorito: favorito || null,
  };
}

module.exports = {
  getClienteByToken,
  verificarObjeto,
  crearFavorito,
  obtenerFavoritoPorObjeto,
  eliminarFavorito,
  obtenerFavoritosCliente,
  obtenerEstadoFavorito,
};
