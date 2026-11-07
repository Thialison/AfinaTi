import { describe, expect, it } from 'vitest';
import { frequenciaDaNota } from '../musica/notas';
import { gerarCorda } from './corda';
import { criarDetector } from './detector';

const TAXA = 48000;
const TAMANHO = 4096;

describe('som de corda dedilhada', () => {
  const detectar = criarDetector(TAMANHO);
  const casos: [string, number, 'violao' | 'guitarra' | 'ukulele' | 'baixo'][] = [
    ['Mi grave do baixo', frequenciaDaNota(28), 'baixo'],
    ['Mi grave do violão', frequenciaDaNota(40), 'violao'],
    ['Si da guitarra', frequenciaDaNota(59), 'guitarra'],
    ['Mi agudo do violão', frequenciaDaNota(64), 'violao'],
    ['Lá do ukulele', frequenciaDaNota(69), 'ukulele'],
    ['Dó do ukulele (acorde)', frequenciaDaNota(72), 'ukulele']
  ];

  for (const [nome, freq, instrumento] of casos) {
    it(`sai afinado: ${nome}`, () => {
      const som = gerarCorda(freq, TAXA, instrumento);
      // Analisa um trecho depois do ataque, como faria o ouvido (ou o afinador).
      const trecho = som.subarray(TAXA * 0.2, TAXA * 0.2 + TAMANHO);
      const r = detectar(trecho, TAXA);
      expect(r).not.toBeNull();
      expect(Math.abs(1200 * Math.log2(r!.freq / freq))).toBeLessThan(3);
    });
  }

  it('não estoura o volume e termina em silêncio', () => {
    const som = gerarCorda(110, TAXA);
    expect(Math.max(...Array.from(som, Math.abs))).toBeLessThanOrEqual(0.81);
    expect(Math.abs(som[som.length - 1])).toBeLessThan(0.001);
  });
});
