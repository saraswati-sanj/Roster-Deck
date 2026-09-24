RosterDesk — Hospital Shift Roster

RosterDesk is a React + TypeScript hospital workforce scheduling application for creating, reviewing, validating, and publishing weekly staff rosters.

The application is designed as a time-boxed assessment implementation and focuses on domain validation, predictable state management, asynchronous behavior, conflict handling, accessibility, and testability.

1. Features

Roster Board

Weekly roster view

Ward filtering

Role filtering

Staff search

Daily shift assignments

Daily and weekly coverage information

Shift editing through a drawer

Draft and published roster states

Shift Types

D — Day: 07:00–15:00

E — Evening: 15:00–23:00

N — Night: 23:00–07:00

L — Leave

Leave is represented as a roster/availability state rather than as an additional time-based working shift.

Other Screens

Swap Requests

Publish Week

Ward Settings

Dev Panel

2. Technology Stack

React 18+

TypeScript

Vite

React Router

TanStack Query

Zustand

React Hook Form

Zod

Vitest

React Testing Library

CSS

3. Architecture

The project uses a feature-based architecture with separation between presentation, domain, and data concerns.

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

Layers

Presentation

React pages

UI components

Forms

Drawers

Modals

User interactions

Domain

Roster models

Scheduling rules

Validation logic

Business constraints

Data

Fake API

Repository/data-access logic

Simulated asynchronous behavior

State

TanStack Query for server state

Zustand for UI/application state

Forms

React Hook Form

Zod validation

4. Scheduling Rules

The application includes domain validation for the assessment's R1–R9 rules.

R1 — One Shift Per Day

A staff member cannot have more than one shift on the same date.

R2 — Minimum Rest

A minimum of 11 hours of rest is required between applicable shifts, including overnight/week-boundary scenarios.

R3 — Weekly Hours

More than 40 hours → warning

More than 48 hours → error

R4 — ICU Certification

An ICU assignment must not be made after the relevant ICU certification has expired.

R5 — Leave Conflict

A working shift must not conflict with approved leave.

R6 — Consecutive Nights

More than 3 consecutive night shifts produce a warning.

R7 — Coverage

Coverage is shown while editing. Understaffing is treated more strictly during publishing.

R8 — Swap Validation

A swap must be validated against the resulting post-swap roster.

R9 — Published Roster

A published roster is read-only. Unpublishing requires a reason and records the unpublish action.

5. Async and Conflict Handling

The application uses a fake API to simulate realistic asynchronous behavior required by the assessment.

The simulated behavior includes:

Network latency

Failed writes

Offline behavior

Concurrent manager changes

Conflict responses

Optimistic updates

Rollback after failed writes

Recovery/refetch behavior

The Dev Panel provides controls for exercising these scenarios.

6. Optimistic Updates

Roster changes can be applied optimistically in the UI.

The general flow is:

User edits shift
      ↓
UI updates optimistically
      ↓
Fake API write
      ↓
Success ───────────────→ Keep change
      ↓
Failure/conflict
      ↓
Rollback / show error

This allows failure and concurrent-edit behavior to be tested without requiring a production backend.

7. URL State

Roster view state is represented through the URL where applicable.

This allows filters and search state to participate in navigation and makes the URL the source of truth for relevant view state.

Example:

/roster?ward=ICU&q=san

8. Accessibility and UX

The implementation uses:

Semantic form controls

Labels for inputs

Visible validation feedback

Keyboard-focus states

Buttons with clear actions

Error and warning messages

Responsive layout behavior

Read-only behavior for published state

9. Testing

The project uses:

Vitest for automated tests

React Testing Library for component testing

Run:

npm test

The assessment requires at least:

6 domain-rule tests

1 component test

Manual testing is also used for the roster workflows, validation behavior, optimistic rollback, conflict scenarios, and publishing flow.

10. Getting Started

Prerequisites

Node.js

npm

Install dependencies

npm install

Start the development server

npm run dev

The application is normally available at:

http://localhost:5173

11. Available Scripts

Command

Description

npm run dev

Start the Vite development server

npm test

Run Vitest tests

npm run typecheck

Run TypeScript type checking

npm run build

Create the production build

Before submission, the recommended verification sequence is:

npm test
npm run typecheck
npm run build

12. Manual Testing Areas

The main workflows can be checked through:

Roster

Open a staff shift

Change the shift

Review live validation

Save/cancel changes

Verify error and warning behavior

Swap Requests

Review swap requests

Test the available swap actions

Verify validation against the resulting roster

Publish Week

Review roster validation

Review warnings/errors

Publish the roster

Verify the published roster becomes read-only

Test the unpublish workflow

Ward Settings

Review and update ward coverage requirements

Verify the roster coverage reflects the configured requirements

Dev Panel

Use the available simulation controls to test:

Offline behavior

Failed writes

Another-manager edits

Conflict handling

Recovery behavior

13. Known Limitations

This project is a time-boxed assessment implementation rather than a production hospital scheduling system.

The backend is intentionally simulated with a fake API. Therefore:

Data is local to the application

Server persistence is not production-grade

Concurrency behavior is simulated

Some production infrastructure concerns are outside the scope of the assessment

Advanced edge cases should be considered within the context of the assessment's time-box.

The implementation and tests should be treated as the source of truth for the exact behavior demonstrated by this submission.

14. AI Usage Disclosure

AI assistance was used during development for:

Code generation

Debugging

Refactoring and code organization

Explaining implementation details

Test and error analysis

Documentation assistance

Generated suggestions were reviewed and adapted during development.

The project was run and checked locally using the development server, automated tests, TypeScript type checking, and production build.

15. Project Goal

RosterDesk demonstrates a maintainable React application for hospital workforce scheduling with an emphasis on:

Type-safe React development

Feature-based architecture

Domain-driven validation

Server-state management

Form validation

Optimistic UI updates

Error and conflict handling

Automated testing

Responsive UI

Clear user feedback
