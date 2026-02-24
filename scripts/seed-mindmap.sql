INSERT INTO lessons (id, title, description, "className", "contentType", content, status, visibility, "approvalStatus", "teacherId", "disciplineId", "createdAt", "updatedAt")
VALUES (
  'test-mindmap-001',
  'Architettura di un Computer',
  'Mappa concettuale interattiva sui componenti principali di un computer',
  '3A',
  'MAPPA_CONCETTUALE',
  '{
    "sections": [
      {
        "id": "intro-1",
        "type": "introduction",
        "title": "Introduzione",
        "content": "Questa mappa concettuale esplora i componenti fondamentali di un computer moderno. Clicca sui nodi della mappa per approfondire ogni concetto con spiegazioni dettagliate ed esempi.",
        "order": 0
      },
      {
        "id": "summary-1",
        "type": "summary",
        "title": "Riepilogo",
        "content": "I componenti principali di un computer sono interconnessi tramite il bus di sistema. La CPU elabora i dati, la RAM li conserva temporaneamente, la memoria di massa li archivia, e i dispositivi I/O permettono l''interazione con l''utente.",
        "order": 1
      }
    ],
    "objectives": ["Comprendere i componenti principali di un computer", "Identificare le relazioni tra CPU, memoria e periferiche"],
    "prerequisites": ["Concetti base di elettronica digitale"],
    "estimatedDuration": 45,
    "targetGrade": "3a superiore",
    "keywords": ["CPU", "RAM", "bus", "architettura", "Von Neumann"],
    "mindMap": {
      "root": {
        "id": "root",
        "label": "Architettura Computer",
        "description": "Organizzazione e interconnessione dei componenti hardware di un computer.",
        "explanation": "L''**architettura di un computer** si basa sul modello di **Von Neumann** (1945), che prevede:\n\n- Una **unità di elaborazione** (CPU)\n- Una **memoria centrale** per dati e istruzioni\n- **Dispositivi di input/output**\n- Un **bus di sistema** per il trasferimento dati\n\n> Il principio fondamentale è che dati e programmi risiedono nella stessa memoria.",
        "children": [
          {
            "id": "cpu",
            "label": "CPU",
            "description": "Central Processing Unit: il processore che esegue le istruzioni.",
            "explanation": "La **CPU** (Central Processing Unit) è il cuore del computer. Esegue le istruzioni dei programmi attraverso un ciclo continuo:\n\n1. **Fetch**: preleva l''istruzione dalla memoria\n2. **Decode**: interpreta l''istruzione\n3. **Execute**: esegue l''operazione\n\n**Esempio pratico**: quando apri un file, la CPU legge le istruzioni del sistema operativo, le decodifica e coordina il caricamento del file dalla memoria di massa alla RAM.\n\nLa velocità si misura in **GHz** (miliardi di cicli al secondo).",
            "color": "#3B82F6",
            "children": [
              {
                "id": "alu",
                "label": "ALU",
                "description": "Unità Aritmetico-Logica per i calcoli.",
                "explanation": "L''**ALU** (Arithmetic Logic Unit) esegue:\n\n- **Operazioni aritmetiche**: addizione, sottrazione, moltiplicazione, divisione\n- **Operazioni logiche**: AND, OR, NOT, XOR\n- **Confronti**: maggiore, minore, uguale\n\n**Esempio**: l''espressione `if (x > 5)` in un programma viene tradotta in un confronto eseguito dall''ALU."
              },
              {
                "id": "cu",
                "label": "Unità di Controllo",
                "description": "Coordina tutte le operazioni della CPU.",
                "explanation": "L''**Unità di Controllo** (CU) è il direttore d''orchestra del processore:\n\n- Decodifica le istruzioni dal **registro istruzioni**\n- Genera i **segnali di controllo** per gli altri componenti\n- Gestisce il **Program Counter** (PC) che indica la prossima istruzione\n\nSenza la CU, la CPU non saprebbe quale operazione eseguire né in che ordine."
              },
              {
                "id": "registri",
                "label": "Registri",
                "description": "Piccole memorie ultra-veloci dentro la CPU.",
                "explanation": "I **registri** sono le memorie più veloci del computer (accesso in ~1 nanosecondo):\n\n- **Accumulatore**: risultati intermedi dei calcoli\n- **Program Counter (PC)**: indirizzo della prossima istruzione\n- **Registro Istruzioni (IR)**: istruzione corrente\n- **Registri generali**: dati temporanei\n\n**Esempio**: durante `a = b + c`, i valori di b e c vengono caricati nei registri, la ALU li somma, e il risultato va nell''accumulatore."
              }
            ]
          },
          {
            "id": "memoria",
            "label": "Memoria",
            "description": "Sistema di memorizzazione dati a più livelli.",
            "explanation": "La **memoria** di un computer è organizzata in una **gerarchia** basata su velocità e capacità:\n\n| Livello | Velocità | Capacità |\n|---------|----------|----------|\n| Registri | ~1 ns | Byte |\n| Cache | ~5 ns | MB |\n| RAM | ~100 ns | GB |\n| Disco | ~ms | TB |\n\nPiù ci si allontana dalla CPU, più la memoria è **lenta ma capiente**.",
            "color": "#10B981",
            "children": [
              {
                "id": "ram",
                "label": "RAM",
                "description": "Memoria volatile ad accesso rapido.",
                "explanation": "La **RAM** (Random Access Memory) è la memoria di lavoro:\n\n- **Volatile**: si cancella allo spegnimento\n- **Veloce**: accesso in ~100 nanosecondi\n- **Capacità tipica**: 8-32 GB nei PC moderni\n\n**Esempio**: quando apri un browser, il programma viene copiato dal disco alla RAM per essere eseguito velocemente dalla CPU.\n\nTipi: **DDR4**, **DDR5** (Double Data Rate)."
              },
              {
                "id": "cache",
                "label": "Cache",
                "description": "Memoria intermedia tra CPU e RAM.",
                "explanation": "La **cache** riduce i tempi di accesso alla memoria:\n\n- **L1**: dentro il core CPU (~32 KB, ~1-2 ns)\n- **L2**: per core (~256 KB, ~5 ns)\n- **L3**: condivisa tra core (~8-32 MB, ~10 ns)\n\n**Principio di località**: i dati usati di recente saranno probabilmente riutilizzati presto, quindi vengono tenuti in cache."
              },
              {
                "id": "massa",
                "label": "Memoria di massa",
                "description": "Storage permanente per dati e programmi.",
                "explanation": "La **memoria di massa** conserva i dati in modo permanente:\n\n- **HDD**: piatti magnetici, economico, ~100 MB/s\n- **SSD**: memoria flash, veloce, ~500-7000 MB/s\n- **NVMe**: SSD su bus PCIe, ultra-veloci\n\n**Esempio**: il sistema operativo, i documenti e le foto sono salvati sulla memoria di massa."
              }
            ]
          },
          {
            "id": "bus",
            "label": "Bus di sistema",
            "description": "Canali di comunicazione tra i componenti.",
            "explanation": "Il **bus di sistema** collega tutti i componenti. Si divide in:\n\n1. **Bus dati**: trasporta i dati (8, 16, 32, 64 bit)\n2. **Bus indirizzi**: specifica dove leggere/scrivere in memoria\n3. **Bus di controllo**: segnali lettura/scrittura, interrupt, clock\n\n**Esempio**: per leggere un dato dalla RAM, la CPU mette l''indirizzo sul bus indirizzi, attiva il segnale di lettura sul bus di controllo, e riceve il dato sul bus dati.",
            "color": "#F59E0B",
            "children": [
              {
                "id": "bus-dati",
                "label": "Bus dati",
                "description": "Trasporta i dati tra componenti.",
                "explanation": "Il **bus dati** è bidirezionale e la sua larghezza determina quanti bit vengono trasferiti per ciclo:\n\n- **8 bit**: primi microprocessori\n- **32 bit**: Pentium\n- **64 bit**: processori moderni\n\nPiù è largo il bus, più dati vengono trasferiti contemporaneamente."
              },
              {
                "id": "bus-indirizzi",
                "label": "Bus indirizzi",
                "description": "Specifica le locazioni di memoria.",
                "explanation": "Il **bus indirizzi** è unidirezionale (CPU → memoria) e determina la RAM massima:\n\n- **32 bit** → 2^32 = **4 GB** massimo\n- **64 bit** → 2^64 = **16 Exabyte** teorici\n\nQuesto spiega perché i sistemi a 32 bit non potevano usare più di 4 GB di RAM."
              }
            ]
          },
          {
            "id": "io",
            "label": "Dispositivi I/O",
            "description": "Periferiche di input e output.",
            "explanation": "I **dispositivi di I/O** permettono la comunicazione tra utente e computer:\n\n**Input** (dati verso il computer):\n- Tastiera, mouse, scanner, microfono\n\n**Output** (dati dal computer):\n- Monitor, stampante, altoparlanti\n\n**Input/Output** (bidirezionali):\n- Touchscreen, modem, scheda di rete\n\nOgni dispositivo comunica tramite un **controller** dedicato.",
            "color": "#EF4444",
            "children": [
              {
                "id": "input",
                "label": "Input",
                "description": "Dispositivi per immettere dati.",
                "explanation": "I dispositivi di **input** convertono azioni fisiche in segnali digitali:\n\n- **Tastiera**: ogni tasto ha un codice ASCII/Unicode\n- **Mouse**: sensore ottico rileva il movimento (DPI)\n- **Scanner**: digitalizza documenti cartacei\n\n**Esempio**: premendo il tasto ''A'', la tastiera invia il codice 65 (ASCII) alla CPU tramite il controller USB."
              },
              {
                "id": "output",
                "label": "Output",
                "description": "Dispositivi per visualizzare risultati.",
                "explanation": "I dispositivi di **output** convertono dati digitali in informazioni percepibili:\n\n- **Monitor**: pixel RGB, risoluzione (es. 1920x1080)\n- **Stampante**: laser (toner) o inkjet (inchiostro)\n- **Altoparlanti**: segnali digitali → onde sonore (DAC)\n\n**Esempio**: la GPU elabora 1920x1080 = 2 milioni di pixel, ognuno con valore RGB, inviati al monitor 60 volte al secondo."
              }
            ]
          },
          {
            "id": "sw",
            "label": "Software di base",
            "description": "Sistema operativo e firmware che gestiscono l''hardware.",
            "explanation": "Il **software di base** fa da intermediario tra hardware e utente:\n\n- **BIOS/UEFI**: firmware che avvia il computer\n- **Sistema Operativo**: gestisce risorse (CPU, memoria, I/O)\n- **Driver**: traducono le richieste del SO per ogni periferica\n\n**Sequenza di avvio**:\n1. Accensione → BIOS/UEFI\n2. POST (Power-On Self Test)\n3. Caricamento bootloader\n4. Avvio del Sistema Operativo",
            "color": "#8B5CF6",
            "children": [
              {
                "id": "so",
                "label": "Sistema Operativo",
                "description": "Gestisce risorse hardware e software.",
                "explanation": "Il **Sistema Operativo** (SO) è il software fondamentale che:\n\n- **Gestisce i processi**: multitasking, scheduling CPU\n- **Gestisce la memoria**: allocazione RAM, memoria virtuale\n- **Gestisce i file**: filesystem (NTFS, ext4, APFS)\n- **Gestisce l''I/O**: code di stampa, buffer di rete\n\n**Esempi**: Windows, Linux, macOS, Android, iOS."
              },
              {
                "id": "bios",
                "label": "BIOS / UEFI",
                "description": "Firmware di avvio del computer.",
                "explanation": "Il **BIOS** (Basic Input/Output System) o il più moderno **UEFI**:\n\n- Risiede su una memoria **ROM/Flash** sulla scheda madre\n- Esegue il **POST** per verificare l''hardware\n- Cerca il dispositivo di boot (disco, USB, rete)\n- Carica il **bootloader** del sistema operativo\n\n**UEFI** vs BIOS: interfaccia grafica, supporto dischi >2TB, boot più veloce, Secure Boot."
              }
            ]
          }
        ]
      },
      "crossLinks": [
        { "fromId": "cache", "toId": "registri", "label": "gerarchia di memoria" },
        { "fromId": "cu", "toId": "bus", "label": "genera segnali" },
        { "fromId": "so", "toId": "io", "label": "gestisce driver" }
      ]
    }
  }'::jsonb,
  'DRAFT',
  'PRIVATE',
  'NONE',
  'cmlp2hmjf000001nxlods2px5',
  '94b68618-8df4-4ab4-929e-2eeebfb0dcc2',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, "updatedAt" = NOW();
