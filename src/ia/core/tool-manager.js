const authorizer = require("../security/ia-authorizer");

class ToolManager {
  constructor() {
    this.tools = new Map();
  }

  register(tool) {
    if (!tool?.name) {
      throw new Error("La Tool debe tener un nombre.");
    }

    if (typeof tool.execute !== "function") {
      throw new Error(`La Tool "${tool.name}" debe tener un método execute().`);
    }

    if (this.tools.has(tool.name)) {
      throw new Error(`La Tool "${tool.name}" ya está registrada.`);
    }

    this.tools.set(tool.name, tool);
  }

  get(name) {
    return this.tools.get(name);
  }

  getAll() {
    return Array.from(this.tools.values());
  }

  getDefinitions() {
    return this.getAll().map((tool) => ({
      name: tool.name,
      description: tool.description,
      type: tool.type || "query",

      parameters: tool.parameters || {
        type: "object",
        properties: {},
        required: [],
      },
    }));
  }

  async execute(name, args = {}, context = {}) {
    const tool = this.get(name);

    if (!tool) {
      throw new Error(`La Tool "${name}" no está registrada.`);
    }

    if (tool.permission) {
      authorizer.autorizar(tool.permission, context);
    }

    return await tool.execute(args, context);
  }
}

module.exports = ToolManager;
