# Design

## Data Model
- Reuse existing billing fields (`penaltyFee`, `items`, `subtotal`, `vat`, `total`).
- Add metadata when rollover is applied:
  - `previousPenaltyIncluded: boolean`
  - `previousPenaltyAmount: number`
  - `previousPenaltySourceMonths: string[]`

## Rollover Logic
- For tenant `T` and new billing month `M`:
  - Fetch all unpaid/overdue/pending invoices for `T`.
  - Filter to invoices with `billingMonth < M` and `penaltyFee > 0`.
  - Sum all qualifying penalties into `rolledPenaltiesTotal`.
  - Collect distinct source months, sorted ascending.
- If rollover is enabled for the tenant:
  - Add one line item to `items`:
    - If one month: `Previous Month Penalty (YYYY-MM)`
    - If multiple months: `Previous Penalties (start..end)` (or "Multiple Months" when range is unclear).
  - Increase `penaltyFee` by the rolled total and recompute `subtotal`, `vat`, `total`.
  - Set metadata fields above with the rolled amount and source months.

## Toggle
- A configuration flag `enablePenaltyRollover` controls whether rollover applies.
- Default behavior: global flag is true unless explicitly disabled per tenant (`tenant.billing?.enablePenaltyRollover === false`).

## Rendering (UI + PDF)
- Invoice tables already render `items`; the rolled penalty item will appear with its label.
- Guard against duplicate penalty rows by skipping fallback penalty rows when any item description contains “penalty”.
- Summary sections continue to show `penaltyFee` totals, which now include rolled amounts.
