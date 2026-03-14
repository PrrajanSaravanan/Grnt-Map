import { jsPDF } from "jspdf";
import type { UserProfile } from "@/firebase";

const MARGIN = 20;
const LINE_HEIGHT = 6;
const TITLE_SIZE = 14;
const LABEL_SIZE = 10;
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

/** Add a section title and optional body, return new y. */
function addSection(
  doc: jsPDF,
  title: string,
  body: string | string[] | undefined,
  x: number,
  y: number,
  pageWidth: number
): number {
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

/** Generate a PDF from user profile and trigger download. */
export function downloadProfilePdf(profile: UserProfile, filename = "GrantWeave-Profile.pdf") {
  const doc = new jsPDF();
  const pageWidth = doc.getInternalPageSize().width;
  let y = MARGIN + LINE_HEIGHT;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("GrantWeave – Organization Profile", MARGIN, y);
  y += LINE_HEIGHT + 8;

  y = addSection(doc, "Contact & organization", undefined, MARGIN, y, pageWidth);
  doc.setFontSize(BODY_SIZE);
  doc.setFont("helvetica", "normal");
  const contact = [
    profile.fullName && `Full name: ${profile.fullName}`,
    profile.email && `Email: ${profile.email}`,
    profile.organizationName && `Organization: ${profile.organizationName}`,
    profile.organizationType && `Type: ${profile.organizationType}`,
    profile.country && `Country: ${profile.country}`,
  ]
    .filter(Boolean)
    .join("  |  ");
  const contactLines = wrapText(doc, contact, pageWidth - MARGIN * 2, BODY_SIZE);
  for (const line of contactLines) {
    if (y > 270) {
      doc.addPage();
      y = MARGIN + LINE_HEIGHT;
    }
    doc.text(line, MARGIN, y);
    y += LINE_HEIGHT;
  }
  y += 8;

  if (profile.mission) {
    y = addSection(doc, "Mission", profile.mission, MARGIN, y, pageWidth);
  }
  if (profile.focusAreas?.length) {
    y = addSection(doc, "Focus areas", profile.focusAreas, MARGIN, y, pageWidth);
  }
  if (profile.fundingNeeds) {
    const fn = profile.fundingNeeds;
    const str = [
      fn.minGrantSize != null && `Min: $${fn.minGrantSize.toLocaleString()}`,
      fn.maxGrantSize != null && `Max: $${fn.maxGrantSize.toLocaleString()}`,
      fn.timeline && `Timeline: ${fn.timeline}`,
      fn.regions?.length && `Regions: ${fn.regions.join(", ")}`,
    ]
      .filter(Boolean)
      .join("  •  ");
    y = addSection(doc, "Funding needs", str, MARGIN, y, pageWidth);
  }
  if (profile.operationalContext) {
    const oc = profile.operationalContext;
    const str = [
      oc.teamSize && `Team: ${oc.teamSize}`,
      oc.yearsOperating != null && `Years operating: ${oc.yearsOperating}`,
      oc.previousGrantExperience && `Grant experience: ${oc.previousGrantExperience}`,
      oc.internationalEligibility != null && `International: ${oc.internationalEligibility ? "Yes" : "No"}`,
    ]
      .filter(Boolean)
      .join("  •  ");
    y = addSection(doc, "Operational context", str, MARGIN, y, pageWidth);
  }
  if (profile.pitchDocText && profile.pitchDocText !== "(No text could be extracted from this PDF.)") {
    y = addSection(doc, "Document text (from PDF)", profile.pitchDocText.slice(0, 3000), MARGIN, y, pageWidth);
  }

  doc.save(filename);
}
