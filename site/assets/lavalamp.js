
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

  const charList = ['.', ',', '-', '<', '>', String.fromCharCode(92), '?', '!', '#'];
  const LAVA_ENABLED_KEY = 'bcode-lavalamp-enabled';

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

  let W, H;
  let density, nextDensity;
  let blobs = [];

  // Create canvas early to measure font
  const canvas = document.createElement('canvas');
  canvas.id = 'lavalamp-canvas';
  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });

  // Measure actual character width
  ctx.font = `bold ${FONT_SIZE}px monospace`;
  CHAR_W = ctx.measureText('M').width || 12;

  function initGrid() {
    W = Math.max(initialText[0].length, Math.ceil(window.innerWidth / CHAR_W) + 5);
    H = Math.max(initialText.length, Math.ceil(window.innerHeight / CHAR_H) + 2);

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

    const savedState = sessionStorage.getItem('lavalamp-state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        // Ensure the screen size roughly matches before restoring blobs, 
        // to prevent weird bunching if they resized window between page loads
        if (Math.abs(parsed.W - W) < 50 && Math.abs(parsed.H - H) < 50) {
          blobs = parsed.blobs;
          return;
        }
      } catch (e) { }
    }

    const numBlobs = Math.floor((W * H) / 400); // Scale blobs with screen size
    blobs = [];
    for (let i = 0; i < numBlobs; i++) {
      let r = 4 + Math.random() * 5;
      blobs.push({
        x: Math.random() * W,
        y: H + Math.random() * 20,
        baseVy: - (0.05 + Math.random() * 0.1),
        vy: 0,
        vx: 0,
        radius: r,
        rSq: r * r
      });
    }
  }

  initGrid();

  window.addEventListener('beforeunload', () => {
    sessionStorage.setItem('lavalamp-state', JSON.stringify({
      W: W,
      H: H,
      blobs: blobs
    }));
  });

  Object.assign(canvas.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
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
    width: '100%',
    height: '100%',
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
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    bloomCanvas.width = window.innerWidth;
    bloomCanvas.height = window.innerHeight;

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

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      initGrid();
      resizeCanvas();
    }, 200);
  });

  function update() {
    // Apply queued lava-param changes at frame boundary, before any blob physics.
    if (pendingLavaParams) {
      const { A, B, C } = pendingLavaParams;
      pendingLavaParams = null;
      if (typeof A === 'number' && isFinite(A)) {
        const target = Math.max(3, Math.min(60, Math.round(A)));
        while (blobs.length < target) {
          const r = 4 + Math.random() * 5;
          blobs.push({ x: Math.random() * W, y: H + Math.random() * 20,
            baseVy: -(0.05 + Math.random() * 0.1), vy: 0, vx: 0, radius: r, rSq: r * r });
        }
        if (blobs.length > target) {
          // Push excess blobs far below screen so their density footprint
          // decays naturally rather than vanishing abruptly.
          for (let i = target; i < blobs.length; i++) blobs[i].y = H + 200;
          blobs.length = target;
        }
      }
      if (typeof B === 'number' && isFinite(B)) {
        const r = Math.max(2, Math.min(20, B));
        blobs.forEach(b => { b.radius = r; b.rSq = r * r; });
      }
      if (typeof C === 'number' && isFinite(C)) {
        const vy = -(0.03 + C * 0.5);
        blobs.forEach(b => { b.baseVy = vy; });
      }
    }

    for (const b of blobs) {
      if (b.vy === 0) b.vy = b.baseVy;

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

      b.x += b.vx + (Math.random() - 0.5) * 0.1;
      b.y += b.vy;

      b.vx *= 0.95;
      b.vy = b.vy * 0.95 + b.baseVy * 0.05;

      if (b.x < -b.radius) b.x = W + b.radius;
      if (b.x > W + b.radius) b.x = -b.radius;

      if (b.y < -b.radius * 2) {
        b.y = H + b.radius;
        b.x = Math.random() * W;
        b.vx = 0;
        b.vy = b.baseVy;
      }
    }

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

    for (let i = 0; i < blobs.length; i++) {
      let b = blobs[i];
      let minX = Math.max(0, Math.floor(b.x - b.radius));
      let maxX = Math.min(W - 1, Math.ceil(b.x + b.radius));
      let minY = Math.max(0, Math.floor(b.y - b.radius));
      let maxY = Math.min(H - 1, Math.ceil(b.y + b.radius));

      let rSq = b.rSq;
      for (let y = minY; y <= maxY; y++) {
        let rowOffset = y * W;
        let dy = b.y - y;
        let dySq = dy * dy;
        for (let x = minX; x <= maxX; x++) {
          let dx = b.x - x;
          let distSq = dx * dx + dySq;
          if (distSq < rSq) {
            let val = 1 - (distSq / rSq);
            nextDensity[rowOffset + x] += val * val * 0.75; // Increased blob density for thicker lava
          }
        }
      }
    }

    for (let i = 0; i < W * H; i++) {
      if (nextDensity[i] > 1) nextDensity[i] = 1.0;
    }

    const temp = density;
    density = nextDensity;
    nextDensity = temp;
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
  });

  // Queue incoming params; applied at the start of the next update() call
  // so mutations always happen at a clean frame boundary.
  window.addEventListener('bcode:lava-params', (e) => {
    if (!e || !e.detail) return;
    pendingLavaParams = Object.assign({}, pendingLavaParams || {}, e.detail);
  });

})();
