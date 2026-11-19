# Anniversary Experience Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans; independent file ownership permits parallel helpers under the session's delegation instructions.

**Goal:** Deliver the approved anniversary website in the original repository with usable, persistent browser-local interactions.

**Architecture:** A React page composes the existing Countdown and FlipDigit boundaries, new dialogs/forms, and tested date/storage utilities. Plain CSS/Sass provides the original pink/blue aesthetic. Photos remain local and are compressed before persistence.

**Tech Stack:** Existing React 19, react-scripts 5, Sass, react-icons, canvas-confetti, Jest and Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-19-anniversary-design.md`

## Global Constraints

- Work in `MMeMercury/anniversary`; retain existing Coconut/Mio and `2026-11-02T18:00` defaults.
- Preserve pink/blue gradients, dark split-flap clock, typing, hearts, and celebration.
- Use current-browser local storage only; explain no cross-device sharing.
- No invented personal photos. Validate dates, malformed data, image limits, and storage failures.
- Body text at least 16px, labels at least 14px, reduced-motion and keyboard support.

## Review Focus

- Future dates, leap days, midnight and DST must not produce negative countdowns or false anniversaries.
- Valid JSON with an invalid shape must not crash the page; denied storage and full quota must not falsely report saving.
- User text containing markup stays text; all memory records remain editable.
- Very long names and narrow mobile screens must remain readable without horizontal overflow.
- Dialog focus, Escape, photo processing completion, and cancellation must preserve user control.

## Task 1: Date and persistence utilities

**Files:** `src/utils/anniversary.js`, `src/utils/storage.js`, and their `.test.js` files.

**Interfaces:** `getElapsedParts(startDate, now)` returns `{days,hours,minutes,seconds,isFuture,valid}`; `getAnniversary(startDate, now)` returns `{date,years,daysRemaining,isToday,isStart}` or null; `isValidLocalDate(value)` returns boolean. `DEFAULT_CONFIG`, `DEFAULT_MEMORIES`, `loadLocalState()` returns `{config,memories,notice}`, `writeConfig(value)` and `writeMemories(value)` return `{ok,error}`.

- [ ] Write behavior tests with literal expected date and storage outcomes, run RED.
- [ ] Implement date arithmetic and localStorage normalization/error handling.
- [ ] Run focused tests GREEN and report exact commands.

## Task 2: Interactive page and original visual language

**Files:** `src/pages/HomePage.js`, `src/pages/HomePage.scss`, `src/components/Countdown.js`, `src/components/FlipDigit.js`, `src/components/FlipDigit.scss`, `src/components/Modal.js`, `src/components/TypewriterText.js`, `src/components/PhotoField.js`, `src/App.js`, `src/App.test.js`, `src/index.css`.

**Interfaces:** Consume Task 1 exactly. `Countdown({parts})`, `FlipDigit({digit})`, `Modal({title,onClose,children,className})`, `TypewriterText({text})`, `PhotoField({value,onChange,onBusyChange})`.

- [ ] Replace stale template test with failing behavioral tests for settings, persistence, memory CRUD, and safe user text.
- [ ] Implement editable settings and letter, accessible dialogs, local photo compression, live counter and memory controls.
- [ ] Apply responsive pink/blue styling and true split-flap digit animation, with reduced-motion handling.
- [ ] Run the complete test suite; verify desktop/mobile rendering and interactions.

## Task 3: Package, review, and deliver

**Files:** `public/index.html`, `public/manifest.json`, `public/heart.svg`, `README.md`, `.openai/hosting.json` and minimal hosting scripts if required.

- [ ] Update Chinese metadata and actual run/build instructions; document local-data and date behavior.
- [ ] Run production build and review the entire diff with an independent reviewer.
- [ ] Fix concrete functional findings, then run the relevant tests and final build.
- [ ] Commit and publish the exact verified source to the original GitHub repository and a private Site; verify the commit and deployment receipts.
