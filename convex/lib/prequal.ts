import type { Category } from "./domain";

export type PrequalQuestion = { q: string; options: string[]; correct: number };

/** 3 domain-knowledge checks per job type, shown right after a match. The last one is always "spot the error". */
export const PREQUAL: Record<Category, PrequalQuestion[]> = {
  voz: [
    {
      q: "¿A qué distancia del micrófono sueles locutar?",
      options: [
        "A unos 15–20 cm, con filtro antipop",
        "Pegado al micrófono, sin filtro",
        "A más de 1 metro",
      ],
      correct: 0,
    },
    {
      q: "El medidor de tu grabación llega a 0 dBFS. ¿Qué significa?",
      options: [
        "Es el volumen ideal",
        "Hay saturación: debes bajar la ganancia",
        "No se grabó nada",
      ],
      correct: 1,
    },
    {
      q: "¿Cuál guion está bien escrito para leer en voz alta?",
      options: [
        "El médico llegó temprano y revisó a la paciente.",
        "El medico llego temprano y reviso a la paciente.",
        "El médico llegó temprano y rebisó a la paciente.",
      ],
      correct: 0,
    },
  ],
  transcripcion: [
    {
      q: "Una palabra del audio no se entiende. ¿Qué haces?",
      options: [
        "La adivinas por el contexto",
        "La marcas como [inaudible] o con la etiqueta de la guía",
        "La saltas sin marcar",
      ],
      correct: 1,
    },
    {
      q: "En una transcripción literal (verbatim), ¿qué haces con «eh», «este» y las repeticiones?",
      options: ["Las transcribes tal cual", "Las eliminas siempre", "Las cambias por sinónimos"],
      correct: 0,
    },
    {
      q: "El audio dice «a ver si mañana vamos a la playa y después comemos». ¿Qué transcripción es correcta?",
      options: [
        "Haber si mañana vamos a la playa y después comemos.",
        "A ver si mañana vamos a la playa y después comemos.",
        "A ver si mañana bamos a la playa y despues comemos.",
      ],
      correct: 1,
    },
  ],
  evaluacion: [
    {
      q: "Un usuario pide una receta sin gluten y la IA incluye harina de trigo. ¿Qué criterio falla?",
      options: ["El tono", "La exactitud: no sigue lo que pidió el usuario", "La extensión"],
      correct: 1,
    },
    {
      q: "Dos respuestas de la IA son correctas. ¿Cuál debe ganar?",
      options: [
        "La más larga",
        "La que responde exactamente lo pedido, clara y sin errores",
        "La que usa más términos técnicos",
      ],
      correct: 1,
    },
    {
      q: "¿Qué respuesta de la IA tiene un error?",
      options: [
        "La capital de Colombia es Bogotá.",
        "El agua hierve a 100 °C al nivel del mar.",
        "La capital de Perú es Cusco.",
      ],
      correct: 2,
    },
  ],
  expertos: [
    {
      q: "Inviertes $1.000 al 10 % anual compuesto. ¿Cuánto tienes tras 2 años?",
      options: ["$1.200", "$1.210", "$1.100"],
      correct: 1,
    },
    {
      q: "En los países de Latinoamérica, ¿qué norma tiene mayor jerarquía?",
      options: ["Un decreto", "La Constitución", "Un reglamento municipal"],
      correct: 1,
    },
    {
      q: "¿Qué afirmación tiene un error?",
      options: [
        "El ADN está en el núcleo de las células eucariotas.",
        "La inflación mide la subida general de precios.",
        "La luz viaja a unos 300.000 km por hora.",
      ],
      correct: 2,
    },
  ],
  tecnico: [
    {
      q: "¿Dónde corta f(x) = x² − 4 el eje x?",
      options: ["x = 4", "x = ±2", "x = 0"],
      correct: 1,
    },
    { q: "En Python, ¿qué devuelve len([1, 2, 3])?", options: ["2", "3", "6"], correct: 1 },
    {
      q: "Una IA resolvió 2x + 6 = 10. ¿Qué paso tiene el error?",
      options: ["Paso 1: 2x = 10 − 6", "Paso 2: 2x = 4", "Paso 3: x = 4 ÷ 2 = 3"],
      correct: 2,
    },
  ],
};

export const PREQUAL_PASS = 2;
