import { prisma } from "@/lib/prisma";
import { createClaudeClient } from "@/lib/claude";
import { createGeminiClient } from "@/lib/gemini";
import { resolveAiProvider } from "@/lib/ai-provider";
import { checkGeminiRateLimit, logAiUsage } from "@/lib/rate-limit";
import type Anthropic from "@anthropic-ai/sdk";
import type { ContentType } from "@/generated/prisma/client";
import type { LessonContent } from "@/types/lesson";

const MAX_TOKENS = 16384;
const MAX_CONTINUATIONS = 2;

interface GenerateContentParams {
  topicId?: string;
  title: string;
  description?: string;
  contentType: ContentType;
  disciplineId: string;
  userId: string;
  documentId?: string;
  className?: string;
}

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  LEZIONE: "Lezione",
  VERIFICA_SCRITTA: "Verifica scritta",
  ESERCIZIO_RISPOSTA_MULTIPLA: "Esercizio (risposta multipla)",
  ESERCIZIO_RISPOSTA_APERTA: "Esercizio (risposta aperta)",
  ESERCITAZIONE_LABORATORIO: "Esercitazione di laboratorio",
  COMPITO_IN_CLASSE: "Compito in classe",
  APPROFONDIMENTO: "Approfondimento",
};

function buildPrompt(params: {
  contentType: ContentType;
  title: string;
  description?: string;
  disciplineName: string;
  moduleContext?: string;
  documentContext?: string;
}): string {
  const { contentType, title, description, disciplineName, moduleContext, documentContext } = params;
  const typeLabel = CONTENT_TYPE_LABELS[contentType];

  let context = `Sei un esperto docente italiano di ${disciplineName}. Genera un contenuto di tipo "${typeLabel}" sull'argomento: "${title}".`;

  if (description) {
    context += `\n\nDescrizione/istruzioni aggiuntive: ${description}`;
  }

  if (moduleContext) {
    context += `\n\nContesto del modulo: ${moduleContext}`;
  }

  if (documentContext) {
    context += `\n\nDocumento di riferimento (usa come base per il contenuto):\n${documentContext.slice(0, 8000)}`;
  }

  const sectionGuidance = getSectionGuidance(contentType);

  context += `\n\n${sectionGuidance}

Rispondi SOLO con un JSON valido nel seguente formato, senza markdown o altro testo:
{
  "sections": [
    {
      "id": "stringa-unica",
      "type": "introduction|explanation|example|exercise|summary|deepening",
      "title": "Titolo sezione",
      "content": "Contenuto della sezione in markdown",
      "order": 0
    }
  ],
  "objectives": ["Obiettivo 1", "Obiettivo 2"],
  "prerequisites": ["Prerequisito 1"],
  "estimatedDuration": 60,
  "targetGrade": "Classe target (es. 3a superiore)",
  "keywords": ["parola1", "parola2"]
}

Regole:
- Rispondi SOLO con JSON puro, senza code fences o altro testo
- Contenuto sezioni in markdown
- Id sezione unico in kebab-case (es. "intro-1", "exercise-2")
- Ordine sezioni da 0
- estimatedDuration in minuti
- Contenuto adatto a un contesto scolastico italiano
- Sii completo ma conciso: evita ripetizioni e frasi di riempimento, vai dritto ai concetti`;

  return context;
}

function getSectionGuidance(contentType: ContentType): string {
  switch (contentType) {
    case "LEZIONE":
      return `Struttura la lezione con le seguenti sezioni:
- introduction: introduzione all'argomento
- explanation: spiegazione dettagliata dei concetti chiave (puoi usare più sezioni explanation)
- example: esempi pratici
- exercise: esercizi per verificare la comprensione
- summary: riepilogo dei punti principali`;

    case "VERIFICA_SCRITTA":
      return `Struttura la verifica scritta con:
- introduction: intestazione con istruzioni per lo studente, tempo a disposizione, punteggio
- exercise: domande/esercizi della verifica (usa più sezioni exercise, numerate)
- summary: griglia di valutazione e soluzioni`;

    case "ESERCIZIO_RISPOSTA_MULTIPLA":
      return `Struttura l'esercizio a risposta multipla con:
- introduction: istruzioni per lo studente
- exercise: domande con 4 opzioni di risposta ciascuna (usa più sezioni exercise). Indica la risposta corretta tra le opzioni.
- summary: soluzioni con spiegazioni`;

    case "ESERCIZIO_RISPOSTA_APERTA":
      return `Struttura l'esercizio a risposta aperta con:
- introduction: istruzioni per lo studente
- exercise: domande aperte con spazio per la risposta (usa più sezioni exercise)
- summary: tracce di risposta e criteri di valutazione`;

    case "ESERCITAZIONE_LABORATORIO":
      return `Struttura l'esercitazione di laboratorio con:
- introduction: obiettivi dell'esercitazione e materiali necessari
- explanation: fondamenti teorici
- exercise: procedura step-by-step dell'esercitazione
- summary: domande di riflessione e relazione finale`;

    case "COMPITO_IN_CLASSE":
      return `Struttura il compito in classe con:
- introduction: intestazione con istruzioni, tempo, punteggio per esercizio
- exercise: esercizi/problemi del compito (usa più sezioni exercise, con difficoltà crescente)
- summary: griglia di valutazione e soluzioni`;

    case "APPROFONDIMENTO":
      return `Struttura l'approfondimento con:
- introduction: contesto e motivazione dell'approfondimento
- explanation: trattazione approfondita dell'argomento
- deepening: aspetti avanzati, collegamenti interdisciplinari
- example: casi studio o esempi concreti
- summary: conclusioni e spunti per ulteriori ricerche`;
  }
}

function extractText(response: Anthropic.Message): string {
  const block = response.content.find((c) => c.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("Risposta AI senza contenuto testuale");
  }
  return block.text;
}

function parseContent(raw: string): LessonContent {
  let text = raw.trim();
  // Strip markdown code fences if present
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }
  return JSON.parse(text);
}

const EMPTY_CONTENT: LessonContent = {
  sections: [],
  objectives: [],
  prerequisites: [],
  estimatedDuration: 0,
  targetGrade: "",
  keywords: [],
};

/**
 * Creates a lesson in GENERATING status with empty content.
 * If topicId is provided, sets topic to GENERATING.
 */
export async function createPendingLesson(params: GenerateContentParams): Promise<string> {
  const { topicId, title, description, contentType, disciplineId, userId, documentId, className } = params;

  const lesson = await prisma.lesson.create({
    data: {
      title,
      description: description || null,
      className: className || null,
      contentType,
      content: EMPTY_CONTENT as any,
      status: "GENERATING",
      visibility: "PRIVATE",
      approvalStatus: "NONE",
      teacherId: userId,
      disciplineId,
      documentId: documentId || null,
    },
  });

  if (topicId) {
    await prisma.topic.update({
      where: { id: topicId },
      data: { status: "GENERATING", lessonId: lesson.id },
    });
  }

  return lesson.id;
}

/**
 * Runs the actual AI generation and updates the lesson with content.
 * On success: lesson -> DRAFT, topic -> GENERATED.
 * On failure: lesson -> FAILED with failureReason, topic -> FAILED.
 */
export async function runGeneration(lessonId: string, params: GenerateContentParams): Promise<void> {
  const { topicId, title, description, contentType, disciplineId, userId, documentId } = params;

  console.log(`[generation] Avvio generazione "${title}" (tipo: ${contentType})`);

  const discipline = await prisma.discipline.findUnique({
    where: { id: disciplineId },
    select: { name: true },
  });
  if (!discipline) {
    await markFailed(lessonId, topicId, "Disciplina non trovata");
    return;
  }

  console.log(`[generation] Disciplina: ${discipline.name}${topicId ? `, topicId: ${topicId}` : ", generazione diretta"}`);

  // Get module context if generating from a topic
  let moduleContext: string | undefined;
  if (topicId) {
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        module: {
          include: {
            program: { select: { title: true, rawContent: true } },
            topics: { select: { title: true }, orderBy: { order: "asc" } },
          },
        },
      },
    });
    if (topic) {
      const otherTopics = topic.module.topics.map((t) => t.title).join(", ");
      moduleContext = `Programma: "${topic.module.program.title}", Modulo: "${topic.module.name}", Argomenti del modulo: ${otherTopics}`;
    }
  }

  // Get document context if provided
  let documentContext: string | undefined;
  if (documentId) {
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      select: { extractedText: true },
    });
    if (doc?.extractedText) {
      documentContext = doc.extractedText;
    }
  }

  try {
    // Resolve which AI provider to use
    const provider = await resolveAiProvider(userId);
    console.log(`[generation] Provider AI: ${provider}`);

    const prompt = buildPrompt({
      contentType,
      title,
      description,
      disciplineName: discipline.name,
      moduleContext,
      documentContext,
    });

    let assembled: string;
    let modelUsed: string;

    if (provider === "claude") {
      // --- Claude path (existing logic) ---
      console.log(`[generation] Creazione client Claude...`);
      const claude = await createClaudeClient(userId);

      console.log(`[generation] Invio richiesta a Claude AI (max_tokens: ${MAX_TOKENS})...`);
      let totalIn = 0;
      let totalOut = 0;
      const messages: Anthropic.MessageParam[] = [{ role: "user", content: prompt }];

      let response = await claude.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: MAX_TOKENS,
        messages,
      });
      totalIn += response.usage.input_tokens;
      totalOut += response.usage.output_tokens;

      assembled = extractText(response);
      console.log(`[generation] Risposta ricevuta (stop: ${response.stop_reason}, ${response.usage.input_tokens} in / ${response.usage.output_tokens} out)`);

      // Continue if truncated
      for (let i = 0; i < MAX_CONTINUATIONS && response.stop_reason === "max_tokens"; i++) {
        console.log(`[generation] Risposta troncata, continuazione ${i + 1}/${MAX_CONTINUATIONS}...`);
        messages.push({ role: "assistant", content: assembled });
        messages.push({ role: "user", content: "Continua esattamente da dove ti sei fermato. Scrivi SOLO il resto del JSON, senza ripetere ciò che hai già scritto." });

        response = await claude.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: MAX_TOKENS,
          messages,
        });
        totalIn += response.usage.input_tokens;
        totalOut += response.usage.output_tokens;

        const continuation = extractText(response);
        assembled += continuation;
        console.log(`[generation] Continuazione ricevuta (stop: ${response.stop_reason}, ${response.usage.input_tokens} in / ${response.usage.output_tokens} out)`);
      }

      if (response.stop_reason === "max_tokens") {
        throw new Error("La risposta AI è troppo lunga anche dopo le continuazioni. Riprova con un argomento più specifico.");
      }

      modelUsed = response.model;
      console.log(`[generation] Totale token: ${totalIn} in / ${totalOut} out`);
    } else {
      // --- Gemini path ---
      const rateLimit = await checkGeminiRateLimit(userId);
      if (!rateLimit.allowed) {
        throw new Error(`Hai raggiunto il limite giornaliero di ${rateLimit.limit} generazioni gratuite. Riprova domani o configura una API key Anthropic personale.`);
      }

      console.log(`[generation] Creazione client Gemini...`);
      const genAI = await createGeminiClient();
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      console.log(`[generation] Invio richiesta a Gemini AI...`);
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: MAX_TOKENS,
        },
      });

      assembled = result.response.text();
      modelUsed = "gemini-2.0-flash";
      console.log(`[generation] Risposta ricevuta da Gemini`);
    }

    // Log AI usage
    await logAiUsage(userId, provider, "generation");

    console.log(`[generation] Parsing JSON risposta...`);
    const content = parseContent(assembled);
    console.log(`[generation] Contenuto generato: ${content.sections.length} sezioni, durata stimata: ${content.estimatedDuration} min`);

    // Update the lesson with generated content
    console.log(`[generation] Salvataggio lezione nel database...`);
    await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        content: content as any,
        aiModelUsed: modelUsed,
        status: "DRAFT",
        failureReason: null,
      },
    });

    // Link to topic if applicable
    if (topicId) {
      await prisma.topic.update({
        where: { id: topicId },
        data: { status: "GENERATED" },
      });
    }

    console.log(`[generation] Lezione generata con successo: ${lessonId}`);
  } catch (error) {
    console.error(`[generation] ERRORE generazione "${title}":`, error);
    const reason = error instanceof Error ? error.message : "Errore sconosciuto";
    await markFailed(lessonId, topicId, reason);
  }
}

async function markFailed(lessonId: string, topicId: string | undefined, reason: string) {
  await prisma.lesson.update({
    where: { id: lessonId },
    data: { status: "FAILED", failureReason: reason },
  });
  if (topicId) {
    await prisma.topic.update({
      where: { id: topicId },
      data: { status: "FAILED" },
    });
  }
}

/**
 * Creates a pending lesson then fires off generation in the background.
 * Returns immediately with the lessonId.
 */
export async function generateContent(
  params: GenerateContentParams
): Promise<{ lessonId: string }> {
  const lessonId = await createPendingLesson(params);

  // Fire-and-forget: launch generation without awaiting
  runGeneration(lessonId, params).catch((err) =>
    console.error(`[generation] Unhandled error for lesson ${lessonId}:`, err)
  );

  return { lessonId };
}
