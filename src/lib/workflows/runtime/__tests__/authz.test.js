/** @jest-environment node */

const { RuntimeErrorCode } = require('@/lib/workflows/runtime/errors');
const { assertCanOpen } = require('@/lib/workflows/runtime/authz');

describe('workflow runtime authz', () => {
  it('permite abertura quando allowedUserIds contem o id3a do ator', () => {
    expect(() =>
      assertCanOpen(
        {
          name: 'Solicitação de Compras',
          active: true,
          allowedUserIds: ['SMO2', 'DLE'],
        },
        'SMO2',
      ),
    ).not.toThrow();
  });

  it('rejeita abertura quando apenas o authUid antigo coincide', () => {
    expect.assertions(1);

    try {
      assertCanOpen(
        {
          name: 'Solicitação de Compras',
          active: true,
          allowedUserIds: ['SMO2', 'DLE'],
        },
        'firebase-uid-1',
      );
    } catch (error) {
      expect(error).toEqual(
        expect.objectContaining({
          code: RuntimeErrorCode.FORBIDDEN,
        }),
      );
    }
  });
});
