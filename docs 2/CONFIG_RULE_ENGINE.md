# Config Rule Engine (Avoid Hardcoding)

This project must avoid guessing by encoding rules as DB configuration.

## Pattern macros
### 111 macro (Triples)
Generates: 000,111,222,...999

### 100 macro (Hundreds)
Generates: 000,100,200,...900

## Modes
### SET (Straight)
Exact match only.

### ANY (Permutation match)
Sort digits before comparing (wins for any permutation).

### BOXK toggle
Explodes a single number into all permutations (3 digits => 6).

### ALL toggle
Applies to every series in section.series_config.
Cost multiplier = series_config.length.

## Admin-configurable tables (expected)
- bet_modes (mode_code, series_scope, cost_multiplier, flags)
- schemes (payout multipliers, commission, allowed patterns)
- sections (series_config json array)
- blocked_numbers / block_rules (limits)
