const seedTipoCalificacion = async (client) => {
  const tipos = [
    {
      codigo: "CALIDAD",
      nombre: "Calidad",
      descripcion: "Evalúa la calidad del servicio realizado",
    },
    {
      codigo: "ATENCION",
      nombre: "Atención",
      descripcion: "Evalúa la atención recibida",
    },
    {
      codigo: "DESTREZA",
      nombre: "Destreza",
      descripcion: "Evalúa la habilidad y destreza del profesional",
    },
    {
      codigo: "RENDIMIENTO",
      nombre: "Rendimiento",
      descripcion: "Evalúa el rendimiento del profesional",
    },
  ];

  for (const tipo of tipos) {
    await client.query(
      `
                INSERT INTO tipo_calificacion (
                    codigo,
                    nombre,
                    descripcion,
                    estado
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    'ACTIVO'
                )
                ON CONFLICT (codigo)
                DO UPDATE SET
                    nombre = EXCLUDED.nombre,
                    descripcion = EXCLUDED.descripcion,
                    estado = 'ACTIVO'
            `,
      [tipo.codigo, tipo.nombre, tipo.descripcion],
    );
  }

  console.log("✅ Tipos de calificación inicializados");
};

module.exports = seedTipoCalificacion;
