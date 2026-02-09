# Implementation Plan: Room booking price calculator

**Branch**: `001-room-pricing-calculator` | **Date**: Monday Feb 9, 2026 | **Spec**: [`specs/001-room-pricing-calculator/spec.md`](spec.md)
**Input**: Feature specification from `specs/001-room-pricing-calculator/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature delivers a React-based web interface that lets users select a room, choose start and end datetimes (1-hour granularity), and calculate the total booking price using CSV-driven combo pricing rules. The system prioritizes combo prices over hourly extensions to find the cheapest valid price. The UI will be entirely in Vietnamese and must provide a detailed explanation of the price breakdown.

## Technical Context

**Language/Version**: TypeScript (React 19)
**Primary Dependencies**: React, React DOM, Vite, shadcn/ui (for UI components), csv-parse (or similar for CSV), date-fns (for date manipulation)
**Storage**: Client-side memory (pricing loaded from `src/assets/pricing.csv`)
**Testing**: Vitest (runner), React Testing Library (component tests) - aligned with Constitution
**Target Platform**: Modern desktop and mobile web browsers (evergreen)
**Project Type**: Single-page web application
**Performance Goals**: Instant calculation (<100ms), immediate UI response
**Constraints**:
- **Language**: Vietnamese UI only (per clarification)
- **Input**: 1-hour granularity (per clarification)
- **Rates**: Fixed hourly rates (70k/80k) for all rooms (per clarification)
- **Breakdown**: Mandatory detailed Vietnamese explanation
**Scale/Scope**: Single property, small dataset (~100 rooms), client-side only

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I – Code Quality Excellence**: Plan uses typed entities (`Room`, `BookingRequest`, `PriceBreakdown`) and pure functions for calculation logic.
- **Principle II – Testing-First Discipline**: Plan explicitly requires failing unit/integration tests before implementation for each user story.
- **Principle III – Modern UI/UX Consistency**: Uses shadcn/ui and enforces consistent Vietnamese language.
- **Principle IV – Performance-By-Design**: Calculations are client-side and optimized (segment-based).
- **Principle VII – Documentation & Knowledge Sharing**: Includes `research.md`, `data-model.md`, `contracts/`, and `quickstart.md`.

All gates are considered **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/001-room-pricing-calculator/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── main.tsx
├── App.tsx
├── index.css
├── assets/
│   └── pricing.csv
└── features/
    └── room-pricing/
        ├── components/          # React + shadcn/ui components (RoomPricingCalculator, PricingForm, PricingResult)
        ├── hooks/               # Custom hooks (useRoomPricing, usePriceCalculation)
        └── lib/                 # Pure domain logic (pricing engine, segmentation, formatting)

tests/
└── room-pricing/
    ├── unit/                    # Pure logic tests (calculation, parsing)
    ├── integration/             # Hook/Flow tests
    └── components/              # UI Component tests
```

**Structure Decision**: Feature-based architecture within `src/features/` to keep domain logic and UI collocated, with mirrored test structure.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None      | N/A        | N/A                                 |
