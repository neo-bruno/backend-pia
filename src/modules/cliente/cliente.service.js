const crypto = require("crypto");

const pool = require("../../database/pool");
const repository = require("./cliente.repository");

const generarToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

const autenticarCliente = async ({ telefono, alias }) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // =====================================================
    // 1. BUSCAR CLIENTE POR TELÉFONO
    // =====================================================

    let cliente = await repository.buscarPorTelefono(client, telefono);

    // =====================================================
    // 2. CLIENTE EXISTE Y YA TIENE TOKEN
    // =====================================================

    if (cliente && cliente.token) {
      await client.query("COMMIT");

      return {
        cliente_id: cliente.id,
        persona_id: cliente.persona_id,
        alias: cliente.alias,
        telefono: cliente.telefono,
        token: cliente.token,
        nuevo: false,
      };
    }

    // =====================================================
    // 3. CLIENTE EXISTE PERO NO TIENE TOKEN
    // =====================================================

    if (cliente && !cliente.token) {
      const token = generarToken();

      cliente = await repository.actualizarToken(client, cliente.id, token);

      await client.query("COMMIT");

      return {
        cliente_id: cliente.id,
        persona_id: cliente.persona_id,
        alias: cliente.alias,
        telefono: cliente.telefono,
        token: cliente.token,
        nuevo: false,
      };
    }

    // =====================================================
    // 4. CLIENTE NO EXISTE
    // =====================================================

    if (!alias) {
      await client.query("ROLLBACK");

      const error = new Error(
        "El alias es obligatorio para registrar un nuevo cliente",
      );

      error.status = 400;

      throw error;
    }

    // =====================================================
    // 5. CREAR PERSONA
    // =====================================================

    const persona = await repository.crearPersona(client, alias, telefono);

    // =====================================================
    // 6. GENERAR TOKEN
    // =====================================================

    const token = generarToken();

    // =====================================================
    // 7. CREAR CLIENTE
    // =====================================================

    cliente = await repository.crearCliente(client, {
      personaId: persona.id,
      alias,
      telefono,
      token,
    });

    // =====================================================
    // 8. CONFIRMAR TRANSACCIÓN
    // =====================================================

    await client.query("COMMIT");

    return {
      cliente_id: cliente.id,
      persona_id: cliente.persona_id,
      alias: cliente.alias,
      telefono: cliente.telefono,
      token: cliente.token,
      nuevo: true,
    };
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
};

/**
 * BUSCAR CLIENTE POR TELÉFONO
 */
const findClientByPhone = async (telefono) => {
  const cliente = await repository.findClientByPhone(telefono);

  if (!cliente) {
    return null;
  }

  return {
    id: cliente.cliente_id,
    persona_id: cliente.persona_id,
    telefono: cliente.telefono,
    nombre: cliente.nombre,
    sexo: cliente.sexo,
    fecha_nacimiento: cliente.fecha_nacimiento,
  };
};

// =====================================================
// LOGIN / REGISTRO CLIENTE
// =====================================================
async function loginRegisterClient(datos) {
  const { telefono, alias } = datos;

  // ==================================================
  // BUSCAR CLIENTE
  // ==================================================

  const clienteExistente = await repository.buscarClientePorTelefono(telefono);

  // ==================================================
  // CLIENTE EXISTENTE
  // ==================================================

  if (clienteExistente) {
    console.log("👤 CLIENTE EXISTENTE:", clienteExistente.id);

    // ------------------------------------------------
    // GENERAR NUEVO TOKEN
    // ------------------------------------------------

    const token = generarToken();

    await repository.updateToken(clienteExistente.id, token);

    // ------------------------------------------------
    // OBTENER DATOS ACTUALIZADOS
    // ------------------------------------------------

    const cliente = await repository.getClientById(clienteExistente.id);

    return {
      id: cliente.id,
      persona_id: cliente.persona_id,
      alias: cliente.alias,
      telefono: cliente.telefono,
      sexo: cliente.sexo,
      fecha_nacimiento: cliente.fecha_nacimiento,
      token: cliente.token,
      nuevo: false,
    };
  }

  // ==================================================
  // CLIENTE NUEVO
  // ==================================================

  console.log("🆕 CLIENTE NUEVO:", telefono, alias);

  // --------------------------------------------------
  // VALIDAR ALIAS
  // --------------------------------------------------

  if (!alias || alias.trim().length < 2) {
    const error = new Error(
      "El alias es obligatorio para registrar un cliente",
    );

    error.status = 400;

    throw error;
  }

  // ==================================================
  // TRANSACCIÓN
  // ==================================================

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ------------------------------------------------
    // GENERAR TOKEN
    // ------------------------------------------------

    const token = generarToken();

    // ------------------------------------------------
    // CREAR PERSONA
    // ------------------------------------------------
    const persona = await repository.createPersona(client, {
      nombre: alias.trim(),
      telefono,
    });

    // ------------------------------------------------
    // CREAR CLIENTE
    // ------------------------------------------------

    const cliente = await repository.createCliente(
      client,
      persona.id,
      alias.trim(),
      telefono,
      token,
    );

    // ------------------------------------------------
    // CONFIRMAR
    // ------------------------------------------------

    await client.query("COMMIT");

    console.log("✅ CLIENTE REGISTRADO:", cliente);

    // ------------------------------------------------
    // RESPUESTA
    // ------------------------------------------------

    return {
      id: cliente.id,
      persona_id: persona.id,
      alias: cliente.alias,
      telefono: cliente.telefono,
      sexo: persona.sexo,
      fecha_nacimiento: persona.fecha_nacimiento,
      token: cliente.token,
      nuevo: true,
    };
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
}

const getPerfil = async (token) => {
  const cliente = await repository.getPerfilByToken(token);

  if (!cliente) {
    const error = new Error("Sesión de cliente no válida");
    error.status = 401;
    throw error;
  }

  return {
    id: cliente.id,
    persona_id: cliente.persona_id,
    alias: cliente.alias,
    telefono: cliente.telefono,
    nombre: cliente.nombre,
    sexo: cliente.sexo,
    fecha_nacimiento: cliente.fecha_nacimiento,
  };
};

// =====================================================
// EDITAR PERFIL DEL CLIENTE
// =====================================================
const actualizarPerfil = async (token, datos) => {
  // ---------------------------------------------------
  // 1. BUSCAR CLIENTE POR TOKEN
  // ---------------------------------------------------
  const cliente = await repository.getPerfilByToken(token);

  if (!cliente) {
    const error = new Error("Sesión de cliente no válida");
    error.status = 401;
    throw error;
  }

  // ---------------------------------------------------
  // 1. VALIDANDO EL TELEFONO UNICO
  // ---------------------------------------------------
  const client = await pool.connect();

  const telefonoExiste = await repository.existeTelefonoEnOtroCliente(
    client,
    datos.telefono,
    cliente.id,
  );

  if (telefonoExiste) {
    const error = new Error(
      "El número de teléfono ya está registrado por otro cliente",
    );

    error.status = 409;

    throw error;
  }

  // ---------------------------------------------------
  // 2. ABRIR TRANSACCIÓN
  // ---------------------------------------------------

  try {
    await client.query("BEGIN");

    // -------------------------------------------------
    // 3. ACTUALIZAR PERSONA + CLIENTE
    // -------------------------------------------------
    const actualizado = await repository.actualizarPerfil(
      client,
      cliente.id,
      cliente.persona_id,
      datos,
    );

    // -------------------------------------------------
    // 4. CONFIRMAR
    // -------------------------------------------------
    await client.query("COMMIT");

    // -------------------------------------------------
    // 5. DEVOLVER PERFIL ACTUALIZADO
    // -------------------------------------------------
    return {
      id: actualizado.id,
      persona_id: actualizado.persona_id,
      alias: actualizado.alias,
      telefono: actualizado.telefono,
      nombre: actualizado.nombre,
      sexo: actualizado.sexo,
      fecha_nacimiento: actualizado.fecha_nacimiento,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  loginRegisterClient,

  findClientByPhone,
  autenticarCliente,
  getPerfil,
  actualizarPerfil,
};
