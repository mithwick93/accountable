import { TokenStorage } from '../TokenStorage';

describe('TokenStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('sets and gets access token', () => {
    TokenStorage.setAccessToken('testAccessToken');
    expect(TokenStorage.getAccessToken()).toBe('testAccessToken');
  });

  it('sets and gets refresh token', () => {
    TokenStorage.setRefreshToken('testRefreshToken');
    expect(TokenStorage.getRefreshToken()).toBe('testRefreshToken');
  });

  it('returns null if access token is not set', () => {
    expect(TokenStorage.getAccessToken()).toBeNull();
  });

  it('returns null if refresh token is not set', () => {
    expect(TokenStorage.getRefreshToken()).toBeNull();
  });

  it('clears both tokens', () => {
    TokenStorage.setAccessToken('testAccessToken');
    TokenStorage.setRefreshToken('testRefreshToken');
    TokenStorage.clearTokens();
    expect(TokenStorage.getAccessToken()).toBeNull();
    expect(TokenStorage.getRefreshToken()).toBeNull();
  });
});
