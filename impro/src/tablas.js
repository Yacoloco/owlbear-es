// Tablas del Kit de impro. Todo el contenido es propio, pensado para Phandalin y alrededores.

export const NOMBRES = {
  humano: {
    m: ["Aldric", "Bram", "Cedric", "Dorn", "Edrin", "Garrick", "Harlan", "Ivor", "Jorin", "Kester", "Lucan", "Merrick", "Osric", "Pell", "Rowan", "Silas", "Tobin", "Wendel", "Hadrik", "Fenwick"],
    f: ["Alys", "Brenna", "Cora", "Della", "Elsbeth", "Fenna", "Greta", "Hilde", "Ilsa", "Jessa", "Kaela", "Linnet", "Mara", "Nessa", "Orla", "Petra", "Rhea", "Sabine", "Tamsin", "Wren"],
    apellidos: ["Ashby", "Brightwater", "Colbert", "Dunmore", "Fairfield", "Greaves", "Hollow", "Marsh", "Penrose", "Thorne", "Underhill", "Wickham", "Stonebrook", "Millbrook", "Graywind"],
  },
  enano: {
    m: ["Bardin", "Dagnal", "Durgan", "Eberk", "Gromli", "Harbek", "Kildrak", "Morgran", "Orsik", "Rurik", "Thorvin", "Vondal", "Brottor", "Tordek"],
    f: ["Amber", "Bardryn", "Dagnal", "Eldeth", "Gunnloda", "Helja", "Kathra", "Liftrasa", "Mardred", "Riswynn", "Torbera", "Vistra"],
    apellidos: ["Martillo de Hierro", "Barba de Brasa", "Rompepiedras", "Puño de Roca", "Forjafuego", "Hachaprofunda", "Yunque Gris", "Vetaplata"],
  },
  elfo: {
    m: ["Adran", "Aelar", "Beiro", "Erevan", "Galinndan", "Heian", "Ivellios", "Laucian", "Quarion", "Riardon", "Soveliss", "Thamior"],
    f: ["Adrie", "Birel", "Caelynn", "Enna", "Keyleth", "Lia", "Meriele", "Naivara", "Quelenna", "Sariel", "Shava", "Valanthe"],
    apellidos: ["Hoja de Luna", "Brisaplata", "Rocío Estelar", "Ramaalta", "Canto de Río", "Flor de Ámbar", "Velo de Niebla"],
  },
  mediano: {
    m: ["Alton", "Cade", "Eldon", "Garret", "Lyle", "Merric", "Milo", "Osborn", "Perrin", "Roscoe", "Wellby", "Corrin"],
    f: ["Andry", "Bree", "Callie", "Cora", "Euphemia", "Kithri", "Lavinia", "Merla", "Nedda", "Seraphina", "Verna", "Trym"],
    apellidos: ["Pieligero", "Buenbarril", "Colinaverde", "Hojadetabaco", "Matorral", "Tejadulce", "Pocacosa"],
  },
  gnomo: {
    m: ["Alston", "Boddynock", "Dimble", "Fonkin", "Gimble", "Glim", "Orryn", "Roondar", "Seebo", "Zook"],
    f: ["Bimpnottin", "Caramip", "Duvamil", "Ellyjobell", "Lilli", "Nissa", "Orla", "Roywyn", "Tana", "Zanna"],
    apellidos: ["Engranajes", "Chispalegre", "Tuercaloca", "Remiendos", "Bolsillos", "Pocholana"],
  },
  semiorco: {
    m: ["Dench", "Feng", "Gell", "Holg", "Imsh", "Krusk", "Mhurren", "Ront", "Shump", "Thokk"],
    f: ["Baggi", "Emen", "Engong", "Kansif", "Myev", "Neega", "Ovak", "Shautha", "Sutha", "Volen"],
    apellidos: ["Colmillo Roto", "Sin Clan", "Hijo del Barro", "Ceniza", "Mano Dura"],
  },
  draconido: {
    m: ["Arjhan", "Balasar", "Donaar", "Ghesh", "Heskan", "Kriv", "Medrash", "Nadarr", "Pandjed", "Rhogar", "Torinn"],
    f: ["Akra", "Biri", "Daar", "Harann", "Kava", "Korinn", "Mishann", "Perra", "Sora", "Thava", "Uadjit"],
    apellidos: ["del clan Kepeshkmolik", "del clan Myastan", "del clan Yarjerit", "del clan Delmirev", "del clan Turnuroth"],
  },
  tiflin: {
    m: ["Akmenos", "Amnon", "Barakas", "Damakos", "Ekemon", "Kairon", "Leucis", "Mordai", "Skamos"],
    f: ["Akta", "Bryseis", "Criella", "Damaia", "Ea", "Kallista", "Makaria", "Nemeia", "Orianna"],
    apellidos: ["Esperanza", "Canción", "Penitencia", "Ceniza", "Temor", "Gloria", "Desvelo"],
  },
};

export const ESPECIES = [
  ["humano", "Humano", 10], ["enano", "Enano", 3], ["mediano", "Mediano", 3], ["elfo", "Elfo", 2],
  ["gnomo", "Gnomo", 1], ["semiorco", "Semiorco", 1], ["draconido", "Dracónido", 1], ["tiflin", "Tiflin", 1],
];

export const OFICIOS = [
  "trabaja en las minas (o eso dice)", "viene a vender nabos al mercado", "corta leña en las afueras", "arregla herraduras y ollas de pueblo en pueblo", "caza y vende pieles",
  "busca oro en el arroyo sin suerte", "maneja carretas en la ruta a Neverwinter", "prepara remedios de hierbas", "cuidaba caravanas y ahora está sin trabajo", "cría cabras",
  "escribe cartas por unas monedas", "vende telas traídas de Waterdeep", "sirve a Tymora y está de paso", "canta y toca de taberna en taberna", "se escapó de su casa para ser aventurero",
  "lleva la posada de la familia", "se dedicaba al contrabando (y todavía un poco)", "hace mapas y se perdió", "acaba de llegar a vivir a Phandalin", "explora ruinas por hobby",
  "pesca en el río", "hornea pan desde antes del amanecer", "cobra deudas para otros", "hace velas de sebo", "reconstruye casas viejas",
];

export const RASGOS = [
  "una cicatriz que le cruza la ceja", "ojos de colores distintos", "le faltan dos dedos de la mano izquierda", "huele a humo de pipa", "lleva un sombrero ridículamente grande",
  "tiene la voz ronca de tanto gritar", "está siempre comiendo algo", "un tatuaje de ancla en el antebrazo", "dientes de oro", "ropa remendada pero muy limpia",
  "una risa que se escucha desde la otra cuadra", "es altísimo y tiene que agacharse para entrar", "anda con un gato en el hombro", "tiene las manos manchadas de tinta", "cojea de la pierna derecha",
  "barba trenzada con cuentas", "pecas por toda la cara", "un parche en el ojo (que se cambia de lado)", "joyas baratas por todos lados", "siempre tiene frío y anda abrigado",
];

export const HABLA = [
  "habla rapidísimo y se come las palabras", "susurra como si todo fuera un secreto", "termina cada frase con una pregunta, ¿viste?", "usa palabras difíciles mal",
  "cuenta todo con exageración", "es seco y de pocas palabras", "se ríe de sus propios chistes", "nunca mira a los ojos", "llama a todos 'muchacho' o 'muchacha'",
  "cita refranes que nadie conoce", "habla de sí mismo en tercera persona", "es tremendamente educado y formal", "interrumpe todo el tiempo", "tartamudea cuando se pone nervioso",
  "canturrea entre frases", "se queja de todo", "es demasiado entusiasta con cualquier cosa", "desconfía de todos y lo dice",
];

export const QUIERE = [
  "juntar plata para irse de Phandalin", "que alguien encuentre a su hermano desaparecido", "vengarse de los Marca Roja", "que le devuelvan algo que le robaron",
  "conseguir trabajo estable", "proteger a su familia", "descubrir qué hay en las ruinas cercanas", "casarse antes del invierno", "ganarse el respeto del pueblo",
  "esconder algo que encontró en el bosque", "vender un mapa 'auténtico'", "aprender a pelear", "que nadie se entere de su pasado", "que los aventureros se vayan pronto",
];

export const SECRETOS = [
  "le debe plata a gente peligrosa", "en realidad trabaja para los Marca Roja", "vio algo raro cerca de la mansión Tresendar", "es noble y huyó de su familia",
  "robó la herencia de su hermano", "tiene un objeto mágico que no sabe usar", "no es quien dice ser", "le paga a alguien para que no hable",
  "sabe un atajo por el bosque que nadie conoce", "está enamorado/a de alguien imposible", "escuchó a goblins hablando de un tal 'Araña Negra'", "ninguno: es exactamente lo que parece",
];

export const BOTIN_OBJETOS = [
  "un relicario con el retrato de una desconocida", "una llave de hierro sin cerradura conocida", "un mapa a medio dibujar con una X tachada", "un dado de hueso que siempre cae en 6 (casi siempre)",
  "una carta sin terminar a 'mi querida Ilsa'", "una bolsita de dientes de distintos animales", "una pluma de grifo", "un frasco con una luciérnaga que nunca se apaga",
  "un cuchillo élfico con runas gastadas", "una moneda de un reino que ya no existe", "un anillo de cobre con una inscripción enana", "un trozo de mapa de la Mina de Wave Echo (falso)",
  "una figura tallada de un búho-oso", "un libro de recetas con una página arrancada", "un silbato que solo oyen los perros", "una piedra caliente al tacto",
  "un medallón de la Alianza de los Señores", "una capa con el escudo de una familia noble", "una botella de vino élfico añejo", "unas botas casi nuevas de tu talla",
];

export const BOTIN_MAGICO = [
  "Poción de curación (2d4 + 2 PG)", "Poción de curación (2d4 + 2 PG)", "Poción de curación (2d4 + 2 PG)", "Pergamino de un conjuro de nivel 1 al azar",
  "Poción de trepar (velocidad de escalada 1 hora)", "Vela que no se consume", "Capa que siempre se seca sola", "Brújula que señala el norte… o algo más",
  "Daga que brilla cerca de goblins (luz tenue a 30 pies)", "Anillo que hace que tu voz suene más grave", "Taza que siempre mantiene la bebida caliente", "Munición +1 (1d4 flechas o virotes)",
  "Poción de respirar bajo el agua", "Piedra mensajera (par: lo que se le dice a una, lo susurra la otra, una vez por día)", "Guantes que no se ensucian nunca", "Pergamino de Curar heridas",
];

export const ENCUENTROS = [
  ["Goblins emboscados", "1d4 + 2 goblins detrás de unos arbustos al costado del camino. Uno tiene un cuerno: si lo hace sonar, llegan 2 más en 2 turnos.", "Goblin"],
  ["Lobos hambrientos", "1d4 + 1 lobos rodean al grupo al atardecer. Huyen si caen la mitad. Si les tiran comida, se distraen un turno.", "Lobo"],
  ["Carreta volcada", "Una carreta de comerciante tumbada en el barro, con la mercadería desparramada. El dueño está escondido entre los árboles: cree que los PJ son bandidos.", null],
  ["Patrulla de Marca Roja", "1d4 + 1 rufianes con capas rojas 'cobran peaje' en el camino. Si los PJ se ven duros, intentan negociar.", "Bandido Carmesí"],
  ["Peregrino perdido", "Un clérigo de Lathander perdido busca un santuario. Ofrece una bendición (Bendición en la próxima pelea) a cambio de compañía.", null],
  ["Osgo solitario", "Un osgo sigue al grupo de lejos durante horas. Ataca de noche, durante la guardia.", "Osgo"],
  ["Orcos de paso", "1d4 + 1 orcos marchan hacia la Colina del Viento. Si no los ven, pasan de largo; si los ven, atacan.", "Orco"],
  ["Estirges en el río", "Al cruzar un vado, 1d6 estirges salen de entre los juncos.", "Estirge"],
  ["Mercader sospechoso", "Un vendedor ofrece pociones baratas: la mitad son agua con colorante. Una es de verdad.", null],
  ["Hobgoblins en formación", "1d2 + 1 hobgoblins disciplinados. Tienen órdenes escritas con un símbolo de araña.", "Hobgoblin"],
  ["Tormenta repentina", "Lluvia torrencial: el camino se vuelve barro (terreno difícil) y hay que buscar refugio. Hay una cueva cerca… ya ocupada.", null],
  ["Un ciervo blanco", "Un ciervo blanco aparece en el bosque y se queda mirando. Si lo siguen, los lleva a un claro con un altar viejo y una ofrenda (2d10 po).", null],
  ["Esqueletos en el túmulo", "Una tumba antigua abierta en una colina. 1d4 + 1 esqueletos salen al anochecer.", "Esqueleto"],
  ["Niño perdido", "Un nene de Phandalin se perdió buscando hongos. Está asustado arriba de un árbol… porque abajo hay una araña gigante.", "Araña Gigante"],
  ["Caravana amiga", "Una caravana de enanos va a Phandalin. Ofrecen viajar juntos y tienen noticias del norte.", null],
  ["Puente roto", "El puente del arroyo está roto. Cruzar requiere Atletismo CD 12 o buscar otro camino (medio día más).", null],
];

export const CLIMA = {
  primavera: ["Llovizna fina toda la mañana; el camino está embarrado.", "Sol tibio y viento fresco; los pájaros no paran de cantar.", "Niebla espesa hasta el mediodía (zona ligeramente oscurecida).", "Chaparrón fuerte por la tarde, con truenos lejanos.", "Día perfecto: cielo despejado y temperatura agradable."],
  verano: ["Calor pesado y húmedo; los animales buscan sombra.", "Tormenta eléctrica a la noche: los relámpagos iluminan todo.", "Día despejado y seco; el polvo del camino se pega a todo.", "Brisa del mar que llega desde la Costa de la Espada.", "Ola de calor: sin agua suficiente, salvaciones de CON para no agotarse."],
  otono: ["Viento frío y hojas por todos lados.", "Cielo gris y lluvia intermitente.", "Mañana con escarcha; a la tarde, sol pálido.", "Niebla al anochecer que sube del río.", "Tormenta de viento que tira ramas en el camino."],
  invierno: ["Nieve liviana que cubre las huellas.", "Frío cortante y cielo azul intenso.", "Ventisca: visibilidad muy baja, terreno difícil.", "Lluvia helada: todo se cubre de hielo resbaladizo.", "Día gris, quieto y silencioso; se oye todo a lo lejos."],
};

export const RUMORES = [
  "Dicen que en la mansión Tresendar, de noche, se ven luces en el sótano.", "Los Marca Roja cobran 'protección' a los comerciantes y nadie se anima a decir nada.",
  "Un minero juró que escuchó tambores bajo tierra cerca de las colinas.", "Hay un dragón verde en el bosque de Neverwinter. O eso dicen los leñadores que ya no vuelven.",
  "El encargado de la Lonja Minera paga bien a quien trae noticias de los orcos.", "Una banshee vive en las ruinas de Conyberry y responde preguntas… a un precio.",
  "Un enano llamado Gundren anda buscando una mina perdida y desapareció.", "En el Árbol del Trueno hay zombis que salen de la ceniza.",
  "La hermana Garaele, del santuario de la Suerte, busca a alguien de confianza para un encargo.", "Los goblins del Escondite Cragmaw tienen un jefe nuevo, mucho más listo que el anterior.",
  "Un mago con capa negra anda pagando en oro a cualquiera que trabaje para él.", "En la granja Hoja de Aliso necesitan ayuda: algo se lleva las gallinas de noche.",
  "Hay un mapa de una mina enana que vale una fortuna. Alguien lo vende en la taberna… o es una estafa.", "El burgomaestre está más preocupado por su bolsillo que por el pueblo.",
  "Un viejo dice que la Mina de Wave Echo tenía una forja mágica que hacía armas encantadas.", "Vieron a una elfa misteriosa preguntando por la Peña del Wyvern.",
];

export const LUGARES = {
  taberna: ["El Barril Torcido", "La Jarra del Minero", "El Búho Dormido", "La Última Moneda", "El Fogón de Piedra", "La Rueda Rota", "El Cuervo Contento", "La Linterna Verde"],
  tienda: ["Herramientas y Más de Brom", "Hierbas de la Abuela Tess", "El Yunque Honesto", "Telas y Botones Wickham", "Todo a una Pieza de Plata", "La Bolsa Sin Fondo (no es mágica)"],
  descripcion: [
    "Huele a pan recién hecho y a humo de leña.", "Hay un perro viejo durmiendo en la entrada que no se mueve por nadie.", "Las vigas están tan bajas que los más altos se golpean la cabeza.",
    "En la pared cuelga la cabeza disecada de un búho-oso.", "Un bardo desafinado toca en un rincón; nadie lo escucha.", "El piso cruje en cada paso y hay manchas sospechosas.",
    "Todo está impecable, y el dueño mira mal a quien entra con barro.", "Hay un tablón con avisos: se buscan, se venden y se pierden cosas.", "Una ventana rota está tapada con un mapa viejo.",
    "Se escucha a alguien discutiendo a los gritos en la trastienda.",
  ],
};

export const COMPLICACIONES = [
  "Llega alguien que reconoce a uno de los PJ… y no para bien.", "Se rompe algo importante del equipo (una cuerda, una mochila, una flecha clave).", "Empieza a llover fuerte justo ahora.",
  "Aparece un testigo inesperado.", "Las cosas no son lo que parecen: el aliado tiene otros planes.", "Alguien grita pidiendo ayuda a lo lejos.",
  "Se apaga la única fuente de luz.", "Un animal asustado se mete en medio de todo.", "Llegan refuerzos… del otro bando.", "El PNJ pide algo a cambio que nadie esperaba.",
  "El piso cede y aparece un pozo o sótano.", "Uno de los PJ encuentra algo que no estaba buscando.", "Se escucha un cuerno de guerra goblin.", "El tiempo apremia: alguien tiene que llegar antes del anochecer.",
];

// Reacción de un PNJ (2d6, como en el Manual del DM): de hostil a amistoso.
export const REACCION = [
  [2, 3, "Hostil", "Se niega a ayudar y puede llegar a actuar en contra de los PJ."],
  [4, 5, "Desconfiado", "Responde lo mínimo y quiere algo a cambio."],
  [6, 8, "Indiferente", "Ayuda si no le cuesta nada; si hay riesgo, no."],
  [9, 10, "Amable", "Ayuda con gusto si no es peligroso."],
  [11, 12, "Muy amistoso", "Se pone de su lado, ofrece ayuda e incluso arriesga algo."],
];
