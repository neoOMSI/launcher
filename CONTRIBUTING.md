# Contributing to the neoOMSI Launcher

Thanks for your interest in contributing. Like [neoOMSI](https://github.com/neoOMSI/neoOMSI), the launcher optimizes for **correctness, simplicity, and long-term maintainability** over raw merge volume.

## Non-negotiable principles

1. **The engine owns the data:** The launcher shows and edits what the engine reports over its [protocol](https://github.com/neoOMSI/neoOMSI/blob/main/docs/LAUNCHER_PROTOCOL.md). It does not parse OMSI content, settings files, or install folders itself. A feature that needs new data starts as a neoOMSI PR adding the command or event. `proto/launcher.proto` is a copy of neoOMSI's schema: `pnpm sync:engine` copies it from a neoOMSI checkout beside this one and regenerates `src/types/launcher_pb.ts`, which is never edited by hand.
2. **No AI slop / Strict code ownership:** AI tools may assist your workflow, but generated code receives **no lower review standard**. Every line submitted must be understood, verified, and defended by the author. Speculative abstractions, unreviewed AI dumps, and vibe-coded refactors will be closed during triage.
3. **Focused PR scope:** Keep diffs tight and focused on one change. Never combine bug fixes with unrelated cosmetic refactoring, reformatting, or dependency updates.
4. **No proprietary assets:** Never commit OMSI screenshots, textures, or other copyrighted material. The neoOMSI name and logos follow [TRADEMARKS.md](TRADEMARKS.md).

## Quick contribution checklist

1. **Build & test locally:**
   - Install Node.js 24 and pnpm, then `pnpm install`.
   - Work against the mock engine with `pnpm dev:app`, or against a real one with `pnpm dev:real` (a neoOMSI checkout beside this one, built with `cargo build --release -p core`).
   - Ensure the checks pass: `pnpm format:check`, `pnpm build`, `pnpm test`.
2. **Branch from `main`:**
   - Use short-lived, single-purpose branches (`feat/`, `fix/`, `refactor/`, `docs/`, `chore/`).
   - `main` is what every neoOMSI build packs: it must always build and package.
3. **Keep both languages:**
   - Every new text goes into `src/i18n` in English and German.
4. **Open your Pull Request:**
   - Document the _what_, _why_, and how you validated the change. Add screenshots for visible changes.
   - Link the neoOMSI PR when the change depends on a new engine command or event.
