require("dotenv").config();

const pool = require("./pool");

const seedRoles = require("./seeds/seed-roles");
const seedTipoPromocion = require("./seeds/seed-tipo-promocion");
const seedTipoCalificacion = require("./seeds/seed-tipo-calificacion");
const seedMetodoPago = require("./seeds/seed-metodo-pago");
const seedSegmentacion = require("./seeds/seed-segmentacion");
const seedSuperadmin = require("./seeds/seed-superadmin");
const seedGerenteGerencia = require("./seeds/seed-gerente-gerencia");
const seedTiposNegocio = require("./seeds/seed-tipo-negocios");
const seedTiposProfesiones = require("./seeds/seed-tipo-profesionales");

const init = async () => {
  const client = await pool.connect();

  try {
    console.log("");
    console.log("================================");
    console.log("       INICIALIZANDO PIA");
    console.log("================================");
    console.log("");

    await client.query("BEGIN");

    /*
     * ==========================================
     * CATÁLOGOS BASE
     * ==========================================
     */

    await seedRoles(client);

    await seedTipoPromocion(client);

    await seedTipoCalificacion(client);

    await seedTiposNegocio(client);

    await seedTiposProfesiones(client);

    await seedMetodoPago(client);

    await seedSegmentacion(client);

    /*
     * ==========================================
     * USUARIO PRINCIPAL
     * ==========================================
     */

    const superadmin = await seedSuperadmin(client);

    /*
     * ==========================================
     * GERENCIA PIA
     * ==========================================
     */

    await seedGerenteGerencia(client, superadmin.persona_id);

    /*
     * ==========================================
     * CONFIRMAR
     * ==========================================
     */

    await client.query("COMMIT");

    console.log("");
    console.log("================================");
    console.log("     ✅ PIA INICIALIZADO");
    console.log("================================");
    console.log("");
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("");
    console.error("❌ ERROR INICIALIZANDO PIA");
    console.error(error.message);
    console.error("");

    process.exitCode = 1;
  } finally {
    client.release();
  }
};

init();
