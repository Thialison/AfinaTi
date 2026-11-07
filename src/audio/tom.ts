let ctx: AudioContext | null = null;

/** Toca a nota de referência por cerca de 2 segundos, com um timbre suave. */
export function tocarNota(freq: number, duracao = 2) {
  if (!window.AudioContext) return;
  ctx ??= new AudioContext();
  void ctx.resume();
  const agora = ctx.currentTime;

  const volume = ctx.createGain();
  volume.gain.setValueAtTime(0.0001, agora);
  volume.gain.exponentialRampToValueAtTime(0.35, agora + 0.02);
  volume.gain.exponentialRampToValueAtTime(0.0001, agora + duracao);
  volume.connect(ctx.destination);

  // Fundamental + um pouco do 2º harmônico: as notas graves do baixo ficam audíveis no alto-falante do celular.
  const parciais: [number, number, OscillatorType][] = [
    [1, 1, 'triangle'],
    [2, 0.35, 'sine'],
    [3, 0.12, 'sine']
  ];
  for (const [multiplo, ganho, tipo] of parciais) {
    const osc = ctx.createOscillator();
    osc.type = tipo;
    osc.frequency.value = freq * multiplo;
    const g = ctx.createGain();
    g.gain.value = ganho;
    osc.connect(g).connect(volume);
    osc.start(agora);
    osc.stop(agora + duracao + 0.05);
  }
}
