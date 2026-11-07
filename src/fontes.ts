// Fontes empacotadas com o app (sem Google Fonts): funcionam offline e não expõem quem usa o app.
import interUrl from '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url';
import grotesk500Url from '@fontsource/space-grotesk/files/space-grotesk-latin-500-normal.woff2?url';
import grotesk700Url from '@fontsource/space-grotesk/files/space-grotesk-latin-700-normal.woff2?url';

export function carregarFontes() {
  if (!('fonts' in document)) return;
  const fontes = [
    new FontFace('Inter', `url(${interUrl}) format('woff2')`, { weight: '100 900', display: 'swap' }),
    new FontFace('Space Grotesk', `url(${grotesk500Url}) format('woff2')`, { weight: '500', display: 'swap' }),
    new FontFace('Space Grotesk', `url(${grotesk700Url}) format('woff2')`, { weight: '700', display: 'swap' })
  ];
  for (const f of fontes) {
    document.fonts.add(f);
    void f.load().catch(() => undefined);
  }
}
