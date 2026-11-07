import type { IdInstrumento } from '../musica/instrumentos';
import { instrumentoPorId } from '../musica/instrumentos';
import type { Notacao } from '../musica/notas';
import { nomeDaNota, oitavaDaNota } from '../musica/notas';

export type Modo = 'notas' | 'acordes';
export type Nivel = 0 | 1 | 2;

/** Uma resposta possível (e também uma pergunta). */
export interface Item {
  /** Chave estável usada no histórico: `nota:40`, `acorde:Am`, `qualidade:menor`. */
  id: string;
  /** Texto grande do botão (E, Am, Maior). */
  sigla: string;
  /** Texto pequeno do botão (Mi · 6ª, Lá menor). */
  sub: string;
  /** Nome completo, usado no retorno e no leitor de tela. */
  nome: string;
  /** Nome curto do histórico ("Mi (E2)", "Lá menor"). */
  rotulo: string;
}

/** Uma pergunta: o item certo e as notas (MIDI) que soam. */
export interface Pergunta {
  certo: Item;
  notas: number[];
  /** O que tocou de fato, quando a resposta é mais geral (ex.: "Lá menor" numa pergunta de maior ou menor). */
  detalhe?: string;
}

export interface Conteudo {
  opcoes: Item[];
  /** Perguntas possíveis (no nível "maior ou menor" há mais perguntas que opções). */
  perguntas: Pergunta[];
}

export const NIVEIS: Record<Modo, { nome: string; desc: string }[]> = {
  notas: [
    { nome: 'Cordas soltas', desc: 'As notas das cordas do instrumento' },
    { nome: 'Notas naturais', desc: 'Dó, Ré, Mi, Fá, Sol, Lá e Si' },
    { nome: 'Todas as 12 notas', desc: 'Inclui os sustenidos (♯)' }
  ],
  acordes: [
    { nome: 'Maior ou menor', desc: 'Só diga se o acorde soa alegre ou triste' },
    { nome: 'Acordes abertos', desc: 'Dó, Ré, Mi, Sol, Lá, Lá menor, Mi menor e Ré menor' },
    { nome: 'Com sétima', desc: 'Inclui Sol7, Ré7, Mi7 e Lá7' }
  ]
};

// ---------- Notas ----------

/** Oitava das notas soltas em cada instrumento (região confortável de ouvir no alto-falante). */
const OITAVA: Record<IdInstrumento, number> = { violao: 3, guitarra: 3, ukulele: 4, baixo: 2 };
const NATURAIS = [0, 2, 4, 5, 7, 9, 11];

function itemNota(midi: number, notacao: Notacao, sub: string): Item {
  const letra = nomeDaNota(midi);
  const pt = nomeDaNota(midi, 'solfejo');
  const oit = oitavaDaNota(midi);
  return {
    id: `nota:${midi}`,
    sigla: nomeDaNota(midi, notacao),
    sub,
    nome: `${pt} (${letra}${oit})`,
    rotulo: `${pt} (${letra}${oit})`
  };
}

function conteudoNotas(nivel: Nivel, instrumento: IdInstrumento, notacao: Notacao): Conteudo {
  if (nivel === 0) {
    const inst = instrumentoPorId(instrumento);
    const opcoes = inst.cordas.map((c) => {
      const pt = nomeDaNota(c.midi, 'solfejo');
      const item = itemNota(c.midi, notacao, notacao === 'letras' ? `${pt} · ${c.numero}ª` : `${c.numero}ª corda`);
      return { ...item, nome: `${item.nome}, ${c.numero}ª corda` };
    });
    return { opcoes, perguntas: opcoes.map((o) => ({ certo: o, notas: [Number(o.id.slice(5))] })) };
  }
  const base = 12 * (OITAVA[instrumento] + 1); // Dó da oitava escolhida
  const classes = nivel === 1 ? NATURAIS : Array.from({ length: 12 }, (_, i) => i);
  const opcoes = classes.map((pc) => {
    const midi = base + pc;
    return itemNota(midi, notacao, notacao === 'letras' ? nomeDaNota(midi, 'solfejo') : nomeDaNota(midi));
  });
  return { opcoes, perguntas: opcoes.map((o) => ({ certo: o, notas: [Number(o.id.slice(5))] })) };
}

// ---------- Acordes ----------

type Qualidade = 'maior' | 'menor' | 'setima';

interface Acorde {
  simbolo: string;
  nome: string;
  qualidade: Qualidade;
  /** Fundamental (classe de altura, 0 = Dó). */
  raiz: number;
  /** Casas no violão/guitarra, da 6ª para a 1ª corda (null = não toca). */
  violao: (number | null)[];
  /** Casas no ukulele, da 4ª para a 1ª corda. */
  ukulele: number[];
}

const ACORDES: Acorde[] = [
  { simbolo: 'C', nome: 'Dó maior', qualidade: 'maior', raiz: 0, violao: [null, 3, 2, 0, 1, 0], ukulele: [0, 0, 0, 3] },
  { simbolo: 'D', nome: 'Ré maior', qualidade: 'maior', raiz: 2, violao: [null, null, 0, 2, 3, 2], ukulele: [2, 2, 2, 0] },
  { simbolo: 'E', nome: 'Mi maior', qualidade: 'maior', raiz: 4, violao: [0, 2, 2, 1, 0, 0], ukulele: [1, 4, 0, 2] },
  { simbolo: 'G', nome: 'Sol maior', qualidade: 'maior', raiz: 7, violao: [3, 2, 0, 0, 0, 3], ukulele: [0, 2, 3, 2] },
  { simbolo: 'A', nome: 'Lá maior', qualidade: 'maior', raiz: 9, violao: [null, 0, 2, 2, 2, 0], ukulele: [2, 1, 0, 0] },
  { simbolo: 'Am', nome: 'Lá menor', qualidade: 'menor', raiz: 9, violao: [null, 0, 2, 2, 1, 0], ukulele: [2, 0, 0, 0] },
  { simbolo: 'Em', nome: 'Mi menor', qualidade: 'menor', raiz: 4, violao: [0, 2, 2, 0, 0, 0], ukulele: [0, 4, 3, 2] },
  { simbolo: 'Dm', nome: 'Ré menor', qualidade: 'menor', raiz: 2, violao: [null, null, 0, 2, 3, 1], ukulele: [2, 2, 1, 0] },
  { simbolo: 'G7', nome: 'Sol com sétima', qualidade: 'setima', raiz: 7, violao: [3, 2, 0, 0, 0, 1], ukulele: [0, 2, 1, 2] },
  { simbolo: 'D7', nome: 'Ré com sétima', qualidade: 'setima', raiz: 2, violao: [null, null, 0, 2, 1, 2], ukulele: [2, 2, 2, 3] },
  { simbolo: 'E7', nome: 'Mi com sétima', qualidade: 'setima', raiz: 4, violao: [0, 2, 0, 1, 0, 0], ukulele: [1, 2, 0, 2] },
  { simbolo: 'A7', nome: 'Lá com sétima', qualidade: 'setima', raiz: 9, violao: [null, 0, 2, 0, 2, 0], ukulele: [0, 1, 0, 0] }
];

const INTERVALOS: Record<Qualidade, number[]> = { maior: [0, 4, 7, 12], menor: [0, 3, 7, 12], setima: [0, 4, 7, 10] };

/** Notas (MIDI) do acorde como ele é tocado no instrumento. */
export function notasDoAcorde(simbolo: string, instrumento: IdInstrumento): number[] {
  const a = ACORDES.find((x) => x.simbolo === simbolo);
  if (!a) return [];
  if (instrumento === 'ukulele') {
    const cordas = instrumentoPorId('ukulele').cordas;
    return a.ukulele.map((casa, i) => cordas[i].midi + casa);
  }
  if (instrumento === 'baixo') {
    // No baixo o acorde é tocado como arpejo a partir da fundamental, na região grave.
    const raiz = 36 + a.raiz; // Dó 2 + raiz
    return INTERVALOS[a.qualidade].map((i) => raiz + i);
  }
  const cordas = instrumentoPorId(instrumento).cordas;
  return a.violao.flatMap((casa, i) => (casa === null ? [] : [cordas[i].midi + casa]));
}

function itemAcorde(a: Acorde): Item {
  return { id: `acorde:${a.simbolo}`, sigla: a.simbolo, sub: a.nome.replace(' maior', ''), nome: `${a.nome} (${a.simbolo})`, rotulo: a.nome };
}

function conteudoAcordes(nivel: Nivel, instrumento: IdInstrumento): Conteudo {
  if (nivel === 0) {
    const maior: Item = { id: 'qualidade:maior', sigla: 'Maior', sub: 'soa alegre', nome: 'acorde maior', rotulo: 'Acordes maiores' };
    const menor: Item = { id: 'qualidade:menor', sigla: 'Menor', sub: 'soa triste', nome: 'acorde menor', rotulo: 'Acordes menores' };
    const perguntas = ACORDES.filter((a) => a.qualidade !== 'setima').map((a) => ({
      certo: a.qualidade === 'maior' ? maior : menor,
      notas: notasDoAcorde(a.simbolo, instrumento),
      detalhe: a.nome
    }));
    return { opcoes: [maior, menor], perguntas };
  }
  const lista = ACORDES.filter((a) => nivel === 2 || a.qualidade !== 'setima');
  const opcoes = lista.map(itemAcorde);
  return { opcoes, perguntas: lista.map((a, i) => ({ certo: opcoes[i], notas: notasDoAcorde(a.simbolo, instrumento) })) };
}

export function montarConteudo(modo: Modo, nivel: Nivel, instrumento: IdInstrumento, notacao: Notacao): Conteudo {
  return modo === 'notas' ? conteudoNotas(nivel, instrumento, notacao) : conteudoAcordes(nivel, instrumento);
}

/** Qualidade de um item de acorde (para a dica de confusão). */
export function qualidadeDoItem(id: string): Qualidade | null {
  if (id.startsWith('qualidade:')) return id.slice(10) as Qualidade;
  const a = ACORDES.find((x) => `acorde:${x.simbolo}` === id);
  return a ? a.qualidade : null;
}

/** Fundamental (MIDI de referência) de um item, para comparar mais grave/mais agudo. */
export function alturaDoItem(id: string, instrumento: IdInstrumento): number | null {
  if (id.startsWith('nota:')) return Number(id.slice(5));
  if (id.startsWith('acorde:')) return Math.min(...notasDoAcorde(id.slice(7), instrumento));
  return null;
}
