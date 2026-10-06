const seedGerenteGerencia = async (client, personaId) => {
  if (!personaId) {
    throw new Error("No se recibió persona_id para crear el gerente");
  }

  /*
   * ==========================================
   * GERENTE
   * ==========================================
   */

  const gerenteExistente = await client.query(
    `
      SELECT id
      FROM gerente
      WHERE persona_id = $1
      LIMIT 1
    `,
    [personaId],
  );

  let gerenteId;

  if (gerenteExistente.rows.length > 0) {
    gerenteId = gerenteExistente.rows[0].id;

    console.log("ℹ️ GERENTE ya existe");
  } else {
    const gerenteResult = await client.query(
      `
        INSERT INTO gerente (
          persona_id,
          nombre,
          estado
        )
        VALUES (
          $1,
          $2,
          'ACTIVO'
        )
        RETURNING id
      `,
      [personaId, "Rudolf Felipez Mancilla"],
    );

    gerenteId = gerenteResult.rows[0].id;

    console.log("✅ GERENTE inicializado");
  }

  /*
   * ==========================================
   * ARCHIVO QR DE MEMBRESÍA
   * ==========================================
   */

  const archivoExistente = await client.query(
    `
      SELECT id
      FROM archivo
      WHERE tipo = 'QR_MEMBRESIA'
        AND nombre = 'pia-qr-membresia.png'
      LIMIT 1
    `,
  );

  let archivoId;

  if (archivoExistente.rows.length > 0) {
    archivoId = archivoExistente.rows[0].id;

    console.log("ℹ️ ARCHIVO QR ya existe");
  } else {
    const archivoResult = await client.query(
      `
        INSERT INTO archivo (
          nombre,
          url,
          tipo,
          mime_type,
          tamano_bytes
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5
        )
        RETURNING id
      `,
      [
        "pia-qr-membresia.png",
        "/uploads/gerencia/pia-qr-membresia.png",
        "QR_MEMBRESIA",
        "image/png",
        0,
      ],
    );

    archivoId = archivoResult.rows[0].id;

    console.log("✅ ARCHIVO QR inicializado");
  }

  /*
   * ==========================================
   * GERENCIA
   * ==========================================
   */

  const gerenciaExistente = await client.query(
    `
      SELECT id
      FROM gerencia
      WHERE gerente_id = $1
      LIMIT 1
    `,
    [gerenteId],
  );

  let gerenciaId;

  if (gerenciaExistente.rows.length > 0) {
    gerenciaId = gerenciaExistente.rows[0].id;

    console.log("ℹ️ GERENCIA ya existe");
  } else {
    const gerenciaResult = await client.query(
      `
        INSERT INTO gerencia (
          gerente_id,
          archivo_id,
          nombre,
          direccion,
          monto_qr,
          estado
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          'ACTIVO'
        )
        RETURNING id
      `,
      [gerenteId, archivoId, "Marketplace PIA", 'C. España # 172', 10],
    );

    gerenciaId = gerenciaResult.rows[0].id;

    console.log("✅ GERENCIA inicializada");
  }

  return {
    gerente_id: gerenteId,
    archivo_id: archivoId,
    gerencia_id: gerenciaId,
  };
};

module.exports = seedGerenteGerencia;
