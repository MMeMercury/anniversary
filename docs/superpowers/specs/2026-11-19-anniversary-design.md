# Anniversary website upgrade

## Intent and approved decisions

Upgrade `MMeMercury/anniversary` in the original repository. The user approved implementation and explicitly chose the original pink/blue gradient and flip-clock style. GitHub application access to the personal account is now installed for all repositories. Earlier draft writes failed; the current base is `675349efd82699d37c64dfd8777930a0a3c11a0e`.

## Experience

- Keep Coconut, Mio and the local start time `2026-11-02T18:00` as the existing defaults.
- A responsive Chinese single-page site with pastel pink/blue, dark split-flap time cards, a plain-text typewriter greeting, subtle hearts, and optional confetti.
- Show elapsed days/hours/minutes/seconds. A future start date switches the main clock to a nonnegative countdown.
- Show the next anniversary, using calendar days and recognizing the whole anniversary date as today. February 29 anniversaries use February 28 in non-leap years; future starts show the beginning milestone, never negative anniversaries.
- Edit names, start date, greeting, subtitle, and letter. Store changes in the current browser with an explicit local-only explanation.
- Add, edit, and delete dated memories, with optional locally uploaded photos. All records including the initial memory are editable. Do not invent personal photographs or dates.
- Read a personal letter in an accessible dialog and trigger a celebration deliberately.
- Support keyboard navigation, Escape and focus restoration in dialogs, reduced motion, mobile widths, and safe rendering of user text.

## Technical choices made by implementer

Keep the existing React 19 / Create React App / Sass stack to minimize migration risk. Use existing dependencies. Replace duplicated timing code with tested utilities and integrate the existing Countdown/FlipDigit component boundaries. Use native React text for typing so custom greetings are not interpreted as HTML. Compress uploaded raster images, cap file sizes, and catch storage quota/errors before reporting success. Preserve recoverable local data if loading fails. No backend, account system, or cross-device synchronization is implied.

## Approaches considered

1. Upgrade the original React app: selected because the user explicitly requested the same repository and style.
2. Separate replacement application or framework migration: unnecessary for the approved interaction scope.

## Delivery and acceptance

Meaningful Jest tests cover date boundaries, malformed storage and failed writes, settings persistence, memory CRUD, and dialog behavior. Run a production build and desktop/mobile browser checks. Commit verified source to the original repository with a guarded fast-forward update. Use Sites for a private runnable deployment of the same source; preserve the user's original repository as the source of the upgrade. Report the real commit and live URL only after their respective receipts.
