# SalesPilot — AI Agent Instructions

> Adapted from [thananon/9arm-skills](https://github.com/thananon/9arm-skills) for the SalesPilot project context.

## Project Context

SalesPilot is a **Vue 3 + Vite** sales management web app.

**Stack:** Vue 3 (Composition API, `<script setup>`), Pinia, Vue Router, Firebase Firestore, Chart.js, TailwindCSS, Lucide Icons, Sweetalert2, date-fns, ExcelJS.

**Architecture:**
```
src/
├── views/           # Page-level components (DashboardView, AllSalesView, etc.)
├── components/      # Reusable components (SalesChart, PullToRefresh)
├── stores/          # Pinia stores (salesStore)
├── services/        # Firebase service layer (salesService)
├── firebase/        # Firebase config & initialization
├── utils/           # Utility functions (dateUtils)
├── layouts/         # Layout wrappers (MainLayout)
├── router/          # Vue Router config with auth guards
├── App.vue          # Root component
└── main.js          # Entry point
```

**Data flow:** View → Pinia Store → Service → Firebase Firestore

**Key domain concepts:**
- **Sales** have `dateTime`, `customerName`, `amount`, `type` (COD or Transfer), `orderNo`
- **COD** = Cash on Delivery (เก็บปลายทาง)
- **Transfer** = Bank transfer (โอนเงิน)
- Firebase Timestamps use `.toDate()` to convert to JS Date objects
- UI is bilingual Thai/English, Thai-primary

---

## Skill 1: Debug Mantra

Four-step discipline for any debug session. Recite verbatim, then apply in order.

### Recite this — verbatim, as the first thing in your first response

> **Mantra:**
> 1. **First is reproducibility.** Can the issue be reproduced reliably?
> 2. **Know the fail path.** Debugger first; then source trace + knob enumeration; then in-code instrumentation.
> 3. **Question your hypothesis.** What would disprove it?
> 4. **Every run is a breadcrumb.** Cross-reference all of them.

Then begin work.

---

### 1. Reproduce reliably

Build a runnable repro before anything else.

- **Reliable repro** → capture the exact steps, inputs, and environment as a runnable artifact: failing test, browser console steps, specific Firestore data state, specific filter combination.
- **Flaky repro** → the bug is not yet debuggable. Raise the rate first: try different browsers, different data sizes, toggle filter modes, clear cache. 50% flake is debuggable; 1% is not.
- **No repro at all** → stop. Say so explicitly. Ask the user for screenshots, browser console logs, network tab output, or Firebase data snapshot. Do **not** proceed to hypothesise.

**SalesPilot-specific repro tips:**
- Check if the bug is **data-dependent**: does it happen with specific date ranges, empty datasets, or particular `type` values?
- Check **Firebase Timestamp vs JS Date**: `sale.dateTime.toDate()` vs `new Date(sale.dateTime)` — the store handles both but edge cases exist.
- Check **filter mode**: the bug may only appear in specific modes (`today`, `thisMonth`, `selectMonth`, `allTime`).
- Check **auth state**: some bugs appear only when auth token is stale or on first load.

Target: a fast, deterministic pass/fail signal.

### 2. Know the fail path

Once reproducible, find *where* the code breaks. Follow the SalesPilot data flow:

```
User interaction (View)
  → Pinia action (salesStore.fetchSales)
    → Service function (salesService.getAllSales)
      → Firebase query (collection, where, orderBy, limit)
        → Firestore response
      ← Data mapping (snapshot.docs.map)
    ← Store state update (this.sales = salesData)
  ← Getter computation (totalSales, summaryByDate, etc.)
← Template rendering (v-for, computed, formatCurrency)
```

Try in this order — escalate only when the prior tactic fails:

1. **Browser DevTools + Vue DevTools.** Inspect component state, Pinia store, network requests to Firestore. One breakpoint beats ten `console.log`s.
2. **Source trace + knob enumeration.** Trace the code path and list every knob:
   - Filter mode, date range, limitCount
   - Firebase index configuration
   - Timestamp format (Firestore Timestamp vs JS Date)
   - Component props, computed dependencies, watcher triggers
3. **In-code instrumentation.** Add `console.log` with unique prefix (e.g. `[DBG-a4f2]`) at suspected fail sites. Tag every probe so cleanup is a single search-and-delete.

### 3. Falsify the hypothesis

When a candidate root cause surfaces, scrutinise it **before** testing it.

- Does it actually explain the symptom end-to-end? Walk the full data flow.
- What is the simplest **proof**? What is the cleanest **disproof**?
- Run the **disproof first**. If the hypothesis survives, it's real.
- Generate 3–5 ranked hypotheses, not one. Single-hypothesis thinking anchors on the first plausible idea.

### 4. Every run is a breadcrumb

Maintain a running **ledger** of every experiment. Each entry: what changed, what happened, what it ruled in or out.

- When a new hypothesis surfaces, walk the ledger. Does it hold for **every** prior observation?
- If any past run contradicts it, the hypothesis is wrong or incomplete.
- Update the ledger after every run.

### Operating rules

- Recite the mantra block **once** per debug session, in your first response. Do not re-recite mid-session.
- Recite **verbatim**. Never paraphrase, shorten, or skip lines.
- If the user says "skip the mantra" → skip the recital but still apply the four steps silently.
- Apply the four steps **in order**: no fix without repro, no hypothesis without fail path, no commit without disproof, no declaration without breadcrumb check.
- The mantra is a constraint **you** carry through the session — not advice to deliver back to the user.

---

## Skill 2: Scrutinize

Stand outside the change and ask whether it should exist at all, then verify it actually does what it claims end-to-end.

### Operating stance

- **Outsider.** Forget who wrote it and why they think it's right. Read the artifact cold.
- **End-to-end, not diff-local.** The diff is the entry point, not the scope. Follow the call graph through real code paths.
- **Actionable, concise, with rationale.** Every finding states *what to change*, *why*, and *what evidence* led you there.

### Workflow

Run these in order. Do not skip ahead.

#### 1. Intent — what is this actually trying to do?

- State the goal in one sentence, in your own words. If you cannot, the artifact is underspecified — say so and stop.
- Ask: **is there a simpler, smaller, or more elegant way to achieve the same goal?** Consider:
  - Doing nothing (is the problem real?).
  - Using something that already exists in the codebase — check existing components, utils, store getters.
  - A smaller change that solves 90% of the goal with 10% of the risk.
  - Solving it at a different layer (Firestore rules vs app code, computed vs watcher, CSS vs JS).

**SalesPilot-specific questions:**
- Does a similar getter already exist in `salesStore`?
- Can this be solved with a Firestore query instead of client-side filtering?
- Is there an existing component in `components/` that can be extended instead of creating a new one?
- Would a Pinia plugin or composable be cleaner than adding logic to individual views?

#### 2. Trace — walk the actual code path

- For each behavior the change claims, trace the path end-to-end:
  - Template binding → `<script setup>` logic → Pinia store action/getter → service function → Firebase query → response mapping → reactive update → re-render.
- Include the unchanged code on either side of the diff. Bugs hide at the seams.
- Note every place the trace surprises you. Surprises are signal.

#### 3. Verify — does it actually do what it claims?

- **Does the traced code path actually produce that behavior?**
- **What inputs / states would break it?** Empty datasets, `null` dates, missing `customerName`, `amount` as string vs number, huge datasets (500+ records), concurrent Firestore updates.
- **What does it silently change?** Performance (unnecessary re-renders), Firebase read costs, error handling, loading state behavior.
- **How is it tested?** Manual testing steps or automated tests?

#### 4. Report

Output one tight section per finding. Order by severity (blocker → major → nit). For each:

- **Finding** — one sentence, specific. Cite `file:line` when applicable.
- **Why it matters** — the consequence.
- **Evidence** — the trace step or input that exposes it.
- **Suggested change** — concrete, minimal.

Close with a one-line verdict: ship / fix-then-ship / rework / reject.

### Operating rules

- **No rubber-stamps.** If you genuinely find nothing, say what you traced and what you checked.
- **Cite or it didn't happen.** Every claim references a specific path, file, or line.
- **One simpler-alternative pass is mandatory.** Even on small changes.
- **Don't pad with style nits when there's a structural problem.**
- **No flattery, no hedging.** State the finding.

---

## Skill 3: Post-Mortem

The canonical engineering record of a bug fix. Written **after** debugging lands a real fix.

### When to invoke

- After the user says "write the post-mortem / write up the root cause / document this fix"
- After a debug session has clearly landed a fix, proactively offer to draft one.

### When NOT to use

- **Bug not fixed yet, or fix not validated.** Refuse and tell the user what's missing.
- **Trivial fix** (typo, obvious one-liner). The commit message is the record.

### Required inputs — refuse to draft without these

- [ ] **Reliable repro** exists.
- [ ] **Root cause is known** (mechanism identified, not hypothesis).
- [ ] **Fix is identified** (specific code changes).
- [ ] **Fix is validated** (the original repro now passes).

### Structure

Use these blocks in this order. **Summary, Root cause, Fix, and Validation are mandatory.**

1. **Summary** _(mandatory)_ — One paragraph. What broke, what fixed it.
2. **Symptom** — What was actually observed. Error messages, wrong data, UI glitch.
3. **Root cause** _(mandatory)_ — The actual bug mechanism. Code identifiers welcome: component names, function names, store getters, service methods, Firebase paths.
4. **Why it produced the symptom** — Link the root cause to what the user saw.
5. **Fix** _(mandatory)_ — What changed and why this change addresses the root cause.
6. **How it was found** — The debugging path. Hypotheses tried and rejected.
7. **Why it slipped through** — What allowed this bug to reach production. Pick the real reason: no test, latent code, workload gap, incomplete prior fix.
8. **Validation** _(mandatory)_ — How we know the fix works. Concrete: tested with specific data, specific filter modes, specific browsers.
9. **Action items / follow-ups** — Concrete next-steps.

### Output

- Save post-mortems to `docs/post-mortems/YYYY-MM-DD-<short-slug>.md`
- Use the structure above.
- **Never invent root cause, owner, validation, or action items.** If facts aren't there, ask.
- **Blameless.** Describe gaps and bugs, never people.

---

## Skill 4: Management Talk

Rewrite engineer-to-engineer content for non-technical stakeholders.

### Audience

Business-savvy non-engineers: team leads, product owners, business partners. They understand product terms but not code. They want: *what's the state, what does it mean for the business, who owns it, what's next.*

### Tone

**Keep.** Product names (SalesPilot, Dashboard, COD Import), feature names, customer impact terms, dates, numbers.

**Strip.** Component names, function names, file paths, store/service internals, Firebase collection paths, Vue reactivity details.

**Translate.** Technical mechanism into plain-language cause-and-effect in Thai.
- Not: "`salesStore.summaryByDate` getter returns wrong keys because `dateTime.toDate()` returns UTC"
- But: "ระบบคำนวณยอดขายรายวันผิดพลาดเพราะเวลาที่ดึงมาจากฐานข้อมูลไม่ตรงกับเวลาไทย"

**Don't over-strip.** Concept-level vocabulary is fine: bug, ระบบล่ม, ข้อมูลหาย, import ผิดพลาด, filter ทำงานผิด.

### Channel shapes

#### LINE / Chat message
- One **bolded TL;DR** as the first line.
- 2–4 short bullets: impact, owner, next step.
- Under ~80 words.

#### รายงานประจำสัปดาห์ / Status report
- **สถานะ** — one line summary.
- **ผลกระทบ** — who's affected, how.
- **สิ่งที่แก้ไข** — plain Thai explanation.
- **ขั้นตอนถัดไป** — concrete, near-term.

#### ประชุมทีม / Meeting talking-points
- Bullet list, max one clause per bullet.
- Include numbers you want to reference.
- Order is the order you'll speak in.

### Rules

- **Never invent facts.**
- **Never strip product names or dates** during de-jargoning.
- **Stay out of advocacy.** Produce a status update, not a recommendation.
- **ภาษาไทยเป็นหลัก** unless the user requests English.

---

## When to activate each skill

| Trigger | Skill |
|---------|-------|
| User reports a bug, says something is broken/failing, pastes an error | **debug-mantra** |
| User asks to review, audit, sanity-check code or a plan | **scrutinize** |
| User asks to document a fix, write a post-mortem/RCA | **post-mortem** |
| User asks to write for management, make something less technical, write a status update | **management-talk** |
