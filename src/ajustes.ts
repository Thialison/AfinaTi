import { useCallback, useState } from 'react';
import type { IdInstrumento } from './musica/instrumentos';
import type { Notacao } from './musica/notas';

export interface Ajustes {
  /** Frequência do Lá de referência (A4), em Hz. */
  a4: number;
  /** Margem, em cents, para considerar a corda afinada. */
  tolerancia: 3 | 5 | 10;
  notacao: Notacao;
  telaLigada: boolean;
  instrumento: IdInstrumento;
}

export const A4_MIN = 430;
export const A4_MAX = 450;

export const PADRAO: Ajustes = {
  a4: 440,
  tolerancia: 5,
  notacao: 'letras',
  telaLigada: true,
  instrumento: 'violao'
};

const CHAVE = 'afinati:ajustes:v1';
const INSTRUMENTOS_VALIDOS: IdInstrumento[] = ['violao', 'guitarra', 'ukulele', 'baixo'];

/** Confere cada campo salvo; qualquer valor estranho volta ao padrão. */
export function validarAjustes(bruto: unknown): Ajustes {
  const a = (typeof bruto === 'object' && bruto !== null ? bruto : {}) as Record<string, unknown>;
  const a4 = typeof a.a4 === 'number' && Number.isInteger(a.a4) && a.a4 >= A4_MIN && a.a4 <= A4_MAX ? a.a4 : PADRAO.a4;
  const tolerancia = a.tolerancia === 3 || a.tolerancia === 5 || a.tolerancia === 10 ? a.tolerancia : PADRAO.tolerancia;
  const notacao = a.notacao === 'letras' || a.notacao === 'solfejo' ? a.notacao : PADRAO.notacao;
  const telaLigada = typeof a.telaLigada === 'boolean' ? a.telaLigada : PADRAO.telaLigada;
  const instrumento = INSTRUMENTOS_VALIDOS.includes(a.instrumento as IdInstrumento) ? (a.instrumento as IdInstrumento) : PADRAO.instrumento;
  return { a4, tolerancia, notacao, telaLigada, instrumento };
}

function carregar(): Ajustes {
  try {
    const texto = localStorage.getItem(CHAVE);
    return texto ? validarAjustes(JSON.parse(texto)) : PADRAO;
  } catch {
    return PADRAO;
  }
}

function salvar(ajustes: Ajustes) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(ajustes));
  } catch {
    // Sem armazenamento (aba anônima, por exemplo): os ajustes valem só nesta visita.
  }
}

/** Ajustes salvos só neste aparelho. */
export function useAjustes() {
  const [ajustes, setAjustes] = useState<Ajustes>(carregar);
  const mudar = useCallback((parcial: Partial<Ajustes>) => {
    setAjustes((atual) => {
      const novo = validarAjustes({ ...atual, ...parcial });
      salvar(novo);
      return novo;
    });
  }, []);
  return [ajustes, mudar] as const;
}
