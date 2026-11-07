import { PitchDetector } from 'pitchy';

/** Abaixo disso o som é considerado silêncio (volume RMS, de 0 a 1). */
export const VOLUME_MINIMO = 0.01;
/** Quão "limpa" a nota precisa estar para ser aceita (0 a 1). */
export const CLAREZA_MINIMA = 0.9;
/** Faixa aceita: um pouco abaixo do Mi grave do baixo (41 Hz) até acima do Lá do ukulele. */
export const FREQ_MIN = 30;
export const FREQ_MAX = 1200;

export interface Leitura {
  freq: number;
  clareza: number;
  volume: number;
}

export function volumeRms(amostras: Float32Array): number {
  let soma = 0;
  for (let i = 0; i < amostras.length; i++) soma += amostras[i] * amostras[i];
  return Math.sqrt(soma / amostras.length);
}

/**
 * Detecta a frequência fundamental de um trecho de áudio com o algoritmo McLeod (biblioteca pitchy).
 * Devolve null quando há silêncio, ruído ou uma frequência fora da faixa dos instrumentos.
 */
export function criarDetector(tamanho: number) {
  const detector = PitchDetector.forFloat32Array(tamanho);
  return (amostras: Float32Array, taxa: number): Leitura | null => {
    const volume = volumeRms(amostras);
    if (volume < VOLUME_MINIMO) return null;
    const [freq, clareza] = detector.findPitch(amostras, taxa);
    if (clareza < CLAREZA_MINIMA || freq < FREQ_MIN || freq > FREQ_MAX) return null;
    return { freq, clareza, volume };
  };
}

/** Mediana das últimas leituras: tira os saltos de uma leitura isolada. */
export function mediana(valores: number[]): number {
  const ordenados = [...valores].sort((a, b) => a - b);
  const meio = Math.floor(ordenados.length / 2);
  return ordenados.length % 2 ? ordenados[meio] : (ordenados[meio - 1] + ordenados[meio]) / 2;
}
