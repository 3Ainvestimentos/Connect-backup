import { resolveOperationalIdentity } from '../request-identity';

describe('resolveOperationalIdentity', () => {
  it('prioritizes fallbackName while preserving userId as identity key', () => {
    expect(
      resolveOperationalIdentity({
        collaborators: [{ id3a: 'RESP1', name: 'Responsavel 1' }],
        userId: 'RESP1',
        fallbackName: 'Owner',
      }),
    ).toEqual({
      identityKey: 'RESP1',
      displayLabel: 'Owner',
    });
  });

  it('uses collaborator name when available', () => {
    expect(
      resolveOperationalIdentity({
        collaborators: [{ id3a: 'RESP1', name: 'Responsavel 1' }],
        userId: 'RESP1',
      }),
    ).toEqual({
      identityKey: 'RESP1',
      displayLabel: 'Responsavel 1',
    });
  });

  it('falls back to the raw userId when no friendly name is available', () => {
    expect(
      resolveOperationalIdentity({
        collaborators: [],
        userId: 'RESP1',
      }),
    ).toEqual({
      identityKey: 'RESP1',
      displayLabel: 'RESP1',
    });
  });

  it('uses the configured placeholder only when neither name nor userId exists', () => {
    expect(
      resolveOperationalIdentity({
        collaborators: [],
        userId: null,
        fallbackName: null,
      }),
    ).toEqual({
      identityKey: 'configured-collaborator',
      displayLabel: 'Colaborador configurado',
    });
  });
});
