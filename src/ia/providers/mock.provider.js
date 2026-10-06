const AIProvider = require("./ai.provider");

class MockProvider extends AIProvider {
  async chat({ messages = [], tools = [] }) {
    console.log("🤖 MOCK PROVIDER");

    console.log("Mensajes recibidos:", messages);

    console.log(
      "Tools recibidas:",
      tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
      })),
    );

    const ultimoMensaje = messages[messages.length - 1];

    // =====================================================
    // CASO 1: solicitar información mediante Tool
    // =====================================================

    if (
      ultimoMensaje?.role === "user" &&
      ultimoMensaje.content?.toLowerCase().includes("servicios")
    ) {
      return {
        text: null,

        toolCalls: [
          {
            id: "call_1",
            name: "buscarServicios",

            arguments: {
              negocio_id: 1,
            },
          },
        ],
      };
    }

    // =====================================================
    // CASO 2: resultado de una Tool
    // =====================================================

    if (ultimoMensaje?.role === "tool") {
      const resultado = JSON.parse(ultimoMensaje.content);

      const servicios = resultado.servicios || [];

      const lista = servicios
        .map((servicio) => `• ${servicio.nombre}: ${servicio.precio} Bs.`)
        .join("\n");

      return {
        text: `Estos son los servicios disponibles:\n\n${lista}`,

        toolCalls: [],
      };
    }

    // =====================================================
    // CASO 3: conversación normal
    // =====================================================

    return {
      text: "Hola 👋. Soy PIA y estoy funcionando correctamente.",

      toolCalls: [],
    };
  }
}

module.exports = MockProvider;
