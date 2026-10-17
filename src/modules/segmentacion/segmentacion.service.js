const pool = require("../../database/pool");
const repository = require("./segmentacion.repository");

const validarId = (valor, nombre) => {
  const id = Number(valor);

  if (!Number.isInteger(id) || id <= 0) {
    const error = new Error(`${nombre} no es válido`);
    error.status = 400;
    throw error;
  }

  return id;
};

const diasEntre = (fechaInicial, fechaFinal) => {
  const inicio = new Date(fechaInicial);
  const fin = new Date(fechaFinal);

  inicio.setUTCHours(0, 0, 0, 0);
  fin.setUTCHours(0, 0, 0, 0);

  return Math.floor((fin.getTime() - inicio.getTime()) / 86400000);
};

const evaluarSegmento = (segmento, atenciones, hoy = new Date()) => {
  if (atenciones.length < Number(segmento.min_atenciones)) {
    return {
      cumple: false,
      motivo: "No alcanza el mínimo de atenciones",
      atenciones_periodo: 0,
      dias_ultima_atencion: null,
      intervalo_maximo_real: null,
    };
  }

  const ultima = atenciones[atenciones.length - 1];
  const diasUltimaAtencion = diasEntre(ultima.fecha, hoy);

  // NUEVO: necesita al menos una atención.
  // No tiene ventana temporal ni límites de intervalo.
  // NUEVO: al menos una atención completada.
  if (
    Number(segmento.min_atenciones) === 1 &&
    Number(segmento.periodo_dias) === 0 &&
    Number(segmento.max_intervalo_dias) === 0 &&
    Number(segmento.max_dias_ultima_atencion) === 0
  ) {
    return {
      cumple: true,
      motivo: "Cliente con al menos una atención completada",
      atenciones_periodo: atenciones.length,
      dias_ultima_atencion: diasUltimaAtencion,
      intervalo_maximo_real: null,
    };
  }

  const periodo = Number(segmento.periodo_dias);
  const fechaLimite = new Date(hoy);
  fechaLimite.setUTCDate(fechaLimite.getUTCDate() - periodo);

  const atencionesPeriodo = atenciones.filter((atencion) => {
    const fecha = new Date(atencion.fecha);
    return fecha >= fechaLimite && fecha <= hoy;
  });

  if (atencionesPeriodo.length < Number(segmento.min_atenciones)) {
    return {
      cumple: false,
      motivo: "No alcanza las atenciones requeridas en el período",
      atenciones_periodo: atencionesPeriodo.length,
      dias_ultima_atencion: diasUltimaAtencion,
      intervalo_maximo_real: null,
    };
  }

  if (
    segmento.max_dias_ultima_atencion != null &&
    diasUltimaAtencion > Number(segmento.max_dias_ultima_atencion)
  ) {
    return {
      cumple: false,
      motivo: "La última atención es demasiado antigua",
      atenciones_periodo: atencionesPeriodo.length,
      dias_ultima_atencion: diasUltimaAtencion,
      intervalo_maximo_real: null,
    };
  }

  const fechas = atencionesPeriodo
    .map((atencion) => new Date(atencion.fecha))
    .sort((a, b) => a - b);

  let intervaloMaximoReal = 0;

  for (let i = 1; i < fechas.length; i += 1) {
    const intervalo = diasEntre(fechas[i - 1], fechas[i]);

    intervaloMaximoReal = Math.max(intervaloMaximoReal, intervalo);
  }

  if (
    segmento.max_intervalo_dias != null &&
    fechas.length > 1 &&
    intervaloMaximoReal > Number(segmento.max_intervalo_dias)
  ) {
    return {
      cumple: false,
      motivo: "El intervalo entre atenciones supera el máximo",
      atenciones_periodo: atencionesPeriodo.length,
      dias_ultima_atencion: diasUltimaAtencion,
      intervalo_maximo_real: intervaloMaximoReal,
    };
  }

  return {
    cumple: true,
    motivo: "Cumple los parámetros del segmento",
    atenciones_periodo: atencionesPeriodo.length,
    dias_ultima_atencion: diasUltimaAtencion,
    intervalo_maximo_real: intervaloMaximoReal,
  };
};

const calcularSegmentacion = (segmentos, atenciones) => {
  if (!atenciones.length) {
    return {
      actual: null,
      evaluacion: [],
    };
  }

  const hoy = new Date();

  // Mayor orden = segmento de mayor jerarquía.
  const ordenados = [...segmentos].sort(
    (a, b) => Number(b.orden) - Number(a.orden),
  );

  const evaluacion = ordenados.map((segmento) => ({
    segmentacion_id: segmento.id,
    nombre: segmento.nombre,
    orden: segmento.orden,
    ...evaluarSegmento(segmento, atenciones, hoy),
  }));

  const elegido = evaluacion.find((item) => item.cumple);

  const actual = elegido
    ? segmentos.find(
        (segmento) => Number(segmento.id) === Number(elegido.segmentacion_id),
      )
    : null;

  return {
    actual: actual
      ? {
          id: actual.id,
          nombre: actual.nombre,
          descripcion: actual.descripcion,
          orden: actual.orden,
          min_atenciones: actual.min_atenciones,
          periodo_dias: actual.periodo_dias,
          max_intervalo_dias: actual.max_intervalo_dias,
          max_dias_ultima_atencion: actual.max_dias_ultima_atencion,
          evaluacion: elegido,
        }
      : null,
    evaluacion,
  };
};

const getSegmentacion = async (profesionalId) => {
  const id = validarId(profesionalId, "El profesional autenticado");

  const client = await pool.connect();

  try {
    return await repository.getSegmentacion(client, id);
  } finally {
    client.release();
  }
};

const getSegmentacionCliente = async (profesionalId, clienteId) => {
  const profesional = validarId(profesionalId, "El profesional autenticado");

  const cliente = validarId(clienteId, "El cliente");

  const client = await pool.connect();

  try {
    const segmentos = await repository.getSegmentacion(client, profesional);

    const atenciones = await repository.getAtencionesCliente(
      client,
      profesional,
      cliente,
    );

    const resultado = calcularSegmentacion(segmentos, atenciones);

    const historial = await repository.getHistorialSegmentacion(
      client,
      profesional,
      cliente,
    );

    // Registrar la clasificación en la última atención.
    // La tabla actual no contiene fecha de asignación.
    if (resultado.actual && atenciones.length) {
      const ultimaAtencion = atenciones[atenciones.length - 1];

      await repository.registrarSegmentacion(
        client,
        ultimaAtencion.historial_id,
        resultado.actual.id,
      );
    }

    return {
      cliente_id: cliente,
      profesional_id: profesional,
      total_atenciones: atenciones.length,
      ultima_atencion: atenciones.length
        ? atenciones[atenciones.length - 1].fecha
        : null,
      segmentacion_actual: resultado.actual,
      evaluacion_segmentos: resultado.evaluacion,
      historial_segmentacion: historial,
    };
  } finally {
    client.release();
  }
};

const getHistorialSegmentacionCliente = async (profesionalId, clienteId) => {
  const profesional = validarId(profesionalId, "El profesional autenticado");

  const cliente = validarId(clienteId, "El cliente");

  const client = await pool.connect();

  try {
    return await repository.getHistorialSegmentacion(
      client,
      profesional,
      cliente,
    );
  } finally {
    client.release();
  }
};

module.exports = {
  getSegmentacion,
  getSegmentacionCliente,
  getHistorialSegmentacionCliente,
};
