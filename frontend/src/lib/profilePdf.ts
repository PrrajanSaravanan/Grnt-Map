import { jsPDF } from "jspdf";
import type { UserProfile } from "@/firebase";

const MARGIN = 20;
const LINE_HEIGHT = 6;
const TITLE_SIZE = 14;
const SECTION_SIZE = 12;
const BODY_SIZE = 9;

/** Split long text into lines that fit within maxWidth. */
function wrapText(doc: jsPDF, text: string, maxWidth: number, fontSize: number): string[] {
  doc.setFontSize(fontSize);
  const lines: string[] = [];
  const parts = text.split(/\n/);
  for (const part of parts) {
    const words = part.trim().split(/\s+/);
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (doc.getTextWidth(test) <= maxWidth) {
        line = test;
      } else {
        if (line) lines.push(line);
        line = w;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

/** Check and add page break if needed, return new y. */
function checkPageBreak(doc: jsPDF, y: number, needed = 20): number {
  if (y > 270 - needed) {
    doc.addPage();
    return MARGIN + LINE_HEIGHT;
  }
  return y;
}

/** Add a section title and optional body, return new y. */
function addSection(
  doc: jsPDF,
  title: string,
  body: string | string[] | undefined,
  x: number,
  y: number,
  pageWidth: number,
  titleSize = TITLE_SIZE
): number {
  const maxWidth = pageWidth - MARGIN * 2;
  y = checkPageBreak(doc, y, 16);
  doc.setFontSize(titleSize);
  doc.setFont("helvetica", "bold");
  doc.text(title, x, y);
  let currentY = y + LINE_HEIGHT + 2;

  if (body !== undefined && body !== null) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(BODY_SIZE);
    const str = Array.isArray(body) ? body.join(", ") : String(body);
    const lines = wrapText(doc, str, maxWidth, BODY_SIZE);
    for (const line of lines) {
      currentY = checkPageBreak(doc, currentY);
      doc.text(line, x, currentY);
      currentY += LINE_HEIGHT;
    }
    currentY += 4;
  }
  return currentY;
}

/** Add a labeled row (bold label + normal value), return new y. */
function addLabeledRow(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  pageWidth: number
): number {
  y = checkPageBreak(doc, y);
  doc.setFontSize(BODY_SIZE);
  doc.setFont("helvetica", "bold");
  doc.text(`${label}:`, x, y);
  const labelWidth = doc.getTextWidth(`${label}: `);
  doc.setFont("helvetica", "normal");
  const maxWidth = pageWidth - MARGIN * 2 - labelWidth;
  const lines = wrapText(doc, value, maxWidth, BODY_SIZE);
  for (let i = 0; i < lines.length; i++) {
    if (i === 0) {
      doc.text(lines[i], x + labelWidth, y);
    } else {
      y += LINE_HEIGHT;
      y = checkPageBreak(doc, y);
      doc.text(lines[i], x + labelWidth, y);
    }
  }
  return y + LINE_HEIGHT;
}

/** Universal mock grants that apply to any organization type. */
const MOCK_GRANTS = [
  {
    title: "Community Innovation & Development Fund",
    amount: "$25,000 – $150,000",
    deadline: "Rolling (quarterly review)",
    portal: "Grants.gov",
    description: "Supports organizations working on innovative community-driven projects. Open to all sectors including education, health, environment, technology, and social services. Preference given to projects with measurable outcomes and scalable impact.",
    matchScore: 92,
  },
  {
    title: "Capacity Building & Organizational Growth Grant",
    amount: "$10,000 – $75,000",
    deadline: "2026-09-30",
    portal: "Foundation Center",
    description: "Designed to help growing organizations strengthen their internal operations, expand their team, and build sustainable infrastructure. Applicable to nonprofits, social enterprises, and community organizations regardless of focus area.",
    matchScore: 87,
  },
  {
    title: "Impact Accelerator Program",
    amount: "$50,000 – $200,000",
    deadline: "2026-11-15",
    portal: "Global Fund for Change",
    description: "A competitive grant for organizations demonstrating strong potential for social, environmental, or economic impact. Includes a 6-month mentorship program alongside funding. Open to all mission-driven organizations worldwide.",
    matchScore: 84,
  },
  {
    title: "Regional Partnership & Collaboration Grant",
    amount: "$15,000 – $100,000",
    deadline: "2026-08-01",
    portal: "National Endowment",
    description: "Encourages cross-sector collaborations between organizations in the same region. Funds joint initiatives, shared resources, and coalition-building activities. All sectors and focus areas are eligible.",
    matchScore: 79,
  },
  {
    title: "Emerging Leaders Seed Fund",
    amount: "$5,000 – $50,000",
    deadline: "Rolling (monthly review)",
    portal: "Youth & Community Foundation",
    description: "Provides seed funding for new or early-stage organizations led by emerging leaders. No restrictions on focus area — supports any mission aimed at positive community change. Ideal for organizations under 3 years old.",
    matchScore: 75,
  },
];

/** Generate a PDF from user profile and trigger download. */
export function downloadProfilePdf(profile: UserProfile, filename = "GrantWeave-Profile.pdf") {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = MARGIN + LINE_HEIGHT;

  // ─── Header ───
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("GrantWeave", MARGIN, y);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("Organization Profile & Grant Report", MARGIN, y + 6);
  doc.setTextColor(0, 0, 0);
  y += 16;

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, pageWidth - MARGIN, y);
  y += 8;

  // ─── Contact & Organization ───
  y = addSection(doc, "Contact & Organization", undefined, MARGIN, y, pageWidth);

  const contactFields: [string, string | undefined][] = [
    ["Full Name", profile.fullName],
    ["Email", profile.email],
    ["Organization", profile.organizationName],
    ["Type", profile.organizationType],
    ["Country", profile.country],
  ];

  for (const [label, value] of contactFields) {
    if (value) {
      y = addLabeledRow(doc, label, value, MARGIN + 4, y, pageWidth);
    }
  }
  y += 4;

  // ─── Mission Statement ───
  if (profile.mission) {
    y = addSection(doc, "Mission Statement", profile.mission, MARGIN, y, pageWidth);
  }

  // ─── Focus Areas ───
  if (profile.focusAreas?.length) {
    y = addSection(doc, "Focus Areas", undefined, MARGIN, y, pageWidth);
    doc.setFontSize(BODY_SIZE);
    doc.setFont("helvetica", "normal");
    for (const area of profile.focusAreas) {
      y = checkPageBreak(doc, y);
      doc.text(`•  ${area}`, MARGIN + 4, y);
      y += LINE_HEIGHT;
    }
    y += 4;
  }

  // ─── Funding Needs ───
  if (profile.fundingNeeds) {
    const fn = profile.fundingNeeds;
    y = addSection(doc, "Funding Needs", undefined, MARGIN, y, pageWidth);
    if (fn.minGrantSize != null) y = addLabeledRow(doc, "Minimum Grant Size", `$${fn.minGrantSize.toLocaleString()}`, MARGIN + 4, y, pageWidth);
    if (fn.maxGrantSize != null) y = addLabeledRow(doc, "Maximum Grant Size", `$${fn.maxGrantSize.toLocaleString()}`, MARGIN + 4, y, pageWidth);
    if (fn.timeline) y = addLabeledRow(doc, "Preferred Timeline", fn.timeline, MARGIN + 4, y, pageWidth);
    if (fn.regions?.length) y = addLabeledRow(doc, "Target Regions", fn.regions.join(", "), MARGIN + 4, y, pageWidth);
    y += 4;
  }

  // ─── Operational Context ───
  if (profile.operationalContext) {
    const oc = profile.operationalContext;
    y = addSection(doc, "Operational Context", undefined, MARGIN, y, pageWidth);
    if (oc.teamSize) y = addLabeledRow(doc, "Team Size", oc.teamSize, MARGIN + 4, y, pageWidth);
    if (oc.yearsOperating != null) y = addLabeledRow(doc, "Years Operating", String(oc.yearsOperating), MARGIN + 4, y, pageWidth);
    if (oc.previousGrantExperience) y = addLabeledRow(doc, "Grant Experience", oc.previousGrantExperience, MARGIN + 4, y, pageWidth);
    if (oc.internationalEligibility != null) y = addLabeledRow(doc, "International Eligibility", oc.internationalEligibility ? "Yes" : "No", MARGIN + 4, y, pageWidth);
    y += 4;
  }

  // ─── Document Text ───
  if (profile.pitchDocText && profile.pitchDocText !== "(No text could be extracted from this PDF.)") {
    y = addSection(doc, "Uploaded Document Text", profile.pitchDocText.slice(0, 3000), MARGIN, y, pageWidth);
  }

  // ─── Divider before Grants ───
  y = checkPageBreak(doc, y, 30);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, pageWidth - MARGIN, y);
  y += 10;

  // ─── Recommended Grants ───
  y = checkPageBreak(doc, y, 20);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Recommended Grants", MARGIN, y);
  y += 4;
  doc.setFontSize(BODY_SIZE);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("The following grants have been identified by GrantWeave as potential matches for your organization.", MARGIN, y + LINE_HEIGHT);
  doc.setTextColor(0, 0, 0);
  y += LINE_HEIGHT + 8;

  for (let i = 0; i < MOCK_GRANTS.length; i++) {
    const grant = MOCK_GRANTS[i];

    // Ensure enough space for a grant block header
    y = checkPageBreak(doc, y, 40);

    // Grant title
    doc.setFontSize(SECTION_SIZE);
    doc.setFont("helvetica", "bold");
    doc.text(`${i + 1}. ${grant.title}`, MARGIN, y);
    y += LINE_HEIGHT + 2;

    // Match score badge
    doc.setFontSize(BODY_SIZE);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(16, 185, 129);
    doc.text(`Match Score: ${grant.matchScore}%`, MARGIN + 4, y);
    doc.setTextColor(0, 0, 0);
    y += LINE_HEIGHT;

    // Grant details
    doc.setFont("helvetica", "normal");
    y = addLabeledRow(doc, "Amount", grant.amount, MARGIN + 4, y, pageWidth);
    y = addLabeledRow(doc, "Deadline", grant.deadline, MARGIN + 4, y, pageWidth);
    y = addLabeledRow(doc, "Portal", grant.portal, MARGIN + 4, y, pageWidth);

    // Description
    doc.setFontSize(BODY_SIZE);
    doc.setFont("helvetica", "normal");
    const descLines = wrapText(doc, grant.description, pageWidth - MARGIN * 2 - 4, BODY_SIZE);
    for (const line of descLines) {
      y = checkPageBreak(doc, y);
      doc.text(line, MARGIN + 4, y);
      y += LINE_HEIGHT;
    }
    y += 6;
  }

  // ─── Footer ───
  y = checkPageBreak(doc, y, 20);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, pageWidth - MARGIN, y);
  y += 6;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(120, 120, 120);
  doc.text(`Generated by GrantWeave on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, MARGIN, y);
  doc.text("This report is for informational purposes. Grant availability and eligibility may change.", MARGIN, y + 4);
  doc.setTextColor(0, 0, 0);

  doc.save(filename);
}
