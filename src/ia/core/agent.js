const Context = require("./context");
const ToolManager = require("./tool-manager");
const AgentLoop = require("./agent-loop");
const agentConfig = require("./agent-config");

class Agent {
  constructor(provider, contextData = {}) {
    if (!provider) {
      throw new Error("El Agent necesita un proveedor de IA.");
    }

    this.provider = provider;

    this.context = new Context({
      agent: {
        id: "PIA",
        type: "AGENTE_IA",
      },

      ...contextData,
    });

    // =========================================================
    // MENSAJE DE SISTEMA
    // =========================================================
    if (agentConfig.systemPrompt) {
      this.context.addMessage("system", agentConfig.systemPrompt);
    }

    this.toolManager = new ToolManager();

    this.loop = new AgentLoop({
      provider: this.provider,
      toolManager: this.toolManager,
      context: this.context,
      maxIterations: agentConfig.maxIterations || 5,
    });
  }

  registerTool(tool) {
    this.toolManager.register(tool);
  }

  async run({ message }) {
    if (!message || !message.trim()) {
      throw new Error("El mensaje del usuario es obligatorio.");
    }

    this.context.addMessage("user", message);

    return await this.loop.run();
  }
}

module.exports = Agent;
