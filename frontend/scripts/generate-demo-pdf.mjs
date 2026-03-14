/**
 * Run from frontend folder: node scripts/generate-demo-pdf.mjs
 * Writes public/demo-profile.pdf with demo profile data.
 */
import { jsPDF } from "jspdf";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, "..", "public", "demo-profile.pdf");

const MARGIN = 20;
const LINE_HEIGHT = 6;
const TITLE_SIZE = 14;
const BODY_SIZE = 9;

function wrapText(doc, text, maxWidth, fontSize) {
  doc.setFontSize(fontSize);
  const lines = [];
  const parts = text.split(/\n/);
  for (const part of parts) {
    const words = part.trim().split(/\s+/);
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (doc.getTextWidth(test) <= maxWidth) line = test;
      else {
        if (line) lines.push(line);
        line = w;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

function addSection(doc, title, body, x, y, pageWidth) {
  const maxWidth = pageWidth - MARGIN * 2;
  doc.setFontSize(TITLE_SIZE);
  doc.setFont("helvetica", "bold");
  doc.text(title, x, y);
  let currentY = y + LINE_HEIGHT + 2;
  if (body !== undefined && body !== null) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(BODY_SIZE);
    const str = Array.isArray(body) ? body.join(", ") : String(body);
    const lines = wrapText(doc, str, maxWidth, BODY_SIZE);
    for (const line of lines) {
      if (currentY > 270) {
        doc.addPage();
        currentY = MARGIN + LINE_HEIGHT;
      }
      doc.text(line, x, currentY);
      currentY += LINE_HEIGHT;
    }
    currentY += 4;
  }
  return currentY;
}

const DEMO_PROFILE = {
  fullName: "Nikee",
  email: "nikee@gmail.com",
  organizationName: "Nikee Limited",
  organizationType: "Nonprofit",
  country: "INDIA",
  mission:
    "To empower underrepresented youth through climate education and sustainable community projects in urban areas.",
  focusAreas: ["Climate Action", "Youth Education", "Community Dev"],
  fundingNeeds: {
    minGrantSize: 50000,
    maxGrantSize: 150000,
    timeline: "Short Term (3-6 months)",
    regions: ["United States"],
  },
  operationalContext: {
    teamSize: "6-20 Employees",
    yearsOperating: 4,
    previousGrantExperience: "Some (1-3 grants)",
    internationalEligibility: true,
  },
  pitchDocText:
    "EcoYouth Nonprofit – Organization Overview. Mission: To empower underrepresented youth through climate education and sustainable community projects. Programs: Youth Climate Leaders Fellowship, Urban Garden Initiative, Community Resilience Workshops. Eligibility: 501(c)(3) tax-exempt. Contact: contact@ecoyouth.example.org",
};

const doc = new jsPDF();
const pageWidth = typeof doc.getInternalPageSize === "function" ? doc.getInternalPageSize().width : 210;
let y = MARGIN + LINE_HEIGHT;

doc.setFontSize(16);
doc.setFont("helvetica", "bold");
doc.text("GrantWeave – Demo Organization Profile", MARGIN, y);
y += LINE_HEIGHT + 8;

doc.setFontSize(TITLE_SIZE);
doc.setFont("helvetica", "bold");
doc.text("Contact & organization", MARGIN, y);
y += LINE_HEIGHT + 2;
doc.setFont("helvetica", "normal");
doc.setFontSize(BODY_SIZE);
// Parser expects pipe-separated pairs: "Full name: X | Email: Y | Organization: Z | Type: T | Country: C"
const contact = [
  `Full name: ${DEMO_PROFILE.fullName}`,
  `Email: ${DEMO_PROFILE.email}`,
  `Organization: ${DEMO_PROFILE.organizationName}`,
  `Type: ${DEMO_PROFILE.organizationType}`,
  `Country: ${DEMO_PROFILE.country}`,
].join(" | ");
wrapText(doc, contact, pageWidth - MARGIN * 2, BODY_SIZE).forEach((line) => {
  doc.text(line, MARGIN, y);
  y += LINE_HEIGHT;
});
y += 8;

y = addSection(doc, "Mission", DEMO_PROFILE.mission, MARGIN, y, pageWidth);
y = addSection(doc, "Focus areas", DEMO_PROFILE.focusAreas, MARGIN, y, pageWidth);
const fn = DEMO_PROFILE.fundingNeeds;
y = addSection(
  doc,
  "Funding needs",
  `Min: $${fn.minGrantSize.toLocaleString()}  •  Max: $${fn.maxGrantSize.toLocaleString()}  •  ${fn.timeline}  •  Regions: ${fn.regions.join(", ")}`,
  MARGIN,
  y,
  pageWidth
);
const oc = DEMO_PROFILE.operationalContext;
y = addSection(
  doc,
  "Operational context",
  `Team: ${oc.teamSize}  •  Years: ${oc.yearsOperating}  •  Grant experience: ${oc.previousGrantExperience}  •  International: ${oc.internationalEligibility ? "Yes" : "No"}`,
  MARGIN,
  y,
  pageWidth
);
y = addSection(doc, "Document text (from PDF)", DEMO_PROFILE.pitchDocText, MARGIN, y, pageWidth);

const buffer = Buffer.from(doc.output("arraybuffer"));
fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, buffer);
console.log("Written:", OUT_PATH);
