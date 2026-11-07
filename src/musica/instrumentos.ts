import { centsEntre, frequenciaDaNota } from './notas';

export type IdInstrumento = 'violao' | 'guitarra' | 'ukulele' | 'baixo';

export interface Corda {
  /** Número da corda (1 = a mais fina/aguda). */
  numero: number;
  /** Nota MIDI da afinação padrão. */
  midi: number;
  /** Espessura do desenho, em px. */
  espessura: number;
}

export interface Instrumento {
  id: IdInstrumento;
  nome: string;
  dica: string;
  corDaCorda: string;
  /** Cordas na ordem em que aparecem olhando o instrumento de frente (da mais grave para a mais aguda). */
  cordas: Corda[];
}

// MIDI: E1=28 A1=33 D2=38 G2=43 E2=40 A2=45 D3=50 G3=55 B3=59 E4=64 C4=60 A4=69 G4=67
export const INSTRUMENTOS: Instrumento[] = [
  {
    id: 'violao',
    nome: 'Violão',
    dica: 'Da corda mais grossa (6ª) para a mais fina (1ª): Mi, Lá, Ré, Sol, Si, Mi.',
    corDaCorda: '#D8CBB0',
    cordas: [
      { numero: 6, midi: 40, espessura: 4 },
      { numero: 5, midi: 45, espessura: 3.4 },
      { numero: 4, midi: 50, espessura: 2.8 },
      { numero: 3, midi: 55, espessura: 2.4 },
      { numero: 2, midi: 59, espessura: 1.9 },
      { numero: 1, midi: 64, espessura: 1.5 }
    ]
  },
  {
    id: 'guitarra',
    nome: 'Guitarra',
    dica: 'Mesmas notas do violão, com cordas de aço mais finas.',
    corDaCorda: '#C9D2DC',
    cordas: [
      { numero: 6, midi: 40, espessura: 3.4 },
      { numero: 5, midi: 45, espessura: 2.9 },
      { numero: 4, midi: 50, espessura: 2.4 },
      { numero: 3, midi: 55, espessura: 2 },
      { numero: 2, midi: 59, espessura: 1.5 },
      { numero: 1, midi: 64, espessura: 1.2 }
    ]
  },
  {
    id: 'ukulele',
    nome: 'Ukulele',
    dica: 'Afinação reentrante: a 4ª corda (Sol) é mais aguda que a 3ª (Dó).',
    corDaCorda: '#EDE6D6',
    cordas: [
      { numero: 4, midi: 67, espessura: 2 },
      { numero: 3, midi: 60, espessura: 2.8 },
      { numero: 2, midi: 64, espessura: 2.3 },
      { numero: 1, midi: 69, espessura: 1.7 }
    ]
  },
  {
    id: 'baixo',
    nome: 'Baixo',
    dica: 'Uma oitava abaixo das quatro cordas mais graves do violão.',
    corDaCorda: '#B7C0CA',
    cordas: [
      { numero: 4, midi: 28, espessura: 5.2 },
      { numero: 3, midi: 33, espessura: 4.5 },
      { numero: 2, midi: 38, espessura: 3.8 },
      { numero: 1, midi: 43, espessura: 3.2 }
    ]
  }
];

export function instrumentoPorId(id: IdInstrumento): Instrumento {
  return INSTRUMENTOS.find((i) => i.id === id) ?? INSTRUMENTOS[0];
}

/** Corda cuja nota está mais perto (em cents) da frequência ouvida. */
export function cordaMaisProxima(freq: number, instrumento: Instrumento, a4 = 440): { indice: number; cents: number } {
  let melhor = { indice: 0, cents: Infinity };
  instrumento.cordas.forEach((corda, indice) => {
    const cents = centsEntre(freq, frequenciaDaNota(corda.midi, a4));
    if (Math.abs(cents) < Math.abs(melhor.cents)) melhor = { indice, cents };
  });
  return melhor;
}
