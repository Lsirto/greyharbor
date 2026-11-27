/**
 * src/ui-v2/report/report-canvas.mjs — draw the shareable match report onto a
 * Canvas 2D and export it as a PNG. No external libraries; colours mirror the
 * theme tokens. The pure view model comes from src/report/report.mjs; this
 * module only owns DOM/canvas plumbing.
 */

const COLORS = Object.freeze({
  ink0: '#04080a',
  ink2: '#0d181a',
  line: 'rgba(198, 183, 143, 0.22)',
  lineSoft: 'rgba(198, 183, 143, 0.11)',
  parchment: '#e5d9bd',
  silver: '#d9d3c4',
  silverDim: '#a29d90',
  silverFaint: '#6f726c',
  lamp: '#e8c98a',
  danger: '#bd6a5b',
  cult: '#43a291',
});

const FONT_DISPLAY = '"Palatino Linotype", "Songti SC", "Noto Serif CJK SC", "STSong", Georgia, serif';
const FONT_UI = '"PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", "Segoe UI", system-ui, sans-serif';

const OUTCOME_COLOR = Object.freeze({
  win: COLORS.lamp,
  loss: COLORS.danger,
  draw: COLORS.silverDim,
});

const WIDTH = 1080;
const HEIGHT = 1350;

function fillBackground(ctx, W, H) {
  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, COLORS.ink2);
  gradient.addColorStop(1, COLORS.ink0);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);
}

function drawBorder(ctx, W, H) {
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, W - 80, H - 80);
  ctx.strokeStyle = COLORS.lineSoft;
  ctx.lineWidth = 1;
  ctx.strokeRect(56, 56, W - 112, H - 112);
}

function drawCentered(ctx, text, y, font, color) {
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, WIDTH / 2, y);
}

function drawDivider(ctx, y) {
  ctx.strokeStyle = COLORS.lineSoft;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(140, y);
  ctx.lineTo(WIDTH - 140, y);
  ctx.stroke();
}

function drawItemGrid(ctx, items, startY) {
  const colX = [150, 590];
  const rowH = 118;
  items.forEach(([label, value], index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = colX[col];
    const y = startY + row * rowH;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.silverDim;
    ctx.font = `26px ${FONT_UI}`;
    ctx.fillText(label, x, y);
    ctx.fillStyle = COLORS.parchment;
    ctx.font = `38px ${FONT_DISPLAY}`;
    ctx.fillText(String(value), x, y + 40);
  });
}

/**
 * Draw the report onto a new canvas.
 * @param {object} vm view model from buildReport
 * @returns {HTMLCanvasElement}
 */
export function createReportCanvas(vm) {
  if (typeof document === 'undefined') {
    throw new TypeError('createReportCanvas needs a DOM document');
  }
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new TypeError('无法创建画布上下文');

  fillBackground(ctx, WIDTH, HEIGHT);
  drawBorder(ctx, WIDTH, HEIGHT);

  // Header
  drawCentered(ctx, vm.title, 130, `64px ${FONT_DISPLAY}`, COLORS.lamp);
  drawCentered(ctx, vm.subtitle, 196, `28px ${FONT_UI}`, COLORS.silverDim);
  drawDivider(ctx, 250);

  // Outcome headline
  const outcomeColor = OUTCOME_COLOR[vm.outcome.tone] ?? COLORS.silverDim;
  drawCentered(ctx, vm.outcome.label, 380, `104px ${FONT_DISPLAY}`, outcomeColor);
  drawCentered(ctx, vm.reason, 462, `32px ${FONT_UI}`, COLORS.silver);

  // Data grid
  const items = [
    ['对局模式', vm.modeLabel],
    ['所属阵营', vm.factionLabel],
    ['调查员', vm.leaderLabel],
    ['经历夜数', `${vm.nights} 夜`],
    ['末夜比分', vm.nightScore],
    ['牌局类型', vm.seedModeLabel],
  ];
  drawItemGrid(ctx, items, 580);

  // Record strip
  let recordY = 980;
  if (vm.record) {
    drawDivider(ctx, 940);
    const text = `累计 ${vm.record.total} 局 · 胜率 ${vm.record.winRateLabel} · 当前连胜 ${vm.record.currentStreak}`;
    drawCentered(ctx, text, recordY, `30px ${FONT_UI}`, COLORS.silverDim);
  }

  // Footer: seed + date + watermark
  drawDivider(ctx, HEIGHT - 180);
  drawCentered(ctx, `种子 ${vm.seed}`, HEIGHT - 130, `24px ${FONT_UI}`, COLORS.silverFaint);
  drawCentered(ctx, vm.dateLabel, HEIGHT - 92, `24px ${FONT_UI}`, COLORS.silverFaint);
  drawCentered(ctx, '灰港三夜 · 本地生成', HEIGHT - 56, `22px ${FONT_UI}`, COLORS.silverFaint);

  return canvas;
}

/** Trigger a PNG download for the drawn canvas. */
export function downloadReport(canvas, filename) {
  if (!canvas || typeof canvas.toDataURL !== 'function') return false;
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  const safeName = typeof filename === 'string' && filename.length > 0 ? filename : '灰港三夜战报.png';
  link.download = safeName.endsWith('.png') ? safeName : `${safeName}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}

export default createReportCanvas;
