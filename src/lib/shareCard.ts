export interface ShareCardData {
  score: number;
  wave: number;
  mode?: string;
  playerName?: string;
}

export async function generateShareCardImage(data: ShareCardData): Promise<Blob> {
  const w = 800;
  const h = 420;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#050505');
  bg.addColorStop(1, '#1a0a14');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 2;
  ctx.strokeRect(24, 24, w - 48, h - 48);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 42px monospace';
  ctx.fillText('BUGSMASHER', 48, 90);

  ctx.fillStyle = '#39ff14';
  ctx.font = '24px monospace';
  ctx.fillText('TACTICAL QA — RUN REPORT', 48, 130);

  ctx.fillStyle = '#aaaaaa';
  ctx.font = '18px monospace';
  ctx.fillText(`SCORE: ${data.score.toLocaleString()}`, 48, 200);
  ctx.fillText(`WAVE: ${data.wave}`, 48, 235);
  if (data.mode) ctx.fillText(`MODE: ${data.mode.toUpperCase()}`, 48, 270);
  if (data.playerName) ctx.fillText(`OPERATOR: ${data.playerName}`, 48, 305);

  ctx.fillStyle = 'rgba(255,50,150,0.4)';
  for (let i = 0; i < 40; i++) {
    ctx.beginPath();
    ctx.arc(
      500 + Math.random() * 250,
      150 + Math.random() * 200,
      4 + Math.random() * 12,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  ctx.fillStyle = '#666';
  ctx.font = '14px monospace';
  ctx.fillText('bugsmasher — defend the core', 48, h - 48);

  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('blob failed'))), 'image/png');
  });
}

export function downloadShareCard(blob: Blob, filename = 'bugsmasher-score.png'): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}