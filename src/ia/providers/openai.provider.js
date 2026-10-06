const OpenAI = require("openai");

const AIProvider = require("./ai.provider");

class OpenAIProvider extends AIProvider {
  constructor() {
    super();

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY no está configurada.");
    }

    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.model = process.env.OPENAI_MODEL || "gpt-5.6-luna";

    /*
     * Estado interno del proveedor.
     *
     * El Core de PIA no necesita conocer esto.
     * Solamente OpenAIProvider sabe cómo continuar
     * una respuesta mediante previous_response_id.
     */
    this.responseId = null;

    /*
     * IDs de las Tools solicitadas por la respuesta
     * anterior de OpenAI.
     */
    this.pendingToolCallIds = [];
  }

  async chat({ messages = [], tools = [] }) {
    const systemMessage = messages.find((message) => message.role === "system");

    const input = this.buildInput(messages);

    const request = {
      model: this.model,

      /*
       * Las instrucciones se mantienen en cada llamada.
       */
      instructions: systemMessage?.content || undefined,

      input,

      tools: this.convertTools(tools),

      /*
       * Necesario para poder continuar la conversación
       * mediante previous_response_id.
       */
      store: true,
    };

    /*
     * Si existe una respuesta anterior, continuamos
     * desde ella.
     */
    if (this.responseId) {
      request.previous_response_id = this.responseId;
    }

    try {
      const response = await this.client.responses.create(request);

      /*
       * Guardamos el ID de esta respuesta para que
       * la siguiente iteración pueda continuar desde aquí.
       */
      this.responseId = response.id;

      const respuesta = this.normalizeResponse(response);

      /*
       * Guardamos los IDs de las Tools que OpenAI
       * acaba de solicitar.
       */
      this.pendingToolCallIds = respuesta.toolCalls.map(
        (toolCall) => toolCall.id,
      );

      return respuesta;
    } catch (error) {
      console.error("Error OpenAI Provider:", error);

      throw new Error(
        error?.message ||
          "No se pudo obtener una respuesta del proveedor de IA.",
      );
    }
  }

  /*
   * Convierte nuestro Context interno al formato
   * que necesita OpenAI Responses API.
   */
  buildInput(messages = []) {
    /*
     * Primera llamada:
     *
     * Todavía no existe responseId.
     *
     * Enviamos la conversación completa.
     */
    if (!this.responseId) {
      return this.buildInitialInput(messages);
    }

    /*
     * Llamadas posteriores:
     *
     * OpenAI ya conoce la respuesta anterior.
     *
     * Solamente necesitamos enviar los resultados
     * de las Tools ejecutadas.
     */
    return messages
      .filter(
        (message) =>
          message.role === "tool" &&
          this.pendingToolCallIds.includes(message.toolCallId),
      )
      .map((message) => ({
        type: "function_call_output",
        call_id: message.toolCallId,
        output: message.content,
      }));
  }

  /*
   * Construye el input de la primera llamada.
   */
  buildInitialInput(messages = []) {
    const input = [];

    for (const message of messages) {
      /*
       * El system message se envía mediante
       * "instructions".
       */
      if (message.role === "system") {
        continue;
      }

      /*
       * Mensaje del usuario.
       */
      if (message.role === "user") {
        input.push({
          role: "user",
          content: message.content,
        });

        continue;
      }

      /*
       * Otros mensajes compatibles.
       */
      input.push({
        role: message.role,
        content: message.content,
      });
    }

    return input;
  }

  /*
   * Convierte nuestras Tools al formato
   * de Functions de OpenAI.
   */
  convertTools(tools = []) {
    return tools.map((tool) => ({
      type: "function",
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,

      /*
       * Dejamos strict=false porque nuestro contrato
       * de Tools todavía no exige esquemas estrictos.
       */
      strict: false,
    }));
  }

  /*
   * Convierte la respuesta específica de OpenAI
   * a nuestro contrato interno.
   *
   * El Core nunca necesita saber que usamos OpenAI.
   */
  normalizeResponse(response) {
    const toolCalls = [];

    for (const item of response.output || []) {
      if (item.type !== "function_call") {
        continue;
      }

      let argumentsParsed = {};

      try {
        argumentsParsed = JSON.parse(item.arguments || "{}");
      } catch (error) {
        throw new Error(
          `Argumentos inválidos para la herramienta "${item.name}".`,
        );
      }

      toolCalls.push({
        id: item.call_id || item.id,
        name: item.name,
        arguments: argumentsParsed,
      });
    }

    return {
      text: response.output_text || null,
      toolCalls,
    };
  }
}

module.exports = OpenAIProvider;
