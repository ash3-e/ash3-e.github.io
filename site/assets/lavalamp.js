
(function () {
  const initialText = [
    `..,.,.-.,.,.,.,.,,.,.,.,.,.-.-..,.,.....-.-.,...,.,..,.-.,...,.-.,.,,.,...,.-.-.,.,.,.,.,,.,.,.,.,.,.-.,,.,.,.,.,.-.-.....,.,..,.-.,...,.-.,..,.,...,.-.,.,.,.,.,..,.,.,.,.,.,.`,
    `..,.,.,.,.....,..,.,.,.....,.,....,.....,.-.,...,.,..,.,.,...,.,.,..,.......,.,.,.......,,.,.,.,...,.,.,........,.,.,.....,.,..,.,.....,.,.,..,.....,.,.,..........,.,.,.,.,.,.`,
    `,.,.-.-.,.,.,.,.,,.,.,.,.,.-.-..,.,.....-.<.,...,.,..,.-.,...,.-.,.,,.,...,.-.-.,.,.,.,.,,.,.,.,.,.,.-.,,.,.,.,.,.-.-.,...,.,..,.-.,...,.-.,..,.,...,.-.-.,.,.,.,,.,.,.,.,.,.,.`,
    `,,,.-.-.,,,.,.,,,,.-.,.,,,.-.-..,.,,,.,.-.<.,..,,.-.,,.-.,,,.,.-.,,,,.,..,,.-.-.,,,.,.,.,,.,.,.,.,.,.-.,,.,.,,,,,.<.-.,,..,.,..-.-.,...-.-.,,.-.,,..,.-.-.,.,,,.,,,-.-.,.,.,.,.`,
    `..,.,.,.,...,.,.,,.,.,...,.,.,....,..,..-.-.,,..,.,.,,.,.,..,,.,.,.,,.,...,.,.,.,.,,..,.,,.,.,.,.,.,.,.,..,.,...,.-.,.....,.,..,.,.,...,.,.,..,.,...,.-.,.,...,.,..,.,.,.,.,.,.`,
    `..,.,.,.,...,.,.,,.,.,.,.,.,.,..,.,.....-.-.,...,.,..,.,.,...,.,.,.,,.,...,.,.,.,.,.,.,.,,.,.,.,.,.,.,.,,.,.,...,.-.,.,...,.,..,.-.,...,.-.,..,.,...,.-.,.,.,.,.,..,.,.,.,.,.,.`,
    `,.,,-.-.,.,,,.,,,,.-.,.,.,.-.-.,,.,...,.-.<.,...,.,.,,.-.,.,.,.-.,.,,.,,,.,.-.-.,.,.,.,.,,.,.,,,.,.,.-,,,.,.,,,.,.-.-,,...,.-,.-.-.,,..,.-.,,.,.,..,,.-.-.,,,.,.,,,-.-.,.,,,.,.`,
    `.,,.,,,.,,..,,,.,,.,,,.,-,.,.,..-.,,...,-.-,,..,,.-..,.-.,-..,,,.,,,,.,..,,.,,,.,,,.,,,.,,.,,,.,,,.,,,.,,.,,,..,,.-.,.,-..,.,.,,.,,,..-,.-.,..,..,..,,-.,,,.,,,.,,.,,,.,,,.,,,.`,
    `....,.,....,..,....,..,....,.,....,..,..,.,..,......,,.,.,..,..,....,..,...,,.,....,..,....,..,...,..,....,..,....,.,,...,..,..,.,..,..,.,..,......,..,.,..,..,....,.,....,..,.`,
    `.,,.,,,.,,..,,,.,,.,.,.,,,.,.,..,.,,...,,.-,,..,,.,..,.,.,,..,,,.,,,,.,..,,.,,,.,,,.,,,.,,.,,,.,,,.,,,.,,.,,,..,,.-.,.,,..,.,.,,.,,,..,,.-.,..,..,..,,,.,,,.,,..,,.,,,.,,,.,,,.`,
    `.-,-,.,-,-,-..-,,,,-.,<.>,-,.,,.-.-..?.-,,,.,\\\\.-,,,.-,,-,,..<,-,,,.,-,--,..-,,,-,.,-,--,..,,,,-,.,-,,,,,.,-,,-..,-,,,-..,-,.-,.,,--.?..,,-,,-.,,,-.-,.,,,-.-..-,-,,,.,-,<,-,.,,`,
    `.-...,...-..,,..,,..,...<..,,...-..,...-...,...-..,....,..<...,..,,...,..-...,...-..,,..,...,,..<...,...,..,,..-...,...-..,...,,..-...<..,,...,..-...,...-...-..,...,,..-...-..`,
    `.,.,,,,,.,.,,,,.,,,,,,-.-.,,.,,.,.,,.-.,,.,,.-.-,.,.,,.,,,-.-.,,,,,.,.,,.,.,,,,,.,.,,,,.,.,,,,,.-.,,,,,,,.,,,,.,.,,,,,.-.,,.,.,,.,,.-.-,,,,,,.,,,,.,.,,,,,.,.,,,,.,,,,,.-.,,,,,`,
    `.-..,-,..<..,,..,,..-,..>..,,,..-..-...-,.,-...<..-...,,..>..,-,.,-..,-..<,.,-,..-..,-..-,..-,..>..,-,.,-..,,..<..,,,..?..-,..-,.,-...>,.,,...-..<...-,.,-..,-..-,..,,..>..,-..`,
    `.<.-.-.\\\\.?,\\\\,--,-,-,-,!.!.>,,,-.<,--.?.\\\\.-.-.!.!,--,-,,,-,!.#.<,-,-.-,--,>.\\\\.-.-.\\\\\\\\,--,-,-,-,<.?.\\\\,-,-,-,--,>.\\\\.-.-.\\\\.!.<-,-,-,,,\\\\.#.?.-,,,-.--,>.<.-.-.\\\\\\\\,\\\\-,-,-,-,\\\\,?.!,>,-`,
    `.-.,.,...-.-,,..,,,,,...-.,,,...-.,,...-.,.,...-,,,...,,,.-...,,,,,...,,,-...,.,.-..,,,,,...,,-.-...,,,,,..,,-.-...,.-.-..,.,.,,..-.<.-..,,.,.,..-.-.,...-.-.,..,.,,,,..-.-.,..`,
    `.-.-.-.-.<,>,,,,,,,,-,?.\\\\.-,,,-.-,--.<.-.,.-.>.\\\\,,-.-,,,-,?.\\\\.-,,,-.-,,-,<.-.-.-.-.>,-,,-,,,-,-.?.\\\\,-,,,-,-,,-.<.-.,.-.>.-,,-,-,,,-.?.\\\\,,,,,-.-,,<.>.-.,.-.\\\\,-,,-,,,,,-,\\\\.\\\\,-,,`,
    `.<...>.\\\\.?,!-\\\\-,-,..\\\\,#.#.\\\\,-,<.>..\\\\,?.\\\\.-.\\\\.#.#..\\\\,-,--<,#.#.>..,-.\\\\--\\\\,?,\\\\.\\\\...!,!-<---,-,>,..#,!,\\\\,-,-,\\\\--..?.<.\\\\.!.!,!-,..-,-,!.#.#,>,-...<--?,!.\\\\.\\\\.\\\\..,\\\\--\\\\,-,-,>,#..,<,-`,
    `.-.-,-,-,?,-,--,,,,,-,<.>,-,,,-.-,--,?.-,,,-.\\\\\\\\,,-.-,,,-,<.>,-,,,-.-,--,-,-,-,-,-,-,-,,-,,,,,-,<,-,-,,,-,-,,-.-.-,,,-.>,-,,-,,,,,-.?.<,,,,,-.-,,>.-,-,,,-.\\\\,--,-,,,,,-,<,\\\\,-,,`,
    `.-.,.,.-.-.-,,,.,,,,,,<.>.-,,,,.-.,-.-.-.,.,.\\\\.-,,,.,,,,,.<.>.-,,,,.,,,-,-.-.,.-.-.-,-,,,.,,,,-.<.-.,,,,,,,,,-.-.-.,.-.-.-,.,.,,,,-.<.>.,,,.-.,,,-.-.,.,.-.-.-,,,,,,,,-.-.-.-,,`,
    `.<,>,\\\\,\\\\,?,!---,----\\\\,#,!,\\\\,-,-,<,->,?.\\\\,-,\\\\,!.!--\\\\,----\\\\,#,#,<,-,-,>--\\\\,?,\\\\,-,\\\\,\\\\,!-\\\\---,-,-,!,#,!,<,-,-,>--\\\\,?,\\\\,-,\\\\,!,\\\\-,\\\\,----<,#.#,---,>,\\\\--?,!,\\\\,-,\\\\.!,<--\\\\,-,-,>,!,!,\\\\--`,
    `-?,----<!\\\\,\\\\---\\\\!----->\\\\\\\\,----\\\\\\\\\\\\,-<,\\\\\\\\----,?-\\\\-->,-!----\\\\,\\\\!<----,!---,\\\\,-#---,>,\\\\\\\\------?--<,\\\\,\\\\!-----,!-->,\\\\,-#--\\\\,\\\\,<?,\\\\,--,#\\\\,!,\\\\--#---,>-\\\\!,<----#-,\\\\,---?------!>,\\\\----`,
    `.-,,,,,,,-,-,,,,,,,,,,-,-,,,,,,,-,,,.-.,,,,,,-.-,,-.,,,,,,-.-,,,,,,,-,,,,-,,,,,,,-,-,,,,,,,,,,,,-,-,,,,,,,,,,-.-,,,,,,,-,-,.-,,,,,,,-.-,,,,,,.-,,-.-,,,,,,,-,,,,,,,,,,,,-,-,,,,`,
    `-<,-?-,->\\\\,\\\\\\\\---\\\\-,!-,\\\\-\\\\,-!,,<--,>\\\\,\\\\-\\\\,,#-,?-\\\\,-!,-!---<\\\\,>\\\\---!-,!----\\\\,-?-,-\\\\-,<\\\\--->,-!---\\\\\\\\,\\\\!-,-\\\\-,?-,--<,-#-,>\\\\\\\\,\\\\\\\\,--\\\\-,!-,?-\\\\,-#,,<,-->\\\\,\\\\\\\\-,-!-,\\\\----?,-!-,-<\\\\,>\\\\--,`,
    `,\\\\--\\\\-\\\\\\\\\\\\-\\\\-\\\\--\\\\-\\\\<-\\\\->\\\\-\\\\--\\\\-\\\\--\\\\-\\\\\\\\\\\\-\\\\\\\\\\\\-\\\\--<->\\\\-\\\\,\\\\\\\\-\\\\\\\\\\\\-\\\\--\\\\-\\\\\\\\\\\\-\\\\\\\\<->-\\\\\\\\\\\\-\\\\--\\\\-\\\\--\\\\-\\\\--\\\\-\\\\\\\\\\\\-\\\\<>-\\\\-\\\\\\\\\\\\-\\\\--\\\\-\\\\--\\\\-\\\\\\\\\\\\-\\\\\\\\\\\\,<-->-\\\\\\\\\\\\-?-\\\\\\\\\\\\-\\\\\\\\\\\\,\\\\--\\\\-\\\\--<-\\\\>-\\\\-\\\\\\\\\\\\-\\\\--\\\\-\\\\--\\\\-\\\\--\\\\-`,
    `---,?,<,>,-,-,----,\\\\,-,-,-,!,\\\\---,--,--,?,#,---,-,<,->,\\\\,\\\\,-,\\\\,\\\\,!,----,---,?,<,>,-,-,----,\\\\,-,\\\\,-,\\\\,\\\\,\\\\-,<,-----,#,>,\\\\-,-\\\\---\\\\.?,-,-,<,!,--,-,--,,>,\\\\,!,---,-,---<,\\\\,\\\\,-,\\\\,\\\\.`,
    `,----,-,,---,,-,--,-,,-,--,-,-,,<,-,,-,,?,-,,-,--,-,--,>,--,-,,<,-,,-,--,-,,-,?,-,,-,,-,-,,-,<,,-,,-,>,--,-,--,-,,-,\\\\,,-,,-,<,,-.-,--,--,-,>-,-,,-,-,,-,----,,-,----,-,,---,,-,`,
    `<>\\\\-#-?-!-\\\\\\\\!-\\\\\\\\!\\\\-#-\\\\-!\\\\\\\\-#-!<!>-?\\\\-\\\\!\\\\!,#-\\\\\\\\\\\\\\\\\\\-#-\\\\#-\\\\-#-<-?->-#\\\\-!\\\\\\\\-\\\\\\\\\\\-#-!-#--\\\\!-<\\\\?>-#-\\\\-!-\\\\-#-\\\\\\\\#\\\\-!-\\\\\\\\\\\\<-#-?>!\\\\-\\\\!,\\\\\\\\\\\\!,#-\\\\\\\\!-\\\\,#-<!-\\\\->\\\\-\\\#-?-#-\\\\\\\\\\\\-\\\\-!\\\\-#-<-!-\\\\-!->,`,
    `--?-#,#,!-!,\\\\-!-<!-!,!,>,#,#,#-\\\\\\\\-\\\\-\\\\-\\\\-#,#,#-<-\\\\,>-\\\\?-#,!,!,!,#,#\\\\!\\\\-\\\\-<-!-#,#,?-!->,!-\\\\!\\\\!,!,\\\\,!,!-#-!<\\\\\\\\,\\\\->-#-#,#,?-\\\\-\\\\,!\\\\-#,!,!,<,#,#-#>-!-\\\\-\\\\-?,#,#-!-\\\\-\\\\-<!\\\\!-#,!,!,>,#.`,
    `--\\\\,?,\\\\,\\\\,-,-,----,<.>,-,\\\\,!,\\\\,--,-,,--,?.#,\\\\,-,-,<,->,\\\\,\\\\,-,\\\\,\\\\,\\\\---,-,-,-,?,!,<,-,-,-,--,>,\\\\,\\\\,-,\\\\,\\\\,\\\\-,-,-,-,<,#.?,-,-,-,>--\\\\.!.-,-,\\\\.!,<-,-,-,-,\\\\,?,!,-,-,-,--->,<,\\\\,-,\\\\,\\\\.`,
    `--?-!-#-\\\\-\\\\-\\\\-!-<!-!,!,>-!-!,#-\\\\\\\\-\\\\--\\\\\\\\-#,#,?---<,>-\\\\\\\\-!,\\\\-\\\\-\\\\,#,!\\\\\\\\\\\\-\\\\---?-!,#-<->-\\\\-\\\\-\\\\\\\\-\\\\-!,\\\\,\\\\-\\\\-#-\\\\\\\\\\\\<,>---?-#,#-\\\\\\\\\\\\-\\\\,!\\\\-#,!,!-<-!,!-?>-!---\\\\-\\\\,#,!-!---\\\\-<\\\\\\\\\\\\-#->-\\\\-\\\\,?,`,
    `!-#-#-#,#,!,!-!<!!>#,!.?,#,#,#\\\\#\\\\-\\\\-\\\\-#-#,#,#-!,<,?>!#-#,#,!,#,#,#\\\\!\\\\-\\\\-!-!-#,#-#-?,!,!<>!\\\\#-#,!.!,#-#-#\\\\\\\\!-\\\\-?-#-#,#,#-<->,!!\\\\#,#.#.#,#.#-#\\\\\\\\\\\\,\\\\-?-#,#,#-!-<->-!!\\\\#-#,#,!,#,#.`,
    `\\\\-?-#,#,!,<,>,\\\\-\\\\\\\\-!,\\\\,\\\\,!,#,?-!\\\\-\\\\---!-#,#,!-<,>,\\\\-\\\\!-?,!,\\\\,!,!,#-\\\\\\\\---<->,#,#,!,\\\\,\\\\\\\\-\\\\\\\\-?,!,\\\\,\\\\,!,!-!--<,-->-!,#,#,?--,\\\\\\\\\\\\-!,#,\\\\,<,!.#,!>-\\\\,\\\\-\\\\-?,#,#,\\\\-\\\\,\\\\-<\\\\-!-!,!,>,!,!.`,
    `--?-#,#,\\\\-<-\\\\-\\\\-\\\\\\\\-!,>,\\\\,!,#,?-\\\\\\\\-\\\\---<-#,#,!-\\\\->,\\\\-\\\\!-?,!,\\\\,!,!,!-<\\\\-\\\\-\\\\->-#,#,!-\\\\-\\\\,\\\\-\\\\\\\\-?,!,<,\\\\,!,!-!>-\\\\,\\\\-\\\\-!-#,#-?---<,\\\\\\\\-#,!,>,\\\\,!,#-!\\\\-\\\\,\\\\-\\\\-?,#,#-<-\\\\->-\\\\\\\\-!-!,!,\\\\,\\\\!.`,
    `?-#-#-#,#,!-!-!<!#>#,!.#,#,#,#\\\\#\\\\-\\\\,\\\\-#-#,#,#-?,<,!>!#-#,#,#,#,#-#\\\\!\\\\\\\\\\\\-?-!-#-#-#-!,!-!<>!\\\\#-#.!.!,#-#-#\\\\\\\\?-\\\\-!-#-#,#,#-!,<-!!>#,#.#.#.#.#-#?\\\\\\\\,\\\\-!-#,#,#-#-<,>-!!\\\\#-#,#.?.#,#.`,
    `\\\\\\\\#\\\\#-#-#-!-<-!>!#\\\\?-#-!-#-!-#\\\\#!\\\\\\\\-\\\\\\\\#<#,#-#>?-!-!\\\\!#\\\\#-!-#-#-#-#<!!\\\\\\\\>\\\\-#\\\\#-#-?\\\\!-!-!\\\\\\\\!\\\\#<#-!-#-#-#-!!!?-!>\\\\-#-#-#-!<!-!-!\\\\\\\\#-#,#-?-#,#>#\\\\\\\\!-!<!\\\\!-#-#\\\\#-\\\\-!\\\\?!\\\\!-#-#-!-!-#,`,
    `<>\\\\-#-!-!-\\\\-?-\\\\\\\\!\\\\-#,\\\\-!-\\\\-#-!<!>-!--\\\\?-#,#-!\\\\\\\\-\\\\-!-\\\\#-!-!-<-!-!-#->?\\\\\\\\-\\\\\\\\\\\\-#-!-#-\\\\-!-<\\\\!\\\\-#->-?-\\\\-#-!-!\\\\-!-\\\\-\\\\\\\\!-#,!-!<--?,>\\\\\\\\!,#-\\\\-!-\\\\,#-!!-\\\\-\\\\<--#-?-#->\\\\\\\\-\\\\-!\\\\-#-!-!-\\\\-!-!,`,
    `<\\\\#-#-#-#-?-!-!>!#\\\\#,!,!-#-#-#<#!-\\\\-\\\\\\\\#-#,#,#-?-!,!>!#-#,#,#,#,#-#<!\\\\\\\\\\\\\\\\?-!-#-#-#-!-!-!>!!\\\\#-#,!,#,#-#-#?<!-\\\\-!-#-#,#-#-!-!-!!>#,#,#,#,#,#-#?<!-\\\\-!-#-#-#-#-!-!-!!>#-#-#,?,#-#,`,
    `!!!\\\\#\\\\!\\\\#\\\\\\\\\\\\#>!!#!\\\\#\\\\?\\\\#\\\\!\\\\#\\\\!!#!\\\\#\\\\\\\\\\\\#!#-#>!!#\\\\\\\\\\\\#\\\\?#!!\\\\#\\\\!\\\\#\\\\!\\\\#\\\\\\\\#!>\\\\#!!\\\\#\\\\?\\\\#\\\\\\\\\\\\#\\\\!!#\\\\\\\\#\\\\!\\\\#>!\\\\#\\\\!!#\\\\\\\\#\\\\\\\\\\\\#?!\\\\#\\\\!\\\\#\\\\\\\\\\\\#>!#!!-#\\\\!\\\\#\\\\!-#\\\\?#!!\\\\!!\\\\\\\\#>!\\\\#\\\\!!#\\\\\\\\!#\\\\\\\\#!?\\\\#\\\\\\\\\\\\#\\\\!-`,
    `>!#!#\\\\#\\\\#!#!#\\\\#?##!#\\\\#\\\\#!#>#\\\\#!##\\\\#!!##!#\\\\#\\\\#?!!#\\\\#!##>#\\\\#!#!#\\\\#\\\\#!##!!?!!#!#\\\\#\\\\#!#!#>#!##!#\\\\#\\\\#\\\\#\\\\#\\\\#?##!#\\\\!!!!#>#\\\\#!#!!!#\\\\#!!#\\\\#\\\\#?#\\\\#\\\\#\\\\##!#>!!!!#\\\\#\\\\#!#!!!#\\\\##?#!#\\\\#\\\\#>#\\\\#-`,
    `\\\\!#\\\\#\\\\!\\\\#\\\\#\\\\#\\\\\\\\?##!#->\\\\#\\\\#\\\\#-!!##\\\\!\\\\\\\\\\\\#!#-#\\\\\\\\?!>#\\\\#-\\\\#\\\\#\\\\#\\\\\\\\\\\\#\\\\#\\\\#\\\\\\\\#!!?!!>\\\\#\\\\#\\\\#\\\\\\\\\\\\#\\\\#!!\\\\\\\\#\\\\#\\\\#\\\\\\\\\\\\#>#\\\\#\\\\\\\\#\\\\?!!!\\\\\\\\#\\\\#\\\\#\\\\\\\\\\\\#\\\\#!!!-#>#\\\\#\\\\\\\\-#\\\\##\\\\?-!!!!#\\\\!\\\\#!#!!>\\\\\\\\##!#\\\\!\\\\#\\\\#\\\\#\\\\?-`,
    `!##!#!#!#!#!#!######!#\\\\#?#!#!####!#!###!.\\\\#!#!#!#!####?#!#!#!#!#!########!#!#!#!#?#!#!######!#\\\\#\\\\#!#!#!####?#!#!#!#!#!###!#!####!#\\\\#!#?#\\\\#!####!#!#!#!#!#!#!#!#!####?#!#!#!#!#-`,
    `!#############################################################################################################################################################################\\\\`,
    `?###################!#######?####!#######!#!#####!####?#!#####!#!##########################################?#######!#######!####!#!#####?#!####!#######!####################?#\\\\`,
    `!########################################?#######!#################################################################?############!#!#####!#####################################\\\\`,
    `####.#########################################################################################################################################################################?`,
    `!#############################################################################################################################################################################?`,
    `!#############################################################################################################################################################################\\\\`,
    `####.#####################################.######################.############.################################################.#########.##############.#####################?`,
    `####.#.##.#################.####.######################.##.######.############.#################.##############.#######.#######.######.##.####.##.######.############.########?`,
    `####.###################################.#####################################.###############################################################################################?`
  ];

  const charList = [',', ',', '-', '<', '>', String.fromCharCode(92), '>', '!', '#'];
  const LAVA_ENABLED_KEY = 'bcode-lavalamp-enabled';
  const LAVA_STATE_KEY = 'lavalamp-state-v2';
  const DEFAULT_RADIUS = 2;
  const DEFAULT_SPEED = 0.0375;
  const MOUSE_FORCE = 0.15;
  const BLOB_FORCE = MOUSE_FORCE * 0.5;
  const DEFAULT_VELOCITY_SPREAD = 0.12;
  const SPLIT_SPEED_THRESHOLD = DEFAULT_SPEED * 2;
  const SPLIT_OVERLAP_RATIO = 0.3;
  const MERGE_OVERLAP_RATIO = 0.4;
  const OPPOSITE_MERGE_OVERLAP_RATIO = 0.4;
  const INTERACTION_MIN_AGE_MS = 3000;
  const METABALL_BLEND_RANGE = 0.55;
  // lavat-style metaball field: each blob contributes a soft halo past its
  // geometric radius so neighbouring blobs blend through the gap between them
  // (emergent merging) instead of needing drawn bridges.
  const METABALL_HALO = 1.55;            // halo reaches 1.55x the blob radius
  const METABALL_EDGE = 0.40;            // field value at the geometric rim (q=1)
  const FLUID_RESTITUTION = 0.18;
  const FLUID_VISCOSITY = 0.26;
  const SOFT_PRESSURE = 0.68;
  const FIELD_ATTRACTION = 0.35;
  const FLUX_FORCE_MULTIPLIER = 2.4;
  const INTERACTION_IMPULSE_SCALE = 0.32;
  const BREAK_IMPULSE_SCALE = 0.22;
  const FUSE_KICK_SCALE = 0.08;
  const INTERACTION_SPEED_CAP = 2.4;
  const FLUX_SURFACE_TENSION = 0.28;
  const FLUX_MIN_OVERLAP_CELLS = 5;
  const FLUX_MIN_THICKNESS = 3;
  const FLUX_LENGTH_FACTOR = 0.335;
  const SPAWN_REPEL_TRAVEL = 2;
  const PARAM_DEFAULTS = {
    radiusSpread: 1.0,
    velocitySpread: 1.0,
    minBlobs: 14,
    maxBlobs: 24,
    blobForce: 1.0
  };

  function charToDensity(c) {
    const idx = charList.indexOf(c);
    if (idx === -1) return 0;
    return (idx + 1) / charList.length;
  }

  function readLavaEnabled() {
    try {
      const raw = localStorage.getItem(LAVA_ENABLED_KEY);
      if (raw == null) return document.body.dataset.lavaEnabled !== '0';
      return raw !== '0' && raw !== 'false';
    } catch (e) {
      return document.body.dataset.lavaEnabled !== '0';
    }
  }

  const LAVA_FONT_SCALE = 0.9;
  const FONT_SIZE = 22 * LAVA_FONT_SCALE;
  const CHAR_H = 24 * LAVA_FONT_SCALE; // Line height
  let CHAR_W = 12; // Will be measured dynamically
  const LOCKED_VIEWPORT_W = Math.max(
    1,
    Math.round(window.innerWidth || document.documentElement.clientWidth || screen.width || 1280)
  );
  const LOCKED_VIEWPORT_H = Math.max(
    1,
    Math.round(window.innerHeight || document.documentElement.clientHeight || screen.height || 720)
  );

  let W, H;
  let density, nextDensity;
  let blobs = [];
  let desiredBlobCount = 0;
  let spawnCooldown = 0;
  let lastStateEmit = 0;
  let nextBlobId = 1;
  const fluxTubes = new Map();
  let paused = false;
  let cleared = false;
  const simParams = Object.assign({}, PARAM_DEFAULTS);

  // Create canvas early to measure font
  const canvas = document.createElement('canvas');
  canvas.id = 'lavalamp-canvas';
  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });

  // Measure actual character width
  ctx.font = `bold ${FONT_SIZE}px monospace`;
  CHAR_W = ctx.measureText('M').width || 12;

  function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function randomInt(min, max) {
    const lo = Math.ceil(min);
    const hi = Math.floor(max);
    return lo + Math.floor(Math.random() * Math.max(1, hi - lo + 1));
  }

  function normalizeBounds() {
    simParams.minBlobs = clamp(Math.round(simParams.minBlobs), 0, 120);
    simParams.maxBlobs = clamp(Math.round(simParams.maxBlobs), 0, 120);
    if (simParams.minBlobs > simParams.maxBlobs) {
      simParams.maxBlobs = simParams.minBlobs;
    }
    desiredBlobCount = clamp(
      desiredBlobCount || randomInt(simParams.minBlobs, simParams.maxBlobs),
      simParams.minBlobs,
      simParams.maxBlobs
    );
  }

  function setBlobRadius(b, radius) {
    b.radius = Math.max(2, radius);
    b.rSq = b.radius * b.radius;
  }

  function applyRadiusSpreadToBlob(b) {
    const jitter = Number.isFinite(b.radiusJitter) ? clamp(b.radiusJitter, -1, 1) : randomBetween(-1, 1);
    const areaScale = Number.isFinite(b.areaScale) && b.areaScale > 0 ? b.areaScale : 1;
    const baseRadius = DEFAULT_RADIUS * Math.sqrt(areaScale);
    const spread = clamp(simParams.radiusSpread, 0, 10);
    const minRadius = Math.max(1, Math.ceil(baseRadius * (1 - spread)));
    const maxRadius = Math.max(minRadius, Math.floor(baseRadius * (1 + spread)));
    b.radiusJitter = jitter;
    setBlobRadius(b, clamp(Math.round(baseRadius * (1 + jitter * spread)), minRadius, maxRadius));
  }

  function applyVelocitySpreadToBlob(b, resetCurrentVelocity = false) {
    const jitter = Number.isFinite(b.speedJitter) ? clamp(b.speedJitter, -1, 1) : randomBetween(-1, 1);
    const direction = b.direction === 1 || b.direction === -1 ? b.direction : -1;
    const spread = clamp(simParams.velocitySpread, 0, 10) * DEFAULT_VELOCITY_SPREAD;
    const speed = DEFAULT_SPEED * (1 + jitter * spread);
    b.speedJitter = jitter;
    b.direction = direction;
    b.baseVy = direction * Math.max(DEFAULT_SPEED * 0.1, speed);
    if (resetCurrentVelocity || !Number.isFinite(b.vy) || b.vy === 0) b.vy = b.baseVy;
  }

  function sanitizeReboundQueue(queue) {
    if (!Array.isArray(queue)) return [];
    return queue
      .filter((item) => item && Number.isFinite(item.x) && Number.isFinite(item.y) && Number.isFinite(item.amount) && Number.isFinite(item.frames))
      .slice(0, 4)
      .map((item) => ({
        x: item.x,
        y: item.y,
        amount: item.amount,
        frames: Math.max(0, Math.round(item.frames))
      }));
  }

  function spawnBlob() {
    const fromTop = Math.random() < 0.5;
    const b = {
      id: nextBlobId++,
      x: randomBetween(0, W),
      y: 0,
      vx: 0,
      vy: 0,
      direction: fromTop ? 1 : -1,
      radiusJitter: randomBetween(-1, 1),
      speedJitter: randomBetween(-1, 1),
      areaScale: 1,
      fromSplit: false,
      spawnTravel: 0,
      deformX: 0,
      deformY: 0,
      deformVX: 0,
      deformVY: 0,
      sloshAmp: 0,
      sloshPhase: 0,
      sloshX: 1,
      sloshY: 0,
      reboundQueue: [],
      bornAt: performance.now()
    };
    applyRadiusSpreadToBlob(b);
    applyVelocitySpreadToBlob(b, true);
    b.y = fromTop ? -b.radius - randomBetween(0, H * 0.2) : H + b.radius + randomBetween(0, H * 0.2);
    return b;
  }

  function resetBlobPopulation() {
    normalizeBounds();
    cleared = false;
    fluxTubes.clear();
    desiredBlobCount = randomInt(simParams.minBlobs, simParams.maxBlobs);
    blobs = [];
    for (let i = 0; i < desiredBlobCount; i++) blobs.push(spawnBlob());
  }

  function hydrateBlob(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const direction = raw.direction === 1 || raw.direction === -1 ? raw.direction : (raw.baseVy > 0 ? 1 : -1);
    const b = {
      id: Number.isFinite(raw.id) ? raw.id : nextBlobId++,
      x: Number.isFinite(raw.x) ? raw.x : randomBetween(0, W),
      y: Number.isFinite(raw.y) ? raw.y : (direction > 0 ? -DEFAULT_RADIUS : H + DEFAULT_RADIUS),
      vx: Number.isFinite(raw.vx) ? raw.vx : 0,
      vy: Number.isFinite(raw.vy) ? raw.vy : 0,
      direction,
      radiusJitter: Number.isFinite(raw.radiusJitter) ? raw.radiusJitter : randomBetween(-1, 1),
      speedJitter: Number.isFinite(raw.speedJitter) ? raw.speedJitter : randomBetween(-1, 1),
      areaScale: Number.isFinite(raw.areaScale) && raw.areaScale > 0 ? raw.areaScale : 1,
      fromSplit: !!raw.fromSplit,
      spawnTravel: Number.isFinite(raw.spawnTravel) ? raw.spawnTravel : SPAWN_REPEL_TRAVEL,
      deformX: Number.isFinite(raw.deformX) ? raw.deformX : 0,
      deformY: Number.isFinite(raw.deformY) ? raw.deformY : 0,
      deformVX: Number.isFinite(raw.deformVX) ? raw.deformVX : 0,
      deformVY: Number.isFinite(raw.deformVY) ? raw.deformVY : 0,
      sloshAmp: Number.isFinite(raw.sloshAmp) ? raw.sloshAmp : 0,
      sloshPhase: Number.isFinite(raw.sloshPhase) ? raw.sloshPhase : 0,
      sloshX: Number.isFinite(raw.sloshX) ? raw.sloshX : 1,
      sloshY: Number.isFinite(raw.sloshY) ? raw.sloshY : 0,
      reboundQueue: sanitizeReboundQueue(raw.reboundQueue),
      bornAt: Number.isFinite(raw.bornAt) ? raw.bornAt : performance.now() - INTERACTION_MIN_AGE_MS
    };
    nextBlobId = Math.max(nextBlobId, b.id + 1);
    applyRadiusSpreadToBlob(b);
    applyVelocitySpreadToBlob(b);
    return b;
  }

  function initGrid() {
    W = Math.max(initialText[0].length, Math.ceil(LOCKED_VIEWPORT_W / CHAR_W) + 5);
    H = Math.max(initialText.length, Math.ceil(LOCKED_VIEWPORT_H / CHAR_H) + 2);

    density = new Float32Array(W * H);
    nextDensity = new Float32Array(W * H);

    for (let y = 0; y < H; y++) {
      let rowOff = y * W;
      let srcY = y % initialText.length;
      for (let x = 0; x < W; x++) {
        let srcX = x % initialText[0].length;
        density[rowOff + x] = charToDensity(initialText[srcY][srcX]);
      }
    }

    const savedState = sessionStorage.getItem(LAVA_STATE_KEY);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.version === 2 && parsed.W === W && parsed.H === H && Array.isArray(parsed.blobs)) {
          if (parsed.params && typeof parsed.params === 'object') {
            Object.assign(simParams, parsed.params);
            normalizeBounds();
          }
          blobs = parsed.blobs.map(hydrateBlob).filter(Boolean);
          desiredBlobCount = clamp(
            Math.round(parsed.desiredBlobCount || randomInt(simParams.minBlobs, simParams.maxBlobs)),
            simParams.minBlobs,
            simParams.maxBlobs
          );
          return;
        }
      } catch (e) { }
    }

    resetBlobPopulation();
  }

  initGrid();

  window.addEventListener('beforeunload', () => {
    sessionStorage.setItem(LAVA_STATE_KEY, JSON.stringify({
      version: 2,
      W: W,
      H: H,
      params: simParams,
      desiredBlobCount,
      blobs: blobs
    }));
  });

  Object.assign(canvas.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: `${LOCKED_VIEWPORT_W}px`,
    height: `${LOCKED_VIEWPORT_H}px`,
    zIndex: '-1',
    pointerEvents: 'none',
    transform: 'translateZ(0)',
    backfaceVisibility: 'hidden',
    willChange: 'transform'
  });
  document.body.prepend(canvas);

  const bloomCanvas = document.createElement('canvas');
  Object.assign(bloomCanvas.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: `${LOCKED_VIEWPORT_W}px`,
    height: `${LOCKED_VIEWPORT_H}px`,
    zIndex: '-2',
    pointerEvents: 'none',
    filter: 'blur(10px)',
    opacity: '0.85',
    transform: 'translateZ(0)',
    backfaceVisibility: 'hidden',
    willChange: 'transform'
  });
  document.body.prepend(bloomCanvas);

  const bloomCtx = bloomCanvas.getContext('2d', { alpha: true, desynchronized: true });
  let enabled = readLavaEnabled();
  let rafId = 0;
  let pendingLavaParams = null;

  function applyEnabledState(nextEnabled) {
    enabled = !!nextEnabled;
    canvas.style.display = enabled ? 'block' : 'none';
    bloomCanvas.style.display = enabled ? 'block' : 'none';
  }

  function resizeCanvas() {
    canvas.width = LOCKED_VIEWPORT_W;
    canvas.height = LOCKED_VIEWPORT_H;
    bloomCanvas.width = LOCKED_VIEWPORT_W;
    bloomCanvas.height = LOCKED_VIEWPORT_H;

    let textGradient;
    if (document.body.classList.contains('theme-balanced')) {
      // original bright text glow, flipped gradient
      textGradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
      textGradient.addColorStop(0, '#ab79fd');
      textGradient.addColorStop(1, '#5300d8');
    } else {
      // default gradient
      textGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      textGradient.addColorStop(0, '#ab79fd');
      textGradient.addColorStop(1, '#5300d8');
    }

    ctx.font = `bold ${FONT_SIZE}px monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = textGradient;
  }

  resizeCanvas();

  // Re-render gradient on theme changes
  let currentTheme = Array.from(document.body.classList).find(c => c.startsWith('theme-'));
  const observer = new MutationObserver((mutations) => {
    let themeChanged = false;
    for (const m of mutations) {
      if (m.type === 'attributes' && m.attributeName === 'class') {
        let newTheme = Array.from(document.body.classList).find(c => c.startsWith('theme-'));
        if (newTheme !== currentTheme) {
          currentTheme = newTheme;
          themeChanged = true;
        }
      }
    }
    if (themeChanged) {
      resizeCanvas();
    }
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

  let mouseX = null;
  let mouseY = null;
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });
  window.addEventListener('mouseout', () => {
    mouseX = null;
    mouseY = null;
  });

  function averageVelocity() {
    if (!blobs.length) return 0;
    const raw = blobs.reduce((sum, b) => sum + Math.abs(Number.isFinite(b.vy) ? b.vy : b.baseVy || 0), 0) / blobs.length;
    return raw / DEFAULT_SPEED;
  }

  function averageRadius() {
    if (!blobs.length) return 0;
    return blobs.reduce((sum, b) => sum + (Number.isFinite(b.radius) ? b.radius : 0), 0) / blobs.length;
  }

  function getLavaState() {
    return {
      blobs: blobs.length,
      minBlobs: simParams.minBlobs,
      maxBlobs: simParams.maxBlobs,
      radiusSpread: simParams.radiusSpread,
      velocitySpread: simParams.velocitySpread,
      blobForce: simParams.blobForce,
      averageVelocity: averageVelocity(),
      averageRadius: averageRadius(),
      glass: document.body.dataset.glassMode === 'on',
      enabled,
      paused,
      cleared
    };
  }

  function publishState(force = false) {
    const now = performance.now();
    if (!force && now - lastStateEmit < 220) return;
    lastStateEmit = now;
    window.dispatchEvent(new CustomEvent('bcode:lava-state', { detail: getLavaState() }));
  }

  function applyPendingParams() {
    if (!pendingLavaParams) return;
    const patch = pendingLavaParams;
    pendingLavaParams = null;
    let radiusChanged = false;
    let velocityChanged = false;

    if (typeof patch.radiusSpread === 'number' && isFinite(patch.radiusSpread)) {
      simParams.radiusSpread = clamp(patch.radiusSpread, 0, 10);
      radiusChanged = true;
    }
    if (typeof patch.velocitySpread === 'number' && isFinite(patch.velocitySpread)) {
      simParams.velocitySpread = clamp(patch.velocitySpread, 0, 10);
      velocityChanged = true;
    }
    if (typeof patch.minBlobs === 'number' && isFinite(patch.minBlobs)) {
      simParams.minBlobs = clamp(Math.round(patch.minBlobs), 0, 120);
    }
    if (typeof patch.maxBlobs === 'number' && isFinite(patch.maxBlobs)) {
      simParams.maxBlobs = clamp(Math.round(patch.maxBlobs), 0, 120);
    }
    if (typeof patch.blobForce === 'number' && isFinite(patch.blobForce)) {
      simParams.blobForce = clamp(patch.blobForce, 0, 10);
    }

    normalizeBounds();
    cleared = false;
    if (radiusChanged) blobs.forEach(applyRadiusSpreadToBlob);
    if (velocityChanged) blobs.forEach((b) => applyVelocitySpreadToBlob(b));
    publishState(true);
  }

  function resetParams(keys) {
    const list = Array.isArray(keys) && keys.length ? keys : ['R', 'V', 'B', 'F'];
    let radiusChanged = false;
    let velocityChanged = false;

    if (list.includes('R')) {
      simParams.radiusSpread = PARAM_DEFAULTS.radiusSpread;
      radiusChanged = true;
    }
    if (list.includes('V')) {
      simParams.velocitySpread = PARAM_DEFAULTS.velocitySpread;
      velocityChanged = true;
    }
    if (list.includes('B')) {
      simParams.minBlobs = PARAM_DEFAULTS.minBlobs;
      simParams.maxBlobs = PARAM_DEFAULTS.maxBlobs;
      normalizeBounds();
    }
    if (list.includes('F')) {
      simParams.blobForce = PARAM_DEFAULTS.blobForce;
    }

    if (radiusChanged) blobs.forEach(applyRadiusSpreadToBlob);
    if (velocityChanged) blobs.forEach((b) => applyVelocitySpreadToBlob(b));
    publishState(true);
  }

  function clearSim() {
    blobs = [];
    fluxTubes.clear();
    desiredBlobCount = 0;
    spawnCooldown = 0;
    cleared = false;
    publishState(true);
  }

  function setPaused(nextPaused) {
    paused = !!nextPaused;
    publishState(true);
  }

  function circleOverlapArea(a, b, dist) {
    const r1 = a.radius;
    const r2 = b.radius;
    if (dist >= r1 + r2) return 0;
    if (dist <= Math.abs(r1 - r2)) {
      const r = Math.min(r1, r2);
      return Math.PI * r * r;
    }
    const r1Sq = r1 * r1;
    const r2Sq = r2 * r2;
    const alpha = Math.acos(clamp((dist * dist + r1Sq - r2Sq) / (2 * dist * r1), -1, 1));
    const beta = Math.acos(clamp((dist * dist + r2Sq - r1Sq) / (2 * dist * r2), -1, 1));
    const lens = 0.5 * Math.sqrt(Math.max(0, (-dist + r1 + r2) * (dist + r1 - r2) * (dist - r1 + r2) * (dist + r1 + r2)));
    return r1Sq * alpha + r2Sq * beta - lens;
  }

  function blobMass(b) {
    return Math.max(1, b.radius * b.radius);
  }

  function capInteractionVelocity(b, multiplier = INTERACTION_SPEED_CAP) {
    if (!b) return;
    const base = Math.max(Math.abs(b.baseVy || 0), DEFAULT_SPEED);
    const cap = base * multiplier;
    const speed = speedOf(b);
    if (speed <= cap || speed <= 0) return;
    const scale = cap / speed;
    b.vx *= scale;
    b.vy *= scale;
  }

  function isMature(b, now = performance.now()) {
    return now - (Number.isFinite(b.bornAt) ? b.bornAt : now) >= INTERACTION_MIN_AGE_MS;
  }

  function isSpawnProtected(b) {
    return (Number.isFinite(b.spawnTravel) ? b.spawnTravel : SPAWN_REPEL_TRAVEL) < SPAWN_REPEL_TRAVEL;
  }

  function applyPairImpulse(a, b, nx, ny, force, attractive) {
    const mA = blobMass(a);
    const mB = blobMass(b);
    const impulse = force * (attractive ? 1 : -1);
    const ax = nx * impulse / mA;
    const ay = ny * impulse / mA;
    const bx = nx * impulse / mB;
    const by = ny * impulse / mB;
    a.vx += ax;
    a.vy += ay;
    b.vx -= bx;
    b.vy -= by;
  }

  function applyElasticBounce(a, b, nx, ny, restitution) {
    const mA = blobMass(a);
    const mB = blobMass(b);
    const rvx = b.vx - a.vx;
    const rvy = b.vy - a.vy;
    const normalVelocity = rvx * nx + rvy * ny;
    if (normalVelocity >= 0) return;
    const impulse = -(1 + restitution) * normalVelocity / ((1 / mA) + (1 / mB));
    const ix = impulse * nx;
    const iy = impulse * ny;
    a.vx -= ix / mA;
    a.vy -= iy / mA;
    b.vx += ix / mB;
    b.vy += iy / mB;
  }

  function applyVelocityTransfer(a, b, strength) {
    const amount = clamp(strength, 0, 1);
    if (amount <= 0) return;
    const mA = blobMass(a);
    const mB = blobMass(b);
    const total = mA + mB;
    const centerVx = (a.vx * mA + b.vx * mB) / total;
    const centerVy = (a.vy * mA + b.vy * mB) / total;
    a.vx += (centerVx - a.vx) * amount;
    a.vy += (centerVy - a.vy) * amount;
    b.vx += (centerVx - b.vx) * amount;
    b.vy += (centerVy - b.vy) * amount;
  }

  function edgeFieldStrength(a, b, dist) {
    const ra = Math.max(1, a.radius);
    const rb = Math.max(1, b.radius);
    const safeDist = Math.max(0.0001, dist);
    const fieldA = (ra * ra) / (safeDist * safeDist);
    const fieldB = (rb * rb) / (safeDist * safeDist);
    return clamp((fieldA + fieldB) * 0.5, 0, 1.5);
  }

  function pairKey(a, b) {
    return a.id < b.id ? `${a.id}:${b.id}` : `${b.id}:${a.id}`;
  }

  function speedOf(b) {
    return Math.sqrt(b.vx * b.vx + b.vy * b.vy);
  }

  function centralCoreRadius(b) {
    return Math.max(2, b.radius * 0.28);
  }

  function overlapChordCells(a, b, dist) {
    const overlapDepth = a.radius + b.radius - dist;
    if (overlapDepth <= 0) return 0;
    const r = Math.min(a.radius, b.radius);
    return 2 * Math.sqrt(Math.max(0, r * r - Math.pow(Math.max(0, r - overlapDepth), 2)));
  }

  function applyDeformation(b, x, y, amount) {
    if (!b || b.radius < 3) return;
    const scale = b.radius > 7 ? 1.08 : 0.58;
    b.deformVX = (b.deformVX || 0) + x * amount * scale;
    b.deformVY = (b.deformVY || 0) + y * amount * scale;
  }

  function addSlosh(b, x, y, amount) {
    if (!b || amount <= 0) return;
    const len = Math.sqrt(x * x + y * y) || 1;
    const nx = x / len;
    const ny = y / len;
    const previous = Number.isFinite(b.sloshAmp) ? b.sloshAmp : 0;
    b.sloshX = nx;
    b.sloshY = ny;
    b.sloshAmp = clamp(previous + amount, 0, b.radius > 7 ? 0.66 : 0.32);
    b.sloshPhase = Number.isFinite(b.sloshPhase) ? b.sloshPhase : 0;
  }

  function queueRebound(b, x, y, amount, frames = 9) {
    if (!b || amount === 0) return;
    b.reboundQueue = sanitizeReboundQueue(b.reboundQueue);
    if (b.reboundQueue.length >= 4) b.reboundQueue.shift();
    b.reboundQueue.push({ x, y, amount, frames });
  }

  function applyTubeRebound(a, b, nx, ny, strength) {
    const ampA = clamp(strength / Math.max(4, a.radius), 0, a.radius > 7 ? 0.5 : 0.2);
    const ampB = clamp(strength / Math.max(4, b.radius), 0, b.radius > 7 ? 0.5 : 0.2);
    applyDeformation(a, nx, ny, -ampA);
    applyDeformation(b, nx, ny, ampB);
    addSlosh(a, nx, ny, ampA * 0.82);
    addSlosh(b, nx, ny, ampB * 0.82);
    queueRebound(a, nx, ny, -ampA * 0.5);
    queueRebound(b, nx, ny, ampB * 0.5);
  }

  function applyTubeBreakImpulse(a, b, nx, ny, tube, forceAmount) {
    const minRadius = Math.max(1, Math.min(a.radius, b.radius));
    const widthRatio = clamp((tube?.width || FLUX_MIN_THICKNESS) / minRadius, 0.45, 1.8);
    const impulse = BLOB_FORCE * FLUX_FORCE_MULTIPLIER * BREAK_IMPULSE_SCALE * forceAmount * widthRatio;
    if (impulse <= 0) return;
    applyPairImpulse(a, b, nx, ny, impulse, false);
    capInteractionVelocity(a, 1.8);
    capInteractionVelocity(b, 1.8);
  }

  function applyFluxSurfaceTension(a, b, nx, ny, tube, forceAmount) {
    if (!tube || forceAmount <= 0) return;
    const minRadius = Math.max(1, Math.min(a.radius, b.radius));
    const widthRatio = clamp((tube.width || FLUX_MIN_THICKNESS) / minRadius, 0.35, 1.7);
    const smaller = a.radius <= b.radius ? a : b;
    const smallBiasA = a === smaller ? 2 : 1;
    const smallBiasB = b === smaller ? 2 : 1;
    const roundForce = clamp(
      (0.014 + (tube.tension || 0) * 0.012 + widthRatio * 0.01 + (tube.closing || 0) * 0.012) * forceAmount,
      0,
      0.068
    );

    for (const [blob, bias] of [[a, smallBiasA], [b, smallBiasB]]) {
      blob.deformVX = Number.isFinite(blob.deformVX) ? blob.deformVX : 0;
      blob.deformVY = Number.isFinite(blob.deformVY) ? blob.deformVY : 0;
      blob.deformX = Number.isFinite(blob.deformX) ? blob.deformX : 0;
      blob.deformY = Number.isFinite(blob.deformY) ? blob.deformY : 0;
      const biasedRoundForce = roundForce * bias;
      blob.deformVX += -blob.deformX * biasedRoundForce;
      blob.deformVY += -blob.deformY * biasedRoundForce;
      blob.deformVX *= 1 - biasedRoundForce * 0.4;
      blob.deformVY *= 1 - biasedRoundForce * 0.4;
    }

    const neckPull = BLOB_FORCE * INTERACTION_IMPULSE_SCALE * FLUX_SURFACE_TENSION * forceAmount * widthRatio;
    if (a === smaller) {
      a.vx += nx * neckPull * 2 / blobMass(a);
      a.vy += ny * neckPull * 2 / blobMass(a);
      b.vx -= nx * neckPull / blobMass(b);
      b.vy -= ny * neckPull / blobMass(b);
    } else {
      a.vx += nx * neckPull / blobMass(a);
      a.vy += ny * neckPull / blobMass(a);
      b.vx -= nx * neckPull * 2 / blobMass(b);
      b.vy -= ny * neckPull * 2 / blobMass(b);
    }
    capInteractionVelocity(a, 1.55);
    capInteractionVelocity(b, 1.55);
  }

  function registerFluxTube(a, b, nx, ny, dist, overlapCells, edgeGap, forceAmount = 1) {
    const maxLength = (a.radius + b.radius) * FLUX_LENGTH_FACTOR;
    const minRadius = Math.max(1, Math.min(a.radius, b.radius));
    const key = pairKey(a, b);
    const existing = fluxTubes.get(key);
    if (!existing && overlapCells < FLUX_MIN_OVERLAP_CELLS) return false;
    if (edgeGap > maxLength) {
      if (existing) {
        applyTubeRebound(a, b, nx, ny, Math.max(FLUX_MIN_THICKNESS, existing.width || FLUX_MIN_THICKNESS) * forceAmount * BREAK_IMPULSE_SCALE);
        fluxTubes.delete(key);
      }
      return false;
    }

    const stretch = clamp(Math.max(0, edgeGap) / maxLength, 0, 1);
    const closing = clamp(Math.max(0, -edgeGap) / minRadius, 0, 1);
    const convergence = clamp(1 - stretch, 0, 1);
    const baseWidth = Math.max(FLUX_MIN_OVERLAP_CELLS, existing?.baseWidth || 0, overlapCells);
    const ageLift = clamp(((existing?.age || 0) + 1) / 22, 0, 0.35);
    const swollenWidth = baseWidth * (1 + closing * 0.9 + ageLift * convergence);
    const widthLimit = Math.max(FLUX_MIN_THICKNESS, minRadius * 1.65);
    const width = clamp(
      swollenWidth * convergence + FLUX_MIN_THICKNESS * stretch,
      FLUX_MIN_THICKNESS,
      widthLimit
    );
    const previousTension = Number.isFinite(existing?.tension) ? existing.tension : 0;
    const tension = clamp(previousTension * 0.78 + (convergence + closing * 1.15) * 0.18, 0, 2);
    fluxTubes.set(key, {
      aId: a.id,
      bId: b.id,
      ax: a.x,
      ay: a.y,
      bx: b.x,
      by: b.y,
      ar: a.radius,
      br: b.radius,
      nx,
      ny,
      width,
      baseWidth,
      stretch,
      closing,
      tension,
      maxLength,
      age: (existing?.age || 0) + 1
    });
    return true;
  }

  function pruneFluxTubes(activeKeys = new Set()) {
    const ids = new Set(blobs.map((b) => b.id));
    for (const [key, tube] of fluxTubes) {
      if (!ids.has(tube.aId) || !ids.has(tube.bId) || !activeKeys.has(key)) {
        fluxTubes.delete(key);
      }
    }
  }

  function mergedBlob(a, b, tube) {
    const areaA = blobMass(a);
    const areaB = blobMass(b);
    const area = areaA + areaB;
    const momentumY = a.vy * areaA + b.vy * areaB;
    const direction = Math.abs(momentumY) > DEFAULT_SPEED * area * 0.08
      ? (momentumY >= 0 ? 1 : -1)
      : (areaA >= areaB ? a.direction : b.direction);
    const merged = {
      id: nextBlobId++,
      x: (a.x * areaA + b.x * areaB) / area,
      y: (a.y * areaA + b.y * areaB) / area,
      vx: (a.vx * areaA + b.vx * areaB) / area,
      vy: (a.vy * areaA + b.vy * areaB) / area,
      direction,
      baseVy: (a.baseVy * areaA + b.baseVy * areaB) / area,
      radiusJitter: clamp(((a.radiusJitter || 0) * areaA + (b.radiusJitter || 0) * areaB) / area, -1, 1),
      speedJitter: clamp(((a.speedJitter || 0) * areaA + (b.speedJitter || 0) * areaB) / area, -1, 1),
      areaScale: area / (DEFAULT_RADIUS * DEFAULT_RADIUS),
      fromSplit: false,
      deformX: ((a.deformX || 0) * areaA + (b.deformX || 0) * areaB) / area,
      deformY: ((a.deformY || 0) * areaA + (b.deformY || 0) * areaB) / area,
      deformVX: ((a.deformVX || 0) * areaA + (b.deformVX || 0) * areaB) / area,
      deformVY: ((a.deformVY || 0) * areaA + (b.deformVY || 0) * areaB) / area,
      sloshAmp: ((a.sloshAmp || 0) * areaA + (b.sloshAmp || 0) * areaB) / area,
      sloshPhase: ((a.sloshPhase || 0) * areaA + (b.sloshPhase || 0) * areaB) / area,
      sloshX: ((a.sloshX || 1) * areaA + (b.sloshX || 1) * areaB) / area,
      sloshY: ((a.sloshY || 0) * areaA + (b.sloshY || 0) * areaB) / area,
      reboundQueue: [],
      bornAt: Math.min(a.bornAt || performance.now(), b.bornAt || performance.now())
    };
    setBlobRadius(merged, Math.sqrt(area));
    const smaller = areaA <= areaB ? a : b;
    const larger = smaller === a ? b : a;
    let fuseDirX = smaller.vx;
    let fuseDirY = smaller.vy;
    let fuseDirLen = Math.sqrt(fuseDirX * fuseDirX + fuseDirY * fuseDirY);
    if (fuseDirLen < DEFAULT_SPEED * 0.35) {
      fuseDirX = larger.x - smaller.x;
      fuseDirY = larger.y - smaller.y;
      fuseDirLen = Math.sqrt(fuseDirX * fuseDirX + fuseDirY * fuseDirY) || 1;
    }
    const fuseKick = speedOf(smaller) * (blobMass(smaller) / area) * FUSE_KICK_SCALE * clamp(simParams.blobForce, 0, 10);
    merged.vx += (fuseDirX / fuseDirLen) * fuseKick;
    merged.vy += (fuseDirY / fuseDirLen) * fuseKick;
    capInteractionVelocity(merged, 1.9);
    if (tube) {
      const forceAmount = clamp(simParams.blobForce, 0, 10);
      const tubeWidth = Number.isFinite(tube.width) ? tube.width : FLUX_MIN_THICKNESS;
      const tubeTension = Number.isFinite(tube.tension) ? tube.tension : 0;
      const fuseAmp = forceAmount > 0
        ? clamp(((tubeWidth / Math.max(4, merged.radius)) * 0.48 + tubeTension * 0.18) * forceAmount, 0, merged.radius > 7 ? 0.72 : 0.38)
        : 0;
      if (fuseAmp > 0) {
        applyDeformation(merged, tube.nx || 1, tube.ny || 0, fuseAmp);
        addSlosh(merged, tube.nx || 1, tube.ny || 0, fuseAmp * 0.95);
        queueRebound(merged, tube.nx || 1, tube.ny || 0, fuseAmp * 0.5, 10);
      }
    }
    applyVelocitySpreadToBlob(merged);
    return merged;
  }

  function splitBlob(b) {
    const firstFrac = randomBetween(0.3, 0.5);
    const secondFrac = 1 - firstFrac;
    const sourceArea = b.radius * b.radius;
    const spreadX = Math.max(1, b.radius * 0.35);
    const sourceVy = Math.sign(b.vy || b.baseVy) === b.direction
      ? b.vy
      : b.baseVy || b.direction * DEFAULT_SPEED;
    const base = {
      direction: b.direction,
      baseVy: b.baseVy,
      speedJitter: b.speedJitter,
      fromSplit: true,
      deformX: (b.deformX || 0) * 0.35,
      deformY: (b.deformY || 0) * 0.35,
      deformVX: 0,
      deformVY: 0,
      sloshAmp: (b.sloshAmp || 0) * 0.45,
      sloshPhase: b.sloshPhase || 0,
      sloshX: b.sloshX || 1,
      sloshY: b.sloshY || 0,
      reboundQueue: [],
      bornAt: performance.now()
    };
    const m1 = sourceArea * firstFrac;
    const m2 = sourceArea * secondFrac;
    const sepImpulse = DEFAULT_SPEED * 0.45;
    const left = Object.assign({}, base, {
      id: nextBlobId++,
      x: b.x - spreadX,
      y: b.y,
      vx: b.vx - sepImpulse * (m2 / sourceArea),
      vy: sourceVy,
      radiusJitter: randomBetween(-1, 1),
      areaScale: (sourceArea * firstFrac) / (DEFAULT_RADIUS * DEFAULT_RADIUS)
    });
    const right = Object.assign({}, base, {
      id: nextBlobId++,
      x: b.x + spreadX,
      y: b.y,
      vx: b.vx + sepImpulse * (m1 / sourceArea),
      vy: sourceVy,
      radiusJitter: randomBetween(-1, 1),
      areaScale: (sourceArea * secondFrac) / (DEFAULT_RADIUS * DEFAULT_RADIUS)
    });
    setBlobRadius(left, Math.sqrt(sourceArea * firstFrac));
    setBlobRadius(right, Math.sqrt(sourceArea * secondFrac));
    capInteractionVelocity(left, 1.6);
    capInteractionVelocity(right, 1.6);
    return [left, right];
  }

  function splinterBlobOnTubeBreak(b, ejectX, ejectY) {
    const sourceArea = b.radius * b.radius;
    const minShardFrac = Math.min(0.4, Math.max(0.2, 9 / sourceArea));
    const shardFrac = randomBetween(minShardFrac, 0.4);
    const shardArea = sourceArea * shardFrac;
    const remnantArea = sourceArea - shardArea;
    const ejectLen = Math.sqrt(ejectX * ejectX + ejectY * ejectY) || 1;
    const ex = ejectX / ejectLen;
    const ey = ejectY / ejectLen;
    const originalSpeed = Math.min(Math.max(speedOf(b), Math.abs(b.baseVy || 0), DEFAULT_SPEED), DEFAULT_SPEED * 1.7);
    const shardSpeed = originalSpeed * 1.25;
    const shardVx = ex * shardSpeed;
    const shardVy = ey * shardSpeed;
    const remnantVx = (b.vx * sourceArea - shardVx * shardArea) / remnantArea;
    const remnantVy = (b.vy * sourceArea - shardVy * shardArea) / remnantArea;
    const offset = Math.max(1, b.radius * 0.32);
    const common = {
      direction: b.direction,
      baseVy: b.baseVy,
      speedJitter: b.speedJitter,
      fromSplit: true,
      bornAt: performance.now(),
      spawnTravel: SPAWN_REPEL_TRAVEL,
      sloshPhase: b.sloshPhase || 0,
      sloshX: ex,
      sloshY: ey,
      reboundQueue: []
    };
    const remnant = Object.assign({}, common, {
      id: nextBlobId++,
      x: b.x - ex * offset * 0.25,
      y: b.y - ey * offset * 0.25,
      vx: remnantVx,
      vy: remnantVy,
      radiusJitter: b.radiusJitter || 0,
      areaScale: remnantArea / (DEFAULT_RADIUS * DEFAULT_RADIUS),
      deformX: (b.deformX || 0) * 0.45 - ex * 0.18,
      deformY: (b.deformY || 0) * 0.45 - ey * 0.18,
      deformVX: 0,
      deformVY: 0,
      sloshAmp: (b.sloshAmp || 0) * 0.45
    });
    const shard = Object.assign({}, common, {
      id: nextBlobId++,
      x: b.x + ex * offset,
      y: b.y + ey * offset,
      vx: shardVx,
      vy: shardVy,
      radiusJitter: randomBetween(-1, 1),
      areaScale: shardArea / (DEFAULT_RADIUS * DEFAULT_RADIUS),
      deformX: ex * 0.24,
      deformY: ey * 0.24,
      deformVX: 0,
      deformVY: 0,
      sloshAmp: (b.sloshAmp || 0) * 0.45
    });
    setBlobRadius(remnant, Math.sqrt(remnantArea));
    setBlobRadius(shard, Math.sqrt(shardArea));
    applyDeformation(remnant, ex, ey, -0.22);
    applyDeformation(shard, ex, ey, 0.28);
    addSlosh(remnant, ex, ey, 0.18);
    addSlosh(shard, ex, ey, 0.22);
    queueRebound(remnant, ex, ey, -0.11, 8);
    queueRebound(shard, ex, ey, 0.14, 8);
    capInteractionVelocity(remnant, 1.7);
    capInteractionVelocity(shard, 2.15);
    return [remnant, shard];
  }

  function applyBlobForces() {
    const splitCandidates = new Set();
    const mergeCandidates = [];
    const splinterCandidates = new Map();
    const activeTubeKeys = new Set();
    const forceAmount = clamp(simParams.blobForce, 0, 10);
    const forceScale = BLOB_FORCE * INTERACTION_IMPULSE_SCALE * forceAmount;
    const now = performance.now();

    for (let i = 0; i < blobs.length; i++) {
      const a = blobs[i];
      if (!a || !isMature(a, now)) continue;
      for (let j = i + 1; j < blobs.length; j++) {
        const b = blobs[j];
        if (!b || !isMature(b, now)) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq) || 0.0001;
        const combinedRadius = a.radius + b.radius;
        const edgeGap = dist - combinedRadius;
        const nx = dx / dist;
        const ny = dy / dist;
        const overlapCells = overlapChordCells(a, b, dist);
        const key = pairKey(a, b);
        const existingTube = fluxTubes.get(key);
        if (edgeGap > 0 && !existingTube) continue;
        const breakingTube = existingTube && edgeGap > (existingTube.maxLength || combinedRadius * FLUX_LENGTH_FACTOR);
        if (breakingTube) {
          applyTubeBreakImpulse(a, b, nx, ny, existingTube, forceAmount);
          if (forceAmount > 0 && a.radius >= DEFAULT_RADIUS * 1.1 && b.radius >= DEFAULT_RADIUS * 1.1) {
            const target = a.radius >= b.radius ? a : b;
            const ejectSign = target === a ? -1 : 1;
            const strength = existingTube.tension || 0;
            const current = splinterCandidates.get(target.id);
            if (!current || strength > current.strength) {
              splinterCandidates.set(target.id, {
                id: target.id,
                strength,
                ejectX: nx * ejectSign,
                ejectY: ny * ejectSign
              });
            }
          }
        }
        const hasOverlappingHashes = overlapCells >= FLUX_MIN_OVERLAP_CELLS;
        if (!existingTube && !hasOverlappingHashes) continue;
        const minRadius = Math.max(1, Math.min(a.radius, b.radius));
        const overlapInfluence = clamp(Math.max(0, -edgeGap) / minRadius, 0, 1);
        const tubeInfluence = existingTube ? clamp((existingTube.width || FLUX_MIN_THICKNESS) / minRadius, 0.3, 1.6) : 0;
        const influence = Math.max(overlapInfluence, tubeInfluence * 0.72, hasOverlappingHashes ? 0.25 : 0);
        const field = edgeFieldStrength(a, b, dist);
        const sameDirection = a.direction === b.direction;
        const spawnProtectedPair = sameDirection && (isSpawnProtected(a) || isSpawnProtected(b));
        const rvx = b.vx - a.vx;
        const rvy = b.vy - a.vy;
        const relativeSpeed = Math.sqrt(rvx * rvx + rvy * rvy);
        const speedA = speedOf(a);
        const speedB = speedOf(b);
        const maxSpeed = Math.max(speedA, speedB, 0.0001);
        const minSpeed = Math.min(speedA, speedB);
        const similarVelocity = minSpeed / maxSpeed >= 0.8;
        const oppositeDirection = !sameDirection;
        const radiusRatio = Math.max(a.radius, b.radius) / Math.max(1, Math.min(a.radius, b.radius));
        const smallMergePair = a.radius <= DEFAULT_RADIUS * 0.75 && b.radius <= DEFAULT_RADIUS * 0.75;
        const smallPullBoost = smallMergePair
          ? clamp(1.35 + relativeSpeed / Math.max(DEFAULT_SPEED, minSpeed) * 0.42, 1.35, 2.6)
          : 1;
        const opposingRepelScale = oppositeDirection && radiusRatio <= 1.5 ? 0.75 : 1;
        const coreOverlap = dist <= centralCoreRadius(a) + centralCoreRadius(b);
        const pairForce = forceScale * influence * (0.2 + field);
        const fluxForce = pairForce * FLUX_FORCE_MULTIPLIER * smallPullBoost;
        const hasTube = registerFluxTube(a, b, nx, ny, dist, overlapCells, edgeGap, forceAmount);
        const tube = hasTube ? fluxTubes.get(key) : null;
        const tubeFusionReady = !hasTube || (tube.closing >= 0.28 || tube.width >= minRadius * 1.05 || tube.age >= 5);
        if (hasTube) activeTubeKeys.add(key);
        if (!hasTube && edgeGap > 0) continue;

        if (spawnProtectedPair) {
          applyPairImpulse(a, b, nx, ny, pairForce * 1.3, false);
          applyVelocityTransfer(a, b, FLUID_VISCOSITY * influence * 0.12 * forceAmount);
          capInteractionVelocity(a, 1.55);
          capInteractionVelocity(b, 1.55);
          continue;
        }

        if (hasTube) {
          applyFluxSurfaceTension(a, b, nx, ny, tube, forceAmount);
          const formingLift = tube.age <= 3 ? 1.7 : 1;
          const tubeFlex = forceAmount > 0
            ? clamp(((tube.tension || 0) * 0.024 + (tube.width / minRadius) * 0.016 + (tube.closing || 0) * 0.022) * formingLift * forceAmount * smallPullBoost, 0, smallMergePair ? 0.105 : 0.075)
            : 0;
          const smallerTubeBlob = a.radius <= b.radius ? a : b;
          const tubeFlexA = tubeFlex * (a === smallerTubeBlob ? 2 : 1);
          const tubeFlexB = tubeFlex * (b === smallerTubeBlob ? 2 : 1);
          applyDeformation(a, nx, ny, -tubeFlexA);
          applyDeformation(b, nx, ny, tubeFlexB);
          if (tube.age <= 3) {
            addSlosh(a, nx, ny, tubeFlexA * 1.4);
            addSlosh(b, nx, ny, tubeFlexB * 1.4);
          }
        }

        if (similarVelocity) {
          applyPairImpulse(a, b, nx, ny, (hasTube ? fluxForce : pairForce) * (sameDirection ? 0.85 : 0.55), true);
          applyVelocityTransfer(a, b, FLUID_VISCOSITY * influence * 0.7 * forceAmount);
          capInteractionVelocity(a, 1.75);
          capInteractionVelocity(b, 1.75);
          if (coreOverlap && tubeFusionReady) {
            mergeCandidates.push([i, j]);
            continue;
          }
        }

        if (smallMergePair && hasTube) {
          const relativePull = fluxForce * clamp(0.35 + relativeSpeed / Math.max(DEFAULT_SPEED, minSpeed) * 0.22, 0.35, 0.95);
          applyPairImpulse(a, b, nx, ny, relativePull, true);
          applyVelocityTransfer(a, b, FLUID_VISCOSITY * influence * 0.55 * forceAmount);
          capInteractionVelocity(a, 1.65);
          capInteractionVelocity(b, 1.65);
        }

        if (oppositeDirection && !smallMergePair && maxSpeed >= minSpeed * 1.3) {
          if (edgeGap <= 0 && radiusRatio >= 1.6 && tubeFusionReady) {
            mergeCandidates.push([i, j]);
            applyTubeRebound(a, b, nx, ny, fluxForce * 0.4);
            continue;
          }
          const faster = speedA >= speedB ? a : b;
          const slower = faster === a ? b : a;
          const fastMass = blobMass(faster);
          const slowMass = blobMass(slower);
          const tangentSign = (faster.vx * -ny + faster.vy * nx) >= 0 ? 1 : -1;
          const tx = -ny * tangentSign;
          const ty = nx * tangentSign;
          const slide = pairForce * opposingRepelScale * (0.7 + Math.min(1.2, radiusRatio * 0.25));
          faster.vx += tx * slide / fastMass;
          faster.vy += ty * slide / fastMass;
          slower.vx -= tx * slide * 0.35 / slowMass;
          slower.vy -= ty * slide * 0.35 / slowMass;
          applyPairImpulse(a, b, nx, ny, pairForce * 0.55 * opposingRepelScale, false);
          applyVelocityTransfer(a, b, FLUID_VISCOSITY * influence * 0.25 * forceAmount);
          capInteractionVelocity(a, 1.85);
          capInteractionVelocity(b, 1.85);
          continue;
        }

        if (edgeGap > 0) {
          applyPairImpulse(a, b, nx, ny, fluxForce * FIELD_ATTRACTION, true);
          applyVelocityTransfer(a, b, FLUID_VISCOSITY * influence * 0.35 * forceAmount);
          capInteractionVelocity(a, 1.7);
          capInteractionVelocity(b, 1.7);
          continue;
        }

        const overlapDepth = -edgeGap;
        const overlapRatio = overlapDepth / combinedRadius;
        const overlapArea = circleOverlapArea(a, b, dist);
        const minArea = Math.PI * Math.min(a.radius * a.radius, b.radius * b.radius);
        const overlapRatioByArea = minArea > 0 ? overlapArea / minArea : 0;
        const bounce = (sameDirection ? FLUID_RESTITUTION * 0.55 : FLUID_RESTITUTION * 0.72 * opposingRepelScale) * Math.min(1, forceAmount);
        const pressure = pairForce * SOFT_PRESSURE * (sameDirection ? 0.35 + overlapRatio : (0.2 + overlapRatio * 0.55) * opposingRepelScale);

        applyElasticBounce(a, b, nx, ny, bounce);
        applyPairImpulse(a, b, nx, ny, pressure, false);
        applyVelocityTransfer(a, b, FLUID_VISCOSITY * influence * (sameDirection ? 1.1 : 0.8) * forceAmount);
        capInteractionVelocity(a, 1.9);
        capInteractionVelocity(b, 1.9);

        if (relativeSpeed > SPLIT_SPEED_THRESHOLD && overlapRatioByArea > SPLIT_OVERLAP_RATIO) {
          const slowerIndex = speedA <= speedB ? i : j;
          if (!blobs[slowerIndex].fromSplit) splitCandidates.add(slowerIndex);
          continue;
        }

        const mergeOverlap = sameDirection ? MERGE_OVERLAP_RATIO : OPPOSITE_MERGE_OVERLAP_RATIO;
        const mergeSpeed = smallMergePair ? DEFAULT_SPEED * 3.1 : (sameDirection ? DEFAULT_SPEED * 2.6 : DEFAULT_SPEED * 1.15);
        if (relativeSpeed < mergeSpeed && overlapRatioByArea >= mergeOverlap && tubeFusionReady) {
          mergeCandidates.push([i, j]);
        }
      }
    }

    if (splitCandidates.size) {
      const additions = [];
      blobs = blobs.filter((b, index) => {
        if (!splitCandidates.has(index) || !b || b.fromSplit) return true;
        additions.push(...splitBlob(b));
        return false;
      });
      blobs.push(...additions);
      pruneFluxTubes(activeTubeKeys);
      return;
    }

    if (mergeCandidates.length) {
      const consumed = new Set();
      const additions = [];
      for (const [i, j] of mergeCandidates) {
        if (consumed.has(i) || consumed.has(j) || !blobs[i] || !blobs[j]) continue;
        const tube = fluxTubes.get(pairKey(blobs[i], blobs[j]));
        consumed.add(i);
        consumed.add(j);
        additions.push(mergedBlob(blobs[i], blobs[j], tube));
      }
      if (consumed.size) {
        blobs = blobs.filter((_, index) => !consumed.has(index));
        blobs.push(...additions);
      }
    }

    if (splinterCandidates.size) {
      const additions = [];
      blobs = blobs.filter((b) => {
        const candidate = splinterCandidates.get(b.id);
        if (!candidate || !b || b.radius < DEFAULT_RADIUS * 1.1) return true;
        additions.push(...splinterBlobOnTubeBreak(b, candidate.ejectX, candidate.ejectY));
        return false;
      });
      blobs.push(...additions);
    }
    pruneFluxTubes(activeTubeKeys);
  }

  function maintainPopulation() {
    if (blobs.length >= simParams.maxBlobs) return;
    if (blobs.length >= desiredBlobCount) {
      desiredBlobCount = randomInt(simParams.minBlobs, simParams.maxBlobs);
      return;
    }
    spawnCooldown -= 1;
    const belowMinimum = blobs.length < simParams.minBlobs;
    if (belowMinimum || spawnCooldown <= 0) {
      blobs.push(spawnBlob());
      spawnCooldown = belowMinimum ? 2 : randomInt(8, 28);
    }
  }

  function updateBlobDeformation(b) {
    b.deformX = Number.isFinite(b.deformX) ? b.deformX : 0;
    b.deformY = Number.isFinite(b.deformY) ? b.deformY : 0;
    b.deformVX = Number.isFinite(b.deformVX) ? b.deformVX : 0;
    b.deformVY = Number.isFinite(b.deformVY) ? b.deformVY : 0;
    b.sloshAmp = Number.isFinite(b.sloshAmp) ? b.sloshAmp : 0;
    b.sloshPhase = Number.isFinite(b.sloshPhase) ? b.sloshPhase : 0;
    b.sloshX = Number.isFinite(b.sloshX) ? b.sloshX : 1;
    b.sloshY = Number.isFinite(b.sloshY) ? b.sloshY : 0;
    b.reboundQueue = sanitizeReboundQueue(b.reboundQueue);
    if (b.reboundQueue.length) {
      const remaining = [];
      for (const rebound of b.reboundQueue) {
        rebound.frames -= 1;
        if (rebound.frames <= 0) {
          applyDeformation(b, rebound.x, rebound.y, rebound.amount);
          addSlosh(b, rebound.x, rebound.y, Math.abs(rebound.amount) * 0.42);
        } else {
          remaining.push(rebound);
        }
      }
      b.reboundQueue = remaining;
    }
    if (b.sloshAmp > 0.001) {
      b.sloshPhase += 0.32;
      const wave = Math.sin(b.sloshPhase) * b.sloshAmp;
      const counterWave = Math.sin(b.sloshPhase * 1.63 + 0.8) * b.sloshAmp;
      b.deformVX += b.sloshX * wave * 0.052 - b.sloshY * counterWave * 0.018;
      b.deformVY += b.sloshY * wave * 0.052 + b.sloshX * counterWave * 0.018;
      b.sloshAmp *= 0.966;
    }
    b.deformVX += -b.deformX * 0.18;
    b.deformVY += -b.deformY * 0.18;
    b.deformVX *= 0.72;
    b.deformVY *= 0.72;
    b.deformX += b.deformVX;
    b.deformY += b.deformVY;
    const len = Math.sqrt(b.deformX * b.deformX + b.deformY * b.deformY);
    const maxLen = b.radius > 7 ? 0.62 : 0.3;
    if (len > maxLen) {
      const scale = maxLen / len;
      b.deformX *= scale;
      b.deformY *= scale;
    }
  }

  function deformationAxes(b) {
    const amount = clamp(Math.sqrt((b.deformX || 0) ** 2 + (b.deformY || 0) ** 2), 0, b.radius > 7 ? 0.64 : 0.3);
    if (amount <= 0.001) {
      return { ux: 1, uy: 0, longAxis: 1, shortAxis: 1, amount: 0 };
    }
    const inv = 1 / amount;
    return {
      ux: b.deformX * inv,
      uy: b.deformY * inv,
      longAxis: 1 + amount,
      shortAxis: Math.max(0.88, 1 - amount * 0.15),
      amount
    };
  }

  function addFluxTubeDensity() {
    for (const tube of fluxTubes.values()) {
      const nx = tube.nx;
      const ny = tube.ny;
      const sx = tube.ax + nx * tube.ar;
      const sy = tube.ay + ny * tube.ar;
      const ex = tube.bx - nx * tube.br;
      const ey = tube.by - ny * tube.br;
      const vx = ex - sx;
      const vy = ey - sy;
      const lenSq = vx * vx + vy * vy;
      if (lenSq < 0.01) continue;
      const len = Math.sqrt(lenSq);
      const tx = vx / len;
      const ty = vy / len;
      const px = -ty;
      const py = tx;
      const minCoreHalf = FLUX_MIN_THICKNESS * 0.5;
      const halfWidth = Math.max(minCoreHalf + 0.9, tube.width * 0.5 + 0.9);
      // Peak fill: solid when the blobs are genuinely fusing, lighter while the
      // tube is merely forming, so a fresh bridge reads as a thin film of wax
      // being drawn out rather than a hard slab.
      const peak = clamp(0.72 + (tube.closing || 0) * 0.5 + (tube.age || 0) * 0.008, 0.72, 1);
      const pad = Math.ceil(halfWidth + 2);
      const minX = Math.max(0, Math.floor(Math.min(sx, ex) - pad));
      const maxX = Math.min(W - 1, Math.ceil(Math.max(sx, ex) + pad));
      const minY = Math.max(0, Math.floor(Math.min(sy, ey) - pad));
      const maxY = Math.min(H - 1, Math.ceil(Math.max(sy, ey) + pad));

      for (let y = minY; y <= maxY; y++) {
        const rowOffset = y * W;
        for (let x = minX; x <= maxX; x++) {
          const rx = x - sx;
          const ry = y - sy;
          const t = clamp((rx * vx + ry * vy) / lenSq, 0, 1);
          const cx = sx + vx * t;
          const cy = sy + vy * t;
          const dx = x - cx;
          const dy = y - cy;
          const dist = Math.abs(dx * px + dy * py);
          // Catenoid neck: always narrower in the middle than where it joins the
          // round blob bodies, so similar-sized blobs bridge with a curved waist
          // instead of a straight-edged (angled) bar.
          const pinch = 4 * t * (1 - t);
          const neck = 1 - pinch * (0.45 + tube.stretch * 0.45);
          const localHalf = Math.max(minCoreHalf, halfWidth * neck);
          if (dist > localHalf) continue;
          // Smooth round cross-section (no hard edge) and ease the density toward
          // the ends so each blob's own metaball carries the join seamlessly.
          const norm = dist / localHalf;
          const radial = 1 - norm * norm;
          const along = 0.58 + 0.42 * pinch;
          const idx = rowOffset + x;
          nextDensity[idx] = Math.max(nextDensity[idx], peak * radial * along);
        }
      }
    }
  }

  function update() {
    applyPendingParams();
    if (paused) {
      publishState();
      return;
    }
    if (!cleared) applyBlobForces();

    for (const b of blobs) {
      if (b.vy === 0) b.vy = b.baseVy;
      updateBlobDeformation(b);

      if (mouseX !== null && mouseY !== null) {
        let dx = (b.x * CHAR_W) - mouseX;
        let dy = (b.y * CHAR_H) - mouseY;
        let distSq = dx * dx + dy * dy;
        let pushRadius = 250;

        if (distSq < pushRadius * pushRadius && distSq > 0) {
          let dist = Math.sqrt(distSq);
          let force = (pushRadius - dist) / pushRadius;
          b.vx += (dx / dist) * force * 0.15;
          b.vy += (dy / dist) * force * 0.15;
        }
      }

      b.x += b.vx;
      b.y += b.vy;
      b.spawnTravel = Math.min(
        SPAWN_REPEL_TRAVEL,
        (Number.isFinite(b.spawnTravel) ? b.spawnTravel : SPAWN_REPEL_TRAVEL) + Math.max(0, b.vy * b.direction)
      );

      b.vx *= 0.93;
      b.vy = b.vy * 0.95 + b.baseVy * 0.05;

      if (b.x < -b.radius) b.x = W + b.radius;
      if (b.x > W + b.radius) b.x = -b.radius;
    }

    blobs = blobs.filter(b =>
      b.direction > 0
        ? b.y <= H + b.radius * 2
        : b.y >= -b.radius * 2
    );
    if (!cleared) maintainPopulation();

    for (let y = 0; y < H; y++) {
      let rowOffset = y * W;
      let srcY = y + 0.2;
      let iy1 = Math.floor(srcY);
      let iy2 = iy1 + 1;
      let fy = srcY - iy1;

      let cy1 = iy1 < 0 ? 0 : iy1 >= H ? H - 1 : iy1;
      let cy2 = iy2 < 0 ? 0 : iy2 >= H ? H - 1 : iy2;
      let row1 = cy1 * W;
      let row2 = cy2 * W;

      for (let x = 0; x < W; x++) {
        let d = density[row1 + x] * (1 - fy) + density[row2 + x] * fy;

        let cx1 = x > 0 ? x - 1 : 0;
        let cx2 = x < W - 1 ? x + 1 : W - 1;
        d = d * 0.98 + (density[row1 + cx1] + density[row1 + cx2]) * 0.009;

        nextDensity[rowOffset + x] = d * 0.99;
      }
    }

    // Flux-tube bridges removed: the soft metaball halo above now connects
    // nearby blobs implicitly (lavat-style), so no drawn neck is needed.

    for (let i = 0; i < blobs.length; i++) {
      let b = blobs[i];
      const axes = deformationAxes(b);
      const boundRadius = b.radius * Math.max(axes.longAxis, axes.shortAxis) * METABALL_HALO;
      let minX = Math.max(0, Math.floor(b.x - boundRadius));
      let maxX = Math.min(W - 1, Math.ceil(b.x + boundRadius));
      let minY = Math.max(0, Math.floor(b.y - boundRadius));
      let maxY = Math.min(H - 1, Math.ceil(b.y + boundRadius));

      let rSq = b.rSq;
      const haloQ = METABALL_HALO * METABALL_HALO; // cutoff in units of dist^2 / rSq
      for (let y = minY; y <= maxY; y++) {
        let rowOffset = y * W;
        let dy = b.y - y;
        for (let x = minX; x <= maxX; x++) {
          let dx = b.x - x;
          let parallel = (dx * axes.ux + dy * axes.uy) / axes.longAxis;
          let perp = (-dx * axes.uy + dy * axes.ux) / axes.shortAxis;
          let distSq = parallel * parallel + perp * perp;
          let q = distSq / rSq;
          if (q >= haloQ) continue;
          let core;
          if (q < 0.2) {
            core = 1.0;
          } else if (q <= 1) {
            // solid body easing to a soft (non-zero) rim
            let val = (1 - q) / 0.8;
            core = METABALL_EDGE + (1 - METABALL_EDGE) * val * val;
          } else {
            // soft halo tail: overlaps neighbouring blobs' fields in the gap so
            // they coalesce smoothly, the way lavat's summed field does
            let h = (q - 1) / (haloQ - 1);
            let f = 1 - h;
            core = METABALL_EDGE * f * f;
          }
          nextDensity[rowOffset + x] += core;
        }
      }
    }

    for (let i = 0; i < W * H; i++) {
      if (nextDensity[i] > 1) nextDensity[i] = 1.0;
    }

    const temp = density;
    density = nextDensity;
    nextDensity = temp;
    publishState();
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < H; y++) {
      let str = '';
      let rowOffset = y * W;
      for (let x = 0; x < W; x++) {
        let d = density[rowOffset + x];
        let idx = Math.floor(d * 9);
        if (idx > 8) idx = 8;
        str += charList[idx];
      }
      ctx.fillText(str, -10, y * CHAR_H); // -10px padding ensures left overlap
    }

    bloomCtx.clearRect(0, 0, canvas.width, canvas.height);
    bloomCtx.drawImage(canvas, 0, 0);
  }

  function loop() {
    rafId = 0;
    if (!enabled) return;
    update();
    render();
    rafId = requestAnimationFrame(loop);
  }

  applyEnabledState(enabled);
  if (enabled) rafId = requestAnimationFrame(loop);

  window.addEventListener('bcode:lavalamp-toggle', (e) => {
    const nextEnabled =
      e && e.detail && typeof e.detail.enabled === 'boolean' ? e.detail.enabled : readLavaEnabled();
    applyEnabledState(nextEnabled);
    if (enabled && !rafId) rafId = requestAnimationFrame(loop);
    publishState(true);
  });

  // Queue incoming params; applied at the start of the next update() call
  // so mutations always happen at a clean frame boundary.
  window.addEventListener('bcode:lava-params', (e) => {
    if (!e || !e.detail) return;
    pendingLavaParams = Object.assign({}, pendingLavaParams || {}, e.detail);
    if (!enabled) applyPendingParams();
  });

  window.addEventListener('bcode:lava-control', (e) => {
    const detail = e && e.detail ? e.detail : {};
    if (detail.command === 'reset') {
      resetParams(detail.keys);
    } else if (detail.command === 'clear') {
      clearSim();
    } else if (detail.command === 'pause') {
      setPaused(detail.paused !== false);
    }
  });

  window.__bcodeLava = {
    getState: getLavaState,
    applyParams(detail) {
      pendingLavaParams = Object.assign({}, pendingLavaParams || {}, detail || {});
      if (!enabled) applyPendingParams();
    },
    control(detail) {
      window.dispatchEvent(new CustomEvent('bcode:lava-control', { detail: detail || {} }));
    }
  };

  publishState(true);

})();
