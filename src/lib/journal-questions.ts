export interface JournalQuestion {
  text: string;
  domain: "practice" | "clients" | "philosophy";
  jungian_theme: string;
}

export interface DayQuestions {
  day: number;
  dayName: string;
  questions: [JournalQuestion, JournalQuestion, JournalQuestion];
}

export const WEEKLY_QUESTIONS: DayQuestions[] = [
  {
    day: 0,
    dayName: "Domingo",
    questions: [
      { text: "Que parte de ser entrenador te pesa y nunca hablas de ello?", domain: "practice", jungian_theme: "shadow" },
      { text: "Cuando fue la ultima vez que un cliente te enseno algo a ti? Que fue?", domain: "clients", jungian_theme: "self" },
      { text: "Si manana no pudieras volver a entrenar a nadie, que extranarias mas? Y que NO extranarias?", domain: "philosophy", jungian_theme: "individuation" },
    ],
  },
  {
    day: 1,
    dayName: "Lunes",
    questions: [
      { text: "Cual es la mentira mas popular sobre tu disciplina que te gustaria destruir en publico?", domain: "practice", jungian_theme: "persona" },
      { text: "Que ves repetirse en cada cliente nuevo que llega a ti y que ellos no reconocen?", domain: "clients", jungian_theme: "archetype" },
      { text: "Por que elegiste este camino y no otro? Que dice eso de quien eres realmente?", domain: "philosophy", jungian_theme: "individuation" },
    ],
  },
  {
    day: 2,
    dayName: "Martes",
    questions: [
      { text: "Que consejo le darias a tu yo del dia 1 como entrenador que contradice lo que ensenas hoy?", domain: "practice", jungian_theme: "shadow" },
      { text: "Hay algo que tus clientes creen de ti que no es del todo cierto? Que mascara usas frente a ellos?", domain: "clients", jungian_theme: "persona" },
      { text: "Cual es la diferencia entre disciplina y obsesion? Donde caes tu?", domain: "philosophy", jungian_theme: "self" },
    ],
  },
  {
    day: 3,
    dayName: "Miercoles",
    questions: [
      { text: "Cual fue tu peor error con un cliente y que aprendiste que nunca has compartido publicamente?", domain: "practice", jungian_theme: "shadow" },
      { text: "Que tipo de cliente te frustra mas? Que de esa frustracion habla de ti y no de ellos?", domain: "clients", jungian_theme: "shadow" },
      { text: "Si el entrenamiento fisico es una metafora de algo mas profundo en la vida, de que seria metafora para ti?", domain: "philosophy", jungian_theme: "self" },
    ],
  },
  {
    day: 4,
    dayName: "Jueves",
    questions: [
      { text: "Que sabes que funciona pero que va en contra de lo que la mayoria de tu industria promueve?", domain: "practice", jungian_theme: "individuation" },
      { text: "Piensa en tu cliente mas exitoso. Que tenia esa persona que los demas no? Era talento o algo mas profundo?", domain: "clients", jungian_theme: "archetype" },
      { text: "Que parte de tu identidad desapareceria si dejaras de hacer lo que haces? Quien serias sin esto?", domain: "philosophy", jungian_theme: "individuation" },
    ],
  },
  {
    day: 5,
    dayName: "Viernes",
    questions: [
      { text: "Cual es la verdad incomoda de tu profesion que nadie quiere decir en voz alta?", domain: "practice", jungian_theme: "shadow" },
      { text: "Que le dirias a un cliente que esta a punto de rendirse si pudieras ser 100% honesto sin filtros?", domain: "clients", jungian_theme: "self" },
      { text: "Crees que la gente que entrenas busca realmente resultados fisicos, o busca otra cosa disfrazada de fitness?", domain: "philosophy", jungian_theme: "archetype" },
    ],
  },
  {
    day: 6,
    dayName: "Sabado",
    questions: [
      { text: "Si pudieras cambiar UNA cosa de como funciona tu industria, cual seria y por que nadie la cambia?", domain: "practice", jungian_theme: "persona" },
      { text: "Cual es el momento exacto en que supiste que un cliente 'lo entendio'? Que cambio en su mirada?", domain: "clients", jungian_theme: "self" },
      { text: "Que precio personal has pagado por dedicarte a esto? Valio la pena?", domain: "philosophy", jungian_theme: "shadow" },
    ],
  },
];

export function getTodayQuestions(): DayQuestions {
  return WEEKLY_QUESTIONS[new Date().getDay()];
}

export function getQuestionsForDay(day: number): DayQuestions {
  return WEEKLY_QUESTIONS[day] || WEEKLY_QUESTIONS[0];
}
