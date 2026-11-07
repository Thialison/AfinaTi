import type { IdInstrumento } from '../musica/instrumentos';

/** Timbre de cada instrumento: quanto o som dura e quão brilhante é o ataque. */
const TIMBRES: Record<IdInstrumento, { duracao: number; perda: number; brilho: number }> = {
  violao: { duracao: 2.4, perda: 0.996, brilho: 0.5 },
  guitarra: { duracao: 2.8, perda: 0.998, brilho: 0.7 },
  ukulele: { duracao: 1.6, perda: 0.993, brilho: 0.6 },
  baixo: { duracao: 3, perda: 0.998, brilho: 0.3 }
};

/** Gerador simples e repetível de números aleatórios (o mesmo som sai igual em todo aparelho). */
function aleatorio(semente: number) {
  let s = semente >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Som de corda dedilhada (algoritmo Karplus-Strong), afinado com atraso fracionário
 * para a nota sair na frequência certa. Função pura: devolve as amostras.
 */
export function gerarCorda(freq: number, taxa: number, instrumento: IdInstrumento = 'violao'): Float32Array<ArrayBuffer> {
  const { duracao, perda, brilho } = TIMBRES[instrumento];
  const total = Math.floor(taxa * duracao);
  const saida = new Float32Array(total);
  // O filtro de média soma meia amostra de atraso; descontamos para a afinação ficar exata.
  const atraso = taxa / freq - 0.5;
  const inteiro = Math.floor(atraso);
  const fracao = atraso - inteiro;

  // Ataque: ruído suavizado (menos brilho = som mais redondo).
  const r = aleatorio(Math.round(freq * 100));
  let anterior = 0;
  for (let i = 0; i <= inteiro + 1 && i < total; i++) {
    const ruido = r() * 2 - 1;
    anterior = brilho * ruido + (1 - brilho) * anterior;
    saida[i] = anterior;
  }

  const ler = (pos: number) => (pos >= 0 ? saida[pos] : 0);
  for (let n = inteiro + 2; n < total; n++) {
    // Valor atrasado com interpolação linear entre as duas amostras vizinhas.
    const a = ler(n - inteiro) * (1 - fracao) + ler(n - inteiro - 1) * fracao;
    const b = ler(n - inteiro - 1) * (1 - fracao) + ler(n - inteiro - 2) * fracao;
    saida[n] = perda * 0.5 * (a + b);
  }

  // Normaliza o volume e suaviza o fim para não estalar.
  let pico = 0;
  for (let i = 0; i < total; i++) pico = Math.max(pico, Math.abs(saida[i]));
  const ganho = pico > 0 ? 0.8 / pico : 0;
  const fim = Math.floor(taxa * 0.15);
  for (let i = 0; i < total; i++) {
    const cauda = i > total - fim ? (total - i) / fim : 1;
    saida[i] *= ganho * cauda;
  }
  return saida;
}

let ctx: AudioContext | null = null;
const cache = new Map<string, AudioBuffer>();
let tocando: AudioBufferSourceNode[] = [];

function contexto(): AudioContext | null {
  if (!window.AudioContext) return null;
  ctx ??= new AudioContext();
  void ctx.resume();
  return ctx;
}

function buffer(c: AudioContext, freq: number, instrumento: IdInstrumento): AudioBuffer {
  const chave = `${instrumento}:${freq.toFixed(3)}:${c.sampleRate}`;
  let b = cache.get(chave);
  if (!b) {
    const amostras = gerarCorda(freq, c.sampleRate, instrumento);
    b = c.createBuffer(1, amostras.length, c.sampleRate);
    b.copyToChannel(amostras, 0);
    cache.set(chave, b);
  }
  return b;
}

/** Para o que estiver tocando (ao tocar de novo ou sair da tela). */
export function pararSons() {
  for (const s of tocando) {
    try {
      s.stop();
    } catch {
      // já tinha parado
    }
  }
  tocando = [];
}

/**
 * Toca uma ou mais notas como cordas dedilhadas.
 * Várias notas = acorde em batida para baixo, da mais grave para a mais aguda.
 * `inicio` em segundos a partir de agora; devolve quando o som termina (em segundos).
 */
export function tocarCordas(freqs: number[], instrumento: IdInstrumento, inicio = 0, intervalo = 0.035): number {
  const c = contexto();
  if (!c) return 0;
  const agora = c.currentTime + 0.03 + inicio;
  const volume = c.createGain();
  volume.gain.value = freqs.length > 1 ? 0.9 / Math.sqrt(freqs.length) : 0.9;
  volume.connect(c.destination);
  const ordenadas = [...freqs].sort((a, b) => a - b);
  let fim = 0;
  ordenadas.forEach((f, i) => {
    const fonte = c.createBufferSource();
    fonte.buffer = buffer(c, f, instrumento);
    fonte.connect(volume);
    const t = agora + i * intervalo;
    fonte.start(t);
    fonte.onended = () => {
      tocando = tocando.filter((s) => s !== fonte);
    };
    tocando.push(fonte);
    fim = Math.max(fim, t + fonte.buffer.duration - c.currentTime);
  });
  return fim;
}
