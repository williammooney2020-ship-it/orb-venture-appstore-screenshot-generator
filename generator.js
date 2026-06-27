// App Store Screenshot Generator — canvas engine.

const DEVICE_SPECS = {
  iphone67: { w: 1320, h: 2868, r: 80,  bezelV: 60,  notchW: 340, notchH: 40 },
  iphone65: { w: 1284, h: 2778, r: 76,  bezelV: 58,  notchW: 320, notchH: 38 },
  iphone61: { w: 1179, h: 2556, r: 70,  bezelV: 54,  notchW: 300, notchH: 36 },
  ipad129:  { w: 2048, h: 2732, r: 60,  bezelV: 80,  notchW: 0,   notchH: 0  },
};
const CAPTION_H_FRAC = 0.22;
const PREVIEW_SCALE  = 0.25;

// ── Core renderer (scale-independent) ────────────────────────────────────────
function renderAt(ctx, W, H, scale, spec) {
  const textPos  = document.getElementById("textPos").value;
  const headline = document.getElementById("headline").value;
  const subline  = document.getElementById("subheadline").value;
  const headSize = parseInt(document.getElementById("headlineSize").value, 10) * scale;
  const colorTop = document.getElementById("colorTop").value;
  const colorBot = document.getElementById("colorBot").value;
  const angle    = parseInt(document.getElementById("gradAngle").value, 10);

  drawBackground(ctx, W, H, colorTop, colorBot, angle);

  const capH = textPos === "none" ? 0 : H * CAPTION_H_FRAC;
  const imgY = textPos === "top" ? capH : 0;
  const imgH = H - capH;

  if (uploadedImg) {
    drawDeviceFrame(ctx, uploadedImg, spec, 0, imgY, W, imgH, scale);
  } else {
    drawPlaceholder(ctx, 0, imgY, W, imgH, spec.r * scale);
  }

  if (textPos !== "none" && (headline || subline)) {
    const ty = textPos === "top" ? 0 : H - capH;
    drawCaption(ctx, headline, subline, 0, ty, W, capH, headSize);
  }
}

function render() {
  const canvas = document.getElementById("preview");
  const spec   = DEVICE_SPECS[currentDevice];
  const W = spec.w * PREVIEW_SCALE;
  const H = spec.h * PREVIEW_SCALE;
  canvas.width  = W;
  canvas.height = H;
  renderAt(canvas.getContext("2d"), W, H, PREVIEW_SCALE, spec);
}

// ── Background ────────────────────────────────────────────────────────────────
function drawBackground(ctx, w, h, c1, c2, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  const cx = w / 2, cy = h / 2;
  const len = Math.sqrt(w * w + h * h) / 2;
  const grad = ctx.createLinearGradient(
    cx - Math.cos(rad) * len, cy - Math.sin(rad) * len,
    cx + Math.cos(rad) * len, cy + Math.sin(rad) * len
  );
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

// ── Device frame ──────────────────────────────────────────────────────────────
function drawDeviceFrame(ctx, img, spec, x, y, w, h, scale) {
  const r      = spec.r * scale;
  const pad    = 18 * scale;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;

  ctx.save();
  roundedRect(ctx, x + pad, y + pad, innerW, innerH, r);
  ctx.clip();

  // Fit screenshot inside device
  const s  = Math.min(innerW / img.naturalWidth, innerH / img.naturalHeight);
  const sw = img.naturalWidth * s;
  const sh = img.naturalHeight * s;
  ctx.drawImage(img, x + pad + (innerW - sw) / 2, y + pad + (innerH - sh) / 2, sw, sh);
  ctx.restore();

  // Bezel outline
  ctx.save();
  roundedRect(ctx, x + pad, y + pad, innerW, innerH, r);
  ctx.strokeStyle = "rgba(255,255,255,0.13)";
  ctx.lineWidth = 3 * scale;
  ctx.stroke();
  ctx.restore();

  // Dynamic Island
  if (spec.notchW > 0) {
    const nw = spec.notchW * scale;
    const nh = spec.notchH * scale;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.85)";
    roundedRect(ctx, x + (w - nw) / 2, y + pad + spec.bezelV * scale * 0.3, nw, nh, nh / 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawPlaceholder(ctx, x, y, w, h, r) {
  const pad = 18;
  ctx.save();
  roundedRect(ctx, x + pad, y + pad, w - pad * 2, h - pad * 2, r);
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 8]);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.font = `${Math.round(h * 0.025)}px -apple-system,sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Upload a screenshot", x + w / 2, y + h / 2);
  ctx.restore();
}

// ── Caption ───────────────────────────────────────────────────────────────────
function drawCaption(ctx, headline, subline, x, y, w, h, headFontSize) {
  const cy = y + h / 2;
  if (headline) {
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 ${headFontSize}px -apple-system,BlinkMacSystemFont,sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const lineY = subline ? cy - headFontSize * 0.65 : cy;
    wrapText(ctx, headline, x + w / 2, lineY, w * 0.88, headFontSize * 1.25);
    ctx.restore();
  }
  if (subline) {
    ctx.save();
    const subSize = headFontSize * 0.52;
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.font = `400 ${subSize}px -apple-system,BlinkMacSystemFont,sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const subY = headline ? cy + headFontSize * 0.75 : cy;
    wrapText(ctx, subline, x + w / 2, subY, w * 0.85, subSize * 1.4);
    ctx.restore();
  }
}

function wrapText(ctx, text, cx, y, maxW, lineH) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = word; }
    else line = test;
  }
  if (line) lines.push(line);
  const startY = y - ((lines.length - 1) / 2) * lineH;
  lines.forEach((l, i) => ctx.fillText(l, cx, startY + i * lineH));
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── Export ────────────────────────────────────────────────────────────────────
function buildExportCanvas() {
  const spec = DEVICE_SPECS[currentDevice];
  const ec   = document.createElement("canvas");
  ec.width   = spec.w;
  ec.height  = spec.h;
  renderAt(ec.getContext("2d"), spec.w, spec.h, 1, spec);
  return ec;
}

function exportImage() {
  const spec = DEVICE_SPECS[currentDevice];
  const ec   = buildExportCanvas();
  const a    = document.createElement("a");
  a.download = `appstore-${currentDevice}-screenshot.png`;
  a.href     = ec.toDataURL("image/png");
  a.click();
}

function copyDataURL() {
  buildExportCanvas().toBlob(blob => {
    navigator.clipboard.write([new ClipboardItem({"image/png": blob})])
      .then(() => {
        const btn = document.querySelector("button.secondary");
        const orig = btn.textContent;
        btn.textContent = "Copied!";
        setTimeout(() => { btn.textContent = orig; }, 2000);
      })
      .catch(() => alert("Copy not supported here — use Download instead."));
  }, "image/png");
}
