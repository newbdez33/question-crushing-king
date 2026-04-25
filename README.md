# 刷题大王

A modern exam practice application with multiple study modes, progress tracking, and cross-device synchronization.

## Features

- **Question Bank Management** - Load registered JSON question banks from `/public/data`
- **Practice Mode** - Answer questions one by one with instant scoring
- **Study Mode** - View correct answers and explanations with bookmark support
- **Exam Mode** - Randomized question sessions by count; full paper submission, result page, and review flow are planned
- **Mistake Review** - Targeted practice on previously incorrect answers
- **My Exams** - Personalized list of joined exams
- **Progress Sync** - Cross-device synchronization via Firebase
- **Profile Data** - Firebase Auth profile fields plus custom Realtime Database fields
- **Localization** - English, Simplified Chinese, Traditional Chinese, and Japanese UI strings, with localized answer explanations when present in question data

## Tech Stack

| Category | Technology |
|----------|------------|
| UI Framework | React 19 + TypeScript |
| Component Library | ShadcnUI (TailwindCSS + RadixUI) |
| Build Tool | Vite 7 |
| Package Manager | pnpm 9.15.0 |
| Routing | TanStack Router |
| State Management | Zustand + React Context |
| Backend | Firebase (Auth, Realtime Database) |
| Localization | LanguageProvider (`en`, `zh`, `zh-TC`, `ja`) |
| Testing | Vitest (unit), Playwright (E2E) |

## Getting Started

> **Note**: This project uses `pnpm` as the package manager. Do not use npm or yarn.

```bash
# Clone the project
git clone <your-repo-url>
cd examtopics

# Install dependencies
pnpm install

# Start development server
# Runs `pnpm typecheck` first via the `predev` script.
pnpm dev

# Type checking
pnpm typecheck

# Run tests
pnpm test
```

## Environment Variables

Copy `.env.example` to `.env` and configure Firebase variables:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_FIREBASE_DATABASE_URL=
VITE_SHOW_DEVTOOLS=
```

See [User Data](./docs/technical/user-data.md) for the LocalStorage and Firebase Realtime Database paths.

## Project Structure

```
├── src/
│   ├── features/      # Feature modules
│   ├── components/    # Shared components
│   ├── routes/        # Route configuration
│   ├── stores/        # State management
│   ├── hooks/         # Custom hooks
│   └── lib/           # Utility functions
├── public/data/       # Question bank JSON and images
└── docs/              # Project documentation
```

## Documentation

See [docs/](./docs/index.md) for detailed documentation:

| Category | Documents |
|----------|-----------|
| **Design** | [Features](./docs/design/features.md) · [Exam Mode](./docs/design/exam-mode.md) · [My Exams](./docs/design/my-exams.md) |
| **Technical** | [Architecture](./docs/technical/architecture.md) · [Exam Mode](./docs/technical/exam-mode.md) · [User Data](./docs/technical/user-data.md) · [Theme](./docs/technical/theme.md) |
| **Testing** | [Strategy](./docs/testing/strategy.md) · [Coverage Plan](./docs/testing/coverage-plan.md) · [Coverage Results](./docs/testing/coverage-results.md) |

## License

MIT
