class AIProvider {
  async chat({ messages, tools = [] }) {
    throw new Error(
      "El método chat() debe ser implementado por el proveedor de IA.",
    );
  }
}

module.exports = AIProvider;
