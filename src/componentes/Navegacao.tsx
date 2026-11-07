import { IconeAjustes, IconeBraco, IconeMedidor } from './Icones';

export type Rota = 'afinador' | 'afinacoes' | 'ajustes';

const ITENS: { rota: Rota; rotulo: string; Icone: typeof IconeMedidor }[] = [
  { rota: 'afinador', rotulo: 'Afinador', Icone: IconeMedidor },
  { rota: 'afinacoes', rotulo: 'Afinações', Icone: IconeBraco },
  { rota: 'ajustes', rotulo: 'Ajustes', Icone: IconeAjustes }
];

export function Navegacao({ atual }: { atual: Rota }) {
  return (
    <nav className="navegacao" aria-label="Telas">
      <div className="navegacao-itens">
        {ITENS.map(({ rota, rotulo, Icone }) => (
          <a key={rota} href={`#/${rota}`} aria-current={rota === atual ? 'page' : undefined}>
            <Icone />
            {rotulo}
          </a>
        ))}
      </div>
    </nav>
  );
}
