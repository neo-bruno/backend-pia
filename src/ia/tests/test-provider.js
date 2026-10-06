const MockProvider = require("../providers/mock.provider");

async function main() {
  const provider = new MockProvider();

  const respuesta = await provider.chat({
    messages: [
      {
        role: "user",
        content: "Hola PIA",
      },
    ],

    tools: [],
  });

  console.log("====================================");
  console.log("🧪 TEST PROVIDER");
  console.log("====================================");

  console.log("✅ RESPUESTA:");

  console.dir(respuesta, {
    depth: null,
  });
}

main().catch((error) => {
  console.error("❌ ERROR:");
  console.error(error);
});
