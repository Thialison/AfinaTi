import { useEffect, useState } from 'react';
import type { EstadoMicrofone } from '../audio/useMicrofone';
import { microfoneJaPermitido } from '../audio/useMicrofone';
import { IconeMicrofone, IconeMicrofoneDesligado, IconeOk } from '../componentes/Icones';
import { ehIphone } from '../sistema';

interface Props {
  estado: EstadoMicrofone;
  onPermitir: () => void;
}

export function Permissao({ estado, onPermitir }: Props) {
  const [jaPermitido, setJaPermitido] = useState(false);
  useEffect(() => {
    void microfoneJaPermitido().then(setJaPermitido);
  }, []);

  const pedindo = estado === 'pedindo';

  if (estado === 'negado') {
    return (
      <section className="permissao" aria-labelledby="titulo-permissao">
        <div className="permissao-meio">
          <Aneis alerta />
          <h1 id="titulo-permissao">O microfone está bloqueado</h1>
          <p>Sem o microfone o afinador não consegue ouvir as cordas. Para liberar:</p>
          {ehIphone() ? (
            <ol className="passos">
              <li>Abra Ajustes do iPhone › Apps › Safari › Microfone.</li>
              <li>Escolha “Perguntar” ou “Permitir”.</li>
              <li>Volte aqui e toque em “Tentar de novo”.</li>
            </ol>
          ) : (
            <ol className="passos">
              <li>Toque no cadeado ao lado do endereço do site.</li>
              <li>Em Permissões, libere o Microfone.</li>
              <li>Volte aqui e toque em “Tentar de novo”.</li>
            </ol>
          )}
        </div>
        <div className="acoes">
          <button type="button" className="botao-principal" onClick={onPermitir}>
            Tentar de novo
          </button>
          <a className="botao-secundario" href="#/afinacoes">
            Afinar de ouvido
          </a>
        </div>
      </section>
    );
  }

  if (estado === 'indisponivel' || estado === 'erro') {
    return (
      <section className="permissao" aria-labelledby="titulo-permissao">
        <div className="permissao-meio">
          <Aneis alerta />
          <h1 id="titulo-permissao">
            {estado === 'indisponivel' ? 'Não encontramos um microfone' : 'Não foi possível ligar o microfone'}
          </h1>
          <p>
            {estado === 'indisponivel'
              ? 'Este navegador ou aparelho não oferece acesso ao microfone. Você ainda pode afinar de ouvido com as notas de referência.'
              : 'Outro app pode estar usando o microfone. Feche-o e tente de novo.'}
          </p>
        </div>
        <div className="acoes">
          <button type="button" className="botao-principal" onClick={onPermitir}>
            Tentar de novo
          </button>
          <a className="botao-secundario" href="#/afinacoes">
            Afinar de ouvido
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="permissao" aria-labelledby="titulo-permissao">
      <div className="permissao-meio">
        <Aneis />
        <h1 id="titulo-permissao">
          {jaPermitido ? 'Pronto para afinar' : 'Para afinar, o app precisa ouvir seu instrumento'}
        </h1>
        <p>O som é analisado só no seu aparelho. Nada é gravado nem enviado para a internet.</p>
        {!jaPermitido && (
          <ul className="lista-ok">
            <li><IconeOk tamanho={18} espessura={2.2} />Funciona sem internet depois de aberto uma vez</li>
            <li><IconeOk tamanho={18} espessura={2.2} />Violão, guitarra, ukulele e baixo</li>
            <li><IconeOk tamanho={18} espessura={2.2} />Sem cadastro e sem anúncios</li>
          </ul>
        )}
      </div>
      <div className="acoes">
        <button type="button" className="botao-principal" onClick={onPermitir} disabled={pedindo}>
          {pedindo ? 'Aguardando permissão…' : jaPermitido ? 'Começar a afinar' : 'Permitir microfone'}
        </button>
        <a className="botao-secundario" href="#/afinacoes">
          Ver as afinações primeiro
        </a>
        {!jaPermitido && (
          <p className="nota-rodape">
            O navegador vai perguntar se pode usar o microfone. Dá para mudar isso depois nas configurações do navegador.
          </p>
        )}
      </div>
    </section>
  );
}

function Aneis({ alerta = false }: { alerta?: boolean }) {
  return (
    <div className={alerta ? 'aneis alerta' : 'aneis'}>
      <div>
        <div>{alerta ? <IconeMicrofoneDesligado tamanho={44} espessura={1.8} /> : <IconeMicrofone tamanho={44} espessura={1.8} />}</div>
      </div>
    </div>
  );
}
