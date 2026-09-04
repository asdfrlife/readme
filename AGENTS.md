# AGENTS.md — Project Rules

## Tech Stack
- Framework: Next.js 16 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- Linting: ESLint (flat config, `eslint.config.mjs`) + `eslint-plugin-sonarjs`
- Testing: Vitest + React Testing Library
- Backend: Supabase

## Code Quality — Hard Rules
- Never disable an ESLint rule with `eslint-disable` unless you've explained *why* it's a genuine false positive in a code comment right above it. Do not disable rules just to make warnings disappear.
- Keep cognitive complexity per function under 15 (sonarjs threshold). If a function is getting complex, break it into smaller named functions instead of suppressing the warning.
- No regular expressions with nested quantifiers or ambiguous backtracking (e.g. `(.+)+`, `[^x]+.[^x]+`). Prefer simpler patterns or non-regex string parsing when validating things like emails.
- Use `Number.parseFloat` / `Number.parseInt` / `Number.isNaN` instead of the bare global versions.
- Use `String.raw` for any string containing multiple backslashes (e.g. regex-like patterns, file paths) instead of manually escaping.
- No `console.log` left in code — use `console.error`/`console.warn` only for actual error paths, and remove debug logging before finishing a task.

## Accessibility (a11y) — Non-negotiable
- Every `<label>` must be associated with its control (wrap the input, or use matching `htmlFor`/`id`).
- Never write alt text containing the words "image," "photo," or "picture" — screen readers already announce the element as an image.
- Purely decorative images get `alt=""`, never omitted alt text.
- Interactive `onClick` handlers on non-native elements (`<div>`, `<span>`) must either:
  - be converted to a native element (`<button>`, `<a>`), or
  - get `role`, `tabIndex={0}`, and a matching `onKeyDown` handler, or
  - if the click handler is purely structural (e.g. `stopPropagation` on a modal backdrop) with no user-facing action, it's fine to suppress the rule — but say so explicitly when you do.
- Modal/dialog elements need `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` pointing at the modal's heading.

## Before Finishing Any Task
1. Run `npx eslint .` — fix everything it flags, or explain why a specific warning is a false positive.
2. Run `npx tsc --noEmit` — zero type errors.
3. Give a completion report (see below) — this is mandatory, never skip it.

## Mandatory Completion Report
At the end of every task, regardless of size, report back in this format before ending your turn:

```
### What I did
- [bullet list of concrete changes: files touched, what was added/removed/fixed]

### Why
- [1-2 lines per non-obvious change — skip this for trivial/self-explanatory edits]

### Checks run
- ESLint: [pass / N issues remaining, listed]
- TypeScript: [pass / N errors remaining, listed]

### Skipped or deferred
- [anything you noticed but didn't fix, and why — e.g. "flagged as false positive," "out of scope," "needs your input"]
```

Do not silently skip a step, silently suppress a lint rule, or silently leave something half-done. If something couldn't be completed, say so explicitly in the report rather than ending the turn without mentioning it.

## Safety Guardrails
- Never hardcode API keys, tokens, or secrets — always use environment variables.
- Never log API keys or tokens, even at debug level.
- Never commit `.env` or `.env.local`.
- Validate all user input before sending it to Supabase or any external API.
- Wrap external API calls (Supabase, OpenRouter, Google AI Studio, etc.) in try/catch with real error handling — never let a rejected promise fail silently.

## Git Conventions
- Use conventional commits: `feat:`, `fix:`, `refactor:`, `test:`, `chore:`, `a11y:`.
- Keep commits focused — don't mix unrelated fixes (e.g. a11y fix + new feature) in one commit.