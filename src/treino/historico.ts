import type { IdInstrumento } from '../musica/instrumentos';
import type { Modo, Nivel } from './conteudo';
import type { Resposta } from './jogo';

export interface Registro {
  rotulo: string;
  acertos: number;
  total: number;
}

export interface ConfigTreino {
  modo: Modo;
  nivel: Nivel;
  instrumento: IdInstrumento;
  rodadas: 10 | 20 | 30;
  referencia: boolean;
}

export interface Historico {
  treinos: number;
  acertos: number;
  total: number;
  itens: Record<string, Registro>;
  config: ConfigTreino | null;
}

const CHAVE = 'afinati:treino:v1';
const VAZIO: Historico = { treinos: 0, acertos: 0, total: 0, itens: {}, config: null };
const INSTRUMENTOS: IdInstrumento[] = ['violao', 'guitarra', 'ukulele', 'baixo'];

/** Já reconhece: 80% ou mais de acerto, com pelo menos 3 tentativas. */
export const LIMITE_RECONHECE = 0.8;
export const MINIMO_TENTATIVAS = 3;

const inteiro = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < 1e7 ? v : null);

function validarConfig(c: unknown): ConfigTreino | null {
  if (typeof c !== 'object' || c === null) return null;
  const x = c as Record<string, unknown>;
  const modo = x.modo === 'notas' || x.modo === 'acordes' ? x.modo : null;
  const nivel = x.nivel === 0 || x.nivel === 1 || x.nivel === 2 ? x.nivel : null;
  const instrumento = INSTRUMENTOS.includes(x.instrumento as IdInstrumento) ? (x.instrumento as IdInstrumento) : null;
  const rodadas = x.rodadas === 10 || x.rodadas === 20 || x.rodadas === 30 ? x.rodadas : null;
  if (!modo || nivel === null || !instrumento || !rodadas) return null;
  return { modo, nivel, instrumento, rodadas, referencia: x.referencia !== false };
}

/** Confere o que veio do armazenamento; qualquer coisa estranha é descartada. */
export function validarHistorico(bruto: unknown): Historico {
  if (typeof bruto !== 'object' || bruto === null) return { ...VAZIO, itens: {} };
  const h = bruto as Record<string, unknown>;
  const itens: Record<string, Registro> = {};
  if (typeof h.itens === 'object' && h.itens !== null) {
    for (const [id, r] of Object.entries(h.itens as Record<string, unknown>)) {
      if (!/^(nota:\d{1,3}|acorde:[A-G][a-z0-9]{0,2}|qualidade:(maior|menor))$/.test(id)) continue;
      const reg = r as Record<string, unknown>;
      const acertos = inteiro(reg?.acertos);
      const total = inteiro(reg?.total);
      const rotulo = typeof reg?.rotulo === 'string' ? reg.rotulo.slice(0, 40) : null;
      if (acertos === null || total === null || !rotulo || acertos > total) continue;
      itens[id] = { rotulo, acertos, total };
    }
  }
  const acertos = inteiro(h.acertos) ?? 0;
  const total = inteiro(h.total) ?? 0;
  return {
    treinos: inteiro(h.treinos) ?? 0,
    acertos: Math.min(acertos, total),
    total,
    itens,
    config: validarConfig(h.config)
  };
}

export function carregarHistorico(): Historico {
  try {
    const t = localStorage.getItem(CHAVE);
    return t ? validarHistorico(JSON.parse(t)) : { ...VAZIO, itens: {} };
  } catch {
    return { ...VAZIO, itens: {} };
  }
}

function salvar(h: Historico) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(h));
  } catch {
    // Sem armazenamento: o histórico vale só nesta visita.
  }
}

/** Soma um treino terminado ao histórico e devolve o histórico novo. */
export function registrarTreino(h: Historico, respostas: Resposta[]): Historico {
  if (!respostas.length) return h;
  const itens = { ...h.itens };
  for (const r of respostas) {
    const c = r.pergunta.certo;
    const atual = itens[c.id] ?? { rotulo: c.rotulo, acertos: 0, total: 0 };
    itens[c.id] = { rotulo: c.rotulo, acertos: atual.acertos + (r.acertou ? 1 : 0), total: atual.total + 1 };
  }
  const novo: Historico = {
    ...h,
    treinos: h.treinos + 1,
    acertos: h.acertos + respostas.filter((r) => r.acertou).length,
    total: h.total + respostas.length,
    itens
  };
  salvar(novo);
  return novo;
}

export function salvarConfig(h: Historico, config: ConfigTreino): Historico {
  const novo = { ...h, config };
  salvar(novo);
  return novo;
}

export function apagarHistorico(): Historico {
  try {
    localStorage.removeItem(CHAVE);
  } catch {
    // nada a fazer
  }
  return { ...VAZIO, itens: {} };
}

/** O que a pessoa já reconhece e o que ainda está treinando, somando todos os treinos. */
export function resumoDoOuvido(h: Historico) {
  const lista = Object.entries(h.itens).map(([id, r]) => ({ id, ...r, taxa: r.total ? r.acertos / r.total : 0 }));
  const reconhece = lista
    .filter((r) => r.total >= MINIMO_TENTATIVAS && r.taxa >= LIMITE_RECONHECE)
    .sort((a, b) => b.taxa - a.taxa || b.total - a.total);
  const treinando = lista
    .filter((r) => r.total >= 2 && r.taxa < LIMITE_RECONHECE)
    .sort((a, b) => a.taxa - b.taxa || b.total - a.total);
  return {
    reconhece,
    treinando,
    porcentagem: h.total ? Math.round((h.acertos / h.total) * 100) : 0
  };
}
