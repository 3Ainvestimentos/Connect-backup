/** @jest-environment node */

const { RuntimeErrorCode } = require('@/lib/workflows/runtime/errors');
const {
  assertCanOpen,
  assertCanAssign,
  assertCanFinalize,
  assertCanArchive,
  assertCanReadRequest,
} = require('@/lib/workflows/runtime/authz');

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

  it('permite abertura quando allowedUserIds contem all', () => {
    expect(() =>
      assertCanOpen(
        {
          name: 'Manutenção / Solicitações Gerais',
          active: true,
          allowedUserIds: ['all'],
        },
        'QUALQUER_ID3A',
      ),
    ).not.toThrow();
  });

  it('rejeita abertura quando o tipo esta inativo', () => {
    expect.assertions(1);

    try {
      assertCanOpen(
        {
          name: 'Solicitação de Compras',
          active: false,
          allowedUserIds: ['SMO2', 'DLE'],
        },
        'SMO2',
      );
    } catch (error) {
      expect(error).toEqual(
        expect.objectContaining({
          code: RuntimeErrorCode.WORKFLOW_TYPE_INACTIVE,
        }),
      );
    }
  });

  it('permite assign quando o ator e o owner', () => {
    expect(() => {
      assertCanAssign('SMO2', 'SMO2');
    }).not.toThrow();
  });

  it('rejeita assign quando o ator nao e o owner', () => {
    expect.assertions(1);

    try {
      assertCanAssign('SMO2', 'DLE');
    } catch (error) {
      expect(error).toEqual(
        expect.objectContaining({
          code: RuntimeErrorCode.FORBIDDEN,
        }),
      );
    }
  });

  it('permite finalize para o responsavel atual', () => {
    expect(() => {
      assertCanFinalize('SMO2', 'RESP1', 'RESP1');
    }).not.toThrow();
  });

  it('permite finalize para o owner como excecao operacional', () => {
    expect(() => {
      assertCanFinalize('SMO2', 'RESP1', 'SMO2');
    }).not.toThrow();
  });

  it('rejeita finalize para terceiro nao autorizado', () => {
    expect.assertions(1);

    try {
      assertCanFinalize('SMO2', 'RESP1', 'DLE');
    } catch (error) {
      expect(error).toEqual(
        expect.objectContaining({
          code: RuntimeErrorCode.FINALIZATION_NOT_ALLOWED,
        }),
      );
    }
  });

  it('permite archive para o owner', () => {
    expect(() => {
      assertCanArchive('SMO2', 'SMO2');
    }).not.toThrow();
  });

  it('rejeita archive para nao-owner', () => {
    expect.assertions(1);

    try {
      assertCanArchive('SMO2', 'DLE');
    } catch (error) {
      expect(error).toEqual(
        expect.objectContaining({
          code: RuntimeErrorCode.FORBIDDEN,
        }),
      );
    }
  });

  it('permite leitura do detalhe para owner, requester, responsavel, destinatario de acao e participante', () => {
    const request = {
      ownerUserId: 'SMO2',
      requesterUserId: 'REQ1',
      responsibleUserId: 'RESP1',
      pendingActionRecipientIds: ['ACT1'],
      operationalParticipantIds: ['PART1'],
    };

    expect(() => assertCanReadRequest(request, 'SMO2')).not.toThrow();
    expect(() => assertCanReadRequest(request, 'REQ1')).not.toThrow();
    expect(() => assertCanReadRequest(request, 'RESP1')).not.toThrow();
    expect(() => assertCanReadRequest(request, 'ACT1')).not.toThrow();
    expect(() => assertCanReadRequest(request, 'PART1')).not.toThrow();
  });

  it('rejeita leitura do detalhe para outsider', () => {
    expect.assertions(1);

    try {
      assertCanReadRequest(
        {
          ownerUserId: 'SMO2',
          requesterUserId: 'REQ1',
          responsibleUserId: 'RESP1',
          pendingActionRecipientIds: ['ACT1'],
          operationalParticipantIds: ['PART1'],
        },
        'OUT1',
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
