# 刷题大王

A modern exam practice application with multiple study modes, progress tracking, and cross-device synchronization.

## Features

- **Question Bank Management** - Load JSON question banks from `/public/data`
- **Practice Mode** - Answer questions one by one with instant scoring
- **Study Mode** - View correct answers and explanations with bookmark support
- **Exam Mode** - Simulated exams with random question sampling
- **Mistake Review** - Targeted practice on previously incorrect answers
- **Progress Sync** - Cross-device synchronization via Firebase

## Tech Stack

| Category | Technology |
|----------|------------|
| UI Framework | React 19 + TypeScript |
| Component Library | ShadcnUI (TailwindCSS + RadixUI) |
| Build Tool | Vite 6 |
| Routing | TanStack Router |
| State Management | Zustand |
| Backend | Firebase (Auth, Realtime Database) |
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
VITE_FIREBASE_DATABASE_URL=
```

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
