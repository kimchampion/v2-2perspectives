export const scenarios = [
  {
    id: "ride",
    category: "Shared Rides",
    title: "Speeding and Changing Lanes",
    image: "shared-rides-scenario.png",
    cardDescription:
      "[User 2] is driving [User 1]. The driver speeds and changes lanes several times, making the passenger uneasy.",
    story:
      "[User 2] is driving [User 1]. During the ride, [User 2] drives faster than the surrounding traffic and changes lanes several times. [User 1] feels uneasy but stays quiet.",
    roles: ["Passenger", "Driver"],
    perspectives: [
      "You are the passenger. The speeding and frequent lane changes make you feel tense and unsafe. You hold back from speaking because you do not want to criticize the driver.\n\nYou want [User 2] to slow down and understand how the driving affects you.",
      "You are the driver. You are focused on driving and think you are handling the car well. You do not realize that your speed and lane changes are making [User 1] uncomfortable.\n\nYou want to understand what [User 1] needs without feeling judged.",
    ],
  },
  {
    id: "playlist",
    category: "FRIENDSHIP",
    title: "The shared playlist",
    icon: "music",
    description:
      "Two friends. One road trip. A playlist that suddenly sounds a little different.",
    story:
      "You and a friend made a playlist for a long-awaited road trip. The night before you leave, one of you changes most of the songs without checking in.",
    perspectives: [
      "You spent an evening putting the playlist together. When you open it, most of your songs are gone. You were excited to share the music you love, and now you wonder whether your taste matters to your friend.",
      "You added upbeat songs to make the drive more fun and removed a few slower ones to make room. You thought the playlist was a starting point, and you were excited to surprise your friend.",
    ],
  },
  {
    id: "project",
    category: "TEAMWORK",
    title: "The last-minute edit",
    icon: "layers",
    description:
      "A group project, a late-night change, and two different ideas of helping.",
    story:
      "Two classmates have finished a presentation together. The morning it is due, one discovers that the other has redesigned several slides overnight.",
    perspectives: [
      "You worked hard on the original slides and thought you had both agreed they were finished. Seeing your work changed without a conversation makes you feel left out of your own project.",
      "You noticed some slides were hard to read and stayed up late improving them. You wanted to take pressure off your teammate and thought they would appreciate the extra effort.",
    ],
  },
  {
    id: "cafe",
    category: "EVERYDAY MOMENTS",
    title: "A change of plans",
    icon: "coffee",
    description:
      "An afternoon catch-up takes an unexpected turn when someone else comes along.",
    story:
      "Two friends plan to meet at their favorite café. One of them arrives with a new friend, without mentioning it beforehand.",
    perspectives: [
      "You were looking forward to some one-on-one time and had something personal you wanted to share. You like meeting new people, but this was not the afternoon you pictured.",
      "Your new friend was having a quiet weekend, so you invited them along. You thought your friends would get along well and saw it as a chance to bring people together.",
    ],
  },
  {
    id: "studio",
    category: "SHARED SPACES",
    title: "Room to create",
    icon: "sparkles",
    description:
      "A shared creative space means sharing a little more than just the desk.",
    story:
      "Two people share a small art studio. One reorganizes the space over the weekend, moving the other person’s supplies into labeled drawers.",
    perspectives: [
      "You arrange materials where you can see them because that is how you find inspiration. The new organization looks tidy, but you cannot find your favorite tools and your space feels unfamiliar.",
      "The studio was getting cluttered, so you spent the weekend making it easier to use. You carefully labeled everything and thought you were making more room for both of you.",
    ],
  },
];

// Translated seed copy stays alongside the English scenarios. IDs and perspective slots are shared.
export const scenarioTranslations = {
  es: {
    ride: {
      category: 'Viajes compartidos',
      title: 'Velocidad y cambios de carril',
      cardDescription: '[User 2] lleva a [User 1] en su auto. La velocidad y los cambios frecuentes de carril hacen que el pasajero sienta inquietud.',
      story: '[User 2] lleva a [User 1] en su auto. Durante el trayecto, [User 2] conduce más rápido que el tráfico a su alrededor y cambia de carril varias veces. [User 1] siente inquietud, pero no dice nada.',
      roles: ['Pasajero', 'Conductor'],
      perspectives: [
        'Vas en el asiento del pasajero. La velocidad y los cambios frecuentes de carril te hacen sentir tensión e inseguridad. Prefieres no decir nada porque no quieres criticar a quien conduce.\n\nQuieres que [User 2] reduzca la velocidad y comprenda cómo te afecta su forma de conducir.',
        'Estás al volante. Te concentras en conducir y crees que estás manejando bien el auto. No te das cuenta de que la velocidad y los cambios de carril le están causando incomodidad a [User 1].\n\nQuieres entender qué necesita [User 1] sin sentir que te están juzgando.',
      ],
    },
    playlist: {
      category: 'AMISTAD',
      title: 'La lista de música compartida',
      description: 'Dos amigos. Un viaje por carretera. Una lista de música que, de pronto, suena un poco diferente.',
      story: 'Tú y un amigo prepararon una lista de música para un viaje por carretera que esperaban desde hace tiempo. La noche antes de salir, uno de ustedes cambia la mayoría de las canciones sin consultarlo.',
      perspectives: [
        'Dedicaste una tarde a preparar la lista de música. Cuando la abres, la mayoría de tus canciones ya no están. Te hacía ilusión compartir la música que te gusta y ahora te preguntas si tus gustos le importan a tu amigo.',
        'Agregaste canciones animadas para hacer más divertido el viaje y quitaste algunas más lentas para dejar espacio. Pensabas que la lista era un punto de partida y te entusiasmaba sorprender a tu amigo.',
      ],
    },
    project: {
      category: 'TRABAJO EN EQUIPO',
      title: 'El cambio de último minuto',
      description: 'Un proyecto en equipo, un cambio por la noche y dos ideas diferentes sobre lo que significa ayudar.',
      story: 'Dos compañeros de clase terminaron una presentación juntos. La mañana de la entrega, uno descubre que el otro rediseñó varias diapositivas durante la noche.',
      perspectives: [
        'Trabajaste mucho en las diapositivas originales y pensabas que ambos habían acordado que estaban listas. Ver cambios en tu trabajo sin haberlo conversado te hace sentir que te dejaron fuera de tu propio proyecto.',
        'Notaste que algunas diapositivas eran difíciles de leer y te quedaste hasta tarde mejorándolas. Querías aliviar la carga de tu compañero y pensabas que agradecería el esfuerzo extra.',
      ],
    },
    cafe: {
      category: 'MOMENTOS COTIDIANOS',
      title: 'Un cambio de planes',
      description: 'Una tarde para ponerse al día toma un rumbo inesperado cuando llega alguien más.',
      story: 'Dos amigos planean encontrarse en su cafetería favorita. Uno llega con un nuevo amigo, sin haberlo mencionado antes.',
      perspectives: [
        'Esperabas pasar un rato a solas con tu amigo y querías compartir algo personal. Te gusta conocer gente, pero esta no era la tarde que habías imaginado.',
        'Tu nuevo amigo estaba pasando un fin de semana tranquilo, así que lo invitaste a acompañarlos. Pensabas que se llevarían bien y lo viste como una oportunidad para reunir a tus amigos.',
      ],
    },
    studio: {
      category: 'ESPACIOS COMPARTIDOS',
      title: 'Espacio para crear',
      description: 'Compartir un espacio creativo significa compartir algo más que un escritorio.',
      story: 'Dos personas comparten un pequeño estudio de arte. Una reorganiza el espacio durante el fin de semana y guarda los materiales de la otra en cajones etiquetados.',
      perspectives: [
        'Colocas los materiales donde puedes verlos porque así encuentras inspiración. La nueva organización se ve ordenada, pero no encuentras tus herramientas favoritas y el espacio ya no te resulta familiar.',
        'El estudio estaba cada vez más desordenado, así que dedicaste el fin de semana a hacerlo más fácil de usar. Etiquetaste todo con cuidado y pensabas que estabas creando más espacio para ambos.',
      ],
    },
  },
};

export function localizeScenario(scenario, language = 'en') {
  const copy = scenarioTranslations[language]?.[scenario?.id];
  return copy ? { ...scenario, ...copy } : scenario;
}

export const presetColors = [
  { value: "#D9CEEB", label: "Lavender", note: "A little reflective" },
  { value: "#F1C6AD", label: "Peach", note: "Soft and open" },
  { value: "#C7D4B9", label: "Sage", note: "Grounded and steady" },
  { value: "#ECCF7E", label: "Honey", note: "Bright and curious" },
  { value: "#B5CEDF", label: "Sky", note: "Room to breathe" },
  { value: "#DFA6A5", label: "Rose", note: "A little stirred up" },
];
