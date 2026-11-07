import { useEffect, useRef, useState } from 'react';
import { IconeOk, IconeSom, IconeX } from '../componentes/Icones';
import { INSTRUMENTOS } from '../musica/instrumentos';
import type { Conteudo, Item, Pergunta } from '../treino/conteudo';
import { NIVEIS } from '../treino/conteudo';
import type { ConfigTreino } from '../treino/historico';
import type { Resposta } from '../treino/jogo';
import { pararSons, tocarDuas, tocarPergunta, tocarReferencia } from '../treino/som';

interface Props {
  id?: number;
  config: ConfigTreino;
  conteudo: Conteudo;
  rodadas: Pergunta[];
  a4: number;
  onFim: (respostas: Resposta[], duracao: number) => void;
}

/** Notas para tocar uma resposta (a primeira pergunta que tem esse item como certo). */
export function notasDoItem(item: Item, conteudo: Conteudo): number[] | null {
  if (item.id.startsWith('qualidade:')) return null;
  return conteudo.perguntas.find((p) => p.certo.id === item.id)?.notas ?? null;
}

function colunas(n: number) {
  return n <= 2 ? 2 : n === 4 || n >= 7 ? 4 : 3;
}

export function TreinoJogo({ config, conteudo, rodadas, a4, onFim }: Props) {
  const [indice, setIndice] = useState(0);
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [tocando, setTocando] = useState(false);
  const inicio = useRef(performance.now());
  const proximaRef = useRef<HTMLButtonElement>(null);

  const pergunta = rodadas[indice];
  const resposta = respostas[indice] as Resposta | undefined;
  const ultima = indice === rodadas.length - 1;
  const { instrumento, referencia } = config;
  const nomeInst = INSTRUMENTOS.find((i) => i.id === instrumento)?.nome ?? '';

  const timerSom = useRef(0);
  const tocar = (comReferencia = false) => {
    tocarPergunta(pergunta.notas, instrumento, a4, comReferencia);
    setTocando(true);
    window.clearTimeout(timerSom.current);
    timerSom.current = window.setTimeout(() => setTocando(false), comReferencia ? 2800 : 1400);
  };

  // Cada rodada começa tocando o som (o toque em "Começar" já liberou o áudio).
  useEffect(() => {
    tocar(referencia);
  }, [indice]); // só quando muda de rodada

  // Sai do jogo sem deixar som tocando.
  useEffect(
    () => () => {
      window.clearTimeout(timerSom.current);
      pararSons();
    },
    []
  );

  const responder = (item: Item) => {
    if (resposta) return;
    const acertou = item.id === pergunta.certo.id;
    if (acertou) navigator.vibrate?.(30);
    setRespostas((r) => [...r, { pergunta, marcado: item, acertou }]);
    window.setTimeout(() => proximaRef.current?.focus(), 0);
  };

  const finalizar = (lista = respostas) => onFim(lista, performance.now() - inicio.current);

  const feitas = respostas.length;
  const acertos = respostas.filter((r) => r.acertou).length;
  const erros = feitas - acertos;
  const certoNome = pergunta.detalhe ? `${pergunta.certo.sigla.toLowerCase()} (${pergunta.detalhe})` : pergunta.certo.nome;
  const notasMarcado = resposta && !resposta.acertou ? notasDoItem(resposta.marcado, conteudo) : null;

  return (
    <div className="jogo" role="region" aria-label="Rodada do treino">
      <div className="jogo-interno">
        <header className="jogo-topo">
          <div className="jogo-progresso">
            <div className="jogo-linha">
              <span className="jogo-rodada">
                Rodada {indice + 1} de {rodadas.length}
              </span>
              <span className="jogo-placar" aria-label={`${acertos} acertos e ${erros} erros`}>
                <span className="ok-txt">
                  <IconeOk tamanho={14} espessura={3} />
                  {acertos}
                </span>
                <span className="fora-txt">
                  <IconeX tamanho={14} espessura={3} />
                  {erros}
                </span>
              </span>
            </div>
            <div className="barra" role="progressbar" aria-label="Progresso do treino" aria-valuemin={0} aria-valuemax={rodadas.length} aria-valuenow={feitas}>
              <div style={{ width: `${(feitas / rodadas.length) * 100}%` }} />
            </div>
          </div>
          <button type="button" className="botao-borda" onClick={() => finalizar()}>
            Finalizar
          </button>
        </header>

        <section className="jogo-pergunta">
          <p className="jogo-modo">
            {NIVEIS[config.modo][config.nivel].nome} · {nomeInst}
          </p>
          <h1>{config.modo === 'notas' ? (config.nivel === 0 ? 'Qual corda está tocando?' : 'Qual é a nota?') : config.nivel === 0 ? 'Maior ou menor?' : 'Que acorde é esse?'}</h1>
          <button type="button" className={tocando ? 'botao-som tocando' : 'botao-som'} onClick={() => tocar()} aria-label="Ouvir de novo">
            <IconeSom tamanho={48} />
          </button>
          <span className="jogo-dica">{tocando ? 'Tocando…' : 'Toque para ouvir de novo'}</span>
          <button type="button" className="botao-borda pequeno" onClick={() => tocarReferencia(instrumento, a4)}>
            <IconeSom tamanho={14} espessura={2.2} />
            Ouvir o Lá de referência
          </button>
        </section>

        <div className="jogo-retorno" aria-live="polite">
          {resposta && (
            <div className={resposta.acertou ? 'retorno ok' : 'retorno fora'}>
              <span className="retorno-icone">{resposta.acertou ? <IconeOk tamanho={18} espessura={3} /> : <IconeX tamanho={16} espessura={3} />}</span>
              <div className="retorno-texto">
                <p className="retorno-titulo">{resposta.acertou ? 'Isso!' : 'Quase'}</p>
                <p>
                  Era {certoNome}.{!resposta.acertou && ` Você marcou ${resposta.marcado.nome}.`}
                </p>
              </div>
              {notasMarcado && (
                <button type="button" className="botao-borda pequeno fora" onClick={() => tocarDuas(pergunta.notas, notasMarcado, instrumento, a4)}>
                  Ouvir as duas
                </button>
              )}
            </div>
          )}
        </div>

        <div className="respostas" role="group" aria-label="Respostas" style={{ gridTemplateColumns: `repeat(${colunas(conteudo.opcoes.length)}, minmax(0, 1fr))` }}>
          {conteudo.opcoes.map((o) => {
            let classe = 'resposta';
            if (resposta) {
              if (o.id === pergunta.certo.id) classe += ' certa';
              else if (o.id === resposta.marcado.id) classe += ' errada';
              else classe += ' apagada';
            }
            return (
              <button key={o.id + o.sub} type="button" className={classe} aria-label={o.nome} aria-disabled={!!resposta} onClick={() => responder(o)}>
                <span className="resposta-sigla">{o.sigla}</span>
                <span className="resposta-sub">{o.sub}</span>
              </button>
            );
          })}
        </div>

        <div className="jogo-acoes">
          <button
            ref={proximaRef}
            type="button"
            className="botao-principal"
            disabled={!resposta}
            onClick={() => (ultima ? finalizar() : setIndice((i) => i + 1))}
          >
            {!resposta ? 'Escolha uma resposta' : ultima ? 'Ver resultado' : 'Próxima'}
          </button>
        </div>
      </div>
    </div>
  );
}
