const pool = require("../../database/pool");

const crearPersona = async (
  client,
  { nombre, telefono, sexo, fecha_nacimiento },
) => {
  const query = `
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
            fecha_nacimiento,
            created_at,
            updated_at
    `;

  const { rows } = await client.query(query, [
    nombre,
    telefono,
    sexo,
    fecha_nacimiento,
  ]);

  return rows[0];
};

const crearUsuario = async (
  client,
  { persona_id, rol_id, telefono, password },
) => {
  const query = `
        INSERT INTO usuario (
            persona_id,
            rol_id,
            telefono,
            password,
            estado
        )
        VALUES ($1, $2, $3, $4, 'HABILITADO')
        RETURNING
            id,
            persona_id,
            rol_id,
            telefono,
            estado,
            created_at,
            updated_at
    `;

  const { rows } = await client.query(query, [
    persona_id,
    rol_id,
    telefono,
    password,
  ]);

  return rows[0];
};

const buscarRolPorId = async (client, rol_id) => {
  const query = `
        SELECT
            id,
            nombre,
            descripcion
        FROM rol
        WHERE id = $1
    `;

  const { rows } = await client.query(query, [rol_id]);

  return rows[0] || null;
};

const buscarUsuarioPorTelefono = async (client, telefono) => {
  const query = `
        SELECT
            id,
            telefono
        FROM usuario
        WHERE telefono = $1
    `;

  const { rows } = await client.query(query, [telefono]);

  return rows[0] || null;
};

const buscarPersonaPorTelefono = async (client, telefono) => {
  const query = `
        SELECT
            id,
            telefono
        FROM persona
        WHERE telefono = $1
    `;

  const { rows } = await client.query(query, [telefono]);

  return rows[0] || null;
};

const ejecutarTransaccion = async (callback) => {
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
};

module.exports = {
  crearPersona,
  crearUsuario,
  buscarRolPorId,
  buscarUsuarioPorTelefono,
  buscarPersonaPorTelefono,
  ejecutarTransaccion,
};
