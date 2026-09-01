const seedMetodoPago = async (client) => {
  const metodos = [
    {
      nombre: "QR",
      codigo: "QR",
      afecta_efectivo: false,
    },
    {
      nombre: "Efectivo",
      codigo: "EFECTIVO",
      afecta_efectivo: true,
    },
  ];

  for (const metodo of metodos) {
    await client.query(
      `
                INSERT INTO metodo_pago (
                    nombre,
                    codigo,
                    afecta_efectivo,
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
                    afecta_efectivo = EXCLUDED.afecta_efectivo,
                    estado = 'ACTIVO'
            `,
      [metodo.nombre, metodo.codigo, metodo.afecta_efectivo],
    );
  }

  console.log("✅ Métodos de pago inicializados");
};

module.exports = seedMetodoPago;
