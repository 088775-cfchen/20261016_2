// =====================================================================
//  天氣小達人：多媒體測驗（p5.js + p5.sound）
//
//  操作方式：一題一頁，看動畫或聽聲音後，直接點選答案。
//            點完立刻顯示對錯和解說，再按「下一題」。
//            鍵盤也可以用：1～4 選答案，Enter 下一題。
//  檔案：只需要這個 sketch.js，搭配原本的 index.html、
//        libraries/p5.min.js、libraries/p5.sound.min.js 即可。
// =====================================================================


// ---------------------------------------------------------------------
// 1. 題目設定（老師修改這裡就好）
// ---------------------------------------------------------------------
//  type 題型：
//    "anim"  看動畫（內建）  → anim 填 sunny / cloudy / rainy / snowy / thunder / windy
//    "sound" 聽聲音（內建）  → sound 填 rain / wind / thunder / birds
//    "image" 看圖片（自備）  → src 填圖片或 GIF 網址 / 檔名，例如 "media/cat.gif"
//    "audio" 聽音檔（自備）  → src 填 mp3 網址 / 檔名，例如 "media/dog.mp3"
//    "video" 看影片（自備）  → src 填 mp4 網址 / 檔名，例如 "media/volcano.mp4"
//  q       題目文字
//  options 選項（2～4 個，每次會自動打亂順序）
//  answer  正確答案（要和某個選項一模一樣）
//  explain 答完後顯示的解說
//
//  自備的圖片、音檔、影片可以放在專案的 media 資料夾裡，
//  要用 VS Code 的 Live Server 或架在網站 / NAS 上開啟才讀得到。

const QUIZ_TITLE = "天氣小達人";
const QUIZ_SUB = "看動畫、聽聲音，選出正確的答案";

const QUESTIONS = [
  {
    type: "anim", anim: "snowy",
    q: "動畫裡是什麼天氣？",
    options: ["下雪", "下雨", "晴天", "多雲"],
    answer: "下雪",
    explain: "白色的雪花慢慢飄下來，地上還有雪人，這是下雪天。",
  },
  {
    type: "sound", sound: "rain",
    q: "仔細聽，這是什麼天氣的聲音？",
    options: ["下雨", "颳大風", "打雷", "晴天"],
    answer: "下雨",
    explain: "沙沙聲加上滴答滴答的聲音，是雨滴落下來的聲音。",
  },
  {
    type: "anim", anim: "thunder",
    q: "遇到這種天氣，最安全的做法是什麼？",
    options: ["待在室內，遠離窗戶", "躲到大樹下面", "去空曠的操場玩", "到河邊釣魚"],
    answer: "待在室內，遠離窗戶",
    explain: "打雷閃電時待在室內最安全；大樹下和空曠的地方容易被雷打到。",
  },
  {
    type: "sound", sound: "wind",
    q: "這個忽大忽小、呼呼的聲音，最可能是什麼天氣？",
    options: ["颳大風", "下雪", "晴天", "下雨"],
    answer: "颳大風",
    explain: "呼～呼～忽大忽小的聲音，是強風吹過的聲音。",
  },
  {
    type: "anim", anim: "sunny",
    q: "這種天氣出門，最需要帶什麼？",
    options: ["帽子和水", "雨傘", "厚外套和手套", "雨鞋"],
    answer: "帽子和水",
    explain: "大太陽要防曬、多喝水，戴帽子可以避免中暑。",
  },
  {
    type: "sound", sound: "thunder",
    q: "轟隆隆～這是什麼聲音？",
    options: ["打雷", "颳大風", "下雨", "鳥叫"],
    answer: "打雷",
    explain: "低沉的轟隆聲是雷聲。通常先看到閃電，過幾秒才聽到雷聲。",
  },
  {
    type: "anim", anim: "windy",
    q: "樹一直搖、葉子到處飛，是什麼天氣？",
    options: ["颳大風", "下雪", "多雲", "下雨"],
    answer: "颳大風",
    explain: "樹枝被吹彎、樹葉被吹走，表示風很大。",
  },
  {
    type: "sound", sound: "birds",
    q: "聽到小鳥開心地唱歌，最可能是什麼天氣？",
    options: ["晴天", "打雷", "下大雨", "颳颱風"],
    answer: "晴天",
    explain: "天氣晴朗的時候，小鳥最常出來活動、唱歌。",
  },
];


// ---------------------------------------------------------------------
// 2. 顏色
// ---------------------------------------------------------------------
const C = {
  bg: "#EEF1F5", panel: "#FFFFFF", ink: "#17212D", muted: "#5A6777",
  line: "#CED6E0", accent: "#D9480F", accentDark: "#B93C0B",
  ok: "#2B8A57", okSoft: "#E3F3EA", bad: "#C92A2A", badSoft: "#FBE5E5",
  screen: "#1B2430",
};
const ART_W = 220, ART_H = 150;   // 內建動畫的原始大小


// ---------------------------------------------------------------------
// 3. 狀態
// ---------------------------------------------------------------------
let screen = "start";      // start | quiz | result
let qi = 0;                // 目前第幾題（從 0 開始）
let opts = [];             // 打亂後的選項
let answers = [];          // 每題選的答案
let qEnterMs = 0, answeredMs = 0, resultMs = 0;
let hits = [];             // 這一幀可以點的區域
let muted = false;
let L = {};                // 版面尺寸

// 音效
let audioReady = false;
let fft;
let rainNoise, rainFilter, windNoise, windFilter, thunderNoise, thunderFilter;
let play = null;           // 正在播放的內建聲音 {kind, t0, dur, next}

// 動畫粒子
let rainDrops = [], snowFlakes = [], windLeaves = [];
const ANIMS = {};


// ---------------------------------------------------------------------
// 4. p5.js 主程式
// ---------------------------------------------------------------------
function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont("sans-serif");
  textWrap(CHAR);                 // 中文逐字換行
  Object.assign(ANIMS, { sunny: drawSunny, cloudy: drawCloudy, rainy: drawRainy, snowy: drawSnowy, thunder: drawThunder, windy: drawWindy });
  makeParticles();
  setupAudio();
  loadCustomMedia();
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }

function draw() {
  background(C.bg);
  hits = [];
  computeLayout();
  if (screen === "start") drawStart();
  else if (screen === "quiz") drawQuiz();
  else drawResult();
  drawMuteButton();
  soundTick();
  updateCursor();
}

function computeLayout() {
  L.fs = constrain(min(width, height * 1.25) / 52, 13, 18);
  L.pad = constrain(width * 0.04, 16, 32);
  L.w = min(width - L.pad * 2, 720);
  L.x = (width - L.w) / 2;
}


// ---------------------------------------------------------------------
// 5. 首頁
// ---------------------------------------------------------------------
function drawStart() {
  const fs = L.fs, t = millis() / 1000;
  const mW = min(L.w, 520), mH = min(mW * ART_H / ART_W, height * 0.36);
  const mW2 = mH * ART_W / ART_H;
  const total = fs * 7.6 + mH + fs * 7.4;
  let y = max(L.pad + fs * 2, (height - total) / 2);
  const cx = width / 2;

  noStroke();
  textAlign(CENTER, TOP);
  fill(C.accent); textStyle(BOLD); textSize(fs * 0.8);
  text("MULTIMEDIA QUIZ", cx, y);
  fill(C.ink); textSize(fs * 2.4);
  text(QUIZ_TITLE, cx, y + fs * 1.4);
  fill(C.muted); textStyle(NORMAL); textSize(fs);
  text(QUIZ_SUB, cx, y + fs * 4.6);
  y += fs * 7.6;

  // 動畫輪播預覽
  const keys = Object.keys(ANIMS);
  const k = keys[floor(t / 2.5) % keys.length];
  drawPanel(cx - mW2 / 2, y, mW2, mH, () => ANIMS[k](t));
  y += mH + fs * 1.4;

  // 題型標籤
  const tags = ["看動畫", "聽聲音", "點選答案"];
  textSize(fs * 0.85); textStyle(BOLD);
  const tw = tags.map(s => textWidth(s) + fs * 1.6);
  let tx = cx - (tw.reduce((a, b) => a + b, 0) + 8 * (tags.length - 1)) / 2;
  tags.forEach((s, i) => {
    fill(C.panel); stroke(C.line); strokeWeight(1);
    rect(tx, y, tw[i], fs * 2, fs);
    noStroke(); fill(C.ink); textAlign(CENTER, CENTER);
    text(s, tx + tw[i] / 2, y + fs);
    tx += tw[i] + 8;
  });
  y += fs * 2.8;

  textStyle(NORMAL); fill(C.muted); textSize(fs * 0.85); textAlign(CENTER, TOP);
  text("共 " + QUESTIONS.length + " 題・有聲音題目，請打開喇叭", cx, y);
  y += fs * 1.9;

  const bw = min(320, L.w), bh = fs * 3.2;
  bigButton(cx - bw / 2, y, bw, bh, "開始測驗", true, startQuiz);
}


// ---------------------------------------------------------------------
// 6. 作答畫面
// ---------------------------------------------------------------------
function drawQuiz() {
  const q = QUESTIONS[qi], fs = L.fs, n = QUESTIONS.length;
  const answered = answers[qi] !== undefined;
  const t = millis() / 1000;
  const x = L.x, w = L.w;

  // --- 上方：題號 + 進度條 ---
  let y = L.pad * 0.7;
  noStroke(); fill(C.ink); textStyle(BOLD); textSize(fs * 1.05); textAlign(LEFT, CENTER);
  text("第 " + (qi + 1) + " / " + n + " 題", x, y + fs);
  fill(C.muted); textStyle(NORMAL); textSize(fs * 0.85); textAlign(RIGHT, CENTER);
  text("答對 " + countRight() + " 題", x + w - fs * 3, y + fs);
  y += fs * 2.4;
  const segW = (w - (n - 1) * 4) / n;
  for (let i = 0; i < n; i++) {
    let c = C.line;
    if (answers[i] !== undefined) c = answers[i] === QUESTIONS[i].answer ? C.ok : C.bad;
    else if (i === qi) c = C.accent;
    fill(c); rect(x + i * (segW + 4), y, segW, 6, 3);
  }
  y += 6 + fs * 1.1;

  // --- 計算各區高度 ---
  const cols = w >= 560 ? 2 : 1;
  const nOpt = opts.length;
  const rows = ceil(nOpt / cols);
  const btnH = fs * 3;
  const btnsH = rows * btnH + (rows - 1) * 10;
  const qH = fs * 1.25 * 2.4;
  const fbH = fs * 6.2;
  const gap = fs * 0.9;
  const avail = height - y - L.pad * 0.7 - qH - btnsH - fbH - gap * 3;
  const mH = constrain(avail, 90, w * ART_H / ART_W);
  const mW = min(w, mH * ART_W / ART_H);

  // 新題目進場：微微往上滑
  const k = easeOut(constrain((millis() - qEnterMs) / 350, 0, 1));
  push();
  translate(0, (1 - k) * 14);
  drawingContext.globalAlpha = k;

  // --- 多媒體區 ---
  drawMedia(q, x + (w - mW) / 2, y, mW, mH, t);
  y += mH + gap;

  // --- 題目 ---
  noStroke(); fill(C.ink); textStyle(BOLD); textSize(fs * 1.25); textAlign(CENTER, TOP);
  text(q.q, x, y, w, qH);
  y += qH + gap * 0.5;

  // --- 選項按鈕 ---
  const bw = (w - (cols - 1) * 10) / cols;
  opts.forEach((o, i) => {
    const bx = x + (i % cols) * (bw + 10);
    const by = y + floor(i / cols) * (btnH + 10);
    drawOption(i, o, bx, by, bw, btnH, q, answered);
  });
  y += btnsH + gap;

  // --- 回饋 / 下一題 ---
  if (answered) drawFeedback(q, x, y, w, fbH);
  else {
    noStroke(); fill(C.muted); textStyle(NORMAL); textSize(fs * 0.85); textAlign(CENTER, TOP);
    const tip = (q.type === "sound" || q.type === "audio") ? "沒聽清楚？點上面的畫面可以再聽一次" :
      q.type === "video" ? "點上面的畫面播放影片" : "點選一個答案";
    text(tip + (width >= 700 ? "（鍵盤 1～" + nOpt + " 也可以作答）" : ""), x, y + fs * 0.5, w);
  }
  pop();
}

function drawOption(i, label, x, y, w, h, q, answered) {
  const fs = L.fs;
  const chosen = answers[qi] === label;
  const isAns = label === q.answer;
  const hover = !answered && inRect(mouseX, mouseY, { x, y, w, h });

  let bg = C.panel, border = C.line, ink = C.ink, badge = C.ink, badgeInk = "#FFFFFF";
  if (hover) { border = C.accent; badge = C.accent; }
  if (answered) {
    if (isAns) { bg = C.okSoft; border = C.ok; badge = C.ok; }
    else if (chosen) { bg = C.badSoft; border = C.bad; badge = C.bad; }
    else { ink = C.muted; badge = C.line; badgeInk = C.muted; }
  }

  push();
  // 答對的按鈕彈一下
  if (answered && isAns && chosen) {
    const p = constrain((millis() - answeredMs) / 300, 0, 1);
    const s = 1 + 0.04 * sin(p * PI);
    translate(x + w / 2, y + h / 2); scale(s); translate(-(x + w / 2), -(y + h / 2));
  }
  fill(bg); stroke(border); strokeWeight(hover || (answered && (isAns || chosen)) ? 2.5 : 1.5);
  rect(x, y, w, h, 12);

  // 左邊的號碼 / 對錯圓圈
  const r = h * 0.62;
  noStroke(); fill(badge);
  circle(x + h * 0.5, y + h / 2, r);
  fill(badgeInk); textAlign(CENTER, CENTER); textStyle(BOLD); textSize(fs * 0.95);
  let mark = String(i + 1);
  if (answered && isAns) mark = "✓";
  else if (answered && chosen) mark = "✗";
  text(mark, x + h * 0.5, y + h / 2);

  // 選項文字（太長就自動縮小）
  fill(ink); textAlign(LEFT, CENTER);
  let size = fs * 1.1;
  const maxW = w - h - fs;
  textSize(size);
  while (textWidth(label) > maxW && size > fs * 0.75) { size -= 1; textSize(size); }
  text(label, x + h, y + h / 2);
  pop();

  if (!answered) addHit(x, y, w, h, () => choose(i));
}

function drawFeedback(q, x, y, w, h) {
  const fs = L.fs;
  const ok = answers[qi] === q.answer;
  const last = qi === QUESTIONS.length - 1;
  noStroke(); fill(ok ? C.okSoft : C.badSoft);
  rect(x, y, w, h, 12);
  fill(ok ? C.ok : C.bad); rect(x, y, 6, h, 12, 0, 0, 12);

  const bw = min(fs * 8, w * 0.36), bh = fs * 2.8;
  const tx = x + fs * 1.1, tw = w - bw - fs * 2.6;
  textAlign(LEFT, TOP); textStyle(BOLD); textSize(fs * 1.1);
  text(ok ? "答對了！" : "答錯了，正確答案是「" + q.answer + "」", tx, y + fs * 0.7, tw, fs * 1.6);
  fill(C.ink); textStyle(NORMAL); textSize(fs * 0.9);
  text(q.explain, tx, y + fs * 2.3, tw, h - fs * 2.6);

  bigButton(x + w - bw - fs * 0.8, y + (h - bh) / 2, bw, bh, last ? "看成績" : "下一題", true, goNext);
}


// ---------------------------------------------------------------------
// 7. 多媒體區
// ---------------------------------------------------------------------
function drawMedia(q, x, y, w, h, t) {
  const tags = { anim: "看動畫", sound: "聽聲音", image: "看圖片", audio: "聽聲音", video: "看影片" };
  drawPanel(x, y, w, h, null);
  const ctx = drawingContext;
  ctx.save(); clipRound(x, y, w, h, 14);

  if (q.type === "anim") {
    push(); translate(x, y); scale(w / ART_W, h / ART_H); (ANIMS[q.anim] || drawSunny)(t); pop();
  } else if (q.type === "sound" || q.type === "audio") {
    drawSoundPanel(q, x, y, w, h);
    addHit(x, y, w, h, () => playMedia(q));
  } else if (q.type === "image") {
    if (q.img && q.img.width > 1) drawCover(q.img, q.img.width, q.img.height, x, y, w, h);
    else centerNote(q.failed ? "圖片讀取失敗，請檢查檔名或網址" : "圖片載入中…", x, y, w, h);
  } else if (q.type === "video") {
    const v = q.vid;
    if (v && v.elt.videoWidth) {
      drawCover(v, v.elt.videoWidth, v.elt.videoHeight, x, y, w, h);
      if (v.elt.paused) playIcon(x + w / 2, y + h / 2, min(w, h) * 0.28, false);
    } else centerNote(q.failed ? "影片讀取失敗，請檢查檔名或網址" : "影片載入中…", x, y, w, h);
    addHit(x, y, w, h, () => playMedia(q));
  }
  ctx.restore();

  // 左上角題型標籤
  textStyle(BOLD); textSize(L.fs * 0.75);
  const lab = tags[q.type] || "";
  const lw = textWidth(lab) + L.fs * 1.2;
  noStroke(); fill(0, 0, 0, 120); rect(x + 10, y + 10, lw, L.fs * 1.6, 6);
  fill(255); textAlign(CENTER, CENTER); text(lab, x + 10 + lw / 2, y + 10 + L.fs * 0.8);
  textStyle(NORMAL);
}

function drawSoundPanel(q, x, y, w, h) {
  const playing = isPlaying(q);
  // 背景：深藍色 + 頻譜長條
  noStroke(); fill("#1F2B3D"); rect(x, y, w, h);
  const bars = 32;
  let spec = null;
  if (playing && fft) spec = fft.analyze();
  const bw = w / bars;
  for (let i = 0; i < bars; i++) {
    let v;
    if (spec) v = spec[floor(map(i, 0, bars, 2, spec.length * 0.7))] / 255;
    else v = 0.06 + 0.04 * sin(millis() / 600 + i * 0.5);
    const bh = v * h * 0.75;
    fill(lerpColor(color("#3B82C4"), color("#FF8A4C"), i / bars));
    rect(x + i * bw + 2, y + h - bh, bw - 4, bh, 2);
  }
  // 中央播放鈕
  const r = min(w, h) * 0.26;
  const pulse = playing ? 1 + 0.05 * sin(millis() / 120) : 1;
  playIcon(x + w / 2, y + h / 2 - L.fs * 0.6, r * pulse, playing);
  textStyle(BOLD); textSize(L.fs * 0.9);
  let msg = playing ? "播放中…" : (q.heard ? "再聽一次" : "點這裡聽聲音");
  if (q.type === "audio" && !(q.snd && q.snd.isLoaded())) msg = q.failed ? "音檔讀取失敗" : "音檔載入中…";
  const mw = textWidth(msg) + L.fs * 1.6, my = y + h / 2 + r * 0.55;
  noStroke(); fill(15, 22, 34, 210);
  rect(x + w / 2 - mw / 2, my, mw, L.fs * 1.8, L.fs * 0.9);
  fill(255); textAlign(CENTER, CENTER);
  text(msg, x + w / 2, my + L.fs * 0.9);
  textStyle(NORMAL);
}

function playIcon(cx, cy, r, playing) {
  noStroke(); fill(255, 255, 255, 235); circle(cx, cy, r);
  fill(C.accent);
  if (playing) {   // 喇叭 + 聲波
    const s = r / 60;
    rect(cx - 14 * s, cy - 6 * s, 8 * s, 12 * s, 1);
    triangle(cx - 8 * s, cy - 6 * s, cx + 4 * s, cy - 15 * s, cx + 4 * s, cy + 15 * s);
    rect(cx - 8 * s, cy - 6 * s, 12 * s, 12 * s);
    noFill(); stroke(C.accent); strokeWeight(2.5 * s);
    arc(cx + 6 * s, cy, 14 * s, 18 * s, -PI / 3, PI / 3);
    arc(cx + 6 * s, cy, 26 * s, 30 * s, -PI / 3, PI / 3);
  } else {
    triangle(cx - r * 0.13, cy - r * 0.2, cx - r * 0.13, cy + r * 0.2, cx + r * 0.22, cy);
  }
}


// ---------------------------------------------------------------------
// 8. 成績畫面
// ---------------------------------------------------------------------
function drawResult() {
  const fs = L.fs, n = QUESTIONS.length, right = countRight();
  const score = round(right / n * 100);
  const x = L.x, w = L.w, cx = width / 2;
  const rowH = fs * 2.1;
  const total = fs * 13 + n * rowH + fs * 4.5;
  let y = max(L.pad + fs, (height - total) / 2);

  noStroke(); textAlign(CENTER, TOP);
  fill(C.accent); textStyle(BOLD); textSize(fs * 0.8);
  text("測驗完成", cx, y);
  fill(C.ink); textSize(fs * 1.4);
  text(QUIZ_TITLE + "・成績", cx, y + fs * 1.3);

  // 分數（數字往上跑）
  const p = easeOut(constrain((millis() - resultMs) / 900, 0, 1));
  fill(C.accent); textSize(fs * 4.2);
  const shown = round(score * p);
  text(shown, cx - fs * 0.7, y + fs * 3.2);
  const sw = textWidth(String(shown));
  fill(C.muted); textSize(fs * 1.1); textAlign(LEFT, TOP);
  text("分", cx - fs * 0.7 + sw / 2 + 4, y + fs * 6.1);

  // 星星
  const stars = score >= 90 ? 3 : score >= 60 ? 2 : score > 0 ? 1 : 0;
  for (let i = 0; i < 3; i++) {
    const sp = constrain((millis() - resultMs - 500 - i * 180) / 300, 0, 1);
    const s = i < stars ? easeOutBack(sp) : 1;
    drawStar(cx + (i - 1) * fs * 2.6, y + fs * 8.7, fs * 1.0 * s, fs * 0.45 * s, i < stars);
  }

  textAlign(CENTER, TOP); fill(C.ink); textSize(fs * 1.05);
  const msg = score === 100 ? "全部答對，你是天氣小達人！" : score >= 60 ? "表現不錯！看看下面答錯的題目" : "再試一次，仔細看、仔細聽喔";
  text(msg, cx, y + fs * 10.2);
  textStyle(NORMAL); fill(C.muted); textSize(fs * 0.85);
  text("答對 " + right + " / " + n + " 題", cx, y + fs * 11.7);
  y += fs * 13;

  // 每題對錯清單
  fill(C.panel); stroke(C.line); strokeWeight(1);
  rect(x, y, w, n * rowH, 12);
  QUESTIONS.forEach((q, i) => {
    const ry = y + i * rowH;
    const ok = answers[i] === q.answer;
    if (i > 0) { stroke(C.line); line(x + fs, ry, x + w - fs, ry); }
    noStroke(); fill(ok ? C.ok : C.bad);
    circle(x + fs * 1.4, ry + rowH / 2, fs * 1.3);
    fill(255); textAlign(CENTER, CENTER); textStyle(BOLD); textSize(fs * 0.75);
    text(ok ? "✓" : "✗", x + fs * 1.4, ry + rowH / 2);
    fill(C.ink); textAlign(LEFT, CENTER); textSize(fs * 0.85);
    text("第 " + (i + 1) + " 題", x + fs * 2.6, ry + rowH / 2);
    textStyle(NORMAL); fill(ok ? C.ok : C.muted); textSize(fs * 0.8);
    const detail = ok ? "答對：" + q.answer : "你選「" + (answers[i] || "沒作答") + "」，正解「" + q.answer + "」";
    text(detail, x + fs * 6.2, ry + rowH / 2 - fs * 0.6, w - fs * 7, fs * 1.4);
  });
  y += n * rowH + fs * 1.2;

  const bw = min(200, (w - 10) / 2), bh = fs * 3;
  bigButton(cx - bw - 5, y, bw, bh, "再測一次", true, startQuiz);
  bigButton(cx + 5, y, bw, bh, "回到首頁", false, () => { stopMedia(); screen = "start"; });
}

function drawStar(cx, cy, r1, r2, filled) {
  push(); translate(cx, cy);
  if (filled) { fill("#F5B100"); noStroke(); } else { noFill(); stroke(C.line); strokeWeight(2); }
  beginShape();
  for (let i = 0; i < 10; i++) {
    const a = -HALF_PI + i * PI / 5, r = i % 2 ? r2 : r1;
    vertex(cos(a) * r, sin(a) * r);
  }
  endShape(CLOSE);
  pop();
}


// ---------------------------------------------------------------------
// 9. 流程控制
// ---------------------------------------------------------------------
function startQuiz() {
  if (typeof userStartAudio === "function") userStartAudio();
  answers = [];
  QUESTIONS.forEach(q => q.heard = false);
  screen = "quiz";
  enterQuestion(0);
}

function enterQuestion(i) {
  stopMedia();
  qi = i;
  opts = shuffle(QUESTIONS[i].options.slice());
  qEnterMs = millis();
  const q = QUESTIONS[i];
  // 聲音題自動播放一次
  if (q.type === "sound" || q.type === "audio") {
    setTimeout(() => { if (screen === "quiz" && qi === i && answers[i] === undefined) playMedia(q); }, 600);
  }
}

function choose(i) {
  if (answers[qi] !== undefined) return;
  const q = QUESTIONS[qi];
  answers[qi] = opts[i];
  answeredMs = millis();
  stopMedia();
  if (opts[i] === q.answer) sfxCorrect(); else sfxWrong();
}

function goNext() {
  if (qi < QUESTIONS.length - 1) { enterQuestion(qi + 1); return; }
  stopMedia();
  screen = "result";
  resultMs = millis();
  if (countRight() / QUESTIONS.length >= 0.6) sfxFanfare();
}

function countRight() { return QUESTIONS.filter((q, i) => answers[i] === q.answer).length; }


// ---------------------------------------------------------------------
// 10. 聲音（p5.sound）
// ---------------------------------------------------------------------
function setupAudio() {
  if (typeof p5.Noise === "undefined") { console.warn("沒有載入 p5.sound，聲音題無法播放"); return; }
  audioReady = true;
  outputVolume(0.85);
  fft = new p5.FFT(0.75, 128);

  rainNoise = new p5.Noise("white");  rainFilter = new p5.BandPass();
  windNoise = new p5.Noise("pink");   windFilter = new p5.BandPass();
  thunderNoise = new p5.Noise("brown"); thunderFilter = new p5.LowPass();
  [[rainNoise, rainFilter], [windNoise, windFilter], [thunderNoise, thunderFilter]].forEach(([nz, f]) => {
    nz.disconnect(); nz.connect(f); nz.amp(0); nz.start();
  });
  rainFilter.freq(2800); rainFilter.res(0.7);
  windFilter.res(4);
  thunderFilter.res(1);
}

// 自備的圖片 / 音檔 / 影片（非同步載入，載入前畫面會顯示「載入中」）
function loadCustomMedia() {
  for (const q of QUESTIONS) {
    if (q.type === "image") q.img = loadImage(q.src, () => {}, () => q.failed = true);
    if (q.type === "audio" && audioReady) q.snd = loadSound(q.src, () => {}, () => q.failed = true);
    if (q.type === "video") {
      q.vid = createVideo(q.src);
      q.vid.hide();
      q.vid.elt.setAttribute("playsinline", "");
      q.vid.elt.onerror = () => q.failed = true;
    }
  }
}

function playMedia(q) {
  if (typeof userStartAudio === "function") userStartAudio();
  q.heard = true;
  if (q.type === "sound" && audioReady) {
    stopSound();
    play = { kind: q.sound, t0: millis(), dur: 3500, next: 0.2 };
  } else if (q.type === "audio" && q.snd && q.snd.isLoaded()) {
    q.snd.stop(); q.snd.play();
  } else if (q.type === "video" && q.vid) {
    if (q.vid.elt.paused) q.vid.play(); else q.vid.pause();
  }
}

function isPlaying(q) {
  if (q.type === "sound") return !!play;
  if (q.type === "audio") return !!(q.snd && q.snd.isPlaying());
  if (q.type === "video") return !!(q.vid && !q.vid.elt.paused);
  return false;
}

function stopMedia() {
  stopSound();
  for (const q of QUESTIONS) {
    if (q.snd && q.snd.isPlaying()) q.snd.stop();
    if (q.vid && !q.vid.elt.paused) q.vid.pause();
  }
}

function stopSound() {
  play = null;
  if (!audioReady) return;
  rainNoise.amp(0, 0.2); windNoise.amp(0, 0.3); thunderNoise.amp(0, 0.4);
}

// 每一幀更新內建聲音的音量、音色，模擬自然的聲音
function soundTick() {
  if (!play || !audioReady) return;
  const e = (millis() - play.t0) / 1000;
  const fade = constrain((play.dur / 1000 - e) / 0.5, 0, 1);   // 最後 0.5 秒淡出
  if (e > play.dur / 1000) { stopSound(); return; }

  if (play.kind === "rain") {
    rainNoise.amp((0.2 + random(-0.03, 0.03)) * fade * constrain(e / 0.3, 0, 1), 0.05);
    if (random() < 0.18) tone(random(1600, 3200), random(900, 1400), random(0, 0.05), 0.07, 0.07 * fade);
  } else if (play.kind === "wind") {
    windFilter.freq(260 + 700 * noise(e * 0.7));
    windNoise.amp((0.08 + 0.4 * noise(e * 0.55 + 10)) * fade * constrain(e / 0.4, 0, 1), 0.08);
  } else if (play.kind === "thunder") {
    const env = e < 0.25 ? 0 : exp(-(e - 0.25) * 1.15);
    const rumble = 0.5 + 0.5 * noise(e * 7);
    thunderFilter.freq(120 + 1000 * env);
    thunderNoise.amp(min(1, env * rumble * 1.3) * fade, 0.03);
  } else if (play.kind === "birds") {
    while (e >= play.next) {
      const base = random(2300, 3000);
      tone(base, base * random(1.3, 1.6), 0, 0.09, 0.16 * fade, "sine");
      play.next += random() < 0.3 ? random(0.35, 0.6) : random(0.1, 0.15);
    }
  }
}

// 用 Web Audio 產生一個短音（音高可以滑動），接到 p5.sound 的主音量
function tone(f1, f2, start, dur, vol, type = "sine") {
  if (!audioReady || vol <= 0) return;
  const ac = getAudioContext();
  const t = ac.currentTime + start;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f1, t);
  if (f2 && f2 !== f1) o.frequency.exponentialRampToValueAtTime(f2, t + dur * 0.8);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect((p5.soundOut && p5.soundOut.input) || ac.destination);
  o.start(t); o.stop(t + dur + 0.05);
}

function sfxCorrect() { tone(784, 784, 0, 0.14, 0.22, "triangle"); tone(1175, 1175, 0.11, 0.3, 0.22, "triangle"); }
function sfxWrong()   { tone(330, 220, 0, 0.35, 0.2, "sawtooth"); }
function sfxFanfare() { [523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.15 + i * 0.13, i === 3 ? 0.5 : 0.16, 0.2, "triangle")); }


// ---------------------------------------------------------------------
// 11. 按鈕、靜音鈕與點擊處理
// ---------------------------------------------------------------------
function bigButton(x, y, w, h, label, primary, fn) {
  const hover = inRect(mouseX, mouseY, { x, y, w, h });
  push();
  if (primary) { fill(hover ? C.accentDark : C.accent); noStroke(); }
  else { fill(hover ? "#E3E7EC" : C.panel); stroke(C.ink); strokeWeight(1.5); }
  rect(x, y, w, h, 12);
  noStroke(); fill(primary ? 255 : C.ink);
  textAlign(CENTER, CENTER); textStyle(BOLD); textSize(L.fs * 1.05);
  text(label, x + w / 2, y + h / 2);
  pop();
  addHit(x, y, w, h, fn);
}

function drawMuteButton() {
  const s = L.fs * 2.2;
  const x = L.x + L.w - s, y = L.pad * 0.7 - (screen === "quiz" ? L.fs * 0.1 : 0);
  const hover = inRect(mouseX, mouseY, { x, y, w: s, h: s });
  push();
  fill(hover ? "#E3E7EC" : C.panel); stroke(C.line); strokeWeight(1);
  rect(x, y, s, s, 8);
  const cx = x + s / 2 - s * 0.08, cy = y + s / 2, u = s / 40;
  noStroke(); fill(C.ink);
  rect(cx - 10 * u, cy - 5 * u, 7 * u, 10 * u);
  triangle(cx - 4 * u, cy - 5 * u, cx + 5 * u, cy - 12 * u, cx + 5 * u, cy + 12 * u);
  rect(cx - 4 * u, cy - 5 * u, 9 * u, 10 * u);
  stroke(muted ? C.bad : C.ink); strokeWeight(2.4 * u); noFill();
  if (muted) { line(cx + 9 * u, cy - 6 * u, cx + 19 * u, cy + 6 * u); line(cx + 19 * u, cy - 6 * u, cx + 9 * u, cy + 6 * u); }
  else { arc(cx + 6 * u, cy, 12 * u, 16 * u, -PI / 3, PI / 3); arc(cx + 6 * u, cy, 24 * u, 28 * u, -PI / 3, PI / 3); }
  pop();
  addHit(x, y, s, s, () => { muted = !muted; if (audioReady) outputVolume(muted ? 0 : 0.85, 0.1); });
}

function addHit(x, y, w, h, fn) { hits.push({ x, y, w, h, fn }); }

let lastTouch = -9999;
function handlePress() {
  for (let i = hits.length - 1; i >= 0; i--) {     // 後畫的在上層，先判斷
    if (inRect(mouseX, mouseY, hits[i])) { hits[i].fn(); return; }
  }
}
function mousePressed() { if (millis() - lastTouch > 700) handlePress(); return false; }
function touchStarted() { lastTouch = millis(); handlePress(); return false; }
function touchEnded() { return false; }

function keyPressed() {
  if (screen === "start" && (keyCode === ENTER || key === " ")) { startQuiz(); return false; }
  if (screen === "quiz") {
    const answered = answers[qi] !== undefined;
    const k = int(key);
    if (!answered && k >= 1 && k <= opts.length) { choose(k - 1); return false; }
    if (answered && (keyCode === ENTER || key === " ")) { goNext(); return false; }
    if (!answered && (key === "p" || key === "P")) { playMedia(QUESTIONS[qi]); return false; }
  }
  if (screen === "result" && keyCode === ENTER) { startQuiz(); return false; }
}

function updateCursor() {
  cursor(hits.some(h => inRect(mouseX, mouseY, h)) ? HAND : ARROW);
}


// ---------------------------------------------------------------------
// 12. 小工具
// ---------------------------------------------------------------------
function inRect(px, py, r) { return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h; }
function easeOut(k) { return 1 - pow(1 - k, 3); }
function easeOutBack(k) { const c = 1.7; return k <= 0 ? 0 : 1 + (c + 1) * pow(k - 1, 3) + c * pow(k - 1, 2); }

function clipRound(x, y, w, h, r) {
  const ctx = drawingContext;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
  ctx.clip();
}

function drawPanel(x, y, w, h, fn) {
  noStroke(); fill(C.screen); rect(x, y, w, h, 14);
  if (!fn) return;
  drawingContext.save(); clipRound(x, y, w, h, 14);
  push(); translate(x, y); scale(w / ART_W, h / ART_H); fn(); pop();
  drawingContext.restore();
}

function drawCover(src, sw, sh, x, y, w, h) {
  const s = max(w / sw, h / sh), iw = sw * s, ih = sh * s;
  image(src, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
}

function centerNote(msg, x, y, w, h) {
  noStroke(); fill("#AEB9C7"); textAlign(CENTER, CENTER); textSize(L.fs * 0.9);
  text(msg, x + 16, y, w - 32, h);
}

function skyGradient(top, bottom, hgt) {
  const c1 = color(top), c2 = color(bottom);
  noStroke();
  for (let i = 0; i < 30; i++) {
    fill(lerpColor(c1, c2, i / 29));
    rect(0, (hgt * i) / 30, ART_W, hgt / 30 + 1);
  }
}

function cloudShape(cx, cy, r, col) {
  noStroke(); fill(col);
  for (const [dx, dy, rr] of [[-1.1, 0.25, 0.7], [-0.4, -0.25, 0.9], [0.45, -0.1, 0.8], [1.1, 0.3, 0.6], [0, 0.35, 0.75]]) {
    circle(cx + dx * r, cy + dy * r, rr * r * 2);
  }
}

function makeParticles() {
  randomSeed(4);
  rainDrops = Array.from({ length: 40 }, () => ({ x: random(ART_W), p: random(1) }));
  snowFlakes = Array.from({ length: 36 }, () => ({ x: random(ART_W), p: random(1), r: random(1.5, 3.5), ph: random(TWO_PI) }));
  windLeaves = Array.from({ length: 9 }, () => ({ p: random(1), y: random(20, 100), ph: random(TWO_PI) }));
  randomSeed(Date.now() % 100000);
}


// ---------------------------------------------------------------------
// 13. 內建天氣動畫（座標以 220 × 150 為準，t 是秒數）
// ---------------------------------------------------------------------
function drawSunny(t) {
  skyGradient("#4696E6", "#AAD7FA", ART_H);
  const cx = 110, cy = 68, pulse = 1 + 0.07 * sin(t * TWO_PI * 0.8);
  stroke("#FFC828"); strokeWeight(4); strokeCap(ROUND);
  for (let i = 0; i < 12; i++) {
    const a = t * 0.6 + i * PI / 6, r2 = (i % 2 ? 46 : 40) * pulse;
    line(cx + 31 * cos(a), cy + 31 * sin(a), cx + r2 * cos(a), cy + r2 * sin(a));
  }
  noStroke(); fill("#FFD63C"); circle(cx, cy, 50);
  fill("#6EB45A"); rect(0, ART_H - 15, ART_W, 15);
}

function drawCloudy(t) {
  skyGradient("#78A5D2", "#BED7EB", ART_H);
  noStroke(); fill("#FFD246"); circle(150, 40, 40);
  const W = ART_W + 100;
  for (const [base, y, r, sp, col] of [[0, 35, 19, 10, "#EBF0F6"], [110, 65, 23, 14, "#FAFCFF"], [60, 100, 17, 22, "#E1E8F0"]]) {
    const x = ((base + t * sp) % W) - 50;
    cloudShape(x, y, r, col); cloudShape(x - W, y, r, col);
  }
  fill("#78AA64"); rect(0, ART_H - 14, ART_W, 14);
}

function drawRainy(t) {
  skyGradient("#5A697D", "#96A5B4", ART_H);
  noStroke(); fill("#5F6E69"); rect(0, ART_H - 18, ART_W, 18);
  stroke("#C8E1FF"); strokeWeight(1);
  for (const d of rainDrops) {
    const y = 30 + ((d.p + t * 1.6) % 1) * (ART_H - 48);
    line(d.x, y, d.x - 2, y + 7);
  }
  noFill();
  [55, 125, 180].forEach((x0, i) => {
    const k = (t * 1.2 + i / 3) % 1;
    stroke(220 - 120 * k); ellipse(x0, ART_H - 9, 6 + 30 * k, 2 + 8 * k);
  });
  cloudShape(65, 22, 24, "#6E7682"); cloudShape(160, 20, 27, "#78808C");
}

function drawSnowy(t) {
  skyGradient("#283C69", "#6E87AF", ART_H);
  noStroke(); fill(255);
  for (const f of snowFlakes) {
    const y = ((f.p + t * 0.25) % 1) * (ART_H - 15);
    circle(f.x + 5 * sin(t * TWO_PI * 0.5 + f.ph), y, f.r * 2);
  }
  fill("#F0F5FC"); ellipse(50, ART_H + 3, 180, 55);
  fill("#E4ECF8"); ellipse(175, ART_H + 6, 170, 55);
  stroke("#C8D2E1"); strokeWeight(0.6); fill(255);
  circle(165, ART_H - 31, 26); circle(165, ART_H - 51, 18);
  noStroke(); fill("#F08228"); triangle(165, ART_H - 52, 175, ART_H - 50.5, 165, ART_H - 49);
  fill(40); circle(162, ART_H - 54, 2); circle(168, ART_H - 54, 2);
}

function drawThunder(t) {
  const phase = (t % 3) / 3;
  const big = phase < 0.03 || (phase > 0.5 && phase < 0.53);
  const bolt = big || (phase > 0.06 && phase < 0.09) || (phase > 0.56 && phase < 0.58);
  if (big) skyGradient("#EBEBFA", "#C8CDE6", ART_H); else skyGradient("#232337", "#46465F", ART_H);
  noStroke(); fill("#2D323C"); rect(0, ART_H - 15, ART_W, 15);
  if (bolt) {
    const x = phase < 0.4 ? 100 : 130;
    fill("#FFEB50");
    beginShape();
    vertex(x, 35); vertex(x - 14, 75); vertex(x - 2, 75); vertex(x - 15, 120);
    vertex(x + 19, 64); vertex(x + 5, 64); vertex(x + 17, 35);
    endShape(CLOSE);
  }
  cloudShape(75, 27, 28, "#505064"); cloudShape(160, 25, 30, "#5A5A70");
}

function drawWindy(t) {
  skyGradient("#96C8EB", "#CDE6F5", ART_H);
  noStroke(); fill("#6EA555"); rect(0, ART_H - 20, ART_W, 20);
  const sway = sin(t * TWO_PI * 0.9) * 6 + 7, bx = 55, by = ART_H - 20;
  fill("#6E4B2D");
  quad(bx - 4.5, by, bx + 4.5, by, bx + 2 + sway * 0.5, by - 45, bx - 2 + sway * 0.5, by - 45);
  fill("#3C8C46");
  for (const [dx, dy, r] of [[0, -55, 23], [-15, -42, 17], [15, -42, 18], [5, -70, 15]]) {
    circle(bx + dx + sway * (dy < -50 ? 1.2 : 1), by + dy, r * 2);
  }
  noFill(); stroke(255); strokeWeight(2); strokeCap(ROUND);
  [[35, 45], [60, 60], [85, 40], [107, 55]].forEach(([y, len], k) => {
    const x = ((t * 0.9 + k * 0.27) % 1) * (ART_W + 80) - 60;
    arc(x + len / 2, y, len, 12, PI * 1.1, PI * 1.9);
  });
  noStroke(); fill("#DC9628");
  for (const lf of windLeaves) {
    const x = ((lf.p + t * 0.35) % 1) * (ART_W + 20) - 10;
    const y = lf.y + 8 * sin(t * TWO_PI * 1.2 + lf.ph);
    push(); translate(x, y); rotate(t * 5 + lf.ph); ellipse(0, 0, 8, 3.5); pop();
  }
}
