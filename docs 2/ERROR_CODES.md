# Error Codes (Canonical)

All backend errors must use:
```json
{ "success": false, "error": "<CODE>", "message": "..." }
```

## Auth
- UNAUTHORIZED
- FORBIDDEN

## Validation
- VALIDATION_FAILED

## Sales Gates
- NO_TICKETS_ASSIGNED
- SALES_CLOSED
- NUMBER_BLOCKED
- CREDIT_LIMIT_EXCEEDED

## Server
- INTERNAL_ERROR
