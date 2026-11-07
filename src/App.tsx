import { useEffect, useState } from 'react';
import { useAjustes } from './ajustes';
import type { Rota } from './componentes/Navegacao';
import { Navegacao } from './componentes/Navegacao';
import { Afinacoes } from './telas/Afinacoes';
import { Afinador } from './telas/Afinador';
import { AjustesTela } from './telas/AjustesTela';

const ROTAS: Rota[] = ['afinador', 'afinacoes', 'ajustes'];
const TITULOS: Record<Rota, string> = {
  afinador: 'AfinaTi · Afinador',
  afinacoes: 'AfinaTi · Afinações padrão',
  ajustes: 'AfinaTi · Ajustes'
};

function rotaAtual(): Rota {
  const r = window.location.hash.replace(/^#\/?/, '') as Rota;
  return ROTAS.includes(r) ? r : 'afinador';
}

export function App() {
  const [rota, setRota] = useState<Rota>(rotaAtual);
  const [ajustes, mudar] = useAjustes();

  useEffect(() => {
    const aoMudar = () => {
      setRota(rotaAtual());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', aoMudar);
    return () => window.removeEventListener('hashchange', aoMudar);
  }, []);

  useEffect(() => {
    document.title = TITULOS[rota];
  }, [rota]);

  return (
    <div className="app">
      <main>
        {rota === 'afinador' && <Afinador ajustes={ajustes} mudar={mudar} />}
        {rota === 'afinacoes' && (
          <Afinacoes
            ajustes={ajustes}
            onAfinar={(id) => {
              mudar({ instrumento: id });
              window.location.hash = '#/afinador';
            }}
          />
        )}
        {rota === 'ajustes' && <AjustesTela ajustes={ajustes} mudar={mudar} />}
      </main>
      <Navegacao atual={rota} />
    </div>
  );
}
