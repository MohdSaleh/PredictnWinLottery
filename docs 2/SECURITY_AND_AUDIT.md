# Security & Audit (Minimum Requirements)

## Auth
- JWT access token
- Passwords hashed (bcrypt/argon2)
- Role-based access control

## Audit logs
Record:
- login events
- master changes (sections, schemes, books, blocks, credit)
- result publish/revoke
- sales create_bill

Audit table should include:
- actor_user_id
- action_code
- entity_type/entity_id
- payload_json
- created_at
