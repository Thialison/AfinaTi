import { describe, expect, it } from 'vitest';
import { PADRAO, validarAjustes } from './ajustes';

describe('ajustes salvos', () => {
  it('aceita valores válidos', () => {
    const a = { a4: 442, tolerancia: 3, notacao: 'solfejo', telaLigada: false, instrumento: 'baixo' };
    expect(validarAjustes(a)).toEqual(a);
  });

  it('troca valores estranhos pelo padrão', () => {
    expect(validarAjustes({ a4: 9999, tolerancia: 7, notacao: 'x', telaLigada: 'sim', instrumento: '<script>' })).toEqual(PADRAO);
    expect(validarAjustes(null)).toEqual(PADRAO);
    expect(validarAjustes('texto')).toEqual(PADRAO);
    expect(validarAjustes({ a4: 440.5 }).a4).toBe(440);
  });
});
