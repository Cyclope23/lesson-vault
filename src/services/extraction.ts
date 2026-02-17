import { readFile } from "node:fs/promises";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

/**
 * Estrae testo da un file in base al mimeType.
 */
export async function extractText(
  storagePath: string,
  mimeType: string
): Promise<string> {
  console.log(`[extraction] Inizio estrazione testo da ${storagePath} (${mimeType})`);
  const buffer = await readFile(storagePath);
  let text: string;

  switch (mimeType) {
    case "text/plain":
      text = buffer.toString("utf-8");
      break;

    case "application/pdf": {
      const pdf = new PDFParse({ data: new Uint8Array(buffer) });
      const result = await pdf.getText();
      text = result.text;
      break;
    }

    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    case "application/msword": {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
      break;
    }

    default:
      throw new Error(`Tipo di file non supportato: ${mimeType}`);
  }

  console.log(`[extraction] Estrazione completata: ${text.length} caratteri`);
  return text;
}
