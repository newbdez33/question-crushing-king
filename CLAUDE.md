# Claude Code Guidelines

This file provides guidance for AI assistants (Claude, Copilot, etc.) working on this codebase.

## Package Manager

**This project uses `pnpm` as the package manager. Do NOT use `npm` or `yarn`.**

- Install dependencies: `pnpm install`
- Add a package: `pnpm add <package>`
- Add a dev dependency: `pnpm add -D <package>`
- Run scripts: `pnpm <script-name>`

The lock file is `pnpm-lock.yaml`. Never create or commit `package-lock.json` or `yarn.lock`.

## Common Commands

```bash
# Install dependencies
pnpm install

# Development server
pnpm dev

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Build for production
pnpm build

# Run unit tests
pnpm test

# Run E2E tests
pnpm test:e2e
```

## Project Structure

- `/src` - Source code (React + TypeScript)
- `/public/data` - Exam JSON files and images
- `/docs` - Documentation
- `/scripts` - Utility scripts

## Tech Stack

- **UI Framework**: React with ShadcnUI (TailwindCSS + RadixUI)
- **Build Tool**: Vite
- **Routing**: TanStack Router
- **Language**: TypeScript
- **Testing**: Vitest (unit), Playwright (E2E)
- **Backend**: Firebase (Auth, Realtime Database)

## Code Style

- Use TypeScript strict mode
- Follow existing code patterns
- Run `pnpm lint` before committing
- Run `pnpm typecheck` to ensure no type errors

## CI/CD

The CI pipeline (`.github/workflows/ci-validate.yml`) runs:
1. `pnpm install --frozen-lockfile`
2. `pnpm typecheck`
3. `pnpm lint`
4. `pnpm build`
5. `pnpm test`

All checks must pass before merging.
