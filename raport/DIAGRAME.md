# Ghid de realizare a diagramelor în draw.io

Acest ghid descrie cele **9 diagrame** ale raportului: ce conține fiecare, ce notație UML
folosește și cum se construiește exact în draw.io.

> **Notă despre curriculum.** Notația de mai jos este UML 2.5 standard, așa cum este predată
> în cursurile de inginerie software. Verifică totuși slide-urile cursului tău de MDS pentru
> convenții specifice (unele cursuri cer, de exemplu, și operațiile în diagrama de clase, sau
> preferă notația Barker/Crow's Foot pentru ER). Structura de mai jos acoperă cele patru
> perspective cerute uzual: **cerințe** (use case), **structură statică** (clase, componente),
> **comportament** (secvență, stare, activitate) și **desfășurare** (deployment).

---

## 0. Setup comun — fă asta o singură dată

### 0.1 Activarea bibliotecilor de forme

În draw.io: **File → Shapes…** și bifează:

- [x] **UML** (obligatoriu — conține toate formele UML 2.5)
- [x] **Flowchart** (pentru diagramele CI/CD și Git)
- [x] **Networking → Network** (opțional, pentru deployment mai vizual)

Apasă **Apply**. Formele apar în panoul din stânga, secțiunea „UML”.

### 0.2 Paleta de culori — identică cu cea din LaTeX

Ca diagramele să arate ca parte din document, nu lipite din altă parte, folosește **exact**
aceste culori (în draw.io: selectezi forma → **Edit Style** sau panoul din dreapta → Fill/Line):

| Rol | HEX | Unde se folosește |
|---|---|---|
| Navy (contur, titluri) | `#0F2942` | Contururi, text de titlu |
| Albastru (accent primar) | `#2563EB` | Elemente principale, actori |
| Chihlimbar (accent secundar) | `#D97706` | Elemente AI / externe |
| Verde (succes) | `#059669` | Stări finale reușite, teste trecute |
| Roșu (eroare) | `#DC2626` | Erori, stări de eșec |
| Gri (secundar) | `#64748B` | Text secundar, note |
| Fundal deschis | `#F1F5F9` | Umplerea cutiilor |

**Regulă de stil pentru aspect „fancy” dar profesional:**

- Umplere `#F1F5F9`, contur `#0F2942`, grosime linie **2**
- Colțuri rotunjite: `rounded=1` în Edit Style
- Umbră discretă: bifează **Shadow** în panelul Style (nu exagera — o singură umbră, nu la toate)
- Font: **Helvetica**, dimensiune 12 pentru conținut, 14 bold pentru titluri
- **Fără gradienți** și fără mai mult de 3 culori per diagramă

### 0.3 Export pentru LaTeX — CRITIC

Pentru fiecare diagramă:

**File → Export as → PDF…**

- [x] **Crop** (taie marginile albe — fără asta diagrama apare mică și pierdută în pagină)
- [ ] Transparent Background — **nelăsat bifat**
- Zoom: **100%**
- Apasă **Export** → **Download**

Salvează în `raport/diagrame/` cu **exact** numele din tabelul de mai jos.

> **De ce PDF și nu PNG:** PDF-ul e vectorial — rămâne clar la orice zoom și la print.
> PNG-ul se pixelează. Dacă totuși folosești PNG, exportă la **Zoom 300%**.

### 0.4 Numele fișierelor

| # | Fișier | Diagramă |
|---|---|---|
| 1 | `01-use-case.pdf` | Cazuri de utilizare |
| 2 | `02-class-diagram.pdf` | Clase (model de domeniu) |
| 3 | `03-component.pdf` | Componente |
| 4 | `04-deployment.pdf` | Desfășurare |
| 5 | `05-sequence.pdf` | Secvență |
| 6 | `06-state-machine.pdf` | Stare |
| 7a | `07a-activity-productie.pdf` | Activitate - faza de producție |
| 7b | `07b-activity-decizie.pdf` | Activitate - faza de decizie |
| 8 | `08-git-flow.pdf` | Strategia de branching |
| 9 | `09-cicd.pdf` | Pipeline CI/CD |

Raportul compilează și **fără** diagrame — apare un placeholder în locul fiecăreia.
Le poți adăuga una câte una.

---

## 1. Diagrama cazurilor de utilizare — `01-use-case.pdf`

### Forme din draw.io
Caută în panoul de căutare: `actor`, `use case`, `rectangle`.

### Conținut

**Actori (stânga)** — forma „Actor” (omuleț):
- `Vizitator`
- `Utilizator autentificat`
- `Administrator`

**Actor secundar (dreapta)** — tot „Actor”, dar colorat `#D97706`:
- `Gemini API`

**Granița sistemului** — un dreptunghi mare etichetat `Platformă Catan AI`, cu toate
cazurile de utilizare **înăuntru**. Actorii stau **în afara** lui.

**Cazuri de utilizare** (elipse, `#F1F5F9` / contur `#0F2942`):

| Grupă | Cazuri de utilizare |
|---|---|
| Vizitator | Urmărire meci live · Vizualizare comentariu AI · Vizualizare trăsături agenți · Acces prin link de partajare |
| Utilizator autentificat | Autentificare · Pornire meci · Oprire/Ștergere meci · Creare agent personalizat · Navigare istoric · Filtrare istoric · Vizualizare metrici · Setare vizibilitate · Generare link partajare · Invitare spectator |
| Administrator | Ștergere orice meci · Ștergere orice agent · Administrare utilizatori |
| Incluse (invocate de sistem) | Selectare agenți · Moderare nume · Generare rezumat AI · Generare decizie agent |

### Relații — atenție, aici se pierd cele mai multe puncte

**a) Generalizare între actori** — linie continuă cu **triunghi gol** la capătul *părintelui*:

```
Administrator ────────▷ Utilizator autentificat ────────▷ Vizitator
```

Sensul: Administratorul poate face tot ce poate un utilizator autentificat, care poate face
tot ce poate un vizitator. Triunghiul e **întotdeauna la părinte** (cel mai general).

*În draw.io:* trage o linie, apoi Edit Style → `endArrow=block;endFill=0;` (triunghi gol).

**b) `<<include>>`** — linie **întreruptă**, săgeată deschisă către cazul **inclus**:

```
Pornire meci ─ ─ ─<<include>>─ ─ ─> Selectare agenți
Creare agent ─ ─ ─<<include>>─ ─ ─> Moderare nume
```

Sensul: cazul de bază **nu poate exista fără** cel inclus. Săgeata pleacă din baza, ajunge la inclus.

**c) `<<extend>>`** — linie **întreruptă**, săgeată deschisă către cazul **de bază**:

```
Generare rezumat AI ─ ─ ─<<extend>>─ ─ ─> Finalizare meci
```

Sensul: comportament **opțional** care extinde un caz existent. Rezumatul e opțional —
dacă API-ul Gemini nu răspunde, se folosește un text implicit.

> ⚠️ **Greșeala clasică:** `<<include>>` și `<<extend>>` au săgeți în **direcții opuse**.
> `include` merge **spre** cazul inclus; `extend` merge **dinspre** extensie **spre** baza.
> Ține minte: săgeata arată mereu spre cazul de care *depinde* relația.

*În draw.io pentru ambele:* Edit Style → `dashed=1;endArrow=open;endFill=0;`
Eticheta o adaugi dublu-clic pe linie și scrii `«include»` (ghilimele franceze, nu `<<>>`).

### Layout
Actori umani în stânga, aliniați vertical. Granița sistemului în centru, ocupând ~65% din lățime.
Gemini API în dreapta. Cazurile grupate vertical pe actorul care le declanșează.

---

## 2. Diagrama de clase — `02-class-diagram.pdf`

### Forme
Caută `class` — folosește forma UML „Class” cu 3 compartimente (nume / atribute / operații).
Pentru un **model de domeniu** derivat din schema bazei de date, compartimentul de operații
poate fi omis; menționează asta în raport.

### Clase și atribute

```
User                          Match                        Agent
─────────────────────         ─────────────────────        ─────────────────────
- id : int {PK}               - id : String {PK}           - id : int {PK}
- name : String [0..1]        - name : String [0..1]       - name : String {unique}
- email : String {unique}     - gameType : String          - description : String [0..1]
- password : String           - status : MatchStatus        - createdAt : DateTime
- role : Role                 - visibility : MatchVisibility
- createdAt : DateTime        - shareToken : String {unique}
                              - robberTile : int
                              - pirateHex : int [0..1]
                              - devDeck : JSON
                              - summary : String [0..1]
                              - createdAt / startedAt / endedAt

MatchAgent  «association class»    MatchEvent               Trait
─────────────────────              ─────────────────────    ─────────────────────
- seat : int                       - id : String {PK}       - id : int {PK}
- score : int                      - turn : int             - name : String {unique}
- position : int [0..1]            - type : EventType       - description : String
- wood/brick/ore/wheat/sheep : int  - text : String
- roads/settlements/cities : int    - payload : JSON [0..1]
- settlementNodes/cityNodes : JSON  - createdAt : DateTime
- roadEdges/shipEdges : JSON
- devCards : JSON
- knightsPlayed : int
- islandVPs : int

AgentTrait               TraitConflict            MatchWatcher
──────────────           ──────────────           ──────────────
- agentId {PK,FK}        - sourceId {PK,FK}       - matchId {PK,FK}
- traitId  {PK,FK}       - targetId {PK,FK}       - userId  {PK,FK}
```

### Enumerări
Adaugă 4 clase cu stereotipul `«enumeration»`:

- `Role` : USER, ADMIN
- `MatchStatus` : PENDING, LIVE, PAUSED, COMPLETED
- `MatchVisibility` : PRIVATE, PROTECTED, PUBLIC
- `EventType` : COMMENTARY, MOVE, RESOURCE, RESULT

### Relații și multiplicități

| De la | Relație | Către | Multiplicitate | Justificare |
|---|---|---|---|---|
| `User` | asociere `creează` | `Match` | `1` — `0..*` | `createdById` e nullable, `onDelete: SetNull` |
| `User` | asociere `deține` | `Agent` | `0..1` — `0..*` | agenții de sistem au `createdById = null` |
| `Match` | **compoziție** ◆ | `MatchAgent` | `1` — `2..4` | `onDelete: Cascade` — nu există fără meci |
| `Match` | **compoziție** ◆ | `MatchEvent` | `1` — `0..*` | `onDelete: Cascade` |
| `Match` | **compoziție** ◆ | `MatchWatcher` | `1` — `0..*` | `onDelete: Cascade` |
| `Agent` | asociere | `MatchAgent` | `1` — `0..*` | |
| `Agent` | asociere `câștigă` | `Match` | `0..1` — `0..*` | `winnerId` nullable |
| `Agent` | **compoziție** ◆ | `AgentTrait` | `1` — `0..*` | `onDelete: Cascade` |
| `Trait` | asociere | `AgentTrait` | `1` — `0..*` | |
| `Trait` | **auto-asociere** prin `TraitConflict` | `Trait` | `0..*` — `0..*` | perechi incompatibile |

**Clasa de asociere `MatchAgent`:** desenează linia de asociere între `Match` și `Agent`,
apoi leagă clasa `MatchAgent` de **mijlocul acelei linii** printr-o **linie întreruptă**
(fără săgeată). Asta e notația UML pentru association class și e exact ce modelează
`MatchAgent` — starea unui agent *într-un anumit meci*.

*În draw.io:* `dashed=1;endArrow=none;`

**Compoziție (romb plin):** Edit Style → `endArrow=diamondThin;endFill=1;endSize=14;`
Rombul stă la capătul **întregului** (`Match`), nu al părții.

**Asociere simplă:** `endArrow=none;` cu multiplicități scrise ca etichete la capete.

### Layout
`Match` în centru (e entitatea centrală). `User` sus-stânga, `Agent` dreapta,
`MatchAgent` între `Match` și `Agent`. `MatchEvent` sub `Match`.
Grupul `Trait` / `AgentTrait` / `TraitConflict` jos-dreapta. Enumerările pe o coloană
separată în marginea din dreapta, colorate `#F1F5F9` cu contur gri.

---

## 3. Diagrama de componente — `03-component.pdf`

### Forme
Caută `component` — dreptunghi cu stereotipul `«component»` și pictograma de componentă
în colțul dreapta-sus. Pentru interfețe caută `provided interface` (lollipop / bilă) și
`required interface` (socket / semicerc).

### Componente

| Componentă | Artefact | Interfață oferită | Interfață cerută |
|---|---|---|---|
| `React SPA` | `frontend/src` | — | `REST API`, `SSE Stream` |
| `Nginx Reverse Proxy` | `nginx.conf` | `HTTP/HTTPS` | `REST API` |
| `Express API` | `backend/src/index.ts` | `REST API`, `SSE Stream` | `GameEngine`, `AIProvider`, `Persistence` |
| `Game Engine` | `backend/src/game/` | `GameEngine` | — *(pur, fără dependențe)* |
| `AI Adapter` | `game/ai.ts`, `gemini-client.ts` | `AIProvider` | `GenerativeAPI` |
| `Persistence` | Prisma Client | `Persistence` | `SQL` |
| `PostgreSQL` | container `universal-db` | `SQL` | — |
| `Gemini API` | serviciu extern | `GenerativeAPI` | — |

### Notație
Conectorii de asamblare se desenează **bilă-în-socket**: interfața oferită (bilă pe băț)
a unei componente se cuplează în semicercul (socket) componentei care o cere.

**Punctul de subliniat în raport:** `Game Engine` **nu cere nicio interfață**. E complet
pur — nu depinde de Express, Prisma sau Gemini. Exact asta permite rularea unui meci
complet în teste, fără bază de date.

Colorează `Gemini API` și `PostgreSQL` cu `#D97706` (sisteme externe), restul cu `#F1F5F9`.

---

## 4. Diagrama de desfășurare — `04-deployment.pdf`

### Forme
Caută `node` (cub 3D) sau `cube`. Artefactele sunt dreptunghiuri simple cu `«artifact»`.

### Structură

```
«device» Client Device
   └── «execution environment» Browser
          └── «artifact» SPA bundle (React, static)

              │ HTTPS (443)
              ▼
«device» Ubuntu Home Server (sigaver)
   │
   ├── «execution environment» Nginx (host)
   │        443 → localhost:3003  (/api/*)
   │
   └── «execution environment» Docker Engine
        │
        ├── «container» byte_boards_frontend        [rețea: app-net]
        │      «artifact» nginx:1.27-alpine + dist/
        │      port 5173 → 80
        │
        ├── «container» byte_boards_backend         [rețele: app-net, global-db-net]
        │      «artifact» node:22-alpine + dist/index.js
        │      port 127.0.0.1:3003 → 5000
        │
        └── «container» universal-db                [rețea: global-db-net]
               «artifact» postgres:15-alpine
               port 127.0.0.1:5432

              │ HTTPS
              ▼
«device» Google Cloud
   └── «execution environment» Gemini API
```

### Notație
- Nodurile fizice: `«device»` — cuburi 3D
- Mediile de execuție: `«execution environment»` — cuburi imbricate
- Containerele: cuburi cu `«container»` (sau `«execution environment»`)
- Căile de comunicație: **linii continue simple** între noduri, etichetate cu protocolul
  și portul (`HTTPS/443`, `HTTP/5000`, `TCP/5432`)

**Elementul de evidențiat:** desenează cele două rețele Docker ca **dreptunghiuri
punctate** care înconjoară containerele corespunzătoare. `byte_boards_backend` apare în
**ambele** — asta e exact ce lipsea și a cauzat căderea de producție din raport.
Colorează `app-net` cu `#2563EB` și `global-db-net` cu `#D97706`, ambele `dashed=1`.

---

## 5. Diagrama de secvență — `05-sequence.pdf`

### Forme
Caută `lifeline` / `sequence`. draw.io are o secțiune UML dedicată cu
„Lifeline”, „Activation”, „Message”.

### Participanți (de la stânga la dreapta)
1. `:Utilizator` (actor)
2. `:React SPA`
3. `:Express API`
4. `:Game Engine`
5. `:Gemini API`
6. `:PostgreSQL`

### Secvența mesajelor

| # | De la → La | Mesaj | Tip |
|---|---|---|---|
| 1 | Utilizator → SPA | `porneșteMeci(agenți, mod)` | sincron |
| 2 | SPA → API | `POST /api/matches` | sincron |
| 3 | API → PostgreSQL | `create(Match, status=LIVE)` | sincron |
| 4 | PostgreSQL → API | `matchId` | return |
| 5 | API → SPA | `201 {id}` | return |
| 6 | SPA → API | `GET /api/matches/:id/stream` | asincron (SSE) |
| 7 | API → API | `runMatchSimulation()` | **self-message** |

**Fragment `loop [până la 8 VP sau 500 ture]`:**

| # | De la → La | Mesaj | Tip |
|---|---|---|---|
| 8 | API → Game Engine | `rollDice()` / `collectResources()` | sincron |
| 9 | API → Game Engine | `getValidActions(state)` | sincron |
| 10 | Game Engine → API | `moves[]` | return |

  **Fragment `alt [cheie API disponibilă] / [altfel]`:**
| 11a | API → Gemini | `generateContent(prompt)` | sincron |
| 12a | Gemini → API | `{action, commentary}` | return |
| 11b | API → Game Engine | `heuristicDecision(moves)` | sincron |

| 13 | API → Game Engine | `applyAction(action)` | sincron |
| 14 | API → PostgreSQL | `persistAgentState()` | sincron |
| 15 | API → SPA | `SSE: tick` | **asincron** |

**După buclă:**

| 16 | API → PostgreSQL | `update(status=COMPLETED, winnerId)` | sincron |
| 17 | API → Gemini | `generateSummary()` | sincron |
| 18 | API → PostgreSQL | `update(summary)` | sincron |
| 19 | API → SPA | `SSE: completed` | asincron |

### Notație — atenție la tipurile de săgeți

| Tip mesaj | Linie | Vârf săgeată | Edit Style draw.io |
|---|---|---|---|
| **Sincron** (apel care așteaptă) | continuă | **plin** (triunghi umplut) | `endArrow=block;endFill=1;` |
| **Return** (răspuns) | **întreruptă** | deschis | `dashed=1;endArrow=open;` |
| **Asincron** (SSE, fire-and-forget) | continuă | **deschis** | `endArrow=open;endFill=0;` |

> ⚠️ Mesajele SSE (15, 19) **trebuie** să fie asincrone — serverul nu așteaptă răspuns.
> Asta e exact ideea arhitecturală de evidențiat: răspunsul HTTP se întoarce la pasul 5,
> iar simularea continuă în fundal.

**Fragmente combinate:** dreptunghi cu un „colț tăiat” sus-stânga în care scrii operatorul
(`loop`, `alt`). Pentru `alt`, împarte dreptunghiul cu o **linie orizontală întreruptă**
și scrie condiția fiecărei ramuri în paranteze pătrate: `[cheie disponibilă]` / `[altfel]`.

**Bare de activare:** dreptunghiuri subțiri verticale peste linia de viață, cât timp
participantul e activ. Nu le omite — fără ele diagrama nu arată durata apelurilor.

---

## 6. Diagrama de stare — `06-state-machine.pdf`

### Forme
Caută `state`. Ai nevoie de: „Initial” (cerc plin), „State” (dreptunghi rotunjit),
„Final” (cerc cu inel).

### Stări și tranziții

```
    ●  (nod inițial)
    │  creareMeci()
    ▼
┌──────────┐
│ PENDING  │
└──────────┘
    │ pornireSimulare()
    ▼
┌──────────┐  pauză()                ┌──────────┐
│   LIVE   │ ──────────────────────> │  PAUSED  │
│          │ <────────────────────── │          │
└──────────┘  reluare()              └──────────┘
    │                                      │
    │ [VP >= 8] / declarăCâștigător()      │ stop()
    │ [tura > 500] / tiebreak()            │
    │ stop()                               │
    ▼                                      │
┌─────────────┐ <───────────────────────────┘
│  COMPLETED  │
└─────────────┘
    │
    ▼
    ◉  (nod final)
```

### Detalii importante

- **Tranziție de recuperare:** adaugă o notă (`note` shape, linie punctată) atașată stării
  `LIVE`: *„La repornirea serverului, meciurile rămase LIVE în baza de date sunt reluate
  automat din starea persistată.”*
- **`COMPLETED` este stare finală** — nu are nicio tranziție de ieșire înapoi. Subliniază asta:
  colorează `COMPLETED` cu `#059669`.
- **Sintaxa etichetelor de tranziție:** `eveniment [gardă] / acțiune`
  Exemplu corect: `verificareScor [VP >= 8] / declarăCâștigător()`
  Gărzile se scriu **întotdeauna** în paranteze pătrate.

Colorează `LIVE` cu `#2563EB`, `PAUSED` cu `#D97706`, `COMPLETED` cu `#059669`.

---

## 7. Diagrama de activitate — `07-activity.pdf`

### Forme
Caută `activity`. Îți trebuie: „Start” (cerc plin), „Activity” (dreptunghi rotunjit),
„Decision” (romb), „Merge” (romb), „Fork/Join” (bară groasă), „End” (cerc cu inel).

### Fluxul unei ture

```
        ●
        │
        ▼
┌───────────────────┐
│ Aruncă zarurile   │
└───────────────────┘
        │
        ◆  [suma == 7]?
       ╱ ╲
   da ╱   ╲ nu
     ▼     ▼
┌──────────────┐  ┌────────────────────────┐
│ Activează    │  │ Distribuie resurse     │
│ hoțul        │  │ conform numerelor      │
└──────────────┘  └────────────────────────┘
     │                      │
     ▼                      │
┌──────────────────────┐    │
│ Jucătorii cu >= 7    │    │
│ resurse aruncă 1/2   │    │
└──────────────────────┘    │
     │                      │
     └──────────►◆◄─────────┘   (merge)
                 │
                 ▼
        ┌─────────────────────────┐
        │ Pentru fiecare agent:   │
        │ calculează mutări legale│
        └─────────────────────────┘
                 │
                 ◆  [cheie Gemini disponibilă]?
                ╱ ╲
            da ╱   ╲ nu
              ▼     ▼
    ┌──────────────┐ ┌────────────────────┐
    │ Cere decizie │ │ Aplică euristica   │
    │ de la Gemini │ │ deterministă       │
    └──────────────┘ └────────────────────┘
              │             │
              └────►◆◄──────┘
                    │
                    ▼
           ┌──────────────────┐
           │ Aplică acțiunea  │
           └──────────────────┘
                    │
                    ▬▬▬▬▬  (fork — acțiuni paralele)
                   ╱     ╲
                  ▼       ▼
      ┌────────────────┐ ┌──────────────────┐
      │ Persistă starea│ │ Emite eveniment  │
      │ în baza de date│ │ SSE către client │
      └────────────────┘ └──────────────────┘
                  ╲       ╱
                   ▬▬▬▬▬  (join)
                     │
                     ◆  [VP >= 8 sau tura > 500]?
                    ╱ ╲
                nu ╱   ╲ da
        (înapoi la    ▼
         începutul  ┌────────────────────┐
         turei)     │ Generează rezumat  │
                    │ și încheie meciul  │
                    └────────────────────┘
                             │
                             ▼
                             ◉
```

### Notație
- **Decizie** (romb, o intrare / mai multe ieșiri) — fiecare ieșire etichetată cu o gardă
  în paranteze pătrate: `[suma == 7]`
- **Merge** (romb, mai multe intrări / o ieșire) — nu confunda cu decizia; nu are gardă
- **Fork / Join** (bară groasă) — pentru acțiuni **cu adevărat paralele**. Persistarea în DB
  și emiterea SSE sunt independente, deci fork-ul e justificat.
- **Swimlanes (opțional, dar impresionează):** împarte diagrama pe verticală în trei culoare
  — `Backend`, `Game Engine`, `Gemini API` — și pune fiecare activitate în culoarul
  responsabil. În draw.io caută `pool` / `swimlane`.

---

## 8. Strategia de branching — `08-git-flow.pdf`

Nu e UML. E o diagramă de tip *Gitflow* — noduri (commit-uri) pe linii orizontale.

### Construcție
- O linie orizontală groasă pentru `main`, culoare `#0F2942`, sus
- Sub ea, câte o linie pentru fiecare feature branch, fiecare cu altă culoare
- **Commit-uri:** cercuri mici (diametru 14px) pe linie
- **Ramificare:** curbă care pleacă din `main` spre linia branch-ului
- **Merge:** curbă care se întoarce în `main`, etichetată cu numărul PR-ului

### Conținut real din proiect

| Branch | Merge prin |
|---|---|
| `branch-initial-setup` | PR #2 |
| `login-and-share` | PR #7 |
| `ai-branch` | PR #8, #9 |
| `testeAgenti` | PR #10 |
| `CItests` | PR #11 |
| `bot-ownership-admin-controls` | PR #12, #13, #14 |
| `seafarers-game-mode` | PR #15, #16 |
| `tests-and-evals` | PR #17 |
| `fix/production-deploy` | (în curs) |

*Sfat:* pentru curbe folosește Edit Style → `curved=1;` — arată mult mai bine decât liniile frânte.

---

## 9. Pipeline CI/CD — `09-cicd.pdf`

Diagramă de tip flowchart, cu două fluxuri paralele.

### Fluxul 1 — `test.yml` (orice push / PR)

```
  [push / pull_request]
          │
          ▼
      ◆ fork ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
      │      │        │        │        │       │
      ▼      ▼        ▼        ▼        ▼       ▼
  test-   test-    build-   build-    lint-   docker-
  agents  backend  backend  frontend  frontend build
   (15)    (140)     (tsc)   (vite)   (eslint)  (imagini)
      │      │        │        │        │       │
      ▬▬▬▬▬▬▬▬▬▬▬▬▬▬ join ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
                     │
                     ▼
                 ✓ / ✗ status pe PR
```

### Fluxul 2 — `deploy.yml` (doar push pe `main`)

Aceleași 6 job-uri, plus:

```
        toate cele 6 job-uri trec
                     │
                     ▼
           ┌──────────────────┐
           │  deploy (SSH)    │
           └──────────────────┘
                     │
                     ▼
        git reset --hard origin/main
        scrie .env din GitHub Secrets
        docker compose up --build -d
        docker image prune -f
```

### Stil
- Job-urile care trec: contur `#059669`
- Poarta de decizie: romb `#D97706` cu textul `toate verificările verzi?`
- Ramura de eșec: săgeată roșie `#DC2626` către un nod `Deploy blocat`
- Marchează vizual `test-backend` și `docker-build` (de ex. cu un chenar mai gros sau o
  steluță) și adaugă o notă: *„adăugate după incidentul de producție”* — leagă diagrama de
  Secțiunea 6.3 din raport.

---

## Ordinea recomandată de lucru

Dacă ești pe timp limitat, fă-le în ordinea asta — primele patru acoperă cerințele de bază:

1. **Use case** (2) — cere cele mai puține decizii, se derivă direct din user stories
2. **Class diagram** (2) — cea mai mare pondere la notare de obicei
3. **Sequence** (7) — arată cel mai bine înțelegerea fluxului
4. **State machine** (6) — rapidă, doar 4 stări
5. **Deployment** (4) — leagă frumos de secțiunea de bug
6. **Component** (3)
7. **Activity** (7)
8. **CI/CD** (9) și **Git flow** (8) — cele mai simple, le poți lăsa la final
