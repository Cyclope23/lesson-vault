export const CONTENT_TYPE_LABELS: Record<string, string> = {
  LEZIONE: "Lezione",
  VERIFICA_SCRITTA: "Verifica scritta",
  ESERCIZIO_RISPOSTA_MULTIPLA: "Esercizio (risposta multipla)",
  ESERCIZIO_RISPOSTA_APERTA: "Esercizio (risposta aperta)",
  ESERCITAZIONE_LABORATORIO: "Esercitazione di laboratorio",
  COMPITO_IN_CLASSE: "Compito in classe",
  APPROFONDIMENTO: "Approfondimento",
};

export const CONTENT_TYPES = [
  "LEZIONE",
  "VERIFICA_SCRITTA",
  "ESERCIZIO_RISPOSTA_MULTIPLA",
  "ESERCIZIO_RISPOSTA_APERTA",
  "ESERCITAZIONE_LABORATORIO",
  "COMPITO_IN_CLASSE",
  "APPROFONDIMENTO",
] as const;

export interface LessonContent {
  sections: LessonSection[];
  objectives: string[];
  prerequisites: string[];
  estimatedDuration: number;
  targetGrade: string;
  keywords: string[];
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
