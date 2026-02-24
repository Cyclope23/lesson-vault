export const CONTENT_TYPE_LABELS: Record<string, string> = {
  LEZIONE: "Lezione",
  VERIFICA_SCRITTA: "Verifica scritta",
  ESERCIZIO_RISPOSTA_MULTIPLA: "Esercizio (risposta multipla)",
  ESERCIZIO_RISPOSTA_APERTA: "Esercizio (risposta aperta)",
  ESERCITAZIONE_LABORATORIO: "Esercitazione di laboratorio",
  COMPITO_IN_CLASSE: "Compito in classe",
  APPROFONDIMENTO: "Approfondimento",
  ESERCIZIO_GUIDATO: "Esercizio guidato",
  MAPPA_CONCETTUALE: "Mappa concettuale",
};

export const CONTENT_TYPES = [
  "LEZIONE",
  "VERIFICA_SCRITTA",
  "ESERCIZIO_RISPOSTA_MULTIPLA",
  "ESERCIZIO_RISPOSTA_APERTA",
  "ESERCITAZIONE_LABORATORIO",
  "COMPITO_IN_CLASSE",
  "APPROFONDIMENTO",
  "ESERCIZIO_GUIDATO",
  "MAPPA_CONCETTUALE",
] as const;

export interface MindMapNode {
  id: string;
  label: string;
  description?: string;
  explanation?: string;  // rich markdown: spiegazione dettagliata con esempi
  color?: string;
  children?: MindMapNode[];
}

export interface MindMapData {
  root: MindMapNode;
  crossLinks?: { fromId: string; toId: string; label: string }[];
}

export interface LessonContent {
  sections: LessonSection[];
  objectives: string[];
  prerequisites: string[];
  estimatedDuration: number;
  targetGrade: string;
  keywords: string[];
  mindMap?: MindMapData;
}

export const SECTION_TYPE_LABELS: Record<string, string> = {
  introduction: "Introduzione",
  explanation: "Spiegazione",
  example: "Esempio",
  exercise: "Esercizio",
  summary: "Riepilogo",
  deepening: "Approfondimento",
};

export interface LessonSection {
  id: string;
  type: "introduction" | "explanation" | "example" | "exercise" | "summary" | "deepening";
  title: string;
  content: string;
  order: number;
}
