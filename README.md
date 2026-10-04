# Development Modeler 2.0

Independent local-first version of Development Modeler. Original `../development-modeler` is not modified. No v1 credentials or live database are used. Storage key: `development-modeler-v2`. The application is public on GitHub Pages; financial inputs stay in browser storage unless explicitly saved to the configured Supabase cloud.

## Run and verify

```sh
npm ci
npm run dev # http://127.0.0.1:3200
npm test
npm run typecheck
npm run build # standalone static out/
```

The working checkout currently reuses installed dependencies through a local symlink. `npm ci` in a fresh checkout installs an independent pinned dependency tree.

## Workflow

Select a project in the sidebar. Edit the key assumptions in place, or use Land / Areas / Payments / Timing / Costs shortcuts for detailed inputs. Results, target pricing, sensitivity matrix and monthly plan use the same financial engine. Common schedules, cash flow, workforce and company overhead remain accessible.

Set a project target margin and monthly demand/price percentages. A matrix cell saves a price/speed scenario. A project scenario affects only its project; moving to another project or portfolio resets to Base. Selecting that scenario reopens its project. Goal seek saves a scenario at the required average future sale price. Portfolio scenarios move all project prices proportionately. Demand and monthly price curves are shared base assumptions, not separate scenario-specific versions; snapshots preserve full alternative models.

Monthly demand advances the baseline sales calendar using cumulative effective months. Zero pauses the future schedule; 50% takes two calendar months per baseline sales month. Whole-unit baseline cohorts are preserved. This is a transparent schedule sensitivity model, not an empirical price-demand forecast. Month-specific prices apply in the actual scenario sale month. Unspecified months use 100%. The 48-month view expands for later obligations.

Locked months retain baseline contract values and timing during market scenarios and quick future-price changes. Locking is not a transaction ledger: direct source edits can revise the underlying baseline. Buyer installments continue under their configured plan.

Additional monthly holding costs run from sales start through the final sale and increase with delays. Other budgets and company employment periods retain their explicit settings; longer sales do not silently extend every company contract. Avoid duplicate expense entries.

## Financial conventions

- Lifetime management margin on revenue: (contract revenue − modeled costs) / contract revenue.
- Project result excludes company overhead; portfolio result includes corporate expenses and workforce once. Portfolio margin uses aggregate amounts, not averaged project percentages.
- Profit on cost is a separate metric. NPV discounts end-of-month unlevered cash flows using an annual effective rate. Initial cash is zero; funding requirement is the maximum negative cumulative cash balance.
- Goal seek recalculates revenue-based expenses and changes future prices only. No inventory and unreachable targets produce explicit statuses.
- No automatic currency conversion. Tax depends on explicit cost entries; financing is modeled separately in the Investments module; accounting revenue recognition is not implemented.
- A high/low price is not a forecast of market acceptance. Demand is an independently specified sensitivity.
- RICS development appraisal principles informed the distinction between whole-project profitability, time-based cash flows and sensitivity: https://www.rics.org/profession-standards/rics-standards-and-guidance/sector-standards/valuation-standards/valuation-of-development-property

## Persistence

Autonomous browser-local saving, named recoverable snapshots, JSON backup download. No cloud synchronization with v1. The source includes retained legacy views/helpers; v2 uses the new homepage. Hosting does not synchronize local browser data between devices. Use cloud saving or JSON model export/import.

## Verification

100 unit/export tests including 11 sensitivity tests and 20 investment tests: neutral equivalence, inventory and cash conservation, demand pauses, holding cost changes, fixed contract preservation, monthly prices, goal seek, project scenario isolation, impossible targets, matrix baseline and horizon extension. TypeScript and static production build are required. Browser QA covers in-place inputs, monthly demand, target scenario, navigation, persistence and responsive layout.

## Investments (2.0 update)

The Investments section supports multiple project or portfolio contracts, beginning-of-month contribution tranches, end-of-month principal/income repayments, optional automatic final settlement, and enabled/disabled alternatives. Legacy models need no migration (`investments` is optional). Data, snapshots and JSON backups include the full contract terms.

- Annual rate: nominal annual / 12. Simple interest applies to outstanding contributed capital. Monthly capitalization additionally accrues interest on unpaid interest. Optional monthly income distributions remove that unpaid-interest base.
- Fixed term return: each tranche creates a one-time return obligation equal to contribution × rate. Early principal repayments do not change the promised amount.
- Profit share: positive lifetime project profit after assigned fixed financing returns; portfolio shares apply after all fixed financing returns and project-level shares. Same-base share percentages add, and totals above 100% generate warnings without normalization. No automatic capital write-down or legal liquidation waterfall is assumed on losses.
- Contributions and principal returns never alter operating revenue, costs or profit. Contractual interest/fixed return reduces profit after financing; profit shares distribute its residual. Developer profit subtracts all accrued returns, including unpaid obligations. Corporate taxes are not automatically recalculated for an interest tax shield.
- Repayments in excess of available principal/accrued return are capped and flagged. Transactions after contractual maturity extend automatic settlement and produce an explicit warning. With manual settlement, interest stops at maturity and remaining obligations are shown.
- XIRR: investor cash flow dates use month starts for contributions and next month starts for end-of-month distributions; ACT/365. Outstanding debt is not a fictitious distribution. Incomplete or non-conventional sign-changing flows do not receive an arbitrary annual rate; the UI states why.
- Funding need is recalculated on operating cash plus investments minus scheduled repayments. Payments are modeled even when cash is negative, exposing financing gaps.
- Portfolio sensitivity can display developer margin and residual funding after investments. Goal seek optionally targets developer margin, recalculating profit shares at each trial price. Contract terms are common across price/speed scenarios; use disabled copies or model snapshots for alternatives.
- CSV exports the combined monthly financing/cash schedule. Legacy operating tables and exports retain their operating-only basis.

Browser QA: contract creation, all three types, partial repayment, capitalization, developer-margin goal seek, disabled alternatives, reload persistence and mobile layout.
