# DB Schema (Canonical) — PostgreSQL

This document describes the required DB tables and relationships.

## Core
- users (role: ADMIN/STOCKIST/SUBSTOCKIST/AGENT/SUBAGENT)
- sections (sessions): name, code, draw_time_local, cutoff_offset_minutes, series_config jsonb
- game_groups (digit_count: 1/2/3)
- section_groups (which digit groups exist per section)
- sales_groups (dropdown 1)
- sales_sub_groups (dropdown 2 / books), belongs_to sales_group

## Pricing & payout
- schemes (product x group x pattern flags): base_price, payout_rate, commissions

## Sales
- bills (header): user_id, section_id, date, total_count, total_amount, status
- bill_entries (lines): bill_id, number, quantity, stake_per_unit, pattern_flags, expanded_count
- sales_ticket_assignments (gate): assigned_to_user_id, section_id, date, group_id, sub_group_id, is_console, is_active

## Inventory (admin)
- ticket_products (SET/ANY/ALL/BOX etc)
- ticket_books (range): product_id, book_code, start_no, end_no, assigned_to_user_id

## Settlement
- results (section_id, date, winning_number, series, published_by, published_at)
- winnings (bill_entry_id, amount, status)
- ledger (debits/credits, settlements)

## Controls
- blocked_numbers / block_rules (pattern, maxCount, scope by section/group)
- credit_limits (user_id, limit_amount)
- audit_logs (actor, action, entity, payload jsonb)
