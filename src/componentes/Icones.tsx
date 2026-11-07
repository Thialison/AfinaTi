interface Props {
  tamanho?: number;
  cor?: string;
  espessura?: number;
}

function Base({ tamanho = 22, cor = 'currentColor', espessura = 2, children }: Props & { children: React.ReactNode }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke={cor}
      strokeWidth={espessura}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export const IconeMedidor = (p: Props) => (
  <Base {...p}>
    <path d="M3 17a9 9 0 0 1 18 0" />
    <path d="M12 17l4-6" />
    <circle cx="12" cy="17" r="1.5" />
  </Base>
);

export const IconeBraco = (p: Props) => (
  <Base {...p}>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M9.5 3v18M14.5 3v18M5 9h14M5 15h14" />
  </Base>
);

export const IconeAjustes = (p: Props) => (
  <Base {...p}>
    <path d="M4 7h9M18 7h2M4 17h3M12 17h8" />
    <circle cx="15.5" cy="7" r="2.5" />
    <circle cx="9.5" cy="17" r="2.5" />
  </Base>
);

export const IconeMicrofone = (p: Props) => (
  <Base {...p}>
    <rect x="9" y="2.5" width="6" height="12" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0" />
    <path d="M12 18v3.5" />
    <path d="M8.5 21.5h7" />
  </Base>
);

export const IconeMicrofoneDesligado = (p: Props) => (
  <Base {...p}>
    <path d="M3 3l18 18" />
    <path d="M9 9v2.5a3 3 0 0 0 5.1 2.1M15 9.3V5.5a3 3 0 0 0-5.7-1.3" />
    <path d="M5 11a7 7 0 0 0 11.3 5.5M19 11a7 7 0 0 1-.6 2.8" />
    <path d="M12 18v3.5" />
  </Base>
);

export const IconeOk = (p: Props) => (
  <Base {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Base>
);

export const IconeCelular = (p: Props) => (
  <Base {...p}>
    <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
    <path d="M12 7v7M9 11l3 3 3-3" />
  </Base>
);

export const IconeCompartilhar = (p: Props) => (
  <Base {...p}>
    <path d="M12 3v12M8 7l4-4 4 4" />
    <path d="M7 11H6v9h12v-9h-1" />
  </Base>
);
