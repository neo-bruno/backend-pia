const OpenAI = require("openai");
const AIProvider = require("./ai.provider");

class GroqProvider extends AIProvider {
  constructor() {
    super();

    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY no está configurada.");
    }

    this.client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });

    console.log(
      "GROQ_API_KEY:",
      process.env.GROQ_API_KEY
        ? `${process.env.GROQ_API_KEY.substring(0, 7)}...`
        : "NO CONFIGURADA"
    );

    this.model = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
  }

  async chat({ messages = [], tools = [] }) {
    const request = {
      model: this.model,
      messages: this.buildMessages(messages),
      tools: this.convertTools(tools),
      tool_choice: "auto",
    };

    try {
      const response = await this.client.chat.completions.create(request);

      return this.normalizeResponse(response);
    } catch (error) {
      console.error("Error Groq Provider:", error);

      throw new Error(
        error?.message ||
          "No se pudo obtener una respuesta del proveedor Groq.",
      );
    }
  }

  buildMessages(messages = []) {
    return messages.map((message) => {
      if (message.role === "tool") {
        return {
          role: "tool",
          tool_call_id: message.toolCallId,
          content: message.content,
        };
      }

      if (message.role === "assistant") {
        const result = {
          role: "assistant",
          content: message.content || null,
        };

        if (message.toolCalls?.length) {
          result.tool_calls = message.toolCalls.map((toolCall) => ({
            id: toolCall.id,
            type: "function",
            function: {
              name: toolCall.name,
              arguments: JSON.stringify(toolCall.arguments || {}),
            },
          }));
        }

        return result;
      }

      return {
        role: message.role,
        content: message.content,
      };
    });
  }

  convertTools(tools = []) {
    return tools.map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }

  normalizeResponse(response) {
    const message = response?.choices?.[0]?.message;

    if (!message) {
      return {
        text: null,
        toolCalls: [],
      };
    }

    const toolCalls = (message.tool_calls || []).map((toolCall) => {
      let argumentsParsed = {};

      try {
        argumentsParsed = JSON.parse(toolCall.function.arguments || "{}");
      } catch {
        throw new Error(
          `Argumentos inválidos para la herramienta "${toolCall.function.name}".`,
        );
      }

      return {
        id: toolCall.id,
        name: toolCall.function.name,
        arguments: argumentsParsed,
      };
    });

    return {
      text: message.content || null,
      toolCalls,
    };
  }
}

module.exports = GroqProvider;
