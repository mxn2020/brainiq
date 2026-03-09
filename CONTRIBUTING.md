# Contributing to BrainIQ

Thank you for your interest in contributing!

## Development Setup

```bash
cd web
pnpm install
npx convex dev        # Start Convex backend
pnpm run dev          # Start Vite dev server
```

## Contribution Workflow

1. **Fork** the repository
2. **Create a branch**: `git checkout -b feat/my-feature`
3. **Make your changes** and add tests
4. **Ensure checks pass**: `pnpm lint && pnpm test:run && pnpm build`
5. **Commit** with a conventional message: `feat: add new question category`
6. **Push** and open a Pull Request

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation only
- `refactor:` — Code restructuring
- `test:` — Adding or updating tests
- `chore:` — Tooling, CI, dependencies

## Code Style

- TypeScript strict mode
- Prettier for formatting
- ESLint for linting

## Questions?

Open an issue or reach out at support@geenius.app.
