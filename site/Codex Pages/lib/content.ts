import { promises as fs } from "fs";
import path from "path";

export type SliderItem = {
  key: string;
  title: string;
  body: string;
  imagePath: string;
};

export type PageChrome = {
  footer: string;
  activityTitle: string;
  landingLinks: Array<{ slug: string; title: string; description: string }>;
};

export type LandingContent = {
  introTitle: string;
  introBody: string;
  slider: SliderItem[];
};

export type SubsidiaryContent = {
  slug: string;
  title: string;
  kicker: string;
  heroBody: string;
  slider: SliderItem[];
};

export type PortfolioGroup = {
  key: string;
  summary: string;
  slides: SliderItem[];
};

export type PortfolioContent = {
  title: string;
  welcomeText: string;
  groups: PortfolioGroup[];
};

export type ResumeContent = {
  title: string;
  body: string;
  pdfPath: string | null;
};

export type EditableFile = {
  relativePath: string;
  kind: "text" | "image" | "pdf" | "other";
  content?: string;
};

const ROOT = process.cwd();
const CONTENT_ROOT = path.join(ROOT, "content");
const PAGES_ROOT = path.join(CONTENT_ROOT, "Pages");
const SITE_ROOT = path.join(CONTENT_ROOT, "site");
const TEXT_EXTENSIONS = [".md", ".txt", ".json"];
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".svg", ".webp"];

function normalizeStem(stem: string, kind: "image" | "text") {
  const upper = stem.toUpperCase();
  if (kind === "image") {
    const match = upper.match(/^(.+?)I([A-Z]*)$/);
    return match ? `${match[1]}${match[2]}` : upper;
  }
  const integratedMatch = upper.match(/^(.+?)IT([A-Z]*)$/);
  if (integratedMatch) {
    return `${integratedMatch[1]}${integratedMatch[2]}`;
  }
  const textMatch = upper.match(/^(.+?)T([A-Z]*)$/);
  return textMatch ? `${textMatch[1]}${textMatch[2]}` : upper;
}

function titleFromKey(key: string) {
  return `Slide ${key.replace(/^\d+/, "").trim() || key}`;
}

async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function getEntries(dirPath: string) {
  try {
    return await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }
}

async function resolveNamedFile(dirPath: string, baseName: string, extensions = TEXT_EXTENSIONS) {
  for (const ext of extensions) {
    const fullPath = path.join(dirPath, `${baseName}${ext}`);
    try {
      await fs.access(fullPath);
      return fullPath;
    } catch {
      continue;
    }
  }
  return null;
}

async function resolveFirstFile(dirPath: string, matcher: (name: string) => boolean) {
  const entries = await getEntries(dirPath);
  const file = entries.find((entry) => entry.isFile() && matcher(entry.name));
  return file ? path.join(dirPath, file.name) : null;
}

async function readText(relativePath: string, fallback = "") {
  const fullPath = path.join(CONTENT_ROOT, relativePath);
  try {
    return await fs.readFile(fullPath, "utf8");
  } catch {
    return fallback;
  }
}

export function publicContentPath(relativePath: string) {
  return `/api/content-file?path=${encodeURIComponent(relativePath.replace(/\\/g, "/"))}`;
}

async function listFiles(dirPath: string, extensions: string[]) {
  const entries = await getEntries(dirPath);
  return entries
    .filter((entry) => entry.isFile() && extensions.includes(path.extname(entry.name).toLowerCase()))
    .map((entry) => path.join(dirPath, entry.name))
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
}

async function discoverSlider(imageDir: string, textDir: string) {
  const images = await listFiles(imageDir, IMAGE_EXTENSIONS);
  const texts = await listFiles(textDir, TEXT_EXTENSIONS);

  const textMap = new Map(
    texts.map((filePath) => {
      const stem = path.parse(filePath).name;
      return [normalizeStem(stem, "text"), filePath];
    })
  );

  const sliderItems = await Promise.all(
    images.map(async (imagePath) => {
      const stem = path.parse(imagePath).name;
      const key = normalizeStem(stem, "image");
      const textPath = textMap.get(key);
      const body = textPath ? await fs.readFile(textPath, "utf8") : "Add matching text content to pair with this image.";
      return {
        key,
        title: titleFromKey(key),
        body,
        imagePath: publicContentPath(path.relative(CONTENT_ROOT, imagePath))
      };
    })
  );

  if (sliderItems.length > 0) {
    return sliderItems;
  }

  return Promise.all(
    texts.map(async (textPath) => ({
      key: normalizeStem(path.parse(textPath).name, "text"),
      title: titleFromKey(normalizeStem(path.parse(textPath).name, "text")),
      body: await fs.readFile(textPath, "utf8"),
      imagePath: ""
    }))
  );
}

function sortPortfolioKey(key: string) {
  return key.toUpperCase().padEnd(8, "Z");
}

export async function seedDirectories() {
  await Promise.all([
    ensureDir(path.join(PAGES_ROOT, "Landing", "Landing Images")),
    ensureDir(path.join(PAGES_ROOT, "Landing", "Landing Text")),
    ensureDir(path.join(PAGES_ROOT, "Portfolio", "Portfolio Images A")),
    ensureDir(path.join(PAGES_ROOT, "Portfolio", "Portfolio Text A")),
    ensureDir(path.join(PAGES_ROOT, "Portfolio", "Portfolio Images B")),
    ensureDir(path.join(PAGES_ROOT, "Portfolio", "Portfolio Text B")),
    ensureDir(path.join(PAGES_ROOT, "Resume")),
    ensureDir(path.join(PAGES_ROOT, "Gyre", "Gyre Images")),
    ensureDir(path.join(PAGES_ROOT, "Gyre", "Gyre Text")),
    ensureDir(path.join(PAGES_ROOT, "Emblazon", "Emblazon Images")),
    ensureDir(path.join(PAGES_ROOT, "Emblazon", "Emblazon Text")),
    ensureDir(path.join(PAGES_ROOT, "Trillium", "Trillium Images")),
    ensureDir(path.join(PAGES_ROOT, "Trillium", "Trillium Text")),
    ensureDir(SITE_ROOT)
  ]);
}

export async function getPageChrome(): Promise<PageChrome> {
  await seedDirectories();
  const footer = await readText(path.join("site", "footer.md"), "Editable footer text lives here.");
  const activityTitle = await readText(path.join("site", "landing-activities-title.md"), "Complimentary Professional Activities");
  const linksRaw = await readText(
    path.join("site", "subsidiary-links.json"),
    JSON.stringify([
      { slug: "gyre", title: "Gyre", description: "Systems, cycles, and durable design thinking." },
      { slug: "emblazon", title: "Emblazon", description: "Maker work, identity systems, and illustrated visual craft." },
      { slug: "trillium", title: "Trillium", description: "Landscape-minded service design with grounded storytelling." }
    ], null, 2)
  );

  let landingLinks: PageChrome["landingLinks"] = [];
  try {
    const parsed = JSON.parse(linksRaw);
    if (Array.isArray(parsed)) landingLinks = parsed;
  } catch {
    landingLinks = [];
  }

  return { footer, activityTitle, landingLinks };
}

export async function getLandingContent(): Promise<LandingContent> {
  const landingRoot = path.join(PAGES_ROOT, "Landing");
  const introTitle = await readText(path.join("Pages", "Landing", "landing-title.md"), "Derek Portfolio");
  const introBody = await readText(path.join("Pages", "Landing", "landing-intro.md"), "A filesystem-backed portfolio prototype with reusable slider modules, editable content, and original page layouts inspired by the provided references.");
  const slider = await discoverSlider(path.join(landingRoot, "Landing Images"), path.join(landingRoot, "Landing Text"));
  return { introTitle, introBody, slider };
}

export async function getSubsidiaryContent(slug: "gyre" | "emblazon" | "trillium"): Promise<SubsidiaryContent> {
  const pageName = slug.charAt(0).toUpperCase() + slug.slice(1);
  const pageRoot = path.join(PAGES_ROOT, pageName);
  const title = await readText(path.join("Pages", pageName, "title.md"), pageName);
  const kicker = await readText(path.join("Pages", pageName, "kicker.md"), `${pageName} Studio Notes`);
  const heroTextFile =
    (await resolveNamedFile(pageRoot, "1IT")) ??
    (await resolveFirstFile(pageRoot, (name) => /^1IT\.(md|txt)$/i.test(name))) ??
    (await resolveNamedFile(pageRoot, "main")) ??
    null;
  const heroBody = heroTextFile ? await fs.readFile(heroTextFile, "utf8") : "Add a main text file for this page to edit the hero copy.";
  const slider = await discoverSlider(path.join(pageRoot, `${pageName} Images`), path.join(pageRoot, `${pageName} Text`));
  return { slug, title, kicker, heroBody, slider };
}

export async function getPortfolioContent(): Promise<PortfolioContent> {
  const root = path.join(PAGES_ROOT, "Portfolio");
  const entries = await getEntries(root);
  const summaryFiles = entries.filter((entry) => entry.isFile() && /^Summary Text /i.test(entry.name));
  const keys = new Set<string>();

  for (const file of summaryFiles) {
    const match = file.name.match(/^Summary Text (.+?)\.[^.]+$/i);
    if (match) keys.add(match[1].trim());
  }

  for (const entry of entries.filter((item) => item.isDirectory())) {
    const imageMatch = entry.name.match(/^Portfolio Images (.+)$/i);
    const textMatch = entry.name.match(/^Portfolio Text (.+)$/i);
    if (imageMatch) keys.add(imageMatch[1].trim());
    if (textMatch) keys.add(textMatch[1].trim());
  }

  const groups = await Promise.all(
    Array.from(keys)
      .sort((left, right) => sortPortfolioKey(left).localeCompare(sortPortfolioKey(right)))
      .map(async (key) => {
        const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const summaryFile = await resolveFirstFile(root, (name) => new RegExp(`^Summary Text ${escaped}\\.(md|txt)$`, "i").test(name));
        const summary = summaryFile ? await fs.readFile(summaryFile, "utf8") : "Add a summary text file for this portfolio group.";
        const slides = await discoverSlider(path.join(root, `Portfolio Images ${key}`), path.join(root, `Portfolio Text ${key}`));
        return { key, summary, slides };
      })
  );

  return {
    title: await readText(path.join("Pages", "Portfolio", "title.md"), "Portfolio"),
    welcomeText: await readText(path.join("Pages", "Portfolio", "welcome.md"), "Welcome to my portfolio. Each section below is file-backed, so adding another content group automatically creates a new portfolio module."),
    groups
  };
}

export async function getResumeContent(): Promise<ResumeContent> {
  const root = path.join(PAGES_ROOT, "Resume");
  const pdfFile = (await resolveNamedFile(root, "Resume", [".pdf"])) ?? (await resolveFirstFile(root, (name) => /\.pdf$/i.test(name))) ?? null;
  return {
    title: await readText(path.join("Pages", "Resume", "title.md"), "Welcome to my Resume"),
    body: await readText(path.join("Pages", "Resume", "intro.md"), "This resume module embeds the current PDF from the local content tree and keeps the download action latched to the same file."),
    pdfPath: pdfFile ? publicContentPath(path.relative(CONTENT_ROOT, pdfFile)) : null
  };
}

async function walkEditableFiles(dirPath: string, bucket: EditableFile[]) {
  const entries = await getEntries(dirPath);
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      await walkEditableFiles(fullPath, bucket);
      continue;
    }
    const relativePath = path.relative(CONTENT_ROOT, fullPath).replace(/\\/g, "/");
    const ext = path.extname(entry.name).toLowerCase();
    if (TEXT_EXTENSIONS.includes(ext)) {
      bucket.push({ relativePath, kind: "text", content: await fs.readFile(fullPath, "utf8") });
      continue;
    }
    if (IMAGE_EXTENSIONS.includes(ext)) {
      bucket.push({ relativePath, kind: "image" });
      continue;
    }
    if (ext === ".pdf") {
      bucket.push({ relativePath, kind: "pdf" });
      continue;
    }
    bucket.push({ relativePath, kind: "other" });
  }
}

export async function getEditableFiles() {
  await seedDirectories();
  const bucket: EditableFile[] = [];
  await walkEditableFiles(CONTENT_ROOT, bucket);
  return bucket.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

export function resolveContentPath(relativePath: string) {
  const normalized = relativePath.replace(/^\/+/, "");
  const resolved = path.resolve(CONTENT_ROOT, normalized);
  if (!resolved.startsWith(CONTENT_ROOT)) {
    throw new Error("Invalid content path.");
  }
  return resolved;
}
