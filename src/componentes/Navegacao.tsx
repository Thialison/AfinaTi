import { IconeAjustes, IconeBraco, IconeMedidor, IconeOuvido } from './Icones';

export type Rota = 'afinador' | 'afinacoes' | 'treino' | 'ajustes';

const ITENS: { rota: Rota; rotulo: string; Icone: typeof IconeMedidor }[] = [
  { rota: 'afinador', rotulo: 'Afinador', Icone: IconeMedidor },
  { rota: 'afinacoes', rotulo: 'Afinações', Icone: IconeBraco },
  { rota: 'treino', rotulo: 'Treino', Icone: IconeOuvido },
  { rota: 'ajustes', rotulo: 'Ajustes', Icone: IconeAjustes }
];

/** Barra em pílula que flutua sobre a tela; só a aba aberta mostra o nome. */
export function Navegacao({ atual }: { atual: Rota }) {
  return (
    <nav className="navegacao" aria-label="Telas">
      {ITENS.map(({ rota, rotulo, Icone }) => {
        const aberta = rota === atual;
        return (
          <a key={rota} href={`#/${rota}`} aria-current={aberta ? 'page' : undefined} aria-label={aberta ? undefined : rotulo}>
            <Icone tamanho={20} />
            {aberta && <span>{rotulo}</span>}
          </a>
        );
      })}
    </nav>
  );
}
