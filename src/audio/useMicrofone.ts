import { useCallback, useEffect, useRef, useState } from 'react';
import { criarDetector, mediana } from './detector';

/**
 * - `pedindo`: esperando a pessoa responder à pergunta do navegador.
 * - `suspenso`: microfone liberado, mas o navegador só deixa o áudio começar depois de um toque na tela.
 */
export type EstadoMicrofone = 'parado' | 'pedindo' | 'suspenso' | 'ouvindo' | 'negado' | 'indisponivel' | 'erro';

/** Amostras analisadas por vez: ~85 ms a 48 kHz, o bastante para o Mi grave do baixo (41 Hz). */
const TAMANHO = 4096;
/** Intervalo entre análises (ms). */
const INTERVALO = 50;
/** Leituras usadas na mediana. */
const JANELA = 5;
/** Depois de quanto tempo sem som a nota some da tela (ms). */
const ESQUECER_APOS = 1200;

interface Recursos {
  ctx: AudioContext;
  stream: MediaStream;
  timer: number;
}

/**
 * Liga o microfone assim que a tela abre e devolve a frequência que está sendo ouvida.
 * O áudio é analisado só no aparelho: nada é gravado nem enviado.
 */
export function useMicrofone() {
  const [estado, setEstado] = useState<EstadoMicrofone>('parado');
  const [freq, setFreq] = useState<number | null>(null);
  const recursos = useRef<Recursos | null>(null);
  /** Muda a cada parada: um pedido antigo que termina depois disso é descartado. */
  const geracao = useRef(0);
  /** O microfone deve voltar a ouvir quando o app voltar para a tela? */
  const voltarAOuvir = useRef(false);

  const liberar = (r: Recursos) => {
    window.clearInterval(r.timer);
    r.stream.getTracks().forEach((t) => t.stop());
    r.ctx.onstatechange = null;
    void r.ctx.close().catch(() => undefined);
  };

  const parar = useCallback(() => {
    geracao.current++;
    const r = recursos.current;
    recursos.current = null;
    if (r) liberar(r);
    setFreq(null);
    setEstado((e) => (e === 'negado' || e === 'indisponivel' ? e : 'parado'));
  }, []);

  const iniciar = useCallback(async () => {
    const existente = recursos.current;
    if (existente) {
      // Já tem microfone; só falta o toque para o áudio começar.
      void existente.ctx.resume().catch(() => undefined);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.AudioContext) {
      setEstado('indisponivel');
      return;
    }
    const minha = ++geracao.current;
    setEstado('pedindo');
    const ctx = new AudioContext();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          // Esses filtros servem para voz e distorcem a nota do instrumento.
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });
      if (minha !== geracao.current) {
        // A tela foi fechada enquanto o navegador perguntava.
        stream.getTracks().forEach((t) => t.stop());
        void ctx.close().catch(() => undefined);
        return;
      }
      const fonte = ctx.createMediaStreamSource(stream);
      const analisador = ctx.createAnalyser();
      analisador.fftSize = TAMANHO;
      fonte.connect(analisador);

      const amostras = new Float32Array(TAMANHO);
      const detectar = criarDetector(TAMANHO);
      const ultimas: number[] = [];
      let ultimaVez = 0;

      const timer = window.setInterval(() => {
        if (ctx.state !== 'running') return;
        analisador.getFloatTimeDomainData(amostras);
        const leitura = detectar(amostras, ctx.sampleRate);
        const agora = performance.now();
        if (leitura) {
          // Mudou de nota (mais de ~1 semitom)? Começa a mediana de novo.
          const anterior = ultimas[ultimas.length - 1];
          if (anterior && Math.abs(1200 * Math.log2(leitura.freq / anterior)) > 80) ultimas.length = 0;
          ultimas.push(leitura.freq);
          if (ultimas.length > JANELA) ultimas.shift();
          ultimaVez = agora;
          setFreq(mediana(ultimas));
        } else if (agora - ultimaVez > ESQUECER_APOS) {
          ultimas.length = 0;
          setFreq(null);
        }
      }, INTERVALO);

      recursos.current = { ctx, stream, timer };
      voltarAOuvir.current = true;
      const atualizar = () => setEstado(ctx.state === 'running' ? 'ouvindo' : 'suspenso');
      ctx.onstatechange = atualizar;
      atualizar();
      void ctx.resume().catch(() => undefined);
    } catch (erro) {
      void ctx.close().catch(() => undefined);
      if (minha !== geracao.current) return;
      const nome = erro instanceof DOMException ? erro.name : '';
      if (nome === 'NotAllowedError' || nome === 'SecurityError') setEstado('negado');
      else if (nome === 'NotFoundError' || nome === 'NotSupportedError') setEstado('indisponivel');
      else setEstado('erro');
    }
  }, []);

  // Liga sozinho quando a tela abre e desliga quando ela fecha.
  useEffect(() => {
    void iniciar();
    return () => {
      voltarAOuvir.current = false;
      parar();
    };
  }, [iniciar, parar]);

  // O navegador segurou o áudio: o primeiro toque em qualquer lugar da tela libera.
  useEffect(() => {
    if (estado !== 'suspenso') return;
    const liberarAudio = () => void recursos.current?.ctx.resume().catch(() => undefined);
    document.addEventListener('pointerdown', liberarAudio, true);
    document.addEventListener('keydown', liberarAudio, true);
    return () => {
      document.removeEventListener('pointerdown', liberarAudio, true);
      document.removeEventListener('keydown', liberarAudio, true);
    };
  }, [estado]);

  // Desliga o microfone quando o app vai para segundo plano (privacidade e bateria) e religa ao voltar.
  useEffect(() => {
    const aoMudar = () => {
      if (document.hidden) {
        const ouvia = recursos.current !== null;
        parar();
        voltarAOuvir.current = ouvia;
      } else if (voltarAOuvir.current) {
        void iniciar();
      }
    };
    document.addEventListener('visibilitychange', aoMudar);
    return () => document.removeEventListener('visibilitychange', aoMudar);
  }, [iniciar, parar]);

  return { estado, freq, iniciar };
}
