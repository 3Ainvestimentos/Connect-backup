import { parseServiceAccount } from '@/lib/firebase-admin';

describe('parseServiceAccount', () => {
  const baseValid = {
    type: 'service_account',
    project_id: 'a-riva-hub',
    client_email: 'svc@a-riva-hub.iam.gserviceaccount.com',
    private_key: '-----BEGIN PRIVATE KEY-----\nABC\n-----END PRIVATE KEY-----\n',
  };

  it('parses valid JSON and normalizes escaped newlines', () => {
    const result = parseServiceAccount(JSON.stringify(baseValid));
    expect(result.project_id).toBe('a-riva-hub');
    expect(result.private_key).toContain('\n');
    expect(result.private_key).not.toContain('\\n');
  });

  it('throws on invalid JSON', () => {
    expect(() => parseServiceAccount('not json')).toThrow(/JSON inválido/);
  });

  it('throws when required fields are missing', () => {
    const { private_key, ...partial } = baseValid;
    expect(() => parseServiceAccount(JSON.stringify(partial))).toThrow(/private_key/);
  });

  it('throws on non-object input (array)', () => {
    expect(() => parseServiceAccount(JSON.stringify([1, 2, 3]))).toThrow(/deve ser um objeto JSON/);
  });

  it('throws on non-object input (null)', () => {
    expect(() => parseServiceAccount('null')).toThrow(/deve ser um objeto JSON/);
  });

  it('throws on non-object input (primitive)', () => {
    expect(() => parseServiceAccount('"just a string"')).toThrow(/deve ser um objeto JSON/);
  });

  it('throws when project_id is absent', () => {
    const { project_id: _, ...rest } = baseValid;
    expect(() => parseServiceAccount(JSON.stringify(rest))).toThrow(/project_id/);
  });

  it('throws when client_email is empty string', () => {
    const invalid = { ...baseValid, client_email: '' };
    expect(() => parseServiceAccount(JSON.stringify(invalid))).toThrow(/client_email/);
  });

  it('throws when client_email is whitespace-only', () => {
    const invalid = { ...baseValid, client_email: '   ' };
    expect(() => parseServiceAccount(JSON.stringify(invalid))).toThrow(/client_email/);
  });

  it('normalizes \\n literals in private_key to real newlines', () => {
    const input = {
      ...baseValid,
      private_key: '-----BEGIN PRIVATE KEY-----\\nABC\\n-----END PRIVATE KEY-----\\n',
    };
    const result = parseServiceAccount(JSON.stringify(input));
    expect(result.private_key).toBe('-----BEGIN PRIVATE KEY-----\nABC\n-----END PRIVATE KEY-----\n');
  });

  it('passes through private_key with real newlines unchanged', () => {
    const rawKey = '-----BEGIN PRIVATE KEY-----\nABC\n-----END PRIVATE KEY-----\n';
    const input = { ...baseValid, private_key: rawKey };
    const result = parseServiceAccount(JSON.stringify(input));
    expect(result.private_key).toBe(rawKey);
  });

  it('preserves extra fields from the JSON', () => {
    const input = {
      ...baseValid,
      private_key_id: 'abc123',
      client_id: '456',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    };
    const result = parseServiceAccount(JSON.stringify(input));
    expect(result.private_key_id).toBe('abc123');
    expect(result.client_id).toBe('456');
    expect(result.auth_uri).toBe('https://accounts.google.com/o/oauth2/auth');
  });
});
