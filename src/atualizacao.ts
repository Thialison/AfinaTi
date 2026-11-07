import { registerSW } from 'virtual:pwa-register';

/** De quanto em quanto tempo procurar versão nova enquanto o app está aberto (ms). */
const INTERVALO = 30 * 60 * 1000;

/**
 * Registra o service worker (uso offline) e aplica versões novas sem a pessoa precisar fechar o app:
 * procura atualização ao abrir, ao voltar para o app e a cada 30 minutos; quando acha, recarrega a página.
 */
export function iniciarAtualizacao() {
  if (!('serviceWorker' in navigator)) return;

  const atualizar = registerSW({
    immediate: true,
    // Com registerType 'autoUpdate', a versão nova assume sozinha e a página recarrega.
    // Se o navegador pedir confirmação mesmo assim, aplica direto.
    onNeedRefresh() {
      void atualizar(true);
    },
    onRegisteredSW(_url, registro) {
      if (!registro) return;
      const procurar = () => {
        if (navigator.onLine) void registro.update().catch(() => undefined);
      };
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) procurar();
      });
      window.setInterval(procurar, INTERVALO);
    }
  });
}
