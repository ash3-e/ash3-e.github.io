import { SABParser } from '../assets/term/bcode_sab.js';

// Since type="module" implies defer, the DOM is already assembled.
// We execute directly instead of waiting for DOMContentLoaded (which often races and does not fire).

// --- 1. UI Elements & Logic ---
const tabs = document.querySelectorAll('.tab');
const views = document.querySelectorAll('.view');

tabs.forEach(t => {
  t.addEventListener('click', () => {
    tabs.forEach(x => x.classList.remove('active'));
    views.forEach(x => x.classList.remove('active'));
    
    t.classList.add('active');
    const target = t.getAttribute('data-target');
    document.getElementById('view-' + target).classList.add('active');
    
    if (target === 'home') {
      document.getElementById('cmd-input').focus();
    }
  });
});

const optionsSelect = document.getElementById('options-select');
optionsSelect.addEventListener('change', (e) => {
  if (e.target.value === 'clear') {
    document.getElementById('unsolicited-feed-content').innerHTML = '';
  }
  // reset to default visual option after handling
  e.target.value = 'bcode';
});

  // --- 2. Live Syntax Highlighting ---
  const cmdInput = document.getElementById('cmd-input');
  const cmdMirror = document.getElementById('cmd-mirror');

  // We explicitly use 'bcode' as requested
  const updateMirror = () => {
    const text = cmdInput.value;
    const result = window.hljs.highlight(text, { language: 'bcode', ignoreIllegals: true });
    // Append a non-breaking space so a trailing space or newline extends the mirror's scroll area
    cmdMirror.innerHTML = result.value + '&nbsp;';
    cmdMirror.scrollLeft = cmdInput.scrollLeft;
  };

  cmdInput.addEventListener('input', updateMirror);
  cmdInput.addEventListener('scroll', () => {
    cmdMirror.scrollLeft = cmdInput.scrollLeft;
  });

  // initial setup
  updateMirror();


  // --- 3. Parser Integration & Output Behavior ---
  const homeHistory = document.getElementById('history-content');
  const reqResChannel = document.getElementById('req-channel-content');
  const unsolFeed = document.getElementById('unsolicited-feed-content');

  // Generic append to terminal log blocks
  const appendHighlightLine = (container, text, prefix = "") => {
    const div = document.createElement('div');
    div.className = 'bcode-line';
    
    // Prefix (e.g. '○') goes outside the syntax highlighting
    let prefixSpan = "";
    if (prefix) {
      prefixSpan = `<span style="color:var(--fg);">${prefix} </span>`;
    }

    const res = window.hljs.highlight(text, { language: 'bcode', ignoreIllegals: true });
    div.innerHTML = prefixSpan + res.value;
    
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  };

  const appendBlank = (container) => {
    const div = document.createElement('div');
    div.className = 'bcode-blank';
    container.appendChild(div);
  };

  const handleLatched = (cmdText) => {
    // Generate simulated application outputs
    let outputText = cmdText; // default mirror back
    
    if (cmdText.includes('q')) {
      outputText = "312H 24I 0.63J 60K " + cmdText;
    } else if (cmdText.includes('A')) {
      outputText = "24A 0.0s"; // dummy normalization demo
    } else if (cmdText.includes('B')) {
      outputText = "4.8B 0.0s";
    } else if (cmdText.includes('C')) {
      outputText = "0.18C 0.0s";
    }

    // append to Home History
    appendHighlightLine(homeHistory, cmdText);
    appendHighlightLine(homeHistory, outputText, "○");
    appendBlank(homeHistory);

    // append to Request/Response
    appendHighlightLine(reqResChannel, cmdText);
    appendHighlightLine(reqResChannel, outputText, "○");
    appendBlank(reqResChannel);
  };

  // Check latch state character by character across the entire input
  // to perfectly emulate interactive stream typing.
  cmdInput.addEventListener('input', () => {
    let text = cmdInput.value;
    if (!text) return;
    
    while(true) {
      let latchIndex = -1;
      
      const parser = new SABParser({
        on_line_latched: (user, cmdByte) => {
          latchIndex = cursorIndex;
        }
      });

      let cursorIndex = 0;
      let consumed = false;
      for (let i = 0; i < text.length; i++) {
          cursorIndex = i;
          parser.feed(text[i]);
          if (latchIndex !== -1) {
              let latchedChars = text.substring(0, latchIndex + 1);
              handleLatched(latchedChars.trim());
              
              text = text.substring(latchIndex + 1);
              cmdInput.value = text;
              updateMirror();
              consumed = true;
              break; 
          }
      }
      
      if (!consumed) {
          break;
      }
    }
  });

  document.getElementById('cmd-send').addEventListener('click', () => {
    // A manual send forcing an append even if missing a terminator
    const text = cmdInput.value;
    if (text.trim()) {
      handleLatched(text);
      cmdInput.value = '';
      updateMirror();
    }
    cmdInput.focus();
  });


  // --- 4. Content Seeding ---
  const seedHomeHistory = () => {
    const pairs = [
      ["24A 0.0s", "24A 0.0s"],
      ["<18A 0.0s", "<18A 17I 296H 0.0q"],
      ["$neon$ 0.0s", "$neon$ 0.0s"],
      ["#414243# 0.0s", "#414243# 0.0s"],
      ["0.0q", "312H 24I 0.63J 60K 0.0q"]
    ];
    pairs.forEach(p => {
      appendHighlightLine(homeHistory, p[0]);
      appendHighlightLine(homeHistory, p[1], "○");
      appendBlank(homeHistory);
    });
  };

  const seedReqRes = () => {
    const pairs = [
      ["24A 0.0s", "24A 0.0s"],
      ["4.8B 0.0s", "4.8B 0.0s"],
      ["0.18C 0.0s", "0.18C 0.0s"],
      [">20A 0.0s", "24A 0.0s"],
      ["0.0q", "312H 24I 0.63J 60K 0.0q"]
    ];
    pairs.forEach(p => {
      appendHighlightLine(reqResChannel, p[0]);
      appendHighlightLine(reqResChannel, p[1], "○");
      appendBlank(reqResChannel);
    });
  };

  const seedUnsolicitedFeed = () => {
    const feedLines = [
      "301H 24I 0.61J 59K 0.0u",
      "305H 24I 0.62J 60K 0.1u",
      "309H 24I 0.63J 60K 0.2u",
      "!309H 24I 0.63J 58K 0.3u",
      "312H 24I 0.64J 60K 0.4u",
      "318H 25I 0.66J 60K 0.5u"
    ];
    feedLines.forEach(l => {
      appendHighlightLine(unsolFeed, l);
    });
  };

  seedHomeHistory();
  seedReqRes();
  seedUnsolicitedFeed();

  // Simulated Telemetry updates over time
  let telemetryCount = 6;
  setInterval(() => {
    let h = 318 + Math.floor(Math.random() * 10);
    let j = (0.66 + Math.random() * 0.02).toFixed(2);
    let k = 58 + Math.floor(Math.random() * 3);
    let u = (telemetryCount / 10).toFixed(1);
    let newLine = `${h}H 25I ${j}J ${k}K ${u}u`;
    
    appendHighlightLine(unsolFeed, newLine);
    telemetryCount++;
    
    if (unsolFeed.childElementCount > 50) {
      unsolFeed.removeChild(unsolFeed.firstChild);
    }
  }, 2500);
