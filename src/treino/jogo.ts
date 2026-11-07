import type { IdInstrumento } from '../musica/instrumentos';
import type { Item, Pergunta } from './conteudo';
import { alturaDoItem, qualidadeDoItem } from './conteudo';

export interface Resposta {
  pergunta: Pergunta;
  marcado: Item;
  acertou: boolean;
}

/**
 * Sorteia as rodadas: cada pergunta aparece um número parecido de vezes
 * e a mesma pergunta nunca vem duas vezes seguidas (quando há mais de uma).
 */
export function sortearRodadas(perguntas: Pergunta[], quantidade: number, aleatorio: () => number = Math.random): Pergunta[] {
  if (perguntas.length === 0) return [];
  const saida: Pergunta[] = [];
  while (saida.length < quantidade) {
    const rodada = [...perguntas];
    for (let i = rodada.length - 1; i > 0; i--) {
      const j = Math.floor(aleatorio() * (i + 1));
      [rodada[i], rodada[j]] = [rodada[j], rodada[i]];
    }
    // Evita repetir a última pergunta da rodada anterior logo no início desta.
    const ultima = saida[saida.length - 1];
    if (ultima && rodada.length > 1 && rodada[0] === ultima) [rodada[0], rodada[1]] = [rodada[1], rodada[0]];
    saida.push(...rodada);
  }
  return saida.slice(0, quantidade);
}

export interface Placar {
  id: string;
  rotulo: string;
  acertos: number;
  total: number;
}

export interface Confusao {
  certo: Item;
  marcado: Item;
  vezes: number;
  dica: string;
}

export interface Analise {
  acertos: number;
  total: number;
  porcentagem: number;
  melhorSequencia: number;
  /** Itens sem nenhum erro neste treino. */
  sabe: Placar[];
  /** Itens com pelo menos um erro. */
  treinar: Placar[];
  confusoes: Confusao[];
  mensagem: string;
}

function dicaDeConfusao(certo: Item, marcado: Item, vezes: number, instrumento: IdInstrumento): string {
  const qa = qualidadeDoItem(certo.id);
  const qb = qualidadeDoItem(marcado.id);
  const prefixo = vezes > 1 ? `${vezes} vezes. ` : '';
  if (qa && qb && qa !== qb && (qa === 'menor' || qb === 'menor')) {
    return `${prefixo}Um é maior e o outro é menor: o menor soa mais triste.`;
  }
  if (qa === 'setima' || qb === 'setima') {
    return `${prefixo}O acorde com sétima tem uma nota a mais e soa “pedindo” para continuar.`;
  }
  const a = alturaDoItem(certo.id, instrumento);
  const b = alturaDoItem(marcado.id, instrumento);
  if (a === null || b === null || a === b) return `${prefixo}Ouça os dois em seguida e compare.`;
  return `${prefixo}O ${certo.rotulo} soa mais ${a < b ? 'grave' : 'agudo'} que o ${marcado.rotulo}.`;
}

function juntarNomes(nomes: string[]): string {
  if (nomes.length <= 1) return nomes.join('');
  return `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`;
}

export function analisar(respostas: Resposta[], instrumento: IdInstrumento): Analise {
  const total = respostas.length;
  const acertos = respostas.filter((r) => r.acertou).length;
  let melhorSequencia = 0;
  let atual = 0;
  for (const r of respostas) {
    atual = r.acertou ? atual + 1 : 0;
    melhorSequencia = Math.max(melhorSequencia, atual);
  }

  const porItem = new Map<string, Placar>();
  for (const r of respostas) {
    const c = r.pergunta.certo;
    const p = porItem.get(c.id) ?? { id: c.id, rotulo: c.rotulo, acertos: 0, total: 0 };
    p.total++;
    if (r.acertou) p.acertos++;
    porItem.set(c.id, p);
  }
  const placares = [...porItem.values()];
  const sabe = placares.filter((p) => p.acertos === p.total).sort((a, b) => b.total - a.total);
  const treinar = placares.filter((p) => p.acertos < p.total).sort((a, b) => a.acertos / a.total - b.acertos / b.total);

  const pares = new Map<string, Confusao>();
  for (const r of respostas) {
    if (r.acertou) continue;
    const chave = `${r.pergunta.certo.id}>${r.marcado.id}`;
    const c = pares.get(chave) ?? { certo: r.pergunta.certo, marcado: r.marcado, vezes: 0, dica: '' };
    c.vezes++;
    pares.set(chave, c);
  }
  const confusoes = [...pares.values()]
    .sort((a, b) => b.vezes - a.vezes)
    .map((c) => ({ ...c, dica: dicaDeConfusao(c.certo, c.marcado, c.vezes, instrumento) }));

  const porcentagem = total ? Math.round((acertos / total) * 100) : 0;
  const abertura =
    porcentagem >= 90 ? 'Excelente ouvido!' : porcentagem >= 70 ? 'Bom ouvido!' : porcentagem >= 40 ? 'Você está no caminho.' : 'Todo começo é assim: o ouvido melhora com treino.';
  const fortes = juntarNomes(sabe.slice(0, 3).map((p) => p.rotulo.split(' (')[0]));
  const fracos = juntarNomes(treinar.slice(0, 2).map((p) => p.rotulo.split(' (')[0]));
  const partes = [abertura];
  if (fortes) partes.push(`Você já reconhece ${fortes}.`);
  if (fracos) partes.push(`Vale treinar mais ${fracos}.`);
  if (total && !treinar.length) partes.push('Nenhum erro neste treino. Que tal subir de nível?');

  return { acertos, total, porcentagem, melhorSequencia, sabe, treinar, confusoes, mensagem: partes.join(' ') };
}
