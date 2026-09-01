const seedTipoPromocion = async (client) => {
  const tipos = [
    {
      codigo: "CUMPLEANOS",
      nombre: "Promoción cumpleaños",
      descripcion: "Promoción asociada al cumpleaños del cliente.",
    },
    {
      codigo: "FELIZ_DIA",
      nombre: "Feliz día",
      descripcion: "Promoción asociada a una fecha especial.",
    },
    {
      codigo: "N_CORTES",
      nombre: "N cortes",
      descripcion: "Promoción basada en la cantidad de atenciones realizadas.",
    },
  ];

  for (const tipo of tipos) {
    await client.query(
      `
        INSERT INTO tipo_promocion (
          codigo,
          nombre,
          descripcion
        )
        VALUES (
          $1,
          $2,
          $3
        )
        ON CONFLICT (codigo)
        DO UPDATE SET
          nombre = EXCLUDED.nombre,
          descripcion = EXCLUDED.descripcion
      `,
      [tipo.codigo, tipo.nombre, tipo.descripcion],
    );
  }

  console.log("✅ Tipos de promoción inicializados");
};

module.exports = seedTipoPromocion;
