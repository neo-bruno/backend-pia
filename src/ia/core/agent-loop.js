class AgentLoop {
  constructor({ provider, toolManager, context, maxIterations = 5 }) {
    this.provider = provider;
    this.toolManager = toolManager;
    this.context = context;
    this.maxIterations = maxIterations;
  }

  async run() {
    for (let iteration = 0; iteration < this.maxIterations; iteration++) {
      const messages = this.context.getMessages();

      const tools = this.toolManager.getDefinitions();

      const respuesta = await this.provider.chat({
        messages,
        tools,
      });

      /*
       * No solicitó ninguna herramienta.
       * Entonces tenemos respuesta final.
       */
      if (!respuesta?.toolCalls?.length) {
        if (respuesta?.text) {
          this.context.addMessage("assistant", respuesta.text);
        }

        return respuesta;
      }

      /*
       * Guardamos la decisión del modelo.
       */
      this.context.addMessage("assistant", respuesta.text || null, {
        toolCalls: respuesta.toolCalls,
      });

      /*
       * Ejecutamos las herramientas solicitadas.
       */
      for (const toolCall of respuesta.toolCalls) {
        const resultado = await this.toolManager.execute(
          toolCall.name,
          toolCall.arguments || {},
          this.context.getData(),
        );

        this.context.addMessage("tool", JSON.stringify(resultado), {
          toolCallId: toolCall.id || null,
          name: toolCall.name,
        });
      }
    }

    throw new Error("PIA alcanzó el máximo de iteraciones del Agent.");
  }
}

module.exports = AgentLoop;
