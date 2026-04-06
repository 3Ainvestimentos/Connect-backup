/** @jest-environment node */

import { buildSeedPayloadsForLot } from '@/lib/workflows/bootstrap/fase2c/shared/payload-builder';
import { LOTE_01_GOVERNANCA_FINANCEIRO_MANIFEST } from '@/lib/workflows/bootstrap/fase2c/manifests/lote-01-governanca-financeiro';
import { LOTE_02_MARKETING_MANIFEST } from '@/lib/workflows/bootstrap/fase2c/manifests/lote-02-marketing';
import { LOTE_03_TI_MANIFEST } from '@/lib/workflows/bootstrap/fase2c/manifests/lote-03-ti';
import { LOTE_04_GENTE_SERVICOS_ATENDIMENTO_MANIFEST } from '@/lib/workflows/bootstrap/fase2c/manifests/lote-04-gente-servicos-atendimento';
import { LOTE_05_GENTE_CICLO_VIDA_MOVIMENTACOES_MANIFEST } from '@/lib/workflows/bootstrap/fase2c/manifests/lote-05-gente-ciclo-vida-movimentacoes';

const collaborators = [
  { email: 'ti@3ainvestimentos.com.br', id3a: 'DFZ2', name: 'TI Owner' },
  { email: 'pablo.costa@3ainvestimentos.com.br', id3a: 'PTC2', name: 'Pablo' },
  { email: 'barbara.fiche@3ainvestimentos.com.br', id3a: 'BFR2', name: 'Barbara Fiche' },
  { email: 'joao.pompeu@3ainvestimentos.com.br', id3a: 'JPO2', name: 'Joao Pompeu' },
  { email: 'fernanda.adami@3ainvestimentos.com.br', id3a: 'FPA2', name: 'Fernanda Adami' },
  { email: 'barbara@3ainvestimentos.com.br', id3a: 'BAR2', name: 'Barbara' },
  { email: 'matheus@3ainvestimentos.com.br', id3a: 'MAT2', name: 'Matheus' },
];

const fakeNow = { seconds: 1, nanoseconds: 0 } as never;

describe('buildSeedPayloadsForLot', () => {
  it('materializa o lote 1 com fields vazios preservados e owner normalizado', () => {
    const payloads = buildSeedPayloadsForLot(
      LOTE_01_GOVERNANCA_FINANCEIRO_MANIFEST,
      collaborators,
      fakeNow,
    );

    const pagamento = payloads.find(
      (payload) => payload.workflowTypeId === 'financeiro_solicitacao_pagamentos',
    );
    const espelhamento = payloads.find(
      (payload) => payload.workflowTypeId === 'governanca_espelhamento_caso_unico',
    );

    expect(payloads).toHaveLength(3);
    expect(pagamento?.versionPayload.fields).toEqual([]);
    expect(pagamento?.typePayload.active).toBe(true);
    expect(espelhamento?.typePayload.ownerEmail).toBe('ti@3ainvestimentos.com.br');
    expect(espelhamento?.typePayload.ownerUserId).toBe('DFZ2');
    expect(espelhamento?.versionPayload.fields.map((field) => field.id)).toEqual([
      'nome_sobrenome',
      'tipo_solicitacao',
      'email_lider_visualizado',
      'email_lider_visualiza',
      'codigo_assessor_visualizado',
      'codigo_assessor_visualiza',
      'descricao_detalhada',
    ]);
  });

  it('aplica o override de imagem_referencia no lote 2', () => {
    const payloads = buildSeedPayloadsForLot(LOTE_02_MARKETING_MANIFEST, collaborators, fakeNow);
    const arte = payloads.find(
      (payload) => payload.workflowTypeId === 'marketing_arte_material_grafico',
    );

    expect(arte?.versionPayload.fields.map((field) => field.id)).toContain(
      'possui_imagem_referencia',
    );
    expect(arte?.versionPayload.fields.map((field) => field.id)).toContain(
      'imagem_referencia_arquivo',
    );
    expect(arte?.reportItem.sanitizations).toEqual(
      expect.arrayContaining([
        'field.id override: "imagem_referencia" -> "possui_imagem_referencia"',
        'field.id override: "imagem_referencia" -> "imagem_referencia_arquivo"',
      ]),
    );
  });

  it('deduplica status id do lote 3 sem perder a sequencia operacional', () => {
    const payloads = buildSeedPayloadsForLot(LOTE_03_TI_MANIFEST, collaborators, fakeNow);
    const compra = payloads.find(
      (payload) => payload.workflowTypeId === 'ti_solicitacao_compra_equipamento',
    );

    const steps = compra?.versionPayload.stepOrder.map((stepId) => compra.versionPayload.stepsById[stepId]);

    expect(steps?.map((step) => step.statusKey)).toEqual([
      'solicitacao_aberta',
      'em_analise',
      'em_aprovacao',
      'em_execucao',
      'finalizado',
    ]);
    expect(steps?.map((step) => step.kind)).toEqual(['start', 'work', 'work', 'work', 'final']);
  });

  it('preserva action e mantem active=false no lote 4', () => {
    const payloads = buildSeedPayloadsForLot(
      LOTE_04_GENTE_SERVICOS_ATENDIMENTO_MANIFEST,
      collaborators,
      fakeNow,
    );
    const ferias = payloads.find(
      (payload) =>
        payload.workflowTypeId ===
        'gente_comunicacao_solicitacao_ferias_ausencia_compensacao_horas',
    );

    const steps = ferias?.versionPayload.stepOrder.map(
      (stepId) => ferias.versionPayload.stepsById[stepId],
    );
    const actionSteps = steps?.filter((step) => step.action);

    expect(ferias?.typePayload.active).toBe(false);
    expect(ferias?.versionPayload.fields.map((field) => field.id)).toEqual([
      'nome_sobrenome',
      'email',
      'setor_area',
      'tipo_solicitacao',
      'data_inicio',
      'data_fim',
      'descricao_detalhada',
    ]);
    expect(steps?.map((step) => step.statusKey)).toEqual([
      'solicitacao_aberta',
      'em_analise',
      'em_execucao',
      'finalizado',
    ]);
    expect(actionSteps).toHaveLength(1);
    expect(actionSteps?.[0].action).toMatchObject({
      type: 'acknowledgement',
      approverIds: ['DFA'],
    });
  });

  it('persiste action metadata e mantem lotes bloqueados em active=false no lote 5', () => {
    const payloads = buildSeedPayloadsForLot(
      LOTE_05_GENTE_CICLO_VIDA_MOVIMENTACOES_MANIFEST,
      collaborators,
      fakeNow,
    );
    const analise = payloads.find(
      (payload) =>
        payload.workflowTypeId ===
        'gente_comunicacao_analise_pre_desligamento_acesso_lideres',
    );

    const steps = analise?.versionPayload.stepOrder.map((stepId) => analise.versionPayload.stepsById[stepId]);
    const actionSteps = steps?.filter((step) => step.action);

    expect(analise?.typePayload.active).toBe(false);
    expect(steps?.map((step) => step.statusKey)).toEqual([
      'iniciar_processo_analise',
      'em_analise_bi',
      'em_analise_financeiro',
      'em_analise_juridico',
      'em_analise_governanca',
      'reanalise_juridico',
      'etapa_7',
      'finalizado',
    ]);
    expect(actionSteps).toHaveLength(6);
    expect(actionSteps?.[0].action).toMatchObject({
      type: 'execution',
      approverIds: ['RHP2'],
      commentRequired: true,
    });
    expect(analise?.reportItem.statusesSummary.filter((item) => item.hasAction)).toHaveLength(6);
  });
});
