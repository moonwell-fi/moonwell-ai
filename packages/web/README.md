# agents.moonwell.fi

Landing page for the Moonwell AI skill.

## Development

```bash
pnpm dev    # localhost:3000
pnpm build  # production build
```

## Notes

- Next.js 16 — breaking changes from v14/v15, read `AGENTS.md` before touching framework code
- Tailwind CSS v4 (`@theme inline` pattern, no `tailwind.config.ts`)
- `public/skill.md` is the static skill definition served at `/skill.md`
