const ToolManager = require("../core/tool-manager");

const buscarServiciosTool = require("../tools/buscar-servicios.tool");

async function main() {
  const toolManager = new ToolManager();

  toolManager.register(buscarServiciosTool);

  console.log("🛠️ TOOLS REGISTRADAS:");

  console.dir(toolManager.getAll(), {
    depth: null,
  });

  const resultado = await toolManager.execute("buscarServicios", {
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
