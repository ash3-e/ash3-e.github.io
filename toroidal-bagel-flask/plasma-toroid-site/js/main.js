import { PlasmaToroidSimulation } from "./simulation.js";
import { InteractionController } from "./interaction.js";

window.__plasmaModuleStarted = true;

const qs = (selector, root = document) => root.querySelector(selector);
const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const hotspotCopy = {
  power: {
    title: "DC Input & RF Choke",
    text: "The DC input feeds the RF driver through a choke that keeps high-frequency energy from escaping back into the supply. Current-limit adjustment is a version-2 feature and a natural interface point for the smart-base supervisory controller."
  },
  mosfet: {
    title: "Class-E Switching Stage",
    text: "The switching device operates in the resonant Class-E / ZVS regime. Its layout, heat path, and timing are part of the tuned RF behavior, so the smart base should supervise power rather than casually rework this stage."
  },
  capacitors: {
    title: "Resonant LC Tank",
    text: "C0G / NP0 capacitors stay mandatory because this is the resonator. It is the piece you most do not want to hack casually; small parasitic changes can move the driver away from the intended operating point."
  },
  coil: {
    title: "Primary Loop Inductor",
    text: "The public sky-guided reference centers on a roughly 2 µH loop, around 13 MHz and about 800 V. Later mechanical clues point to an inductor geometry around 115 mm by 12 mm."
  },
  feedback: {
    title: "Self-Oscillating Feedback Network",
    text: "The capacitive divider feedback and gate timing make the driver follow the resonant build. That sensitivity is exactly why external control should be slow, supervisory, and upstream."
  }
};

function setupReveal() {
  const cards = qsa(".reveal");
  cards.forEach((card, index) => {
    card.style.transitionDelay = `${Math.min(index, 5) * 60}ms`;
  });
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    }
  }, { threshold: 0.12 });
  cards.forEach((card) => observer.observe(card));
}

function setupNav(simulation) {
  const hero = qs("#hero");
  const nav = qs("#siteNav");
  const links = qsa(".nav-pills a", nav);
  const sections = links
    .map((link) => qs(link.getAttribute("href")))
    .filter(Boolean);

  const heroObserver = new IntersectionObserver(([entry]) => {
    const mostlyGone = entry.intersectionRatio < 0.08;
    document.body.classList.toggle("nav-ready", mostlyGone);
  }, { threshold: [0, 0.08, 0.18] });
  heroObserver.observe(hero);

  const syncHeroState = () => {
    const rect = hero.getBoundingClientRect();
    document.body.classList.toggle("nav-ready", rect.bottom < window.innerHeight * 0.1);
  };
  window.addEventListener("scroll", syncHeroState, { passive: true });
  window.addEventListener("resize", syncHeroState, { passive: true });
  syncHeroState();

  const sectionObserver = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    links.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `#${visible.target.id}`);
    });
  }, { rootMargin: "-28% 0px -58% 0px", threshold: [0.12, 0.35, 0.65] });
  sections.forEach((section) => sectionObserver.observe(section));
}

function setupHotspots() {
  const buttons = qsa(".pcb-hotspot");
  const panel = qs("#boardInfo");
  const activate = (button) => {
    const data = hotspotCopy[button.dataset.hotspot];
    if (!data) return;
    buttons.forEach((item) => item.classList.toggle("is-active", item === button));
    panel.innerHTML = `<h3>${data.title}</h3><p>${data.text}</p>`;
  };
  buttons.forEach((button) => {
    button.addEventListener("mouseenter", () => activate(button));
    button.addEventListener("focus", () => activate(button));
    button.addEventListener("click", () => activate(button));
  });
}

function setupAmbientCard(simulation) {
  const cards = qsa(".glass-card");
  function tick() {
    const ambient = simulation.getAmbientBrightness();
    let chosen = null;
    for (const card of cards) {
      const rect = card.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.58 && rect.bottom > 120) {
        chosen = card;
        break;
      }
    }
    cards.forEach((card) => card.classList.toggle("ambient", card === chosen));
    if (chosen) chosen.style.setProperty("--ambient", ambient.toFixed(3));
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function setupDebug() {
  const params = new URLSearchParams(window.location.search);
  document.body.classList.toggle("debug", params.get("debug") === "1");
}

setupDebug();
const simulation = new PlasmaToroidSimulation(qs("#plasmaCanvas"), qs("#simulationStatus"));
new InteractionController(simulation, qs("#globeFocus"));
setupReveal();
setupNav(simulation);
setupHotspots();
setupAmbientCard(simulation);
simulation.start();
