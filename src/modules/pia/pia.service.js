const Agent = require("../../ia/core/agent");

const { crearProvider } = require("../../ia/providers/provider-factory");

const { crearToolRegistry } = require("../../ia/registry/tool-registry");

async function chat({ message, user }) {
  const provider = crearProvider();

  const agent = new Agent(provider, {
    user: {
      id: user?.id || null,
      type: user?.rol || "CLIENTE",
      telefono: user?.telefono || null,
    },

    negocio: {
      id: user?.negocio_id || null,
    },

    session: {
      id: null,
    },
  });

  const tools = crearToolRegistry();

  for (const tool of tools) {
    agent.registerTool(tool);
  }

  return await agent.run({
    message,
  });
}

module.exports = {
  chat,
};
