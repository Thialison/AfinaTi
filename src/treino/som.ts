import { pararSons, tocarCordas } from '../audio/corda';
import type { IdInstrumento } from '../musica/instrumentos';
import { frequenciaDaNota } from '../musica/notas';

/** Lá de referência na região do instrumento (A1 no baixo, A4 no ukulele, A2 no violão e na guitarra). */
const LA_DO_INSTRUMENTO: Record<IdInstrumento, number> = { violao: 45, guitarra: 45, ukulele: 69, baixo: 33 };

export function tocarNotas(notas: number[], instrumento: IdInstrumento, a4: number, inicio = 0): number {
  return tocarCordas(
    notas.map((m) => frequenciaDaNota(m, a4)),
    instrumento,
    inicio
  );
}

export function tocarReferencia(instrumento: IdInstrumento, a4: number, inicio = 0): number {
  return tocarNotas([LA_DO_INSTRUMENTO[instrumento]], instrumento, a4, inicio);
}

/** Toca a pergunta, com o Lá antes quando a pessoa pediu. */
export function tocarPergunta(notas: number[], instrumento: IdInstrumento, a4: number, comReferencia: boolean) {
  pararSons();
  if (comReferencia) {
    tocarReferencia(instrumento, a4);
    tocarNotas(notas, instrumento, a4, 1.4);
  } else {
    tocarNotas(notas, instrumento, a4);
  }
}

/** Toca uma resposta e depois a outra, para comparar. */
export function tocarDuas(a: number[], b: number[], instrumento: IdInstrumento, a4: number) {
  pararSons();
  tocarNotas(a, instrumento, a4);
  tocarNotas(b, instrumento, a4, 1.6);
}

export { pararSons };
