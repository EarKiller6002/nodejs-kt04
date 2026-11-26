import { generateTokens, verifyAccessToken, verifyRefreshToken } from '../src/utils/jwt.js';

describe('JWT Utility Unit Tests', () => {
  const mockPayload = { id: 1, email: 'unit@test.com', role: 'USER' };

  test('generateTokens должен создавать валидные accessToken и refreshToken', () => {
    const tokens = generateTokens(mockPayload);

    expect(tokens).toHaveProperty('accessToken');
    expect(tokens).toHaveProperty('refreshToken');

    const decodedAccess = verifyAccessToken(tokens.accessToken);
    expect(decodedAccess.id).toBe(mockPayload.id);
    expect(decodedAccess.email).toBe(mockPayload.email);
    expect(decodedAccess.role).toBe(mockPayload.role);

    const decodedRefresh = verifyRefreshToken(tokens.refreshToken);
    expect(decodedRefresh.id).toBe(mockPayload.id);
  });

  test('verifyAccessToken должен выбрасывать ошибку при невалидном токене', () => {
    expect(() => verifyAccessToken('invalid.token.string')).toThrow();
  });
});
