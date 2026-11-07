import { useEffect, useId, useRef } from 'react';
import { IconeCompartilhar, IconeMenu } from './Icones';

export interface Passo {
  texto: string;
  icone?: 'compartilhar' | 'menu';
}

interface Props {
  aberta: boolean;
  titulo: string;
  texto: string;
  passos: Passo[];
  onFechar: () => void;
}

/** Folha que sobe da parte de baixo da tela. Usa <dialog> para o foco, o Esc e o leitor de tela. */
export function Folha({ aberta, titulo, texto, passos, onFechar }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (aberta && !d.open) d.showModal();
    if (!aberta && d.open) d.close();
  }, [aberta]);

  return (
    <dialog
      ref={ref}
      className="folha"
      aria-labelledby={idTitulo}
      onClose={onFechar}
      onClick={(e) => {
        // Toque fora da folha (no fundo escurecido) fecha.
        if (e.target === e.currentTarget) onFechar();
      }}
    >
      <div className="folha-conteudo">
        <div className="folha-alca" aria-hidden="true" />
        <div>
          <h2 id={idTitulo}>{titulo}</h2>
          <p>{texto}</p>
        </div>
        <ol className="folha-passos">
          {passos.map((p, i) => (
            <li key={p.texto}>
              <span className="bola">{i + 1}</span>
              <span className="folha-texto">{p.texto}</span>
              {p.icone && (
                <span className="folha-icone">
                  {p.icone === 'compartilhar' ? (
                    <IconeCompartilhar tamanho={20} rotulo="ícone Compartilhar" />
                  ) : (
                    <IconeMenu tamanho={20} rotulo="ícone de menu com três pontos" />
                  )}
                </span>
              )}
            </li>
          ))}
        </ol>
        <button type="button" className="botao-claro" onClick={onFechar}>
          Entendi
        </button>
      </div>
    </dialog>
  );
}
