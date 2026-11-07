import { describe, expect, it } from 'vitest';
import { INSTRUMENTOS, cordaMaisProxima, instrumentoPorId } from './instrumentos';
import { centsEntre, formatar, frequenciaDaNota, nomeDaNota, notaMaisProxima, oitavaDaNota } from './notas';

describe('notas', () => {
  it('calcula as frequências da afinação padrão', () => {
    expect(frequenciaDaNota(69)).toBeCloseTo(440, 5);
    expect(frequenciaDaNota(40)).toBeCloseTo(82.41, 2); // Mi grave do violão
    expect(frequenciaDaNota(28)).toBeCloseTo(41.2, 2); // Mi grave do baixo
    expect(frequenciaDaNota(67)).toBeCloseTo(392.0, 1); // Sol do ukulele
  });

  it('respeita o Lá de referência', () => {
    expect(frequenciaDaNota(69, 432)).toBeCloseTo(432, 5);
    expect(frequenciaDaNota(57, 442)).toBeCloseTo(221, 5);
  });

  it('dá o nome e a oitava em letras e em solfejo', () => {
    expect(nomeDaNota(40)).toBe('E');
    expect(nomeDaNota(40, 'solfejo')).toBe('Mi');
    expect(nomeDaNota(60, 'solfejo')).toBe('Dó');
    expect(oitavaDaNota(40)).toBe(2);
    expect(oitavaDaNota(60)).toBe(4);
  });

  it('mede a distância em cents', () => {
    expect(centsEntre(440, 440)).toBe(0);
    expect(centsEntre(880, 440)).toBeCloseTo(1200, 6);
    expect(centsEntre(frequenciaDaNota(70), 440)).toBeCloseTo(100, 6);
  });

  it('acha a nota cromática mais próxima', () => {
    const r = notaMaisProxima(83);
    expect(r.midi).toBe(40);
    expect(r.cents).toBeGreaterThan(0);
  });

  it('formata com vírgula', () => {
    expect(formatar(82.4069, 2)).toBe('82,41');
  });
});

describe('instrumentos', () => {
  it('tem as afinações padrão certas', () => {
    const letras = (id: Parameters<typeof instrumentoPorId>[0]) =>
      instrumentoPorId(id).cordas.map((c) => `${nomeDaNota(c.midi)}${oitavaDaNota(c.midi)}`).join(' ');
    expect(letras('violao')).toBe('E2 A2 D3 G3 B3 E4');
    expect(letras('guitarra')).toBe('E2 A2 D3 G3 B3 E4');
    expect(letras('ukulele')).toBe('G4 C4 E4 A4');
    expect(letras('baixo')).toBe('E1 A1 D2 G2');
  });

  it('numera as cordas com a 1ª sendo a mais aguda (exceto o Sol reentrante do ukulele)', () => {
    for (const inst of INSTRUMENTOS) {
      const primeira = inst.cordas.find((c) => c.numero === 1)!;
      expect(Math.max(...inst.cordas.map((c) => c.midi))).toBe(primeira.midi);
    }
  });

  it('escolhe a corda mais próxima do som ouvido', () => {
    const violao = instrumentoPorId('violao');
    expect(cordaMaisProxima(80, violao).indice).toBe(0); // um pouco abaixo do Mi grave
    expect(cordaMaisProxima(250, violao).indice).toBe(4); // perto do Si
    const r = cordaMaisProxima(108, violao);
    expect(r.indice).toBe(1);
    expect(r.cents).toBeLessThan(0);
  });
});
