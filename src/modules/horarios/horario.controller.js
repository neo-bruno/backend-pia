const service = require("./horario.service");

const saveBusinessHours = async (req, res, next) => {
  try {
    /*
     * El profesional sale del JWT.
     * NO del frontend.
     */

    const profesionalId = req.usuario?.profesional_id;

    /*
     * El frontend puede enviar directamente:
     *
     * [
     *   {...},
     *   {...}
     * ]
     */

    const dias = req.body;

    const resultado = await service.saveBusinessHours(profesionalId, dias);

    return res.status(200).json({
      ok: true,

      message: "Horarios del negocio guardados correctamente",

      data: resultado,
    });
  } catch (error) {
    next(error);
  }
};

const getBusinessHours = async (req, res, next) => {
  try {
    // --------------------------------------------
    // PROFESIONAL DEL JWT
    // --------------------------------------------

    const profesionalId = req.usuario?.profesional_id;

    // --------------------------------------------
    // SERVICE
    // --------------------------------------------

    const resultado = await service.getBusinessHours(profesionalId);

    // --------------------------------------------
    // RESPONSE
    // --------------------------------------------

    return res.status(200).json({
      ok: true,

      message: "Horarios del negocio obtenidos correctamente",

      data: resultado,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  saveBusinessHours,
  getBusinessHours,
};
