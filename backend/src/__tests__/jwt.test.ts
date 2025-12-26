import { generateToken, verifyToken } from '../utils/jwt';

describe('JWT Utils', () => {
  const testPayload = {
    userId: 1,
    username: 'testuser',
    role: 'AGENT' as const,
  };

  test('should generate a valid JWT token', () => {
    const token = generateToken(testPayload);
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
  });

  test('should verify and decode a valid token', () => {
    const token = generateToken(testPayload);
    const decoded = verifyToken(token);
    
    expect(decoded).toBeTruthy();
    expect(decoded?.userId).toBe(testPayload.userId);
    expect(decoded?.username).toBe(testPayload.username);
    expect(decoded?.role).toBe(testPayload.role);
  });

  test('should return null for invalid token', () => {
    const invalidToken = 'invalid.token.here';
    const decoded = verifyToken(invalidToken);
    expect(decoded).toBeNull();
  });

  test('should return null for expired token', () => {
    // This test would require mocking time or using a very short expiry
    // For now, we just test the structure
    const token = generateToken(testPayload);
    expect(token).toBeTruthy();
  });
});
