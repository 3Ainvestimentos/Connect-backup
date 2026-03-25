/** @jest-environment node */

const { RuntimeErrorCode } = require('@/lib/workflows/runtime/errors');
const { normalizeFormData } = require('@/lib/workflows/runtime/input-normalization');

describe('normalizeFormData', () => {
  it('normaliza centrodecusto para centro_custo', () => {
    expect(
      normalizeFormData({
        nome_sobrenome: 'Alice',
        centrodecusto: '3ARI-São Paulo',
      }),
    ).toEqual({
      nome_sobrenome: 'Alice',
      centro_custo: '3ARI-São Paulo',
    });
  });

  it('falha quando centrodecusto e centro_custo chegam juntos', () => {
    expect.assertions(1);

    try {
      normalizeFormData({
        centrodecusto: '3ARI-São Paulo',
        centro_custo: '3ARI-Rio de Janeiro',
      });
    } catch (error) {
      expect(error).toEqual(
        expect.objectContaining({
          code: RuntimeErrorCode.INVALID_FORM_DATA,
        }),
      );
    }
  });

  it('mantem payload sem centrodecusto intacto', () => {
    expect(
      normalizeFormData({
        nome_sobrenome: 'Alice',
        centro_custo: '3ARI-São Paulo',
        prioridade: 'alta',
      }),
    ).toEqual({
      nome_sobrenome: 'Alice',
      centro_custo: '3ARI-São Paulo',
      prioridade: 'alta',
    });
  });
});
