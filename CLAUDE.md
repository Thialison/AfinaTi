# AfinaTi — instruções para o Claude

- Tudo em português: código, textos do app, commits e conversa.
- Mudança visual: prévia no canvas antes de implementar. Design aprovado: https://claude.ai/artifact/Fvs3Njana5YBMqhUH4VEAi
- Antes de enviar: `npm test` e `npm run build` precisam passar.
- O app fica em `/AfinaTi/` (base do Vite) e é publicado no GitHub Pages pelo workflow `deploy.yml`.
- Privacidade: nada de servidor, análise de uso, Google Fonts ou qualquer chamada de rede. O áudio nunca sai do aparelho. A CSP está no `index.html`.
- Estrutura: `src/musica` (notas e instrumentos), `src/audio` (microfone, detector, som de referência), `src/telas` (Afinador, Afinações, Ajustes, Permissão), `src/sistema.ts` (tela ligada e instalação), `src/ajustes.ts` (ajustes salvos e validados).
