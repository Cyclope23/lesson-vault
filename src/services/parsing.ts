import { prisma } from "@/lib/prisma";
import { createClaudeClient } from "@/lib/claude";
import { createGeminiClient } from "@/lib/gemini";
import { resolveAiProvider } from "@/lib/ai-provider";
import { checkGeminiRateLimit, logAiUsage } from "@/lib/rate-limit";
import type { ParsedProgram } from "@/types/program";

/**
 * Analizza il rawContent di un programma con AI,
 * estraendo moduli e argomenti, e li salva nel DB.
 */
export async function parseProgram(
  programId: string,
  userId: string
): Promise<void> {
  const program = await prisma.program.findUnique({
    where: { id: programId },
    include: { discipline: { select: { name: true } } },
  });

  if (!program) throw new Error("Programma non trovato");
  if (!program.rawContent) throw new Error("Nessun contenuto da analizzare");

  console.log(`[parsing] Avvio analisi programma "${program.title}" (${programId})`);
  console.log(`[parsing] Disciplina: ${program.discipline.name}, contenuto: ${program.rawContent.length} caratteri`);

  // Set status to PARSING
  await prisma.program.update({
    where: { id: programId },
    data: { status: "PARSING" },
  });

  try {
    const provider = await resolveAiProvider(userId);
    console.log(`[parsing] Provider AI: ${provider}`);

    const prompt = `Sei un esperto di didattica scolastica italiana. Analizza il seguente programma di disciplina "${program.discipline.name}" e estrai la struttura in moduli e argomenti.

PROGRAMMA:
${program.rawContent}

Rispondi SOLO con un JSON valido nel seguente formato, senza markdown o altro testo:
{
  "modules": [
    {
      "name": "Nome del modulo",
      "description": "Breve descrizione opzionale",
      "topics": [
        {
          "title": "Titolo dell'argomento",
          "description": "Breve descrizione opzionale"
        }
      ]
    }
  ]
}

Regole:
- Ogni modulo deve avere almeno un argomento
- I titoli devono essere concisi ma descrittivi
- Mantieni l'ordine logico del programma originale
- Se il testo non contiene una struttura chiara, cerca di organizzarlo in moduli tematici`;

    let responseText: string;

    if (provider === "claude") {
      console.log(`[parsing] Creazione client Claude...`);
      const claude = await createClaudeClient(userId);

      console.log(`[parsing] Invio richiesta a Claude AI...`);
      const response = await claude.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      });

      const textContent = response.content.find((c) => c.type === "text");
      if (!textContent || textContent.type !== "text") {
        throw new Error("Risposta AI senza contenuto testuale");
      }

      responseText = textContent.text;
      console.log(`[parsing] Risposta ricevuta da Claude (modello: ${response.model})`);
    } else {
      // Gemini path
      const rateLimit = await checkGeminiRateLimit(userId);
      if (!rateLimit.allowed) {
        throw new Error(`Hai raggiunto il limite giornaliero di ${rateLimit.limit} generazioni gratuite. Riprova domani o configura una API key Anthropic personale.`);
      }

      console.log(`[parsing] Creazione client Gemini...`);
      const genAI = await createGeminiClient();
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      console.log(`[parsing] Invio richiesta a Gemini AI...`);
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: 4096,
        },
      });

      responseText = result.response.text();
      console.log(`[parsing] Risposta ricevuta da Gemini`);
    }

    // Log AI usage
    await logAiUsage(userId, provider, "parsing");

    // Strip code fences if present
    let cleanText = responseText.trim();
    if (cleanText.startsWith("```")) {
      cleanText = cleanText.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
    }

    const parsed: ParsedProgram = JSON.parse(cleanText);

    if (!parsed.modules || parsed.modules.length === 0) {
      throw new Error("Nessun modulo estratto dal programma");
    }

    const totalTopics = parsed.modules.reduce((sum, m) => sum + m.topics.length, 0);
    console.log(`[parsing] Estratti ${parsed.modules.length} moduli, ${totalTopics} argomenti totali`);

    // Create modules and topics in DB
    console.log(`[parsing] Salvataggio struttura nel database...`);
    for (let i = 0; i < parsed.modules.length; i++) {
      const mod = parsed.modules[i];
      const dbModule = await prisma.module.create({
        data: {
          name: mod.name,
          description: mod.description || null,
          order: i,
          programId,
        },
      });

      for (let j = 0; j < mod.topics.length; j++) {
        const topic = mod.topics[j];
        await prisma.topic.create({
          data: {
            title: topic.title,
            description: topic.description || null,
            order: j,
            status: "PENDING",
            contentType: "LEZIONE",
            moduleId: dbModule.id,
          },
        });
      }
    }

    await prisma.program.update({
      where: { id: programId },
      data: { status: "PARSED" },
    });

    console.log(`[parsing] Analisi completata con successo per programma "${program.title}"`);
  } catch (error) {
    console.error(`[parsing] ERRORE analisi programma ${programId}:`, error);
    await prisma.program.update({
      where: { id: programId },
      data: { status: "FAILED" },
    });
    throw error;
  }
}
