import type { Ajustes } from '../ajustes';
import { A4_MAX, A4_MIN } from '../ajustes';
import { IconeCelular, IconeCompartilhar, IconeOk } from '../componentes/Icones';
import { useInstalacao } from '../sistema';
import { VERSAO } from '../versao';

interface Props {
  ajustes: Ajustes;
  mudar: (parcial: Partial<Ajustes>) => void;
}

const TOLERANCIAS: Ajustes['tolerancia'][] = [3, 5, 10];

export function AjustesTela({ ajustes, mudar }: Props) {
  const { situacao, instalar } = useInstalacao();
  const temWakeLock = 'wakeLock' in navigator;

  return (
    <div className="tela">
      <header className="topo" style={{ paddingBottom: 4 }}>
        <h1 className="titulo-tela">Ajustes</h1>
      </header>

      <div className="ajustes">
        <section className="grupo" aria-labelledby="grupo-afinacao">
          <h2 id="grupo-afinacao">Afinação</h2>
          <div className="caixa">
            <div className="linha-ajuste">
              <div>
                <p className="rotulo" id="rotulo-a4">Lá de referência</p>
                <p className="explica">Padrão: 440 Hz</p>
              </div>
              <div className="passo-a-passo" role="group" aria-labelledby="rotulo-a4">
                <button
                  type="button"
                  className="redondo"
                  aria-label="Diminuir 1 Hz"
                  disabled={ajustes.a4 <= A4_MIN}
                  onClick={() => mudar({ a4: ajustes.a4 - 1 })}
                >
                  −
                </button>
                <span className="valor" aria-live="polite">{ajustes.a4} Hz</span>
                <button
                  type="button"
                  className="redondo"
                  aria-label="Aumentar 1 Hz"
                  disabled={ajustes.a4 >= A4_MAX}
                  onClick={() => mudar({ a4: ajustes.a4 + 1 })}
                >
                  +
                </button>
              </div>
            </div>
            <div className="divisor" />
            <div className="bloco-ajuste">
              <p className="rotulo" id="rotulo-tol">Margem para “afinado”</p>
              <div className="segmentos" role="group" aria-labelledby="rotulo-tol" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
                {TOLERANCIAS.map((t) => (
                  <button key={t} type="button" aria-pressed={ajustes.tolerancia === t} onClick={() => mudar({ tolerancia: t })}>
                    ±{t} cents
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grupo" aria-labelledby="grupo-exibicao">
          <h2 id="grupo-exibicao">Exibição</h2>
          <div className="caixa">
            <div className="bloco-ajuste">
              <p className="rotulo" id="rotulo-notas">Nome das notas</p>
              <div className="segmentos" role="group" aria-labelledby="rotulo-notas" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                <button type="button" aria-pressed={ajustes.notacao === 'letras'} onClick={() => mudar({ notacao: 'letras' })}>
                  C D E
                </button>
                <button type="button" aria-pressed={ajustes.notacao === 'solfejo'} onClick={() => mudar({ notacao: 'solfejo' })}>
                  Dó Ré Mi
                </button>
              </div>
            </div>
            {temWakeLock && (
              <>
                <div className="divisor" />
                <div className="linha-ajuste">
                  <div>
                    <p className="rotulo" id="rotulo-tela">Manter a tela ligada</p>
                    <p className="explica">Enquanto o afinador estiver ouvindo</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    className="chave"
                    aria-checked={ajustes.telaLigada}
                    aria-labelledby="rotulo-tela"
                    onClick={() => mudar({ telaLigada: !ajustes.telaLigada })}
                  >
                    <span />
                  </button>
                </div>
              </>
            )}
          </div>
        </section>

        {situacao === 'instalado' && (
          <section className="instalado">
            <IconeOk tamanho={20} cor="#4FD8A6" espessura={2.2} />
            App instalado · funciona sem internet
          </section>
        )}

        {situacao === 'iphone' && (
          <section className="instalar" aria-labelledby="titulo-instalar">
            <div className="instalar-topo">
              <IconeCelular cor="#4FD8A6" />
              <div>
                <p className="rotulo" id="titulo-instalar">Instalar no iPhone</p>
                <p>Funciona sem internet e não perde seus ajustes.</p>
              </div>
            </div>
            <ol className="passos-ios">
              <li>
                <span className="bola">1</span>
                <span className="com-icone">
                  No Safari, toque em Compartilhar
                  <IconeCompartilhar tamanho={18} cor="#4FD8A6" />
                </span>
              </li>
              <li>
                <span className="bola">2</span>
                Escolha “Adicionar à Tela de Início”
              </li>
              <li>
                <span className="bola">3</span>
                Toque em “Adicionar” e abra pelo ícone
              </li>
            </ol>
          </section>
        )}

        {(situacao === 'convite' || situacao === 'navegador') && (
          <section className="instalar" aria-labelledby="titulo-instalar">
            <div className="instalar-topo">
              <IconeCelular cor="#4FD8A6" />
              <div>
                <p className="rotulo" id="titulo-instalar">Instalar no celular</p>
                <p>
                  {situacao === 'convite'
                    ? 'Abre em tela cheia, como um app, e funciona sem internet.'
                    : 'No menu do navegador, escolha “Instalar app” ou “Adicionar à tela inicial”.'}
                </p>
              </div>
            </div>
            {situacao === 'convite' && (
              <button type="button" className="botao-principal" style={{ height: 44 }} onClick={() => void instalar()}>
                Instalar
              </button>
            )}
          </section>
        )}

        <p className="rodape-ajustes">
          O microfone é usado só para afinar. O som é analisado no aparelho e nunca sai dele. Os ajustes ficam salvos só neste aparelho.
          <br />
          AfinaTi · versão {VERSAO}
        </p>
      </div>
    </div>
  );
}
