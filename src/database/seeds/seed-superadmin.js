const { hashPassword } = require("../../utils/password");

const seedSuperadmin = async (client) => {
  const telefono = "73425366";
  const password = "bruno";

  const rolResult = await client.query(
    `
      SELECT id
      FROM rol
      WHERE nombre = 'SUPERADMIN'
      LIMIT 1
    `,
  );

  if (rolResult.rows.length === 0) {
    throw new Error("No existe el rol SUPERADMIN");
  }

  const rolId = rolResult.rows[0].id;

  const usuarioResult = await client.query(
    `
      SELECT id, persona_id
      FROM usuario
      WHERE telefono = $1
      LIMIT 1
    `,
    [telefono],
  );

  if (usuarioResult.rows.length > 0) {
    console.log("ℹ️ SUPERADMIN ya existe");

    return {
      usuario_id: usuarioResult.rows[0].id,
      persona_id: usuarioResult.rows[0].persona_id,
    };
  }

  const personaResult = await client.query(
    `
      INSERT INTO persona (
        nombre,
        telefono,
        sexo
      )
      VALUES (
        $1,
        $2,
        $3
      )
      RETURNING id
    `,
    ["Rudolf Felipez Mancilla", telefono, "MASCULINO"],
  );

  const personaId = personaResult.rows[0].id;

  const passwordHash = await hashPassword(password);

  const nuevoUsuarioResult = await client.query(
    `
      INSERT INTO usuario (
        persona_id,
        rol_id,
        telefono,
        password,
        estado
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        'HABILITADO'
      )
      RETURNING id
    `,
    [personaId, rolId, telefono, passwordHash],
  );

  console.log("✅ SUPERADMIN inicializado");

  return {
    usuario_id: nuevoUsuarioResult.rows[0].id,
    persona_id: personaId,
  };
};

module.exports = seedSuperadmin;
