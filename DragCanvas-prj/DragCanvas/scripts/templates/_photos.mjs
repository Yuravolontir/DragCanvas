/**
 * The photographs, by what is in them.
 *
 * The first version of this gallery drew on twenty-six pictures for fourteen
 * templates, and one stock shot of a meeting appeared eight times - as an
 * agency's work sample, as a clinic's hero, and as a logo. Nothing in the source
 * showed that: `px(3184291)` reads the same wherever it is written.
 *
 * So the id never appears in a template again. A template asks for
 * `PHOTOS.clinic.chair`, and using a boardroom for a dental surgery becomes a
 * thing you have to type on purpose. Every name below describes what is actually
 * in the frame - each one was looked at, not guessed from a search term.
 *
 * Widths are requested per use: a hero at 1600, a card at 800, a thumbnail at
 * 600. Pexels resizes on delivery, so asking for what is needed is free.
 */

const pexels = (id) => (w = 1200) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

export const PHOTOS = {
  bakery: {
    loaves: pexels(8633662),        // dark sourdough rounds, close
    shelves: pexels(35993723),      // wooden racks of finished bread
    assorted: pexels(10202985),     // rye and white loaves on a pale surface
    croissant: pexels(6202224),     // one croissant, close and gold
    counter: pexels(2245293),       // the pastry counter, several trays
    trays: pexels(7405059),         // baguettes racked on steel trays
  },
  restaurant: {
    pasta: pexels(5531093),         // greens and pasta in a wide white bowl
    carpaccio: pexels(7243881),     // plated starter, red and white
    risotto: pexels(8864543),       // two-part plate, meat and grain
    braise: pexels(8194817),        // dark braise in a shallow bowl
    tasting: pexels(1327393),       // carrots and jus, fine-dining plating
    room: pexels(262978),           // dining room table, plates in service
  },
  coffee: {
    bar: pexels(5373256),           // the counter and back bar, warm wood
    counter: pexels(1855214),       // menu boards above a busy counter
    shelves: pexels(7601665),       // bags and jars on shelves
    table: pexels(4916548),         // cups on a window table
    grinders: pexels(32617176),     // grinders and kit on the bench
    pour: pexels(302899),           // milk poured into a flat white
  },
  clinic: {
    hygienist: pexels(7800666),     // clinician working at the chair
    treatment: pexels(7800669),     // the same surgery, second angle
    child: pexels(6627447),         // a child being treated
    instruments: pexels(6812483),   // instruments laid out, shallow focus
    chair: pexels(305567),          // an empty surgery, clean and lit
    surgery: pexels(6502623),       // the room, wide
  },
  conference: {
    panel: pexels(8348468),         // four people on a panel, lit warm
    stage: pexels(29708258),        // a speaker alone on a big stage
    crowd: pexels(31129059),        // the audience from behind
    talk: pexels(3321796),          // a smaller room, seated speaker
    hall: pexels(9275222),          // full auditorium, slide behind
    seats: pexels(8761641),         // empty chairs before the doors open
  },
  travel: {
    ridge: pexels(9805720),         // a walker on a bare ridge
    mountains: pexels(29719488),    // blue layered peaks in haze
    window: pexels(13522524),       // green valley seen from a train
    volcano: pexels(11680560),      // cloud sitting on a crater
    dusk: pexels(10911356),         // palms against a late sky
    wing: pexels(4096283),          // a wing above the horizon
    alpine: pexels(1271619),        // a hiker in high summer meadow
  },
  agency: {
    facade: pexels(2582933),        // yellow and grey building, graphic
    desk: pexels(414974),           // laptop, swatches, tools from above
    studio: pexels(7675029),        // three people at a shared monitor
    monitor: pexels(1714202),       // a dark room, one bright screen
    proofs: pexels(4348193),        // hands over printed proofs
    sketches: pexels(3747269),      // pencils and layout sketches
    suite: pexels(326518),          // an edit suite, screens and speakers
  },
  photography: {
    lit: pexels(23991042),          // a full-length shot with the softbox in frame
    portrait: pexels(14257415),     // a close portrait, warm key
    beauty: pexels(5611592),        // a beauty shot against teal
    mono: pexels(29085930),         // black and white, seated
    couple: pexels(20029576),       // two people, studio
    standing: pexels(34921744),     // a standing figure, low key
    editorial: pexels(37233404),    // a dark editorial set-up
    onlocation: pexels(16666883),   // a photographer working
  },
  saas: {
    desks: pexels(6804068),         // an office of people at monitors
    pairing: pexels(7988116),       // two developers at one desk
    floor: pexels(6805161),         // the wider floor, people working
    standup: pexels(12902857),      // a group around a laptop
    screen: pexels(1181461),        // one bright screen in a dim room
  },
  developer: {
    editor: pexels(27427258),       // syntax-highlighted code, close
    terminal: pexels(4955393),      // a dark terminal, green on black
    lines: pexels(374559),          // a wall of numbered lines
    markup: pexels(270488),         // HTML on a green screen
    review: pexels(4164418),        // code with the structure visible
    trace: pexels(360591),          // a colourful stack trace
    book: pexels(1181671),          // hands holding a Python book
  },
  ceramics: {
    stacks: pexels(34004100),       // rows of unglazed bowls
    bowls: pexels(8063833),         // finished pieces, black and white
    tools: pexels(6693557),         // a wheel-head and hand tools
    wheel: pexels(4241336),         // hands centring terracotta on the wheel
    throwing: pexels(31875677),     // a tall form being pulled up
    studio: pexels(9304545),        // the workshop, shelves of drying work
  },
  fitness: {
    barbell: pexels(6628962),       // a loaded bar on rubber floor
    deadlift: pexels(2261477),      // mid-lift, side on
    stack: pexels(4464780),         // a weight stack, close
    rack: pexels(32610333),         // dumbbells in the rack
  },
  interiors: {
    living: pexels(1571460),        // a pale living room, stairs behind
    lounge: pexels(276724),         // a warm lounge at night
    kitchen: pexels(1080721),       // a white kitchen, island in front
  },

  joinery: {
    bench: pexels(313776),          // a joiner planing a board at the bench
    fitting: pexels(5466144),       // fitting a carcass, brick behind
    shop: pexels(6790066),          // the workshop, machines and stock
    saw: pexels(5711703),           // cutting down a long board
    shavings: pexels(374049),       // a hand plane and its shavings
  },
  people: {
    meeting: pexels(3184291),       // a team around a table
    desk: pexels(3184338),          // three colleagues at a laptop
    handshake: pexels(3184465),     // two hands meeting over a desk
    hands: pexels(3184418),         // hands joined over paperwork
    pair: pexels(29057425),         // two women, studio, confident
  },

  /**
   * Faces, for team grids and testimonials.
   *
   * Worth its own group because of what was there before: the gym's three
   * trainers were a barbell, a weight stack and a dumbbell rack, and one of the
   * conference speakers was a photograph of the auditorium. A team grid crops to
   * a small circle, so anything that is not a face at the centre of the frame
   * turns into an unreadable smudge.
   */
  faces: {
    suited: pexels(37148308),       // man in a dark suit, plain ground
    short: pexels(29852852),        // woman, dark red hair, low key
    grey: pexels(30004325),         // woman in a grey jacket, white ground
    white: pexels(29852895),        // woman in a white collar, smiling
    warm: pexels(12311572),         // man laughing, red ground
    dark: pexels(31869537),         // woman in black, dark ground
    violet: pexels(9092311),        // man against violet
    teal: pexels(26872232),         // man in a teal jacket, hand to chin
    navy: pexels(29995581),         // man in navy, pale ground
    turtleneck: pexels(10816007),   // man in white and grey
    beard: pexels(18032391),        // bearded man, violet ground
  },
};
