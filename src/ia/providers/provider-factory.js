const OpenAIProvider = require("./openai.provider");
const GroqProvider = require("./groq.provider");

function crearProvider(providerName) {
  const nombre = (
    providerName ||
    process.env.PIA_AI_PROVIDER ||
    "groq"
  ).toLowerCase();

  switch (nombre) {
    case "openai":
      return new OpenAIProvider();

    case "groq":
      return new GroqProvider();

    default:
      throw new Error(`Proveedor de IA no soportado: ${nombre}`);
  }
}

module.exports = {
  crearProvider,
};
