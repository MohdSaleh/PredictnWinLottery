# Security Notes
- JWT secret defaults to dev-secret-key-12345; must be overridden via env.
- No rate limiting or brute-force protection on auth endpoints.
- Credit limit and exposure enforcement present but incomplete without ticket assignments and global exposure limits.
- Avoid logging sensitive data; current routes log errors to console only.
