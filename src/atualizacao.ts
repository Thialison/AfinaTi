import { registerSW } from 'virtual:pwa-register';

/** De quanto em quanto tempo procurar versão nova enquanto o app está aberto (ms). */
const INTERVALO = 15 * 60 * 1000;

let bloqueado = false;
let pendente = false;
let recarregando = false;

function recarregar() {
  if (bloqueado) {
    pendente = true;
    return;
  }
  if (recarregando) return;
  recarregando = true;
  window.location.reload();
}

/** Enquanto um treino está em andamento, a atualização espera ele acabar para não perder a partida. */
export function segurarAtualizacao(segurar: boolean) {
  bloqueado = segurar;
  if (!segurar && pendente) recarregar();
}

/**
 * Registra o service worker (uso offline) e aplica versões novas sem a pessoa precisar fechar o app:
 * procura atualização ao abrir, ao trocar de aba, ao voltar para o app e a cada 15 minutos;
 * quando a versão nova assume, a página recarrega.
 */
export function iniciarAtualizacao() {
  if (!('serviceWorker' in navigator)) return;

  // Se já havia uma versão controlando a página, a troca de controle significa versão nova.
  // (Na primeira visita não há controle, e a página não precisa recarregar.)
  const tinhaVersao = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (tinhaVersao) recarregar();
  });

  registerSW({
    immediate: true,
    onNeedReload: recarregar,
    onRegisteredSW(_url, registro) {
      if (!registro) return;
      const procurar = () => {
        if (navigator.onLine) void registro.update().catch(() => undefined);
      };
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) procurar();
      });
      window.addEventListener('hashchange', procurar);
      window.setInterval(procurar, INTERVALO);
    }
  });
}
