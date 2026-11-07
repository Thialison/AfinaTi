import { useEffect, useState } from 'react';
import type { Ajustes } from '../ajustes';
import { tocarNota } from '../audio/tom';
import { IconeMedidor } from '../componentes/Icones';
import type { IdInstrumento } from '../musica/instrumentos';
import { INSTRUMENTOS } from '../musica/instrumentos';
import { formatar, frequenciaDaNota, nomeDaNota, oitavaDaNota } from '../musica/notas';

interface Props {
  ajustes: Ajustes;
  onAfinar: (id: IdInstrumento) => void;
}

export function Afinacoes({ ajustes, onAfinar }: Props) {
  const [tocando, setTocando] = useState<string | null>(null);

  useEffect(() => {
    if (!tocando) return;
    const t = window.setTimeout(() => setTocando(null), 1200);
    return () => window.clearTimeout(t);
  }, [tocando]);

  return (
    <div className="tela">
      <header className="topo" style={{ display: 'block', paddingBottom: 8 }}>
        <h1 className="titulo-tela">Afinações padrão</h1>
        <p className="sub-tela">Toque numa nota para ouvir o som de referência e afinar de ouvido.</p>
      </header>

      <div className="cartoes">
        {INSTRUMENTOS.map((inst) => {
          const letras = inst.cordas.map((c) => nomeDaNota(c.midi)).join(' ');
          return (
            <article className="cartao" key={inst.id} aria-labelledby={`titulo-${inst.id}`}>
              <div className="cartao-topo">
                <div>
                  <h2 id={`titulo-${inst.id}`}>{inst.nome}</h2>
                  <p className="cartao-resumo">
                    {inst.cordas.length} cordas · {letras} · frequências em Hz
                  </p>
                </div>
                <button type="button" className="botao-afinar" onClick={() => onAfinar(inst.id)}>
                  <IconeMedidor tamanho={16} espessura={2.2} />
                  Afinar
                </button>
              </div>

              <div className="braco">
                <div className="pestana" />
                <div className="traste t1" />
                <div className="traste t2" />
                <div className="colunas">
                  {inst.cordas.map((c) => {
                    const chave = `${inst.id}-${c.numero}`;
                    const freq = frequenciaDaNota(c.midi, ajustes.a4);
                    const pt = nomeDaNota(c.midi, 'solfejo');
                    return (
                      <div className="coluna" key={chave}>
                        <button
                          type="button"
                          className={tocando === chave ? 'tarraxa tocando' : 'tarraxa'}
                          aria-label={`Ouvir ${pt} (${nomeDaNota(c.midi)}${oitavaDaNota(c.midi)}), ${formatar(freq, 2)} Hz, corda ${c.numero}`}
                          onClick={() => {
                            tocarNota(freq);
                            setTocando(chave);
                          }}
                        >
                          {nomeDaNota(c.midi, ajustes.notacao)}
                          <sub>{oitavaDaNota(c.midi)}</sub>
                        </button>
                        <div className="fio" style={{ width: c.espessura, background: inst.corDaCorda }} />
                        <span className="num">{c.numero}ª</span>
                        <span className="pt">{pt}</span>
                        <span className="hz">{formatar(freq, 2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <p className="cartao-dica">{inst.dica}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
