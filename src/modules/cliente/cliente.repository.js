const pool = require("../../database/pool");

const buscarPorTelefono = async (client, telefono) => {
  const query = `
        SELECT
            id,
            persona_id,
            alias,
            telefono,
            token
        FROM cliente
        WHERE telefono = $1
        LIMIT 1
    `;

  const { rows } = await client.query(query, [telefono]);

  return rows[0] || null;
};
const crearPersona = async (client, nombre, telefono) => {
  const query = `
        INSERT INTO persona (
            nombre,
            telefono
        )
        VALUES ($1, $2)
        RETURNING
            id,
            nombre,
            telefono
    `;

  const { rows } = await client.query(query, [nombre, telefono]);

  return rows[0];
};
const crearCliente = async (client, { personaId, alias, telefono, token }) => {
  const query = `
        INSERT INTO cliente (
            persona_id,
            alias,
            telefono,
            token
        )
        VALUES ($1, $2, $3, $4)
        RETURNING
            id,
            persona_id,
            alias,
            telefono,
            token
    `;

  const { rows } = await client.query(query, [
    personaId,
    alias,
    telefono,
    token,
  ]);

  return rows[0];
};
const actualizarToken = async (client, clienteId, token) => {
  const query = `
        UPDATE cliente
        SET
            token = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING
            id,
            persona_id,
            alias,
            telefono,
            token
    `;

  const { rows } = await client.query(query, [token, clienteId]);

  return rows[0];
};

/**
 * BUSCAR CLIENTE POR TELÉFONO
 */
const findClientByPhone = async (telefono) => {
  const query = `
    SELECT
      c.id AS cliente_id,
      c.persona_id,
      c.telefono,
      c.token,

      p.nombre,
      p.telefono AS persona_telefono,
      p.sexo,
      p.fecha_nacimiento

    FROM cliente c

    INNER JOIN persona p
      ON p.id = c.persona_id

    WHERE c.telefono = $1

    LIMIT 1
  `;

  const { rows } = await pool.query(query, [telefono]);

  return rows[0] || null;
};

// =====================================================
// BUSCAR CLIENTE POR TELÉFONO
// =====================================================
async function buscarClientePorTelefono(telefono) {
  const result = await pool.query(
    `
      SELECT
        c.id,
        c.persona_id,
        c.token,
        p.nombre,
        p.telefono,
        p.sexo,
        p.fecha_nacimiento

      FROM cliente c

      INNER JOIN persona p
        ON p.id = c.persona_id

      WHERE p.telefono = $1

      LIMIT 1
    `,
    [telefono],
  );

  return result.rows[0] || null;
}

// =====================================================
// CREAR PERSONA
// =====================================================

async function createPersona(client, datos) {
  const result = await client.query(
    `
      INSERT INTO persona (
        nombre,
        telefono,
        sexo,
        fecha_nacimiento
      )
      VALUES ($1, $2, $3, $4)

      RETURNING
        id,
        nombre,
        telefono,
        sexo,
        fecha_nacimiento
    `,
    [datos.nombre, datos.telefono, null, null],
  );

  return result.rows[0];
}

// =====================================================
// CREAR CLIENTE
// =====================================================

async function createCliente(client, personaId, alias, telefono, token) {
  const result = await client.query(
    `
      INSERT INTO cliente (
        persona_id,
        alias,
        telefono,
        token
      )
      VALUES ($1, $2, $3, $4)

      RETURNING
        id,
        persona_id,
        alias,
        telefono,
        token
    `,
    [personaId, alias, telefono, token],
  );

  return result.rows[0];
}

// =====================================================
// ACTUALIZAR TOKEN
// =====================================================

async function updateToken(clienteId, token) {
  const result = await pool.query(
    `
      UPDATE cliente
      SET token = $1,
          updated_at = CURRENT_TIMESTAMP

      WHERE id = $2

      RETURNING
        id,
        persona_id,
        token
    `,
    [token, clienteId],
  );

  return result.rows[0];
}

// =====================================================
// OBTENER CLIENTE COMPLETO
// =====================================================

async function getClientById(clienteId) {
  const result = await pool.query(
    `
      SELECT
        c.id,
        c.persona_id,
        c.alias,
        c.token,

        p.nombre,
        p.telefono,
        p.sexo,
        p.fecha_nacimiento

      FROM cliente c

      INNER JOIN persona p
        ON p.id = c.persona_id

      WHERE c.id = $1

      LIMIT 1
    `,
    [clienteId],
  );

  return result.rows[0] || null;
}

// =====================================================
// OBTENER PERFIL POR TOKEN DE CLIENTE
// =====================================================

async function getPerfilByToken(token) {
  const result = await pool.query(
    `
      SELECT
        c.id,
        c.persona_id,
        c.alias,
        c.telefono,

        p.nombre,
        p.sexo,
        p.fecha_nacimiento

      FROM cliente c

      INNER JOIN persona p
        ON p.id = c.persona_id

      WHERE c.token = $1

      LIMIT 1
    `,
    [token],
  );

  return result.rows[0] || null;
}

// =====================================================
// ACTUALIZAR PERFIL DEL CLIENTE
// =====================================================

async function actualizarPerfil(client, clienteId, personaId, datos) {
  // ===================================================
  // ACTUALIZAR PERSONA
  // ===================================================

  const personaResult = await client.query(
    `
      UPDATE persona
      SET
        nombre = $1,
        telefono = $2,
        sexo = $3,
        fecha_nacimiento = $4,
        updated_at = CURRENT_TIMESTAMP

      WHERE id = $5

      RETURNING
        id,
        nombre,
        telefono,
        sexo,
        fecha_nacimiento
    `,
    [
      datos.nombre,
      datos.telefono,
      datos.sexo,
      datos.fecha_nacimiento,
      personaId,
    ],
  );

  if (personaResult.rows.length === 0) {
    const error = new Error("No se encontró la persona del cliente");
    error.status = 404;
    throw error;
  }

  // ===================================================
  // ACTUALIZAR CLIENTE
  // ===================================================

  const clienteResult = await client.query(
    `
      UPDATE cliente
      SET
        alias = $1,
        telefono = $2,
        updated_at = CURRENT_TIMESTAMP

      WHERE id = $3

      RETURNING
        id,
        persona_id,
        alias,
        telefono
    `,
    [datos.alias, datos.telefono, clienteId],
  );

  if (clienteResult.rows.length === 0) {
    const error = new Error("No se encontró el cliente");
    error.status = 404;
    throw error;
  }

  // ===================================================
  // DEVOLVER PERFIL ACTUALIZADO
  // ===================================================

  return {
    ...clienteResult.rows[0],
    ...personaResult.rows[0],
  };
}

// =====================================================
// VERIFICAR TELÉFONO EN OTRO CLIENTE
// =====================================================

const existeTelefonoEnOtroCliente = async (client, telefono, clienteId) => {
  const result = await client.query(
    `
      SELECT c.id
      FROM cliente c
      INNER JOIN persona p
        ON p.id = c.persona_id
      WHERE
        c.id <> $1
        AND (
          c.telefono = $2
          OR p.telefono = $2
        )
      LIMIT 1
    `,
    [clienteId, telefono],
  );

  return result.rows.length > 0;
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  buscarClientePorTelefono,
  createPersona,
  createCliente,
  updateToken,
  getClientById,

  findClientByPhone,

  buscarPorTelefono,
  crearPersona,
  crearCliente,
  actualizarToken,
  getPerfilByToken,

  actualizarPerfil,
  existeTelefonoEnOtroCliente,
};
