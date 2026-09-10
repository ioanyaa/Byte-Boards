# Raport MDS — Byte Boards

Sursa LaTeX a raportului și ghidul de realizare a diagramelor.

```
raport/
├── main.tex          # sursa LaTeX completă (Overleaf-ready)
├── DIAGRAME.md       # ghid pas cu pas pentru cele 9 diagrame draw.io
├── README.md         # fișierul acesta
└── diagrame/         # aici pui PDF-urile exportate din draw.io
```

## Cum îl folosești pe Overleaf

1. **New Project → Upload Project** și încarcă un ZIP cu tot conținutul folderului `raport/`.
   (Sau: New Project → Blank Project, apoi copiezi `main.tex` și creezi folderul `diagrame/`.)
2. **Setează compilatorul pe LuaLaTeX** (Menu → Compiler → LuaLaTeX). Vezi nota de mai jos.
   Documentul compilează din prima, **și fără diagrame** — în locul fiecăreia apare un
   placeholder vizibil.
3. Pe măsură ce desenezi diagramele, le exporți ca PDF și le urci în `diagrame/`,
   cu numele exacte din `DIAGRAME.md`. Placeholder-ul e înlocuit automat.

### De ce LuaLaTeX și nu pdfLaTeX

Preambulul detectează automat motorul, deci documentul compilează pe **ambele**.
Diferența e în *stratul de text* al PDF-ului:

| | pdfLaTeX | LuaLaTeX |
|---|---|---|
| Cum arată ș / ț pe pagină | corect | corect |
| Cum sunt scrise în PDF | `s` + virgulă separată | glifă Unicode U+0219 |
| Copy-paste din PDF | „s,i" în loc de „și" | „și" |
| Căutare `Ctrl+F` în PDF | **nu găsește** cuvinte cu diacritice | funcționează |

`raport-1.pdf` (varianta veche) avea exact această problemă — de aceea extragerea
textului din el returna „s, i" și „t, ă". Cu LuaLaTeX dispare.

Verificat: cu LuaLaTeX, căutarea după „și" găsește 102 potriviri în PDF; cu pdfLaTeX, 0.

## Ce s-a schimbat față de `raport-1.pdf`

| Aspect | Înainte | Acum |
|---|---|---|
| Diagrame | ASCII art în blocuri de cod | 9 diagrame UML vectoriale (draw.io) |
| User stories | 14, parțial nesincronizate | 15, sincronizate cu `README.md` |
| Trăsături agenți | „9 posibile” | 15 (valoarea reală din `personality.ts`) |
| Teste | „13 tests passed” | 140 Vitest + 15 regresie + 3 suite evals |
| Evals | descriere calitativă | DeepEval cu metrici GEval și praguri |
| Job-uri CI | 4 | 6 (`test-backend`, `docker-build` adăugate) |
| Bug-uri analizate | 2 | 3 (adăugat incidentul de producție) |
| Structură | 7 secțiuni | 8 secțiuni + concluzii |

### Verificări de acuratețe făcute pe cod

Toate cifrele din raport au fost verificate direct în repository:

- 24 de rute API (`grep -c "^app\." backend/src/index.ts`)
- 9 modele Prisma + 4 enumerări (`backend/prisma/schema.prisma`)
- 15 trăsături, 14 cu conflicte declarate (`backend/src/game/personality.ts`)
- 140 de teste Vitest în 7 fișiere; 15 în `test-agents.ts`
- 13 Pull Requests integrate (`git log --grep="Merge pull request"`)

## Secțiuni și diagramele corespunzătoare

| Secțiune raport | Diagramă |
|---|---|
| 2. User Stories și Backlog | `01-use-case` |
| 3.2 Diagrama de clase | `02-class-diagram` |
| 3.3 Diagrama de componente | `03-component` |
| 3.4 Diagrama de desfășurare | `04-deployment` |
| 3.5 Diagrama de secvență | `05-sequence` |
| 3.6 Diagrama de stare | `06-state-machine` |
| 3.7 Diagrama de activitate (faza de producție) | `07a-activity-productie` |
| 3.7 Diagrama de activitate (faza de decizie) | `07b-activity-decizie` |
| 4. Source Control cu Git | `08-git-flow` |
| 7. Pipeline CI/CD | `09-cicd` |
