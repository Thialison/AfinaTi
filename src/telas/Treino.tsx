import { useState } from 'react';
import type { Ajustes } from '../ajustes';
import { INSTRUMENTOS } from '../musica/instrumentos';
import type { Conteudo, Modo, Nivel, Pergunta } from '../treino/conteudo';
import { NIVEIS, montarConteudo } from '../treino/conteudo';
import type { ConfigTreino } from '../treino/historico';
import { apagarHistorico, carregarHistorico, registrarTreino, resumoDoOuvido, salvarConfig } from '../treino/historico';
import type { Resposta } from '../treino/jogo';
import { sortearRodadas } from '../treino/jogo';
import { TreinoJogo } from './TreinoJogo';
import { TreinoResultado } from './TreinoResultado';

interface Props {
  ajustes: Ajustes;
}

interface Partida {
  id: number;
  config: ConfigTreino;
  conteudo: Conteudo;
  rodadas: Pergunta[];
}

interface Fim {
  partida: Partida;
  respostas: Resposta[];
  duracao: number;
}

const MODOS: { id: Modo; sigla: string; nome: string; desc: string }[] = [
  { id: 'notas', sigla: 'E', nome: 'Notas das cordas', desc: 'Qual corda está tocando?' },
  { id: 'acordes', sigla: 'Am', nome: 'Acordes', desc: 'Que acorde é esse?' }
];
const RODADAS: ConfigTreino['rodadas'][] = [10, 20, 30];

export function Treino({ ajustes }: Props) {
  const [historico, setHistorico] = useState(carregarHistorico);
  const [config, setConfig] = useState<ConfigTreino>(
    () => historico.config ?? { modo: 'notas', nivel: 0, instrumento: ajustes.instrumento, rodadas: 10, referencia: true }
  );
  const [partida, setPartida] = useState<Partida | null>(null);
  const [fim, setFim] = useState<Fim | null>(null);

  const mudar = (parcial: Partial<ConfigTreino>) => setConfig((c) => ({ ...c, ...parcial }));

  /** Começa uma partida; com `foco`, as perguntas saem só desses itens (as respostas continuam todas). */
  const comecar = (c: ConfigTreino, foco?: Set<string>) => {
    const conteudo = montarConteudo(c.modo, c.nivel, c.instrumento, ajustes.notacao);
    const perguntas = foco ? conteudo.perguntas.filter((p) => foco.has(p.certo.id)) : conteudo.perguntas;
    setHistorico((h) => salvarConfig(h, c));
    setFim(null);
    setPartida({ id: Date.now(), config: c, conteudo, rodadas: sortearRodadas(perguntas.length ? perguntas : conteudo.perguntas, c.rodadas) });
  };

  const terminar = (respostas: Resposta[], duracao: number) => {
    const p = partida;
    setPartida(null);
    if (!p || respostas.length === 0) return;
    setHistorico((h) => registrarTreino(h, respostas));
    setFim({ partida: p, respostas, duracao });
    window.scrollTo(0, 0);
  };

  if (partida) {
    return <TreinoJogo key={partida.id} {...partida} a4={ajustes.a4} onFim={terminar} />;
  }

  if (fim) {
    return (
      <TreinoResultado
        {...fim}
        a4={ajustes.a4}
        onDeNovo={() => comecar(fim.partida.config)}
        onTreinarErros={(ids) => comecar(fim.partida.config, ids)}
        onInicio={() => setFim(null)}
      />
    );
  }

  const resumo = resumoDoOuvido(historico);
  const niveis = NIVEIS[config.modo];

  return (
    <div className="tela">
      <header className="topo" style={{ display: 'block', paddingBottom: 4 }}>
        <h1 className="titulo-tela">Treino de ouvido</h1>
        <p className="sub-tela">Ouça e descubra qual nota ou acorde está tocando.</p>
      </header>

      <div className="ajustes">
        <section className="caixa progresso" aria-labelledby="titulo-progresso">
          <div className="progresso-topo">
            <h2 id="titulo-progresso">Seu ouvido até agora</h2>
            {historico.treinos > 0 && (
              <span>
                {historico.treinos} {historico.treinos === 1 ? 'treino' : 'treinos'} · {resumo.porcentagem}% de acertos
              </span>
            )}
          </div>
          {historico.treinos === 0 ? (
            <p className="progresso-vazio">Faça o primeiro treino para ver o que o seu ouvido já reconhece.</p>
          ) : (
            <>
              <ListaChips titulo="Você já reconhece" itens={resumo.reconhece.slice(0, 8).map((r) => r.rotulo)} tipo="ok" vazio="Acerte uma nota 3 vezes para ela aparecer aqui." />
              <ListaChips titulo="Ainda treinando" itens={resumo.treinando.slice(0, 8).map((r) => r.rotulo)} tipo="fora" vazio="Nada por aqui. Bom sinal!" />
              <button
                type="button"
                className="link-discreto"
                onClick={() => {
                  if (window.confirm('Apagar todo o histórico do treino? Isso não pode ser desfeito.')) setHistorico(apagarHistorico());
                }}
              >
                Zerar histórico
              </button>
            </>
          )}
        </section>

        <section className="grupo" aria-labelledby="titulo-modo">
          <h2 id="titulo-modo">O que treinar</h2>
          <div className="modos" role="group" aria-labelledby="titulo-modo">
            {MODOS.map((m) => (
              <button
                key={m.id}
                type="button"
                className="modo"
                aria-pressed={config.modo === m.id}
                onClick={() => mudar({ modo: m.id, nivel: 0 })}
              >
                <span className="modo-sigla" aria-hidden="true">{m.sigla}</span>
                <span className="modo-nome">{m.nome}</span>
                <span className="modo-desc">{m.desc}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="grupo" aria-labelledby="titulo-config">
          <h2 id="titulo-config">Ajustes do treino</h2>
          <div className="caixa">
            <div className="bloco-ajuste">
              <p className="rotulo" id="rotulo-nivel">Nível</p>
              <div className="niveis" role="group" aria-labelledby="rotulo-nivel">
                {niveis.map((n, i) => (
                  <button key={n.nome} type="button" className="nivel" aria-pressed={config.nivel === i} onClick={() => mudar({ nivel: i as Nivel })}>
                    <span>
                      <span className="nivel-nome">{n.nome}</span>
                      <span className="nivel-desc">{n.desc}</span>
                    </span>
                    <span className="radio" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
            <div className="divisor" />
            <div className="bloco-ajuste">
              <p className="rotulo" id="rotulo-som">Som de</p>
              <div className="segmentos" role="group" aria-labelledby="rotulo-som" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
                {INSTRUMENTOS.map((i) => (
                  <button key={i.id} type="button" aria-pressed={config.instrumento === i.id} onClick={() => mudar({ instrumento: i.id })}>
                    {i.nome}
                  </button>
                ))}
              </div>
            </div>
            <div className="divisor" />
            <div className="linha-ajuste">
              <p className="rotulo" id="rotulo-rodadas">Rodadas</p>
              <div className="segmentos" role="group" aria-labelledby="rotulo-rodadas" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', width: 180 }}>
                {RODADAS.map((n) => (
                  <button key={n} type="button" aria-pressed={config.rodadas === n} onClick={() => mudar({ rodadas: n })}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="divisor" />
            <div className="linha-ajuste">
              <div>
                <p className="rotulo" id="rotulo-ref">Tocar o Lá antes</p>
                <p className="explica">Uma nota de referência ajuda a comparar</p>
              </div>
              <button
                type="button"
                role="switch"
                className="chave"
                aria-checked={config.referencia}
                aria-labelledby="rotulo-ref"
                onClick={() => mudar({ referencia: !config.referencia })}
              >
                <span />
              </button>
            </div>
          </div>
        </section>

        <button type="button" className="botao-principal botao-comecar" onClick={() => comecar(config)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M7 4.5v15l12-7.5z" />
          </svg>
          Começar
        </button>
      </div>
    </div>
  );
}

function ListaChips({ titulo, itens, tipo, vazio }: { titulo: string; itens: string[]; tipo: 'ok' | 'fora'; vazio: string }) {
  return (
    <div className="lista-chips">
      <p>{titulo}</p>
      {itens.length ? (
        <ul>
          {itens.map((t) => (
            <li key={t} className={`chip-${tipo}`}>
              {t}
            </li>
          ))}
        </ul>
      ) : (
        <p className="lista-vazia">{vazio}</p>
      )}
    </div>
  );
}
