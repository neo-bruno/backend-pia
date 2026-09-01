const seedRoles = async (client) => {
  const roles = [
    {
      nombre: "SUPERADMIN",
      descripcion: "Creador de Todo",
    },
    {
      nombre: "ADMIN",
      descripcion: "Control de Algunos modulos",
    },
  ];

  for (const rol of roles) {
    await client.query(
      `
                INSERT INTO rol (
                    nombre,
                    descripcion
                )
                VALUES ($1, $2)
                ON CONFLICT (nombre)
                DO UPDATE SET
                    descripcion = EXCLUDED.descripcion
            `,
      [rol.nombre, rol.descripcion],
    );
  }

  console.log("✅ Roles inicializados");
};

module.exports = seedRoles;
