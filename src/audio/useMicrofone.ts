import { useCallback, useEffect, useRef, useState } from 'react';
import { criarDetector, mediana } from './detector';

export type EstadoMicrofone = 'parado' | 'pedindo' | 'ouvindo' | 'negado' | 'indisponivel' | 'erro';

/** Amostras analisadas por vez: ~85 ms a 48 kHz, o bastante para o Mi grave do baixo (41 Hz). */
const TAMANHO = 4096;
/** Intervalo entre análises (ms). */
const INTERVALO = 50;
/** Leituras usadas na mediana. */
const JANELA = 5;
/** Depois de quanto tempo sem som a nota some da tela (ms). */
const ESQUECER_APOS = 1200;

/**
 * Liga o microfone e devolve a frequência que está sendo ouvida.
 * O áudio é analisado só no aparelho: nada é gravado nem enviado.
 */
export function useMicrofone() {
  const [estado, setEstado] = useState<EstadoMicrofone>('parado');
  const [freq, setFreq] = useState<number | null>(null);
  const recursos = useRef<{ ctx: AudioContext; stream: MediaStream; timer: number } | null>(null);

  const parar = useCallback(() => {
    const r = recursos.current;
    recursos.current = null;
    if (r) {
      window.clearInterval(r.timer);
      r.stream.getTracks().forEach((t) => t.stop());
      void r.ctx.close().catch(() => undefined);
    }
    setFreq(null);
    setEstado((e) => (e === 'ouvindo' || e === 'pedindo' ? 'parado' : e));
  }, []);

  const iniciar = useCallback(async () => {
    if (recursos.current) return;
    if (!navigator.mediaDevices?.getUserMedia || !window.AudioContext) {
      setEstado('indisponivel');
      return;
    }
    setEstado('pedindo');
    // O AudioContext é criado no toque do botão: o iPhone exige um gesto da pessoa.
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
      await ctx.resume();
      const fonte = ctx.createMediaStreamSource(stream);
      const analisador = ctx.createAnalyser();
      analisador.fftSize = TAMANHO;
      fonte.connect(analisador);

      const amostras = new Float32Array(TAMANHO);
      const detectar = criarDetector(TAMANHO);
      const ultimas: number[] = [];
      let ultimaVez = 0;

      const timer = window.setInterval(() => {
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
      setEstado('ouvindo');
    } catch (erro) {
      void ctx.close().catch(() => undefined);
      const nome = erro instanceof DOMException ? erro.name : '';
      if (nome === 'NotAllowedError' || nome === 'SecurityError') setEstado('negado');
      else if (nome === 'NotFoundError') setEstado('indisponivel');
      else setEstado('erro');
    }
  }, []);

  // Desliga o microfone quando o app vai para segundo plano (privacidade e bateria).
  useEffect(() => {
    const aoMudar = () => {
      if (document.hidden) parar();
    };
    document.addEventListener('visibilitychange', aoMudar);
    return () => {
      document.removeEventListener('visibilitychange', aoMudar);
      parar();
    };
  }, [parar]);

  return { estado, freq, iniciar, parar };
}

/** Já existe permissão para o microfone? (Nem todo navegador sabe responder.) */
export async function microfoneJaPermitido(): Promise<boolean> {
  try {
    const r = await navigator.permissions?.query({ name: 'microphone' as PermissionName });
    return r?.state === 'granted';
  } catch {
    return false;
  }
}
