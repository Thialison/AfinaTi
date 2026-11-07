import type { Passo } from './componentes/Folha';
import type { SituacaoInstalacao } from './sistema';
import { ehIphone } from './sistema';

const CHAVE_FAIXA = 'afinati:faixa-instalar-fechada';

export function faixaFoiFechada(): boolean {
  try {
    return localStorage.getItem(CHAVE_FAIXA) === '1';
  } catch {
    return false;
  }
}

export function fecharFaixa() {
  try {
    localStorage.setItem(CHAVE_FAIXA, '1');
  } catch {
    // Sem armazenamento: a faixa volta na próxima visita.
  }
}

export function passosParaInstalar(situacao: SituacaoInstalacao): { titulo: string; passos: Passo[] } {
  if (situacao === 'iphone') {
    return {
      titulo: 'Instalar no iPhone',
      passos: [
        { texto: 'Toque em Compartilhar, na barra do Safari', icone: 'compartilhar' },
        { texto: 'Escolha “Adicionar à Tela de Início”' },
        { texto: 'Toque em “Adicionar” e abra pelo ícone' }
      ]
    };
  }
  return {
    titulo: 'Instalar no celular',
    passos: [
      { texto: 'Toque no menu do navegador, no canto de cima', icone: 'menu' },
      { texto: 'Escolha “Instalar app” ou “Adicionar à tela inicial”' },
      { texto: 'Confirme e abra pelo ícone' }
    ]
  };
}

export function passosParaLiberarMicrofone(): Passo[] {
  return ehIphone()
    ? [
        { texto: 'Abra Ajustes do iPhone › Apps › Safari' },
        { texto: 'Toque em Microfone e escolha “Permitir”' },
        { texto: 'Volte ao AfinaTi e toque em “Ligar microfone”' }
      ]
    : [
        { texto: 'Toque no ícone ao lado do endereço do site' },
        { texto: 'Em Permissões, libere o Microfone' },
        { texto: 'Volte e toque em “Ligar microfone”' }
      ];
}
