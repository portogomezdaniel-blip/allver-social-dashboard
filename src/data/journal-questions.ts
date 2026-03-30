export type QuestionAngle = 'experiencial' | 'reflexiva' | 'contenido';

export interface JournalQuestion {
  angle: QuestionAngle;
  text: string;
}

export interface JournalDay {
  day: number;
  week: number;
  weekName: string;
  weekSub: string;
  questions: [JournalQuestion, JournalQuestion, JournalQuestion];
}

export const JOURNAL_DAYS: JournalDay[] = [
  // ═══════════════════════════════════════
  // SEMANA 1: TU TRINCHERA (Días 1-7)
  // Lo que pasa en tu día real
  // ═══════════════════════════════════════
  {
    day: 1, week: 1, weekName: 'TU TRINCHERA', weekSub: 'Lo que pasa en tu día real',
    questions: [
      { angle: 'experiencial', text: '¿Cómo te sientes hoy con lo que haces?' },
      { angle: 'reflexiva', text: '¿Lo que haces se siente como obligación o como elección?' },
      { angle: 'contenido', text: '¿Qué le dirías a alguien que está donde tú estabas al inicio?' },
    ]
  },
  {
    day: 2, week: 1, weekName: 'TU TRINCHERA', weekSub: 'Lo que pasa en tu día real',
    questions: [
      { angle: 'experiencial', text: '¿Qué fue lo más real que te pasó hoy?' },
      { angle: 'reflexiva', text: '¿Eso te acercó o te alejó de quien quieres ser?' },
      { angle: 'contenido', text: '¿Cómo lo contarías si solo tuvieras 15 segundos?' },
    ]
  },
  {
    day: 3, week: 1, weekName: 'TU TRINCHERA', weekSub: 'Lo que pasa en tu día real',
    questions: [
      { angle: 'experiencial', text: '¿Qué te dio energía hoy y qué te la quitó?' },
      { angle: 'reflexiva', text: '¿Hay un patrón en lo que te drena?' },
      { angle: 'contenido', text: '¿Tu audiencia siente lo mismo? ¿Cómo hablarías de eso siendo honesto?' },
    ]
  },
  {
    day: 4, week: 1, weekName: 'TU TRINCHERA', weekSub: 'Lo que pasa en tu día real',
    questions: [
      { angle: 'experiencial', text: '¿Qué evitaste hoy que sabes que deberías haber hecho?' },
      { angle: 'reflexiva', text: '¿Qué hay detrás de esa resistencia?' },
      { angle: 'contenido', text: '¿Esa resistencia es algo que las personas que te siguen también sienten?' },
    ]
  },
  {
    day: 5, week: 1, weekName: 'TU TRINCHERA', weekSub: 'Lo que pasa en tu día real',
    questions: [
      { angle: 'experiencial', text: '¿Qué te hizo sentir orgulloso hoy, aunque sea algo pequeño?' },
      { angle: 'reflexiva', text: '¿Por qué eso importa más de lo que parece?' },
      { angle: 'contenido', text: '¿Cómo compartirías eso sin que suene a presumir?' },
    ]
  },
  {
    day: 6, week: 1, weekName: 'TU TRINCHERA', weekSub: 'Lo que pasa en tu día real',
    questions: [
      { angle: 'experiencial', text: '¿Qué parte de tu vida fuera del gym te hace mejor en lo que haces?' },
      { angle: 'reflexiva', text: '¿Tu vida personal alimenta o contradice tu mensaje?' },
      { angle: 'contenido', text: '¿Cómo mostrarías ese lado humano sin perder autoridad?' },
    ]
  },
  {
    day: 7, week: 1, weekName: 'TU TRINCHERA', weekSub: 'Lo que pasa en tu día real',
    questions: [
      { angle: 'experiencial', text: '¿Cómo terminas esta semana comparado con cómo la empezaste?' },
      { angle: 'reflexiva', text: '¿Estás avanzando o estás en piloto automático?' },
      { angle: 'contenido', text: '¿Qué aprendiste esta semana que valdría la pena compartir?' },
    ]
  },

  // ═══════════════════════════════════════
  // SEMANA 2: EL ESPEJO (Días 8-14)
  // Lo que tus clientes te enseñan
  // ═══════════════════════════════════════
  {
    day: 8, week: 2, weekName: 'EL ESPEJO', weekSub: 'Lo que tus clientes te enseñan',
    questions: [
      { angle: 'experiencial', text: '¿Qué viste hoy en alguien que entrenaste que te recordó a ti mismo?' },
      { angle: 'reflexiva', text: '¿Qué te enseña eso sobre por qué haces lo que haces?' },
      { angle: 'contenido', text: '¿Cómo hablarías de esa conexión sin exponerte demasiado?' },
    ]
  },
  {
    day: 9, week: 2, weekName: 'EL ESPEJO', weekSub: 'Lo que tus clientes te enseñan',
    questions: [
      { angle: 'experiencial', text: '¿Qué es lo que más repites a las personas que entrenas?' },
      { angle: 'reflexiva', text: '¿Te lo estás diciendo a ti también?' },
      { angle: 'contenido', text: '¿Esa frase podría ser el inicio de tu próximo contenido?' },
    ]
  },
  {
    day: 10, week: 2, weekName: 'EL ESPEJO', weekSub: 'Lo que tus clientes te enseñan',
    questions: [
      { angle: 'experiencial', text: '¿Qué persona te desafía más en lo que haces y por qué?' },
      { angle: 'reflexiva', text: '¿Ese desafío es sobre la otra persona o sobre algo tuyo?' },
      { angle: 'contenido', text: '¿Cómo convertirías esa tensión en un mensaje que conecte con otros?' },
    ]
  },
  {
    day: 11, week: 2, weekName: 'EL ESPEJO', weekSub: 'Lo que tus clientes te enseñan',
    questions: [
      { angle: 'experiencial', text: '¿Qué resultado de alguien te sorprendió últimamente?' },
      { angle: 'reflexiva', text: '¿Qué dice eso sobre lo que realmente funciona vs. lo que tú pensabas?' },
      { angle: 'contenido', text: '¿Cómo contarías esa historia de forma que enseñe sin aburrir?' },
    ]
  },
  {
    day: 12, week: 2, weekName: 'EL ESPEJO', weekSub: 'Lo que tus clientes te enseñan',
    questions: [
      { angle: 'experiencial', text: '¿Qué pregunta te hicieron que te dejó pensando?' },
      { angle: 'reflexiva', text: '¿Por qué no tenías la respuesta lista?' },
      { angle: 'contenido', text: '¿Cómo responderías esa pregunta frente a toda tu audiencia?' },
    ]
  },
  {
    day: 13, week: 2, weekName: 'EL ESPEJO', weekSub: 'Lo que tus clientes te enseñan',
    questions: [
      { angle: 'experiencial', text: '¿En qué cambiaste desde que empezaste a guiar a otras personas?' },
      { angle: 'reflexiva', text: '¿Ese cambio te acercó o te alejó de la persona que querías ser?' },
      { angle: 'contenido', text: '¿Cómo le explicarías esa evolución a alguien que no te conoce?' },
    ]
  },
  {
    day: 14, week: 2, weekName: 'EL ESPEJO', weekSub: 'Lo que tus clientes te enseñan',
    questions: [
      { angle: 'experiencial', text: '¿Qué sentiste esta semana al ver el progreso de alguien?' },
      { angle: 'reflexiva', text: '¿Es celebración genuina o necesitas la validación de sus resultados?' },
      { angle: 'contenido', text: '¿Cómo celebrarías el progreso de otro sin hacerlo sobre ti?' },
    ]
  },

  // ═══════════════════════════════════════
  // SEMANA 3: CONTRA LA CORRIENTE (Días 15-21)
  // Dónde te separas del resto
  // ═══════════════════════════════════════
  {
    day: 15, week: 3, weekName: 'CONTRA LA CORRIENTE', weekSub: 'Dónde te separas del resto',
    questions: [
      { angle: 'experiencial', text: '¿Qué viste hoy en redes de otro coach que te pareció irresponsable o incorrecto?' },
      { angle: 'reflexiva', text: '¿Por qué crees que ese tipo de contenido funciona aunque esté mal?' },
      { angle: 'contenido', text: '¿Cómo responderías con un contenido propio sin mencionar al otro coach?' },
    ]
  },
  {
    day: 16, week: 3, weekName: 'CONTRA LA CORRIENTE', weekSub: 'Dónde te separas del resto',
    questions: [
      { angle: 'experiencial', text: '¿Cuál es el mito más dañino que la industria fitness sigue repitiendo?' },
      { angle: 'reflexiva', text: '¿Por qué ese mito persiste a pesar de la evidencia en contra?' },
      { angle: 'contenido', text: '¿Cómo romperías ese mito en un reel de 45 segundos con un dato concreto?' },
    ]
  },
  {
    day: 17, week: 3, weekName: 'CONTRA LA CORRIENTE', weekSub: 'Dónde te separas del resto',
    questions: [
      { angle: 'experiencial', text: '¿En qué tema técnico tienes una opinión diferente a la mayoría de coaches?' },
      { angle: 'reflexiva', text: '¿Qué experiencia o evidencia respalda tu posición?' },
      { angle: 'contenido', text: '¿Cómo defenderías tu postura sin sonar arrogante ni confrontacional?' },
    ]
  },
  {
    day: 18, week: 3, weekName: 'CONTRA LA CORRIENTE', weekSub: 'Dónde te separas del resto',
    questions: [
      { angle: 'experiencial', text: '¿Qué tendencia fitness actual crees que desaparecerá en 2 años?' },
      { angle: 'reflexiva', text: '¿Qué principio atemporal seguirá funcionando sin importar la moda?' },
      { angle: 'contenido', text: '¿Cómo explicarías la diferencia entre tendencia y principio a tu audiencia?' },
    ]
  },
  {
    day: 19, week: 3, weekName: 'CONTRA LA CORRIENTE', weekSub: 'Dónde te separas del resto',
    questions: [
      { angle: 'experiencial', text: '¿Qué consejo popular de nutrición fitness te parece simplista o peligroso?' },
      { angle: 'reflexiva', text: '¿Cuál es la realidad que tú ves en la práctica con clientes reales?' },
      { angle: 'contenido', text: '¿Cómo harías contenido sobre eso manteniéndote en tu rol de coach, no de nutriólogo?' },
    ]
  },
  {
    day: 20, week: 3, weekName: 'CONTRA LA CORRIENTE', weekSub: 'Dónde te separas del resto',
    questions: [
      { angle: 'experiencial', text: '¿Qué coach o referente de la industria respetas genuinamente y por qué?' },
      { angle: 'reflexiva', text: '¿Qué aprendiste de esa persona que cambió cómo entrenas o piensas?' },
      { angle: 'contenido', text: '¿Cómo hablarías de esa influencia de forma auténtica sin parecer que copias?' },
    ]
  },
  {
    day: 21, week: 3, weekName: 'CONTRA LA CORRIENTE', weekSub: 'Dónde te separas del resto',
    questions: [
      { angle: 'experiencial', text: 'Si tuvieras un micrófono frente a toda la industria fitness por 60 segundos, ¿qué dirías?' },
      { angle: 'reflexiva', text: '¿Por qué eso necesita ser dicho y por qué tú eres quien debe decirlo?' },
      { angle: 'contenido', text: '¿Cómo convertirías eso en el reel más importante de tu cuenta?' },
    ]
  },

  // ═══════════════════════════════════════
  // SEMANA 4: TU HUELLA (Días 22-31)
  // La marca que quieres dejar
  // ═══════════════════════════════════════
  {
    day: 22, week: 4, weekName: 'TU HUELLA', weekSub: 'La marca que quieres dejar',
    questions: [
      { angle: 'experiencial', text: '¿Qué quieres que digan de ti los clientes que ya no entrenan contigo?' },
      { angle: 'reflexiva', text: '¿Qué impacto quieres dejar que va más allá de lo físico?' },
      { angle: 'contenido', text: '¿Cómo comunicarías esa visión en una bio de Instagram de 150 caracteres?' },
    ]
  },
  {
    day: 23, week: 4, weekName: 'TU HUELLA', weekSub: 'La marca que quieres dejar',
    questions: [
      { angle: 'experiencial', text: '¿Qué problema del fitness actual te gustaría resolver con tu trabajo?' },
      { angle: 'reflexiva', text: '¿Qué estás haciendo hoy para resolverlo, aunque sea en pequeña escala?' },
      { angle: 'contenido', text: '¿Cómo contarías ese propósito sin sonar pretencioso ni mesiánico?' },
    ]
  },
  {
    day: 24, week: 4, weekName: 'TU HUELLA', weekSub: 'La marca que quieres dejar',
    questions: [
      { angle: 'experiencial', text: '¿Cómo quieres que se sienta alguien después de consumir tu contenido?' },
      { angle: 'reflexiva', text: '¿Tus publicaciones actuales logran esa sensación o se quedan cortas?' },
      { angle: 'contenido', text: '¿Qué cambiarías en tu próximo contenido para acercarte más a eso?' },
    ]
  },
  {
    day: 25, week: 4, weekName: 'TU HUELLA', weekSub: 'La marca que quieres dejar',
    questions: [
      { angle: 'experiencial', text: '¿Cuál es la frase que más repites a tus clientes sin darte cuenta?' },
      { angle: 'reflexiva', text: '¿Por qué esa frase es tan importante para ti que la repites instintivamente?' },
      { angle: 'contenido', text: '¿Esa frase podría ser tu slogan? ¿Cómo la usarías visualmente en tu marca?' },
    ]
  },
  {
    day: 26, week: 4, weekName: 'TU HUELLA', weekSub: 'La marca que quieres dejar',
    questions: [
      { angle: 'experiencial', text: '¿Qué harías diferente si empezaras tu carrera de coach desde cero hoy?' },
      { angle: 'reflexiva', text: '¿Qué error temprano te enseñó la lección más valiosa de tu carrera?' },
      { angle: 'contenido', text: '¿Cómo le contarías eso a alguien que está pensando en ser coach?' },
    ]
  },
  {
    day: 27, week: 4, weekName: 'TU HUELLA', weekSub: 'La marca que quieres dejar',
    questions: [
      { angle: 'experiencial', text: '¿Dónde te ves dentro de 5 años como profesional del fitness?' },
      { angle: 'reflexiva', text: '¿Tu contenido actual está construyendo hacia esa visión o la contradice?' },
      { angle: 'contenido', text: '¿Qué tipo de contenido necesitas empezar a hacer hoy para llegar ahí?' },
    ]
  },
  {
    day: 28, week: 4, weekName: 'TU HUELLA', weekSub: 'La marca que quieres dejar',
    questions: [
      { angle: 'experiencial', text: '¿Qué legado quieres dejar en la industria fitness de tu ciudad?' },
      { angle: 'reflexiva', text: '¿Qué estás dispuesto a sacrificar para que eso pase?' },
      { angle: 'contenido', text: '¿Cómo harías contenido que muestre ese compromiso sin victimizarte?' },
    ]
  },
  {
    day: 29, week: 4, weekName: 'TU HUELLA', weekSub: 'La marca que quieres dejar',
    questions: [
      { angle: 'experiencial', text: '¿Qué te diferencia de los otros 100 coaches en tu ciudad?' },
      { angle: 'reflexiva', text: '¿Tus clientes podrían articular esa diferencia si alguien les preguntara?' },
      { angle: 'contenido', text: '¿Cómo comunicarías tu diferencial en los primeros 3 segundos de un video?' },
    ]
  },
  {
    day: 30, week: 4, weekName: 'TU HUELLA', weekSub: 'La marca que quieres dejar',
    questions: [
      { angle: 'experiencial', text: '¿Qué aprendiste este mes sobre ti como coach que no sabías el día 1?' },
      { angle: 'reflexiva', text: '¿Qué pregunta de este mes te hizo pensar más de lo que esperabas?' },
      { angle: 'contenido', text: 'Si tuvieras que hacer UN solo contenido con todo lo que reflexionaste este mes, ¿de qué sería?' },
    ]
  },
  {
    day: 31, week: 4, weekName: 'TU HUELLA', weekSub: 'La marca que quieres dejar',
    questions: [
      { angle: 'experiencial', text: '¿Cómo te sientes hoy como coach comparado con el día 1 de este mes?' },
      { angle: 'reflexiva', text: '¿Qué hábito de reflexión de este mes vas a mantener el próximo?' },
      { angle: 'contenido', text: '¿Cuál es el mensaje que quieres que tu audiencia recuerde de ti para siempre?' },
    ]
  },
];

// Helper: get today's questions
export function getTodayQuestions(): JournalDay {
  const dayOfMonth = new Date().getDate();
  return JOURNAL_DAYS.find(d => d.day === dayOfMonth) || JOURNAL_DAYS[0];
}

// Helper: get questions for a specific day of month
export function getQuestionsForDayOfMonth(dayOfMonth: number): JournalDay {
  return JOURNAL_DAYS.find(d => d.day === dayOfMonth) || JOURNAL_DAYS[0];
}

// Helper: get week info
export function getWeekTheme(dayOfMonth: number): { name: string; sub: string; week: number } {
  if (dayOfMonth <= 7) return { name: 'TU TRINCHERA', sub: 'Lo que pasa en tu día real', week: 1 };
  if (dayOfMonth <= 14) return { name: 'EL ESPEJO', sub: 'Lo que tus clientes te enseñan', week: 2 };
  if (dayOfMonth <= 21) return { name: 'CONTRA LA CORRIENTE', sub: 'Dónde te separas del resto', week: 3 };
  return { name: 'TU HUELLA', sub: 'La marca que quieres dejar', week: 4 };
}
