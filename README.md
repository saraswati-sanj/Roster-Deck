# RosterDesk

A React + TypeScript implementation of the RosterDesk hospital shift roster assignment.

## Run

```bash
npm install
npm run dev
```

Checks:

```bash
npm run typecheck
npm test
npm run build
```

## Architecture

```text
src/
├── app/                         # Router and application shell
├── core/
│   ├── api/                     # Typed API errors and HTTP boundary
│   ├── time/                    # Hospital-time helpers and injectable clock
│   └── url/                     # Zod-validated URL state
├── features/
│   ├── roster/
│   │   ├── domain/               # Entities, rules, schemas, use cases
│   │   ├── data/                 # DTO boundary, mappers, fake repository/API
│   │   └── presentation/        # Pages, components, hooks, Zustand UI state
│   ├── swaps/
│   └── publish/
└── test/
```

The domain layer does not import React, React Router, TanStack Query, Zustand or fetch. Presentation talks to the repository through hooks, and DTO mapping happens at the data boundary.

## Implemented assignment areas

- URL-driven week / ward / role / staff search
- Roster grid and shift drawer
- Live domain validation
- Rest, weekly hours, ICU certification, leave, night streak and coverage rules
- Fake API latency, write failures, idempotency and 409 version conflicts
- TanStack Query server state with optimistic update and rollback
- Zustand UI/dev state
- Swap requests with bulk approve and rejection validation
- Publish review with error blocking and warning acknowledgement
- Lazy-loaded publish route
- Ward staffing settings with cross-field Zod validation
- Domain tests and a React Testing Library component test
- Accessible labels, buttons, status messages and keyboard-friendly controls

## Notes / trade-offs

The assignment specifies a 2-hour time box. This implementation prioritises the architecture and the scenarios that demonstrate the main engineering decisions. The fake API uses an in-memory store instead of MSW to keep the submission small.

A production version would add the remaining 300-staff seed volume, a stronger multi-tab BroadcastChannel flow, router-level navigation blocking for unsaved drawer state, a persistent unpublish audit log, full cross-week roster hydration, and more exhaustive swap validation.

AI tools were used as an implementation assistant. The code was organised around the supplied assignment requirements and should be reviewed and understood by the candidate before submission.
