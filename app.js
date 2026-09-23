const DATA_URL = new URL("data.json", document.baseURI);

const board = document.querySelector("#board");
const todayLine = document.querySelector("#today-line");
const dialog = document.querySelector("#detail");
const detailBody = document.querySelector("#detail-body");
const detailKicker = document.querySelector("#detail-kicker");
const closeButton = document.querySelector("#detail-close");

const WEEKDAYS = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

function melbourneToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Melbourne",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(new Date());
  const get = (type) => parts.find((part) => part.type === type)?.value;
  const iso = `${get("year")}-${get("month")}-${get("day")}`;
  return iso;
}

function weekdayLabel(iso) {
  const date = parseIso(iso);
  return WEEKDAYS[date.getUTCDay()];
}

function formatLong(iso) {
  const [year, month, day] = iso.split("-");
  return `${year}年${Number(month)}月${Number(day)}日 ${weekdayLabel(iso)}`;
}

function formatShort(iso) {
  const [, month, day] = iso.split("-");
  return `${Number(month)}月${Number(day)}日`;
}

function parseIso(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function weekStart(iso) {
  const date = parseIso(iso);
  const day = date.getUTCDay();
  const offset = day === 0 ? 6 : day - 1;
  date.setUTCDate(date.getUTCDate() - offset);
  return date.toISOString().slice(0, 10);
}

function safeUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  const trimmed = value.trim();
  // Allow same-origin relative image/paths used by GitHub Pages data.json
  if (
    trimmed.startsWith("images/") ||
    trimmed.startsWith("./images/") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }
  try {
    const url = new URL(trimmed);
    if (url.protocol === "https:" || url.protocol === "http:") return url.href;
  } catch {
    return null;
  }
  return null;
}

function byDateDesc(a, b) {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  return a.order - b.order;
}

function group(items, today) {
  const start = weekStart(today);
  const todayItems = [];
  const weekItems = [];
  const earlierItems = [];
  for (const item of items) {
    if (item.date === today) todayItems.push(item);
    else if (item.date >= start) weekItems.push(item);
    else earlierItems.push(item);
  }
  todayItems.sort(byDateDesc);
  weekItems.sort(byDateDesc);
  earlierItems.sort(byDateDesc);

  let featured = todayItems.slice(0, 2);
  let featuredTitle = "今日推薦";
  let week = [...todayItems.slice(2), ...weekItems];

  if (!featured.length && weekItems.length) {
    const latest = weekItems[0].date;
    featured = weekItems.filter((item) => item.date === latest).slice(0, 2);
    featuredTitle = `${formatShort(latest)} 推薦`;
    const featuredIds = new Set(featured.map((item) => item.id));
    week = weekItems.filter((item) => !featuredIds.has(item.id));
  }

  week.sort(byDateDesc);
  return { featured, featuredTitle, week, earlier: earlierItems };
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function card(item, large) {
  const button = el("button", "card");
  button.type = "button";
  button.dataset.id = item.id;
  button.setAttribute("aria-haspopup", "dialog");

  const images = Array.isArray(item.images) ? item.images.map(safeUrl).filter(Boolean) : [];
  if (images.length) {
    const thumb = document.createElement("img");
    thumb.className = "card-thumb";
    thumb.src = images[0];
    thumb.alt = item.name;
    thumb.loading = "lazy";
    button.append(thumb);
  }

  const top = el("div", "card-top");
  top.append(el("span", "cuisine", item.cuisine || "中菜"));
  top.append(el("span", "price", item.priceBand || "—"));

  const title = el("h3", null, item.name);
  const hook = el("p", "hook", item.hook || item.why || "");

  const foot = el("div", "card-foot");
  foot.append(el("span", "area", item.area || ""));
  foot.append(el("span", "date-chip", formatShort(item.date)));

  button.append(top, title, hook, foot);
  if (large) button.dataset.size = "large";
  return button;
}

function section(title, items, { large = false, emptyText, className = "" } = {}) {
  const wrap = el("section", `section ${className}`.trim());
  const head = el("div", "section-head");
  head.append(el("h2", null, title));
  head.append(el("span", "count", items.length ? `${items.length} 間` : ""));
  wrap.append(head);
  if (!items.length) {
    wrap.append(el("p", "empty", emptyText));
    return wrap;
  }
  const list = el("div", "cards");
  for (const item of items) list.append(card(item, large));
  wrap.append(list);
  return wrap;
}

function render(items, today) {
  board.replaceChildren();
  const groups = group(items, today);

  board.append(
    section(groups.featuredTitle, groups.featured, {
      large: true,
      className: "today",
      emptyText: "今日未有新推薦。",
    }),
    section("今個星期", groups.week, {
      emptyText: "今個星期未有其他推薦。",
    })
  );

  const archive = el("details", "section archive");
  const summary = el("summary", null, "早前");
  archive.append(summary);
  if (!groups.earlier.length) {
    archive.append(el("p", "empty", "未有更早嘅紀錄。"));
  } else {
    const list = el("div", "cards");
    for (const item of groups.earlier) list.append(card(item, false));
    archive.append(list);
  }
  board.append(archive);
}

function addBlock(parent, label, text) {
  if (!text) return;
  const block = el("div", "block");
  block.append(el("h4", null, label));
  block.append(el("p", null, text));
  parent.append(block);
}

function openDetail(item) {
  detailKicker.textContent = `${formatShort(item.date)} · ${item.area || ""}`;
  detailBody.replaceChildren();

  detailBody.append(el("h3", null, item.name));
  detailBody.append(el("p", "address", item.address || ""));

  const facts = el("ul", "facts");
  for (const fact of [item.cuisine, item.priceBand, item.partySize].filter(Boolean)) {
    facts.append(el("li", null, fact));
  }
  detailBody.append(facts);

  const images = Array.isArray(item.images) ? item.images.map(safeUrl).filter(Boolean) : [];
  if (images.length) {
    const block = el("div", "block");
    block.append(el("h4", null, "食物相"));
    const photos = el("div", "photos");
    for (const src of images) {
      const img = document.createElement("img");
      img.src = src;
      img.alt = item.name;
      img.loading = "lazy";
      photos.append(img);
    }
    block.append(photos);
    detailBody.append(block);
  } else {
    addBlock(detailBody, "食物相", "暫時未有食物相。");
  }

  addBlock(detailBody, "點解推薦", item.why);
  addBlock(detailBody, "氣氛", item.vibe);
  addBlock(detailBody, "幾時去", item.whenToGo);
  addBlock(detailBody, "點叫", item.howToOrder);
  addBlock(detailBody, "營業時間", item.hours);
  addBlock(detailBody, "特價", item.specials);

  if (Array.isArray(item.dishes) && item.dishes.length) {
    const block = el("div", "block");
    block.append(el("h4", null, "可以點"));
    const list = el("ul", "dishes");
    for (const dish of item.dishes) list.append(el("li", null, dish));
    block.append(list);
    detailBody.append(block);
  } else {
    addBlock(detailBody, "可以點", "菜單未有記錄，問店員當日推薦。");
  }

  const actions = el("div", "actions");
  const maps = safeUrl(item.mapsUrl);
  if (maps) {
    const link = el("a", null, "Google 地圖");
    link.href = maps;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    actions.append(link);
  }
  const source = safeUrl(item.sourceUrl);
  if (source) {
    const link = el("a", "secondary", "來源");
    link.href = source;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    actions.append(link);
  }
  if (actions.childElementCount) detailBody.append(actions);

  if (!dialog.open) dialog.showModal();
}

function showError(message) {
  board.replaceChildren();
  const status = el("p", "status error", message);
  board.append(status);
}

closeButton.addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

board.addEventListener("click", (event) => {
  const button = event.target.closest(".card");
  if (!button) return;
  const item = board._items?.find((entry) => entry.id === button.dataset.id);
  if (item) openDetail(item);
});

async function main() {
  const today = melbourneToday();
  todayLine.textContent = `墨爾本今日 · ${formatLong(today)}`;
  try {
    const response = await fetch(DATA_URL, { cache: "no-cache" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const items = Array.isArray(data) ? data : data.recommendations;
    if (!Array.isArray(items)) throw new Error("data.json 缺少 recommendations");
    const valid = items
      .filter((item) => item && item.id && item.name && item.date)
      .map((item, order) => ({ ...item, order }));
    board._items = valid;
    render(valid, today);
  } catch (error) {
    showError("載入唔到 data.json。檢查檔案係咪喺同一層，然後重新整理。");
    console.error(error);
  }
}

main();
