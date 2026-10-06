const Agent = require("../core/agent");
const MockProvider = require("../providers/mock.provider");

const buscarServiciosTool = require("../tools/buscar-servicios.tool");

async function main() {
  const provider = new MockProvider();

  const agent = new Agent(provider, {
    agent: {
      id: "PIA",
      type: "AGENTE_IA",
    },

    user: {
      id: 25,
      type: "CLIENTE",
    },

    negocio: {
      id: 1,
    },

    session: {
      id: "test-session-001",
    },
  });

  agent.registerTool(buscarServiciosTool);

  const respuesta = await agent.run({
    message: "¿Qué servicios tienen?",
  });

  console.log("\n====================================");
  console.log("🤖 RESPUESTA DEL AGENTE");
  console.log("====================================");

  console.dir(respuesta, {
    depth: null,
  });

  console.log("\n====================================");
  console.log("🧠 CONTEXTO");
  console.log("====================================");

  console.dir(
    {
      data: agent.context.getData(),
      messages: agent.context.getMessages(),
    },
    {
      depth: null,
    },
  );
}

main().catch((error) => {
  console.error("\n❌ ERROR:");
  console.error(error);
});
