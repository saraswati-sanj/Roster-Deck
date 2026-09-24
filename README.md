# RosterDesk — Hospital Shift Roster

RosterDesk is a **React + TypeScript hospital workforce scheduling application** for creating, reviewing, validating, and publishing weekly staff rosters.

The application is designed as a **time-boxed assessment implementation** and focuses on:

- Domain validation
- Predictable state management
- Asynchronous behavior
- Conflict handling
- Accessibility
- Testability

---

# 1. Features

## Roster Board

The Roster Board provides:

- Weekly roster view
- Ward filtering
- Role filtering
- Staff search
- Daily shift assignments
- Daily and weekly coverage information
- Shift editing through a drawer
- Draft and published roster states

## Shift Types

| Code | Shift | Time |
|---|---|---|
| **D** | Day | 07:00–15:00 |
| **E** | Evening | 15:00–23:00 |
| **N** | Night | 23:00–07:00 |
| **L** | Leave | — |

> **Note:** Leave is represented as a roster/availability state rather than an additional time-based working shift.

## Other Screens

- **Swap Requests**
- **Publish Week**
- **Ward Settings**
- **Dev Panel**

---

# 2. Technology Stack

| Technology | Purpose |
|---|---|
| **React 18+** | User interface |
| **TypeScript** | Type safety |
| **Vite** | Development and build tooling |
| **React Router** | Application routing |
| **TanStack Query** | Server-state management |
| **Zustand** | UI/application state |
| **React Hook Form** | Form management |
| **Zod** | Form/schema validation |
| **Vitest** | Unit testing |
| **React Testing Library** | Component testing |
| **CSS** | Styling and responsive UI |

---

# 3. Architecture

The project uses a **feature-based architecture** with separation between presentation, domain, and data concerns.

```text
src/
├── features/
│   └── roster/
│       ├── data/
│       ├── domain/
│       │   └── rules/
│       └── presentation/
├── components/
├── store/
├── test/
└── ...
