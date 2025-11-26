# Rollover All Unpaid Penalties Into Current Invoice

## Problem
- Penalties from earlier unpaid invoices are not reflected in new invoices, which leads to under-collection and tenant confusion.
- The billing UI and PDF already show per-invoice penalties, but there is no automatic roll-forward of unpaid penalties from prior months.

## Goal
- When enabled, roll **all unpaid penalties from any past months** into the current invoice as a single, clearly labeled line item.
- Ensure the invoice breakdown, totals (subtotal, VAT, total), and generated PDF all include this rolled penalty amount.

## Scope
- Billing generation logic in `src/app/(admin)/utils/billingService.js`.
- Invoice/UI + PDF rendering in `src/app/(admin)/components/BillingManagement.jsx`.
- Metadata to mark when previous penalties are included.

## Out of Scope
- Changing penalty calculation rules or percentages.
- Retroactively editing past invoices.
- Partial/complex payment application logic.
