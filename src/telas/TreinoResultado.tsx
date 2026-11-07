import { useEffect, useMemo } from 'react';
import { IconeSom } from '../componentes/Icones';
import { INSTRUMENTOS } from '../musica/instrumentos';
import type { Conteudo, Pergunta } from '../treino/conteudo';
import { NIVEIS } from '../treino/conteudo';
import type { ConfigTreino } from '../treino/historico';
import type { Placar, Resposta } from '../treino/jogo';
import { analisar } from '../treino/jogo';
import { pararSons, tocarDuas } from '../treino/som';
import { notasDoItem } from './TreinoJogo';

interface Props {
  partida: { config: ConfigTreino; conteudo: Conteudo; rodadas: Pergunta[] };
  respostas: Resposta[];
  duracao: number;
  a4: number;
  onDeNovo: () => void;
  onTreinarErros: (ids: Set<string>) => void;
  onInicio: () => void;
}

const RAIO = 64;
const CIRCUNFERENCIA = 2 * Math.PI * RAIO;

function tempo(ms: number) {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function TreinoResultado({ partida, respostas, duracao, a4, onDeNovo, onTreinarErros, onInicio }: Props) {
  const { config, conteudo } = partida;
  const a = useMemo(() => analisar(respostas, config.instrumento), [respostas, config.instrumento]);
  const nomeInst = INSTRUMENTOS.find((i) => i.id === config.instrumento)?.nome ?? '';
  useEffect(() => () => pararSons(), []);

  // "Treinar só o que errei": o que errou e com o que confundiu, para comparar os dois.
  // Precisa de pelo menos dois itens diferentes, senão a resposta fica óbvia.
  const perguntaveis = new Set(conteudo.perguntas.map((p) => p.certo.id));
  const foco = new Set([...a.treinar.map((p) => p.id), ...a.confusoes.map((c) => c.marcado.id)].filter((id) => perguntaveis.has(id)));
  const idsErrados = conteudo.opcoes.length > 2 && foco.size >= 2 ? foco : new Set<string>();

  return (
    <div className="tela">
      <header className="topo" style={{ display: 'block', paddingBottom: 4 }}>
        <h1 className="titulo-tela">Resultado</h1>
        <p className="sub-tela">
          {NIVEIS[config.modo][config.nivel].nome} · {nomeInst} · {a.total} {a.total === 1 ? 'rodada' : 'rodadas'}
        </p>
      </header>

      <div className="ajustes resultado">
        <section className="caixa placar" aria-label="Pontuação">
          <div className="anel">
            <svg width="148" height="148" viewBox="0 0 148 148" aria-hidden="true">
              <circle cx="74" cy="74" r={RAIO} className="anel-fundo" />
              <circle
                cx="74"
                cy="74"
                r={RAIO}
                className="anel-valor"
                strokeDasharray={`${(a.porcentagem / 100) * CIRCUNFERENCIA} ${CIRCUNFERENCIA}`}
                transform="rotate(-90 74 74)"
              />
            </svg>
            <div className="anel-texto">
              <span className="anel-numero">
                {a.acertos}
                <span>/{a.total}</span>
              </span>
              <span className="anel-pct">{a.porcentagem}% de acertos</span>
            </div>
          </div>
          <p className="placar-mensagem">{a.mensagem}</p>
          <div className="numeros">
            <div>
              <p className="numero ok-txt">{a.acertos}</p>
              <p>acertos</p>
            </div>
            <div>
              <p className="numero">{a.melhorSequencia}</p>
              <p>seguidos</p>
            </div>
            <div>
              <p className="numero">{tempo(duracao)}</p>
              <p>minutos</p>
            </div>
          </div>
        </section>

        {a.sabe.length > 0 && <ListaPlacar titulo="Você já reconhece" tipo="ok" itens={a.sabe} />}
        {a.treinar.length > 0 && <ListaPlacar titulo="Ainda treinando" tipo="fora" itens={a.treinar} />}

        {a.confusoes.length > 0 && (
          <section className="grupo" aria-labelledby="titulo-confusoes">
            <h2 id="titulo-confusoes" className="titulo-secao">O que você confundiu</h2>
            {a.confusoes.slice(0, 4).map((c) => {
              const notasA = notasDoItem(c.certo, conteudo);
              const notasB = notasDoItem(c.marcado, conteudo);
              return (
                <div key={c.certo.id + c.marcado.id} className="confusao">
                  <div>
                    <p className="confusao-titulo">
                      Era <span className="ok-txt">{c.certo.rotulo}</span>, você marcou <span className="fora-txt">{c.marcado.rotulo}</span>
                    </p>
                    <p className="confusao-dica">{c.dica}</p>
                  </div>
                  {notasA && notasB && (
                    <button type="button" className="botao-borda pequeno" onClick={() => tocarDuas(notasA, notasB, config.instrumento, a4)}>
                      <IconeSom tamanho={14} espessura={2.2} />
                      Ouvir as duas
                    </button>
                  )}
                </div>
              );
            })}
            {a.confusoes.length > 4 && (
              <p className="explica" style={{ margin: '0 4px' }}>
                E mais {a.confusoes.length - 4} {a.confusoes.length - 4 === 1 ? 'confusão' : 'confusões'}: veja a lista rodada a rodada.
              </p>
            )}
          </section>
        )}

        <section className="grupo" aria-labelledby="titulo-rodadas">
          <h2 id="titulo-rodadas" className="titulo-secao">Rodada a rodada</h2>
          <ol className="caixa rodadas">
            {respostas.map((r, i) => (
              <li key={i}>
                <span className="rodada-n">{i + 1}</span>
                <span className="rodada-certa">{r.pergunta.detalhe ?? r.pergunta.certo.rotulo}</span>
                <span className={r.acertou ? 'ok-txt' : 'fora-txt'}>{r.acertou ? 'acertou' : `marcou ${r.marcado.rotulo}`}</span>
              </li>
            ))}
          </ol>
        </section>

        <div className="acoes">
          {idsErrados.size > 0 && (
            <button type="button" className="botao-principal" onClick={() => onTreinarErros(idsErrados)}>
              Treinar só o que errei
            </button>
          )}
          <button type="button" className={idsErrados.size > 0 ? 'botao-secundario' : 'botao-principal'} onClick={onDeNovo}>
            Jogar de novo
          </button>
          <button type="button" className="botao-texto" onClick={onInicio}>
            Voltar ao início do treino
          </button>
        </div>
      </div>
    </div>
  );
}

function ListaPlacar({ titulo, tipo, itens }: { titulo: string; tipo: 'ok' | 'fora'; itens: Placar[] }) {
  return (
    <section className="grupo">
      <h2 className="titulo-secao">
        <span className={`bolinha ${tipo}`} aria-hidden="true" />
        {titulo}
      </h2>
      <ul className="caixa barras">
        {itens.map((p) => (
          <li key={p.id}>
            <span className="barra-nome">{p.rotulo}</span>
            <span className="barra-trilho" aria-hidden="true">
              <span className={tipo} style={{ width: `${Math.round((p.acertos / p.total) * 100)}%` }} />
            </span>
            <span className="barra-placar">
              {p.acertos} de {p.total}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
