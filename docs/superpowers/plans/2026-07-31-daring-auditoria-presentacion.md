# Daring Audit Presentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a professional, navigable HTML presentation that explains Daring's website conversion problems and prioritized improvements in plain Spanish.

**Architecture:** A single static HTML deck contains the 11 slides, navigation logic, and presentation-specific CSS. A small token stylesheet centralizes the palette and typography. Remote Daring images are used only as visual evidence, with graceful fallback styling if unavailable.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript, Google Fonts, remote Daring image assets.

---

### Task 1: Create the visual token layer

**Files:**
- Create: `assets/design-tokens.css`

- [ ] **Step 1: Define semantic tokens**

Create cream, red, charcoal, olive, muted text, border, shadow, heading font, body font, slide spacing, and radius variables. Keep component styles consuming variables rather than raw colors.

- [ ] **Step 2: Verify token file exists**

Run: `Test-Path -LiteralPath "assets\design-tokens.css"`
Expected: `True`

### Task 2: Build the presentation deck

**Files:**
- Create: `daring-auditoria.html`

- [ ] **Step 1: Add the 11-slide content structure**

Use the approved structure from the design spec. Each slide must have one main message, a short explanation, and a visual treatment such as a card grid, before/after split, flow, or action timeline.

- [ ] **Step 2: Add accessible navigation**

Implement previous/next buttons, keyboard arrows, spacebar, clickable deck navigation, slide counter, progress bar, and a `prefers-reduced-motion` fallback.

- [ ] **Step 3: Add responsive styles**

Use a 16:9 desktop canvas and a vertically scrollable mobile layout with readable text, no clipped cards, and controls that remain accessible.

- [ ] **Step 4: Add Daring visual evidence**

Use public Daring image URLs for the product and pizza slides. Add alt text and fallback blocks with labels so the message remains understandable if a remote image fails.

- [ ] **Step 5: Add a print-friendly mode**

Make each slide visible in print/PDF output and hide interactive controls in print media.

### Task 3: Validate the deliverable

**Files:**
- Verify: `daring-auditoria.html`
- Verify: `assets/design-tokens.css`

- [ ] **Step 1: Check required presentation hooks**

Run: `rg -n "slide|progress|ArrowRight|ArrowLeft|prefers-reduced-motion|@media print" daring-auditoria.html`
Expected: matches for slide markup, navigation, accessibility motion fallback, and print styles.

- [ ] **Step 2: Check for unfinished copy**

Run: `rg -n "TODO|TBD|Lorem|undefined" daring-auditoria.html assets/design-tokens.css`
Expected: no matches.

- [ ] **Step 3: Review final status**

Run: `git status --short`
Expected: only the new presentation, token file, spec, and plan are listed if the directory is under version control.
