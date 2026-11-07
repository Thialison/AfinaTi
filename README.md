# AfinaTi

Afinador de violão, guitarra, ukulele e baixo que funciona no navegador do celular (PWA).

**Abrir:** https://thialison.github.io/AfinaTi/

## O que faz

- **Afinador (tela inicial):** liga o microfone sozinho ao abrir, ouve o instrumento pelo microfone, mostra a nota, a corda e quantos cents falta, com a dica "aperte" ou "solte a tarraxa". Detecta a corda sozinho ou trabalha com uma corda fixa.
- **Afinações padrão:** violão e guitarra (E A D G B E), ukulele (G C E A) e baixo (E A D G), com o desenho das cordas, as frequências e o som de referência de cada nota.
- **Ajustes:** Lá de referência (430 a 450 Hz), margem de afinado (±3, ±5 ou ±10 cents), notas em C D E ou Dó Ré Mi, tela ligada enquanto afina e instalação no celular.

## Privacidade

O som é analisado só no aparelho: nada é gravado nem enviado. O microfone é desligado quando o app sai da tela. Os ajustes ficam salvos só no aparelho (`localStorage`). Não há login, servidor, anúncios nem rastreamento.

## Instalar no celular (opcional)

- **Android (Chrome):** Ajustes › Instalar, ou o menu do Chrome › Instalar app.
- **iPhone (Safari):** Compartilhar › Adicionar à Tela de Início. No iPhone vale instalar: o Safari pode apagar a cópia offline e os ajustes de sites que ficam dias sem uso.

## Tecnologias

- React 19 + TypeScript + Vite
- Microfone: `getUserMedia` com cancelamento de eco, redução de ruído e ganho automático desligados
- Detecção da nota: algoritmo McLeod ([pitchy](https://github.com/ianprime0509/pitchy)), 4096 amostras por leitura, mediana das últimas leituras
- Som de referência: oscilador da Web Audio API
- PWA: `vite-plugin-pwa` (Workbox), tudo pré-carregado para uso offline
- Screen Wake Lock API para manter a tela ligada
- Fontes Inter e Space Grotesk empacotadas no app

## Desenvolvimento

```bash
npm install
npm run dev      # servidor local
npm test         # testes (Vitest)
npm run build    # checagem de tipos + build em dist/
```

O microfone só funciona em HTTPS ou em `localhost`.

## Publicação

Cada push na `main` roda os testes e o build e publica no GitHub Pages (`.github/workflows/deploy.yml`).
