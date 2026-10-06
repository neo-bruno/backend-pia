const buscarServiciosTool = require("../tools/buscar-servicios.tool");

async function main() {
  console.log("====================================");
  console.log("🧪 TEST buscarServicios");
  console.log("====================================");

  const resultado = await buscarServiciosTool.execute({
    negocio_id: 1,
  });

  console.log("\n✅ RESULTADO:");

  console.dir(resultado, {
    depth: null,
  });
}

main().catch((error) => {
  console.error("\n❌ ERROR:");
  console.error(error);
});
