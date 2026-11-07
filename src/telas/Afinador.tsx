import { useEffect, useRef, useState } from 'react';
import type { Ajustes } from '../ajustes';
import { useMicrofone } from '../audio/useMicrofone';
import { IconeMicrofone } from '../componentes/Icones';
import { INSTRUMENTOS, cordaMaisProxima, instrumentoPorId } from '../musica/instrumentos';
import { centsEntre, formatar, frequenciaDaNota, nomeDaNota, oitavaDaNota } from '../musica/notas';
import { useTelaLigada } from '../sistema';
import { Permissao } from './Permissao';

interface Props {
  ajustes: Ajustes;
  mudar: (parcial: Partial<Ajustes>) => void;
}

/** Marcas do medidor, de −50 a +50 cents, de 5 em 5. */
const MARCAS = Array.from({ length: 21 }, (_, i) => -50 + i * 5);
/** Graus do ponteiro por cent (±50 cents = ±45°). */
const GRAUS_POR_CENT = 0.9;
/** Tempo na faixa de afinado para marcar a corda como afinada (ms). */
const SEGURAR_AFINADO = 500;

export function Afinador({ ajustes, mudar }: Props) {
  const mic = useMicrofone();
  useTelaLigada(ajustes.telaLigada && mic.estado === 'ouvindo');

  const instrumento = instrumentoPorId(ajustes.instrumento);
  const [automatico, setAutomatico] = useState(true);
  const [cordaFixa, setCordaFixa] = useState(0);
  const [afinadas, setAfinadas] = useState<ReadonlySet<number>>(new Set());
  const ultimaAuto = useRef(0);

  // Trocou de instrumento: recomeça a lista de cordas afinadas.
  useEffect(() => {
    setAfinadas(new Set());
    setCordaFixa(0);
    ultimaAuto.current = 0;
  }, [instrumento.id]);

  const { a4, tolerancia, notacao } = ajustes;
  const freq = mic.freq;

  let indice = automatico ? ultimaAuto.current : cordaFixa;
  let cents: number | null = null;
  if (freq !== null) {
    if (automatico) {
      const r = cordaMaisProxima(freq, instrumento, a4);
      indice = r.indice;
      cents = r.cents;
      ultimaAuto.current = r.indice;
    } else {
      cents = centsEntre(freq, frequenciaDaNota(instrumento.cordas[indice].midi, a4));
    }
  }
  indice = Math.min(indice, instrumento.cordas.length - 1);
  const corda = instrumento.cordas[indice];
  const alvo = frequenciaDaNota(corda.midi, a4);
  const dentro = cents !== null && Math.abs(cents) <= tolerancia;
  const situacao = cents === null ? 'sem-som' : dentro ? 'ok' : 'fora';

  // Segurou afinado por meio segundo: marca a corda e vibra (no Android).
  useEffect(() => {
    if (!dentro) return;
    const t = window.setTimeout(() => {
      setAfinadas((atual) => {
        if (atual.has(indice)) return atual;
        navigator.vibrate?.(40);
        return new Set(atual).add(indice);
      });
    }, SEGURAR_AFINADO);
    return () => window.clearTimeout(t);
  }, [dentro, indice]);

  if (mic.estado !== 'ouvindo') {
    return (
      <div className="tela">
        <div className="topo">
          <p className="marca">AfinaTi</p>
        </div>
        <Permissao estado={mic.estado} onPermitir={() => void mic.iniciar()} />
      </div>
    );
  }

  const nome = nomeDaNota(corda.midi, notacao);
  const nomePt = nomeDaNota(corda.midi, 'solfejo');
  const graus = cents === null ? 0 : Math.max(-50, Math.min(50, cents)) * GRAUS_POR_CENT;
  const centsArred = cents === null ? 0 : Math.round(cents);
  const textoCents = cents === null ? '' : centsArred === 0 ? '0 cents' : `${centsArred > 0 ? '+' : '−'}${Math.abs(centsArred)} cents`;
  const estado =
    cents === null
      ? 'Toque uma corda'
      : dentro
        ? 'Afinado'
        : cents < 0
          ? `${cents < -50 ? 'Muito grave' : 'Grave'} · aperte a tarraxa`
          : `${cents > 50 ? 'Muito agudo' : 'Agudo'} · solte a tarraxa`;

  return (
    <div className={`tela ${situacao}`}>
      <header className="topo">
        <div className="topo-esq">
          <h1 className="marca">AfinaTi</h1>
          <span className="selo">
            <IconeMicrofone tamanho={12} espessura={2.2} />
            Ouvindo
          </span>
        </div>
        <a className="chip-link" href="#/ajustes" aria-label={`Lá de referência: ${a4} Hz. Abrir ajustes`}>
          Lá = {a4} Hz
        </a>
      </header>

      <div className="instrumentos" role="group" aria-label="Instrumento">
        {INSTRUMENTOS.map((i) => (
          <button
            key={i.id}
            type="button"
            className="pilula"
            aria-pressed={i.id === instrumento.id}
            onClick={() => mudar({ instrumento: i.id })}
          >
            {i.nome}
          </button>
        ))}
      </div>

      <section className="medidor" aria-hidden="true">
        <div className="arco">
          {MARCAS.map((v) => (
            <div
              key={v}
              className={`marca-arco${v % 25 === 0 ? ' maior' : ''}${Math.abs(v) <= 5 ? ' zona' : ''}`}
              style={{ transform: `rotate(${v * GRAUS_POR_CENT}deg)` }}
            >
              <span />
            </div>
          ))}
          <div className="ponteiro" style={{ transform: `rotate(${graus}deg)` }} />
          <div className="eixo" />
        </div>
        <div className="escala">
          <span>−50 · grave</span>
          <span>0</span>
          <span>agudo · +50</span>
        </div>
      </section>

      <section className="nota">
        <div className="nota-grande">
          <span className="letra">{nome}</span>
          <span className="oitava">{oitavaDaNota(corda.midi)}</span>
        </div>
        <p className="nota-corda">
          {notacao === 'letras' ? `${nomePt} · ` : ''}corda {corda.numero}
        </p>
        <div className="leitura">
          {textoCents && <span className="cents">{textoCents}</span>}
          <span className="estado">{estado}</span>
        </div>
        <p className="freq">
          {freq === null ? `Alvo ${formatar(alvo, 2)} Hz` : `Ouvindo ${formatar(freq, 1)} Hz · alvo ${formatar(alvo, 2)} Hz`}
        </p>
        <span className="so-leitor" aria-live="polite">
          {cents === null ? '' : `${nomePt}, corda ${corda.numero}: ${estado}`}
        </span>
      </section>

      <section className="cordas" aria-label="Cordas">
        <div className="cordas-topo">
          <span className="cordas-titulo">Cordas · {instrumento.nome}</span>
          <button
            type="button"
            className="botao-modo"
            aria-pressed={automatico}
            onClick={() => {
              if (!automatico) ultimaAuto.current = cordaFixa;
              else setCordaFixa(indice);
              setAutomatico(!automatico);
            }}
          >
            {automatico ? 'Automático' : 'Corda fixa'}
          </button>
        </div>
        <div className="grade-cordas" style={{ gridTemplateColumns: `repeat(${instrumento.cordas.length}, minmax(0, 1fr))` }}>
          {instrumento.cordas.map((c, i) => (
            <button
              key={c.numero}
              type="button"
              className={i === indice ? 'corda atual' : 'corda'}
              aria-pressed={!automatico && i === indice}
              aria-label={`Corda ${c.numero}, ${nomeDaNota(c.midi, 'solfejo')} (${nomeDaNota(c.midi)}${oitavaDaNota(c.midi)})${afinadas.has(i) ? ', afinada' : ''}`}
              onClick={() => {
                setAutomatico(false);
                setCordaFixa(i);
              }}
            >
              <span className="letra">{nomeDaNota(c.midi, notacao)}</span>
              <span className="numero">{c.numero}ª</span>
              {afinadas.has(i) && <span className="ponto" />}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
