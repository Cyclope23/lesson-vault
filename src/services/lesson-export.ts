import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  ShadingType,
  type IBorderOptions,
  type IShadingAttributesProperties,
} from "docx";
import {
  CONTENT_TYPE_LABELS,
  SECTION_TYPE_LABELS,
} from "@/types/lesson";
import type { LessonContent, LessonSection } from "@/types/lesson";

interface LessonExportData {
  title: string;
  description: string | null;
  contentType: string;
  content: LessonContent;
  teacher: { firstName: string; lastName: string };
  discipline: { name: string };
}

// ───── Markdown export ─────

export function lessonToMarkdown(data: LessonExportData): string {
  const lines: string[] = [];
  const { title, description, contentType, content, teacher, discipline } = data;

  lines.push(`# ${title}`, "");

  // Metadata
  lines.push(`**Docente:** ${teacher.firstName} ${teacher.lastName}`);
  lines.push(`**Disciplina:** ${discipline.name}`);
  lines.push(`**Tipo:** ${CONTENT_TYPE_LABELS[contentType] || contentType}`);
  if (content.estimatedDuration > 0) {
    lines.push(`**Durata stimata:** ${content.estimatedDuration} minuti`);
  }
  if (content.targetGrade) {
    lines.push(`**Classe:** ${content.targetGrade}`);
  }
  lines.push("");

  // Description
  if (description) {
    lines.push(`*${description}*`, "");
  }

  // Objectives
  if (content.objectives?.length) {
    lines.push("## Obiettivi", "");
    for (const obj of content.objectives) {
      lines.push(`- ${obj}`);
    }
    lines.push("");
  }

  // Prerequisites
  if (content.prerequisites?.length) {
    lines.push("## Prerequisiti", "");
    for (const pre of content.prerequisites) {
      lines.push(`- ${pre}`);
    }
    lines.push("");
  }

  lines.push("---", "");

  // Sections
  const sorted = [...content.sections].sort((a, b) => a.order - b.order);
  for (const section of sorted) {
    const typeLabel = SECTION_TYPE_LABELS[section.type] || section.type;
    lines.push(`## [${typeLabel}] ${section.title}`, "");
    lines.push(section.content, "");
  }

  // Keywords
  if (content.keywords?.length) {
    lines.push("---", "");
    lines.push(`**Parole chiave:** ${content.keywords.join(", ")}`);
    lines.push("");
  }

  return lines.join("\n");
}

// ───── DOCX export ─────

export async function lessonToDocx(
  data: LessonExportData,
): Promise<Buffer> {
  const { title, description, contentType, content, teacher, discipline } = data;
  const children: Paragraph[] = [];

  // Title
  children.push(
    new Paragraph({ text: title, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
  );
  children.push(new Paragraph({ text: "" }));

  // Metadata
  children.push(metaParagraph("Docente", `${teacher.firstName} ${teacher.lastName}`));
  children.push(metaParagraph("Disciplina", discipline.name));
  children.push(metaParagraph("Tipo", CONTENT_TYPE_LABELS[contentType] || contentType));
  if (content.estimatedDuration > 0) {
    children.push(metaParagraph("Durata stimata", `${content.estimatedDuration} minuti`));
  }
  if (content.targetGrade) {
    children.push(metaParagraph("Classe", content.targetGrade));
  }
  children.push(new Paragraph({ text: "" }));

  // Description
  if (description) {
    children.push(
      new Paragraph({ children: [new TextRun({ text: description, italics: true })] }),
    );
    children.push(new Paragraph({ text: "" }));
  }

  // Objectives
  if (content.objectives?.length) {
    children.push(new Paragraph({ text: "Obiettivi", heading: HeadingLevel.HEADING_2 }));
    for (const obj of content.objectives) {
      children.push(new Paragraph({ text: obj, bullet: { level: 0 } }));
    }
    children.push(new Paragraph({ text: "" }));
  }

  // Prerequisites
  if (content.prerequisites?.length) {
    children.push(new Paragraph({ text: "Prerequisiti", heading: HeadingLevel.HEADING_2 }));
    for (const pre of content.prerequisites) {
      children.push(new Paragraph({ text: pre, bullet: { level: 0 } }));
    }
    children.push(new Paragraph({ text: "" }));
  }

  // Sections
  const sorted = [...content.sections].sort((a, b) => a.order - b.order);
  for (const section of sorted) {
    const typeLabel = SECTION_TYPE_LABELS[section.type] || section.type;
    children.push(
      new Paragraph({
        text: `[${typeLabel}] ${section.title}`,
        heading: HeadingLevel.HEADING_2,
      }),
    );
    children.push(...markdownToDocxParagraphs(section.content));
    children.push(new Paragraph({ text: "" }));
  }

  // Keywords
  if (content.keywords?.length) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Parole chiave: ", bold: true }),
          new TextRun({ text: content.keywords.join(", ") }),
        ],
      }),
    );
  }

  const doc = new Document({
    sections: [{ children }],
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}

// ───── Helpers ─────

function metaParagraph(label: string, value: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true }),
      new TextRun({ text: value }),
    ],
  });
}

// ───── Code block styling constants ─────

const CODE_SHADING: IShadingAttributesProperties = {
  type: ShadingType.CLEAR,
  fill: "F5F5F5",
};

const CODE_BORDER_LEFT: IBorderOptions = {
  style: BorderStyle.SINGLE,
  size: 6,
  color: "CCCCCC",
  space: 4,
};

const CODE_FONT = "Courier New";
const CODE_FONT_SIZE = 20; // in half-points → 10pt

/**
 * Converts markdown text to an array of DOCX paragraphs.
 * Handles headings, bold/italic, bullet lists, numbered lists, and code blocks.
 */
function markdownToDocxParagraphs(md: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const lines = md.split("\n");
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let codeLang = "";

  for (const line of lines) {
    // Code block toggle
    if (line.trimStart().startsWith("```")) {
      if (!inCodeBlock) {
        // Opening — extract optional language
        inCodeBlock = true;
        codeLines = [];
        codeLang = line.trimStart().slice(3).trim();
      } else {
        // Closing — flush collected code lines
        inCodeBlock = false;
        paragraphs.push(...buildCodeBlock(codeLines, codeLang));
        codeLines = [];
        codeLang = "";
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Headings (### → HEADING_3, etc.)
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingLevels: Record<number, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
        1: HeadingLevel.HEADING_1,
        2: HeadingLevel.HEADING_2,
        3: HeadingLevel.HEADING_3,
        4: HeadingLevel.HEADING_4,
        5: HeadingLevel.HEADING_5,
        6: HeadingLevel.HEADING_6,
      };
      paragraphs.push(
        new Paragraph({
          text: headingMatch[2],
          heading: headingLevels[level] || HeadingLevel.HEADING_3,
        }),
      );
      continue;
    }

    // Bullet list
    const bulletMatch = line.match(/^[\s]*[-*+]\s+(.*)/);
    if (bulletMatch) {
      paragraphs.push(
        new Paragraph({
          children: parseInlineFormatting(bulletMatch[1]),
          bullet: { level: 0 },
        }),
      );
      continue;
    }

    // Numbered list
    const numberedMatch = line.match(/^[\s]*\d+\.\s+(.*)/);
    if (numberedMatch) {
      paragraphs.push(
        new Paragraph({
          children: parseInlineFormatting(numberedMatch[1]),
          bullet: { level: 0 },
        }),
      );
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      paragraphs.push(new Paragraph({ text: "" }));
      continue;
    }

    // Regular paragraph with inline formatting
    paragraphs.push(
      new Paragraph({ children: parseInlineFormatting(line) }),
    );
  }

  // Handle unclosed code block
  if (inCodeBlock && codeLines.length > 0) {
    paragraphs.push(...buildCodeBlock(codeLines, codeLang));
  }

  return paragraphs;
}

/**
 * Builds a visually styled code block: optional language label,
 * gray background, left border, monospace font, compact spacing.
 */
function buildCodeBlock(codeLines: string[], lang: string): Paragraph[] {
  const result: Paragraph[] = [];

  // Language label (e.g. "python")
  if (lang) {
    result.push(
      new Paragraph({
        children: [
          new TextRun({
            text: lang.toUpperCase(),
            bold: true,
            font: CODE_FONT,
            size: 16, // 8pt — smaller than code
            color: "888888",
          }),
        ],
        shading: { type: ShadingType.CLEAR, fill: "E8E8E8" },
        border: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
          left: CODE_BORDER_LEFT,
          right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        },
        spacing: { before: 120, after: 0 },
        indent: { left: 360 },
      }),
    );
  }

  for (let i = 0; i < codeLines.length; i++) {
    const isFirst = i === 0;
    const isLast = i === codeLines.length - 1;

    const border: Record<string, IBorderOptions> = {
      left: CODE_BORDER_LEFT,
      right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    };
    // Top border only on first line (and only if no language label)
    if (isFirst && !lang) {
      border.top = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
    }
    // Bottom border on last line
    if (isLast) {
      border.bottom = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
    }

    result.push(
      new Paragraph({
        children: [
          new TextRun({
            text: codeLines[i] || " ", // ensure empty lines still render
            font: CODE_FONT,
            size: CODE_FONT_SIZE,
          }),
        ],
        shading: CODE_SHADING,
        border,
        spacing: {
          before: isFirst && !lang ? 120 : 0,
          after: isLast ? 120 : 0,
          line: 276, // 1.15x line spacing for readability
        },
        indent: { left: 360 },
      }),
    );
  }

  return result;
}

/**
 * Parses inline markdown formatting (bold, italic, code, bold+italic) into TextRuns.
 */
function parseInlineFormatting(text: string): TextRun[] {
  const runs: TextRun[] = [];
  // Match: ***bold+italic***, **bold**, *italic*, `code`, or plain text
  const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Plain text before this match
    if (match.index > lastIndex) {
      runs.push(new TextRun({ text: text.slice(lastIndex, match.index) }));
    }

    if (match[2]) {
      // ***bold+italic***
      runs.push(new TextRun({ text: match[2], bold: true, italics: true }));
    } else if (match[3]) {
      // **bold**
      runs.push(new TextRun({ text: match[3], bold: true }));
    } else if (match[4]) {
      // *italic*
      runs.push(new TextRun({ text: match[4], italics: true }));
    } else if (match[5]) {
      // `code` — monospace with gray background
      runs.push(new TextRun({
        text: match[5],
        font: CODE_FONT,
        size: CODE_FONT_SIZE,
        shading: { type: ShadingType.CLEAR, fill: "F0F0F0", color: "auto" },
      }));
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining plain text
  if (lastIndex < text.length) {
    runs.push(new TextRun({ text: text.slice(lastIndex) }));
  }

  // If nothing was parsed, return at least one empty run
  if (runs.length === 0) {
    runs.push(new TextRun({ text }));
  }

  return runs;
}

export function sanitizeFileName(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-zA-Z0-9\s-]/g, "") // remove special chars
    .trim()
    .replace(/\s+/g, "-") // spaces → hyphens
    .toLowerCase()
    .slice(0, 80);
}
