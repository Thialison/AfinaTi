export type Notacao = 'letras' | 'solfejo';

const LETRAS = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const SOLFEJO = ['Dó', 'Dó♯', 'Ré', 'Ré♯', 'Mi', 'Fá', 'Fá♯', 'Sol', 'Sol♯', 'Lá', 'Lá♯', 'Si'];

/** Número MIDI do Lá 4 (A4). */
const MIDI_A4 = 69;

/** Frequência de uma nota MIDI, com o Lá de referência em `a4` Hz. */
export function frequenciaDaNota(midi: number, a4 = 440): number {
  return a4 * Math.pow(2, (midi - MIDI_A4) / 12);
}

/** Diferença em cents entre uma frequência ouvida e a frequência alvo. */
export function centsEntre(ouvida: number, alvo: number): number {
  return 1200 * Math.log2(ouvida / alvo);
}

export function nomeDaNota(midi: number, notacao: Notacao = 'letras'): string {
  const i = ((midi % 12) + 12) % 12;
  return notacao === 'solfejo' ? SOLFEJO[i] : LETRAS[i];
}

export function oitavaDaNota(midi: number): number {
  return Math.floor(midi / 12) - 1;
}

/** Nota cromática mais próxima de uma frequência. */
export function notaMaisProxima(freq: number, a4 = 440): { midi: number; cents: number } {
  const midi = Math.round(MIDI_A4 + 12 * Math.log2(freq / a4));
  return { midi, cents: centsEntre(freq, frequenciaDaNota(midi, a4)) };
}

/** Formata um número com vírgula decimal (padrão brasileiro). */
export function formatar(valor: number, casas: number): string {
  return valor.toFixed(casas).replace('.', ',');
}
