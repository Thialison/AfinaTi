import { describe, expect, it } from 'vitest';
import { criarDetector, mediana } from './detector';

const TAXA = 48000;
const TAMANHO = 4096;

/** Gera um som parecido com uma corda: fundamental + harmônicos que vão diminuindo. */
function corda(freq: number, amplitude = 0.3): Float32Array {
  const a = new Float32Array(TAMANHO);
  for (let i = 0; i < TAMANHO; i++) {
    const t = i / TAXA;
    let v = 0;
    for (let h = 1; h <= 6; h++) v += Math.sin(2 * Math.PI * freq * h * t) / h;
    a[i] = amplitude * 0.5 * v;
  }
  return a;
}

describe('detector de frequência', () => {
  const detectar = criarDetector(TAMANHO);
  const notas: [string, number][] = [
    ['Mi grave do baixo (E1)', 41.2],
    ['Lá do baixo (A1)', 55],
    ['Mi grave do violão (E2)', 82.41],
    ['Sol do violão (G3)', 196],
    ['Dó do ukulele (C4)', 261.63],
    ['Mi agudo (E4)', 329.63],
    ['Lá do ukulele (A4)', 440]
  ];

  for (const [nome, freq] of notas) {
    it(`reconhece ${nome}`, () => {
      const r = detectar(corda(freq), TAXA);
      expect(r).not.toBeNull();
      // Erro menor que 2 cents.
      expect(Math.abs(1200 * Math.log2(r!.freq / freq))).toBeLessThan(2);
    });
  }

  it('ignora silêncio', () => {
    expect(detectar(new Float32Array(TAMANHO), TAXA)).toBeNull();
    expect(detectar(corda(110, 0.001), TAXA)).toBeNull();
  });

  it('ignora ruído', () => {
    const ruido = new Float32Array(TAMANHO);
    let semente = 1;
    for (let i = 0; i < TAMANHO; i++) {
      semente = (semente * 16807) % 2147483647;
      ruido[i] = (semente / 2147483647 - 0.5) * 0.6;
    }
    expect(detectar(ruido, TAXA)).toBeNull();
  });
});

describe('mediana', () => {
  it('tira leituras isoladas', () => {
    expect(mediana([82, 82.2, 164, 82.1, 81.9])).toBeCloseTo(82.1, 5);
    expect(mediana([1, 2, 3, 4])).toBe(2.5);
  });
});
