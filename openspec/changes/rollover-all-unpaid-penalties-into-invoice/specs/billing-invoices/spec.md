## MODIFIED Requirements

### Requirement: Current invoices include unpaid penalties from past invoices when rollover is enabled

#### Scenario: Tenant has unpaid penalties from past months
- Given tenant T has one or more past invoices where `penaltyFee > 0` and `status` is in `["unpaid", "overdue", "pending"]`
- And each such invoice has `billingMonth < M`
- And a new invoice is generated for month M for tenant T
- And `enablePenaltyRollover` is true for tenant T
- Then the new invoice MUST include the sum of all these unpaid penalties in the amount due
- And the invoice MUST add one line item for the rolled penalties:
  - If exactly one source month exists, label it `Previous Month Penalty (YYYY-MM)`
  - If multiple source months exist, label it to indicate multiple months (e.g., `Previous Penalties (start..end)` or “Multiple Months”)
- And the rolled penalty MUST be reflected in `penaltyFee`, `subtotal`, `vat`, and `total`
- And the generated PDF MUST show the same rolled penalty line item and totals.

#### Scenario: Tenant has no unpaid penalties
- Given tenant T has no past invoices with both `penaltyFee > 0` and `status` in `["unpaid", "overdue", "pending"]`
- When a new invoice is generated for month M
- Then no carried-over penalty line item MUST appear
- And totals MUST reflect only current-period charges and fees.

#### Scenario: Tenant pays past penalties before new invoice
- Given tenant T had past invoices with penalties
- And all those invoices are marked `status = "paid"` before generating month M
- When the month M invoice is generated
- Then no past penalties MUST be rolled into the M invoice.

#### Scenario: Multiple unpaid penalty invoices exist
- Given tenant T has unpaid penalty invoices across multiple past months
- When the month M invoice is generated and rollover is enabled
- Then the rolled penalty amount MUST be the sum of all qualifying invoices
- And it MUST be displayed as a single line item with a label indicating multiple months.

## ADDED Requirements

### Requirement: Configurable penalty rollover toggle

#### Scenario: Rollover disabled
- Given a configuration `enablePenaltyRollover` exists
- And it is `false` for tenant T
- When a new invoice for T is generated
- Then unpaid penalties from past invoices MUST NOT be rolled into the new invoice.

### Requirement: Metadata for rolled penalties

#### Scenario: Recording rolled penalties on a new invoice
- When unpaid penalties are rolled into a new invoice
- Then that invoice MUST set:
  - `previousPenaltyIncluded = true`
  - `previousPenaltyAmount` to the rolled total
  - `previousPenaltySourceMonths` to the distinct source months (sorted)
- And these values MUST match the rolled penalty line item, `penaltyFee`, `subtotal`, `vat`, and `total`.
