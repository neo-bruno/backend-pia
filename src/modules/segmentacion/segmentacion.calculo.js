
// =====================================================
// SEGMENTACIÓN - MOTOR DE CÁLCULO
// =====================================================

exports.diasEntre = (fechaInicial, fechaFinal) => {
  const inicio = new Date(fechaInicial);
  const fin = new Date(fechaFinal);

  inicio.setUTCHours(0, 0, 0, 0);
  fin.setUTCHours(0, 0, 0, 0);

  return Math.floor((fin.getTime() - inicio.getTime()) / 86400000);
};

exports.evaluarSegmento = (segmento, atenciones, hoy = new Date()) => {
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
  const diasUltimaAtencion = exports.diasEntre(ultima.fecha, hoy);

  // NUEVO: necesita al menos una atención.
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
    const intervalo = exports.diasEntre(
      fechas[i - 1],
      fechas[i],
    );

    intervaloMaximoReal = Math.max(
      intervaloMaximoReal,
      intervalo,
    );
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

exports.calcularSegmentacion = (segmentos, atenciones) => {
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
    ...exports.evaluarSegmento(segmento, atenciones, hoy),
  }));

  const elegido = evaluacion.find((item) => item.cumple);

  const actual = elegido
    ? segmentos.find(
        (segmento) =>
          Number(segmento.id) === Number(elegido.segmentacion_id),
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
