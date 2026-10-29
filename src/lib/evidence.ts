export type EvidenceCard = { id: string; title: string; organization: string; date: string; status: string; fact: string; implication: string; limitation: string; url: string };
export const evidenceReviewedOn = "2026-10-28";
export const evidenceCards: EvidenceCard[] = [
  { id: "gmg-v3", title: "Planificar una flota BEV subterránea", organization: "Global Mining Guidelines Group", date: "2022-06-23 · versión 3", status: "Guía marcada Current al consultar",
    fact: "La guía reúne consideraciones de operación, almacenamiento, métodos de carga, interfaces y caso de negocio para incorporar vehículos a batería.",
    implication: "Solicitar ciclos, ventanas reales y compatibilidad, además de capacidad de batería y potencia.", limitation: "Es orientación general. Este prototipo no certifica cumplimiento ni reproduce toda la guía.",
    url: "https://gmggroup.org/recommended-practices-for-battery-electric-vehicles-in-underground-mining-version-3/" },
  { id: "abb-integration", title: "Integrar red, cargadores y operación", organization: "ABB", date: "Artículo técnico del proveedor", status: "Experiencia y criterios de integración",
    fact: "ABB destaca interoperabilidad, movilidad, gestión energética, interfaces de conexión, infraestructura y diseño del proceso al integrar BEV en minas.",
    implication: "La potencia del cargador no sustituye el perfil de demanda existente ni confirma la conexión eléctrica disponible.", limitation: "Las capacidades y beneficios de otros proyectos no se transfieren automáticamente a esta flota sintética.",
    url: "https://new.abb.com/mining/thought-leadership-topics/how-best-to-integrate-battery-electric-vehicles-in-mines" },
  { id: "amtc-elmo-batmine", title: "ELMOMine y BATMINE", organization: "AMTC · Universidad de Chile", date: "2026-07-06", status: "Herramienta de simulación e investigación en baterías",
    fact: "AMTC describe ELMOMine para evaluar flotas e infraestructura antes de implementarlas y BATMINE para estudiar degradación con perfiles operacionales y ensayos.",
    implication: "El nicho propuesto aquí es una revisión preliminar pequeña, verificable y explicable. Un simulador minero genérico ya tiene antecedentes.", limitation: "La noticia no publica datos suficientes para calibrar nuestras baterías ni una validación de ElectroDecision.",
    url: "https://www.amtc.cl/noticia-general/amtc-impulsa-nuevas-tecnologias-para-acelerar-la-electrificacion-de-la-mineria-subterranea/" },
  { id: "uchile-integrated", title: "Diseño, infraestructura, flota y energía", organization: "FCFM · Universidad de Chile", date: "Lanzamiento 2026-10-23", status: "Programa de investigación anunciado por tres años",
    fact: "CASE y AMTC anunciaron un proyecto de electrificación que aborda conjuntamente diseño minero, infraestructura eléctrica, flotas y gestión energética, con socios industriales.",
    implication: "Conservar una matriz de datos faltantes para pasar del calendario preliminar a un estudio conjunto de operación e infraestructura.", limitation: "El lanzamiento y sus objetivos no son resultados finales ni una herramienta disponible para integrar en este prototipo.",
    url: "https://ingenieria.uchile.cl/noticias/246258/u-de-chile-impulsa-la-electrificacion-y-descarbonizacion-de-la-mineria" },
];

export const dataRequirements = [
  { id: "cycles", label: "Ciclo de trabajo y consumo", model: "Tareas y consumos sintéticos", needed: "Medir kWh por tarea, carga, pendiente, ruta y variación entre turnos.", reason: "La sensibilidad +10%/+20% es una prueba de escenario; no una distribución estimada." },
  { id: "windows", label: "Ventanas, traslados y conexión", model: "Carga disponible fuera de las tareas", needed: "Validar ventanas, desvíos, tiempo de conexión, esperas y ubicación del cargador.", reason: "La carga fraccionable sin tiempos de conexión es una simplificación favorable." },
  { id: "battery", label: "Batería y cargador", model: "Capacidad utilizable y eficiencia constante asumidas", needed: "Confirmar curvas OEM, estado de salud, límites térmicos, compatibilidad y potencia aceptada por equipo.", reason: "El 90% de la demo es un supuesto editable, no un dato medido ni una especificación de fabricante." },
  { id: "network", label: "Red e infraestructura", model: "Potencia disponible para un cargador", needed: "Levantar demanda existente, suministro firme, transformadores, alimentadores, calidad de energía y contingencias.", reason: "El mínimo uniforme del modelo no es la potencia de diseño de una subestación." },
  { id: "economics", label: "Costo total y servicio equivalente", model: "Sólo costo variable de energía", needed: "Cotizaciones de obras y equipos, cargos de potencia, mantenimiento, baterías, horizonte y producción equivalente.", reason: "Reducir kW no implica por sí mismo ahorro de costo total; no se calcula VAN ni retorno de inversión." },
  { id: "emissions", label: "Emisiones y referencia diésel", model: "Factor eléctrico opcional, sin baseline", needed: "Documentar factor, año, método y frontera; medir combustible para un mismo servicio antes de comparar.", reason: "Emisiones de carga no equivalen a ciclo de vida ni a reducción frente a combustión." },
] as const;

export const technologyScope = [
  { name: "BEV con carga estacionaria", coverage: "Modelado de forma simplificada", detail: "Una flota compatible y un cargador compartido; tareas fijas y carga secuencial." },
  { name: "Intercambio de baterías", coverage: "Fuera del modelo", detail: "Requiere packs de reserva, logística, estaciones y colas propias." },
  { name: "Trolley o carga dinámica", coverage: "Fuera del modelo", detail: "Necesita rutas, rampas, infraestructura y reparto entre tracción y carga." },
  { name: "Diésel e híbridos", coverage: "Referencia pendiente", detail: "No hay consumos equivalentes ni costos reales para calcular una transición comparable." },
] as const;
