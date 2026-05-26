import { nanoid } from "nanoid";

const CAPTCHA_TTL = 5 * 60 * 1000;
const CAPTCHA_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
const CAPTCHA_LENGTH = 8;

interface CaptchaEntry {
  answer: string;
  expires: number;
}

interface CaptchaStore {
  [key: string]: CaptchaEntry;
}

const globalForCaptcha = globalThis as unknown as { captchaStore: CaptchaStore };

function getStore(): CaptchaStore {
  if (!globalForCaptcha.captchaStore) {
    globalForCaptcha.captchaStore = {};
  }
  return globalForCaptcha.captchaStore;
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const bgColors = ["#f8fafc", "#f1f5f9", "#eef2ff", "#f0fdf4", "#fef2f2", "#fff7ed", "#faf5ff"];
const textColors = ["#1e293b", "#334155", "#0f172a", "#1e3a5f", "#3b0764", "#14532d", "#7c2d12"];

function generateCaptchaSvg(text: string): string {
  const w = 280;
  const h = 70;
  const chars = text.split("");

  // Background stripes
  let bg = `<rect width="${w}" height="${h}" fill="${pick(bgColors)}" rx="8"/>`;
  bg += `<pattern id="stripes" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(${rand(0, 45)})">
    <line x1="0" y1="0" x2="0" y2="6" stroke="#e2e8f0" stroke-width="1" opacity="0.5"/>
  </pattern>
  <rect width="${w}" height="${h}" fill="url(#stripes)" rx="8"/>`;

  // Noise lines (3-5 lines crossing the text)
  let lines = "";
  const lineCount = Math.floor(rand(3, 6));
  for (let i = 0; i < lineCount; i++) {
    const x1 = rand(0, w);
    const y1 = rand(0, h);
    const x2 = rand(0, w);
    const y2 = rand(0, h);
    const color = pick(["#94a3b8", "#cbd5e1", "#93c5fd", "#fca5a5", "#86efac", "#c4b5fd"]);
    lines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${rand(1, 2.5)}" opacity="${rand(0.3, 0.6)}" stroke-linecap="round"/>`;
  }

  // Noise dots
  let dots = "";
  const dotCount = Math.floor(rand(30, 60));
  for (let i = 0; i < dotCount; i++) {
    const dx = rand(2, w - 2);
    const dy = rand(2, h - 2);
    const r = rand(1, 3);
    const color = pick(["#64748b", "#94a3b8", "#818cf8", "#f472b6", "#34d399"]);
    dots += `<circle cx="${dx}" cy="${dy}" r="${r}" fill="${color}" opacity="${rand(0.2, 0.5)}"/>`;
  }

  // Characters
  let texts = "";
  const charWidth = 280 / chars.length;
  const fontSizes = pick([[36, 44], [32, 40], [34, 42], [30, 38]]);

  chars.forEach((char, i) => {
    const x = charWidth * i + charWidth / 2 + rand(-4, 4);
    const y = rand(44, 58);
    const angle = rand(-25, 25);
    const fontSize = rand(fontSizes[0], fontSizes[1]);
    const color = pick(textColors);
    const fontWeight = pick(["bold", "normal"]);

    texts += `<text x="${x}" y="${y}" transform="rotate(${angle} ${x} ${y})" fill="${color}" font-size="${fontSize}" font-family="monospace" font-weight="${fontWeight}" text-anchor="middle" dominant-baseline="middle">${char}</text>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">
    ${bg}
    ${lines}
    ${dots}
    ${texts}
  </svg>`;
}

export function generateCaptcha(): { id: string; svg: string } {
  let text = "";
  for (let i = 0; i < CAPTCHA_LENGTH; i++) {
    text += CAPTCHA_CHARS.charAt(Math.floor(Math.random() * CAPTCHA_CHARS.length));
  }
  const id = nanoid(16);
  const store = getStore();
  store[id] = { answer: text, expires: Date.now() + CAPTCHA_TTL };
  const svg = generateCaptchaSvg(text);
  return { id, svg };
}

export async function verifyCaptcha(id: string, answer: string): Promise<boolean> {
  const store = getStore();
  const entry = store[id];
  if (!entry) return false;
  delete store[id];
  if (Date.now() > entry.expires) return false;
  return answer === entry.answer;
}
