import { describe, expect, it } from 'vitest';
import { nomeDaNota, oitavaDaNota } from '../musica/notas';
import { montarConteudo, notasDoAcorde } from './conteudo';
import { validarHistorico, registrarTreino, resumoDoOuvido } from './historico';
import type { Resposta } from './jogo';
import { analisar, sortearRodadas } from './jogo';

const nomes = (midis: number[]) => midis.map((m) => `${nomeDaNota(m)}${oitavaDaNota(m)}`).join(' ');

/** Aleatório repetível para os testes. */
function semente(s: number) {
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

describe('conteúdo do treino', () => {
  it('tem as cordas soltas de cada instrumento', () => {
    expect(montarConteudo('notas', 0, 'violao', 'letras').opcoes.map((o) => o.sigla)).toEqual(['E', 'A', 'D', 'G', 'B', 'E']);
    expect(montarConteudo('notas', 0, 'ukulele', 'letras').opcoes.map((o) => o.sigla)).toEqual(['G', 'C', 'E', 'A']);
    expect(montarConteudo('notas', 0, 'baixo', 'solfejo').opcoes.map((o) => o.sigla)).toEqual(['Mi', 'Lá', 'Ré', 'Sol']);
  });

  it('tem 7 notas naturais e 12 notas no nível difícil', () => {
    expect(montarConteudo('notas', 1, 'violao', 'letras').opcoes.map((o) => o.sigla).join(' ')).toBe('C D E F G A B');
    expect(montarConteudo('notas', 2, 'violao', 'letras').opcoes).toHaveLength(12);
  });

  it('monta os acordes com as notas certas', () => {
    expect(nomes(notasDoAcorde('C', 'violao'))).toBe('C3 E3 G3 C4 E4');
    expect(nomes(notasDoAcorde('Am', 'violao'))).toBe('A2 E3 A3 C4 E4');
    expect(nomes(notasDoAcorde('D', 'violao'))).toBe('D3 A3 D4 F♯4');
    expect(nomes(notasDoAcorde('G7', 'guitarra'))).toBe('G2 B2 D3 G3 B3 F4');
    expect(nomes(notasDoAcorde('C', 'ukulele'))).toBe('G4 C4 E4 C5');
    expect(nomes(notasDoAcorde('Am', 'ukulele'))).toBe('A4 C4 E4 A4');
    expect(nomes(notasDoAcorde('Em', 'baixo'))).toBe('E2 G2 B2 E3');
  });

  it('cada acorde tem as notas da sua tríade', () => {
    const triades: Record<string, number[]> = { C: [0, 4, 7], D: [2, 6, 9], E: [4, 8, 11], G: [7, 11, 2], A: [9, 1, 4], Am: [9, 0, 4], Em: [4, 7, 11], Dm: [2, 5, 9] };
    for (const inst of ['violao', 'ukulele', 'baixo'] as const) {
      for (const [simbolo, classes] of Object.entries(triades)) {
        const tocadas = new Set(notasDoAcorde(simbolo, inst).map((m) => m % 12));
        expect([...tocadas].sort()).toEqual([...classes].sort());
      }
    }
  });

  it('separa maior de menor no nível fácil de acordes', () => {
    const c = montarConteudo('acordes', 0, 'violao', 'letras');
    expect(c.opcoes.map((o) => o.sigla)).toEqual(['Maior', 'Menor']);
    expect(c.perguntas).toHaveLength(8);
    expect(c.perguntas.find((p) => p.detalhe === 'Lá menor')?.certo.id).toBe('qualidade:menor');
  });
});

describe('sorteio das rodadas', () => {
  it('faz a quantidade pedida, equilibrada e sem repetir seguido', () => {
    const { perguntas } = montarConteudo('notas', 0, 'violao', 'letras');
    const r = sortearRodadas(perguntas, 30, semente(7));
    expect(r).toHaveLength(30);
    for (let i = 1; i < r.length; i++) expect(r[i]).not.toBe(r[i - 1]);
    const contagem = new Map<string, number>();
    r.forEach((p) => contagem.set(p.certo.id + p.notas[0], (contagem.get(p.certo.id + p.notas[0]) ?? 0) + 1));
    expect(Math.max(...contagem.values()) - Math.min(...contagem.values())).toBeLessThanOrEqual(1);
  });
});

describe('análise do resultado', () => {
  const { perguntas, opcoes } = montarConteudo('notas', 0, 'violao', 'letras');
  const [mi, la, re, sol] = perguntas;
  const resp = (p: (typeof perguntas)[number], marcado = p.certo): Resposta => ({ pergunta: p, marcado, acertou: marcado.id === p.certo.id });

  const respostas = [resp(sol), resp(re, opcoes[1]), resp(mi), resp(re, opcoes[1]), resp(la), resp(sol), resp(re)];
  const a = analisar(respostas, 'violao');

  it('conta acertos, porcentagem e sequência', () => {
    expect(a.acertos).toBe(5);
    expect(a.total).toBe(7);
    expect(a.porcentagem).toBe(71);
    expect(a.melhorSequencia).toBe(3);
  });

  it('separa o que sabe do que precisa treinar', () => {
    expect(a.sabe.map((p) => p.rotulo)).toEqual(['Sol (G3)', 'Mi (E2)', 'Lá (A2)']);
    expect(a.treinar).toEqual([{ id: re.certo.id, rotulo: 'Ré (D3)', acertos: 1, total: 3 }]);
  });

  it('encontra a confusão e explica', () => {
    expect(a.confusoes).toHaveLength(1);
    expect(a.confusoes[0].vezes).toBe(2);
    expect(a.confusoes[0].dica).toBe('2 vezes. O Ré (D3) soa mais agudo que o Lá (A2).');
    expect(a.mensagem).toContain('Bom ouvido!');
  });
});

describe('histórico', () => {
  const { perguntas } = montarConteudo('notas', 0, 'violao', 'letras');
  const certa = (i: number): Resposta => ({ pergunta: perguntas[i], marcado: perguntas[i].certo, acertou: true });

  it('soma os treinos e diz o que já reconhece', () => {
    let h = validarHistorico(null);
    h = registrarTreino(h, [certa(0), certa(0), certa(1)]);
    h = registrarTreino(h, [certa(0), { pergunta: perguntas[1], marcado: perguntas[0].certo, acertou: false }]);
    expect(h.treinos).toBe(2);
    expect(h.total).toBe(5);
    const r = resumoDoOuvido(h);
    expect(r.reconhece.map((x) => x.rotulo)).toEqual(['Mi (E2)']); // 3 de 3
    expect(r.treinando.map((x) => x.rotulo)).toEqual(['Lá (A2)']); // 1 de 2
    expect(r.porcentagem).toBe(80);
  });

  it('descarta dados estranhos', () => {
    const h = validarHistorico({ treinos: -1, itens: { 'nota:40': { rotulo: 'Mi', acertos: 5, total: 2 }, '<x>': { rotulo: 'a', acertos: 1, total: 1 } }, config: { modo: 'x' } });
    expect(h).toEqual({ treinos: 0, acertos: 0, total: 0, itens: {}, config: null });
  });
});
