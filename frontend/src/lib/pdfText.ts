import * as pdfjsLib from "pdfjs-dist";

const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10MB

let workerInitialized = false;
function ensureWorker() {
  if (workerInitialized) return;
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  workerInitialized = true;
}

/**
 * Extract text from a PDF file. Rejects if not PDF or > 10MB.
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  if (file.type !== "application/pdf") throw new Error("Please upload a PDF file.");
  if (file.size > MAX_PDF_BYTES) throw new Error("File must be 10MB or smaller.");

  ensureWorker();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;
  const parts: string[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (text) parts.push(text);
  }

  return parts.join("\n\n").trim() || "(No text could be extracted from this PDF.)";
}

const FOCUS_KEYWORDS: [string, string[]][] = [
  ["Climate Action", ["climate", "environment", "sustainability", "green"]],
  ["Youth Education", ["youth", "education", "students", "school"]],
  ["Public Health", ["health", "medical", "wellness"]],
  ["Technology", ["technology", "tech", "digital", "software"]],
  ["Arts & Culture", ["arts", "culture", "creative"]],
  ["Social Justice", ["justice", "equity", "rights", "advocacy"]],
  ["Community Dev", ["community", "local", "development"]],
  ["Research", ["research", "study", "science"]],
];

/** Infer focus areas from extracted PDF text (keyword match). */
export function inferFocusAreasFromText(text: string): string[] {
  const lower = text.toLowerCase();
  const matched: string[] = [];
  for (const [area, keywords] of FOCUS_KEYWORDS) {
    if (keywords.some((k) => lower.includes(k))) matched.push(area);
  }
  return matched.length > 0 ? matched : ["Climate Action", "Youth Education", "Community Dev"];
}

/** Section headers we look for in PDF text (order matters for splitting). */
const SECTION_HEADERS = [
  "Contact & organization",
  "Contact",
  "Mission",
  "Focus areas",
  "Funding needs",
  "Operational context",
  "Document text (from PDF)",
  "Document text",
];

export interface ParsedPdfSections {
  mission: string;
  focusAreas: string[];
  fundingText: string;
  operationalText: string;
  documentText: string;
  contactText: string;
}

/**
 * Parse full PDF text into sections by looking for known headers.
 * Used to fill mission, focus areas, etc. separately instead of one block.
 */
export function parsePdfSections(fullText: string): ParsedPdfSections {
  const result: ParsedPdfSections = {
    mission: "",
    focusAreas: [],
    fundingText: "",
    operationalText: "",
    documentText: "",
    contactText: "",
  };
  const lower = fullText.toLowerCase();
  const sections: { name: string; start: number }[] = [];
  for (const header of SECTION_HEADERS) {
    const idx = lower.indexOf(header.toLowerCase());
    if (idx !== -1) sections.push({ name: header, start: idx });
  }
  sections.sort((a, b) => a.start - b.start);

  for (let i = 0; i < sections.length; i++) {
    const start = sections[i].start;
    const end = i + 1 < sections.length ? sections[i + 1].start : fullText.length;
    const headerLen = sections[i].name.length;
    let content = fullText.slice(start + headerLen, end).replace(/\s+/g, " ").trim();
    const name = sections[i].name.toLowerCase();
    if (name.includes("contact")) result.contactText = content;
    else if (name.includes("mission")) result.mission = content;
    else if (name.includes("focus")) {
      result.focusAreas = parseFocusAreasFromContent(content);
    } else if (name.includes("funding")) result.fundingText = content;
    else if (name.includes("operational")) result.operationalText = content;
    else if (name.includes("document")) result.documentText = content;
  }

  if (!result.mission && fullText.length > 0) {
    const firstBlock = fullText.replace(/\s+/g, " ").trim().slice(0, 1500);
    result.mission = firstBlock;
  }
  if (result.focusAreas.length === 0) {
    result.focusAreas = inferFocusAreasFromText(fullText);
  }
  return result;
}

/** Parse "Focus areas" section content: comma/semicolon/newline/bullet separated, normalized and deduped. */
function parseFocusAreasFromContent(content: string): string[] {
  if (!content || !content.trim()) return [];
  const raw = content
    .split(/[,;\n]|\s+and\s+|[•\-*]\s*/)
    .map((s) => s.trim().replace(/^["']|["']$/g, ""))
    .filter((s) => s.length > 0);
  const seen = new Set<string>();
  return raw.filter((s) => {
    const key = s.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Parse funding numbers from a string like "Min: $50,000 • Max: $150,000". Only treats numbers >= 1000 or after $ as grant amounts. */
export function parseFundingFromText(text: string): { minGrant: string; maxGrant: string; timeline: string; regions: string[] } {
  const result = { minGrant: "50000", maxGrant: "150000", timeline: "Short Term (3-6 months)", regions: ["United States"] as string[] };
  const lower = text.toLowerCase();
  const grantLikeNumbers = (text.match(/\$\s*[\d,]+|(?:min|max)[:\s]*\$?\s*[\d,]+/gi) || [])
    .map((s) => parseInt(s.replace(/[^\d]/g, ""), 10))
    .filter((n) => n >= 1000);
  const allBigNumbers = (text.match(/\d{1,3}(?:,\d{3})+/g) || []).map((s) => parseInt(s.replace(/,/g, ""), 10)).filter((n) => n >= 1000);
  const numbers = grantLikeNumbers.length >= 2 ? grantLikeNumbers : allBigNumbers.length >= 2 ? allBigNumbers : [];
  if (numbers.length >= 2) {
    const sorted = [...numbers].sort((a, b) => a - b);
    result.minGrant = String(sorted[0]);
    result.maxGrant = String(sorted[sorted.length - 1]);
  } else if (numbers.length === 1) {
    result.minGrant = String(numbers[0]);
    result.maxGrant = String(numbers[0]);
  }
  if (lower.includes("immediate") || lower.includes("1-2 months")) result.timeline = "Immediate (1-2 months)";
  else if (lower.includes("long term") || lower.includes("6-12 months")) result.timeline = "Long Term (6-12 months)";
  const regionsMatch = text.match(/regions?[:\s]+([^.•\n]+)/i);
  if (regionsMatch) {
    result.regions = regionsMatch[1]
      .split(/[,;]| and /)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (result.regions.length === 0) result.regions = ["United States"];
  return result;
}

export interface ParsedOperational {
  teamSize: string;
  yearsOperating: number;
  previousGrantExperience: string;
  internationalEligibility: boolean;
}

/** Parse operational context from a string like "Team: 6-20 Employees • Years: 4 • ...". */
export function parseOperationalFromText(text: string): ParsedOperational {
  const result: ParsedOperational = {
    teamSize: "6-20 Employees",
    yearsOperating: 4,
    previousGrantExperience: "Some (1-3 grants)",
    internationalEligibility: true,
  };
  const lower = text.toLowerCase();
  const teamMatch = text.match(/(?:team|size)[:\s]*([^.•\n]+)/i);
  if (teamMatch) result.teamSize = teamMatch[1].trim();
  const yearsMatch = text.match(/(?:years?)[:\s]*(\d+)/i);
  if (yearsMatch) result.yearsOperating = Math.max(0, parseInt(yearsMatch[1], 10) || 0);
  if (lower.includes("none") && lower.includes("grant experience")) result.previousGrantExperience = "None";
  else if (lower.includes("experienced") || lower.includes("4+")) result.previousGrantExperience = "Experienced (4+)";
  if (lower.includes("international") && (lower.includes("no") || lower.includes("false"))) result.internationalEligibility = false;
  return result;
}

export interface ParsedContact {
  fullName: string;
  email: string;
  organizationName: string;
  organizationType: string;
  country: string;
}

/** Parse contact section from text like "Full name: Nikee | Email: nikee@gmail.com | Organization: Nikee Limited | Type: Nonprofit | Country: INDIA". */
export function parseContactFromText(text: string): Partial<ParsedContact> {
  const result: Partial<ParsedContact> = {};
  const pairs = text.split(/\s*\|\s*/).map((s) => s.trim());
  for (const pair of pairs) {
    const match = pair.match(/^(full\s*name|email|organization|type|country)[:\s]+(.+)$/i);
    if (match) {
      const key = match[1].toLowerCase();
      const value = match[2].trim();
      if (key.includes("full") || key.includes("name")) result.fullName = value;
      else if (key.includes("email")) result.email = value;
      else if (key.includes("organization")) result.organizationName = value;
      else if (key.includes("type")) result.organizationType = value;
      else if (key.includes("country")) result.country = value;
    }
  }
  return result;
}
