import { useEffect, useState } from 'react';

/** Mantém a tela ligada enquanto `ativo` for verdadeiro (Screen Wake Lock API). */
export function useTelaLigada(ativo: boolean) {
  useEffect(() => {
    if (!ativo || !('wakeLock' in navigator)) return;
    let trava: WakeLockSentinel | null = null;
    let cancelado = false;
    const pedir = async () => {
      if (document.hidden || cancelado) return;
      try {
        trava = await navigator.wakeLock.request('screen');
      } catch {
        // Bateria fraca ou navegador recusou: segue sem travar a tela.
      }
    };
    void pedir();
    // O sistema solta a trava quando o app sai da tela; pede de novo ao voltar.
    document.addEventListener('visibilitychange', pedir);
    return () => {
      cancelado = true;
      document.removeEventListener('visibilitychange', pedir);
      void trava?.release().catch(() => undefined);
    };
  }, [ativo]);
}

interface EventoInstalacao extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let eventoGuardado: EventoInstalacao | null = null;
const ouvintes = new Set<() => void>();

/** Chamado logo no início do app, antes de o navegador disparar o convite de instalação. */
export function capturarConviteDeInstalacao() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    eventoGuardado = e as EventoInstalacao;
    ouvintes.forEach((f) => f());
  });
  window.addEventListener('appinstalled', () => {
    eventoGuardado = null;
    ouvintes.forEach((f) => f());
  });
}

export function estaInstalado(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function ehIphone(): boolean {
  const ua = navigator.userAgent;
  // iPad com iPadOS se apresenta como Mac, mas tem tela de toque.
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

export type SituacaoInstalacao = 'instalado' | 'iphone' | 'convite' | 'navegador';

export function useInstalacao() {
  const calcular = (): SituacaoInstalacao =>
    estaInstalado() ? 'instalado' : ehIphone() ? 'iphone' : eventoGuardado ? 'convite' : 'navegador';
  const [situacao, setSituacao] = useState<SituacaoInstalacao>(calcular);

  useEffect(() => {
    const atualizar = () => setSituacao(calcular());
    ouvintes.add(atualizar);
    return () => {
      ouvintes.delete(atualizar);
    };
  }, []);

  const instalar = async () => {
    if (!eventoGuardado) return;
    await eventoGuardado.prompt();
    await eventoGuardado.userChoice.catch(() => undefined);
    eventoGuardado = null;
    setSituacao(calcular());
  };

  return { situacao, instalar };
}
