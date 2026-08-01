const $ = (s) => document.querySelector(s);
let allNews = [];
let currentSymbol = "BIST:XU100";

const defaultFavorites = [
  { symbol: "BIST:THYAO", name: "THYAO" },
  { symbol: "BIST:ASELS", name: "ASELS" },
  { symbol: "BIST:TUPRS", name: "TUPRS" },
  { symbol: "BIST:EREGL", name: "EREGL" },
  { symbol: "BIST:AKBNK", name: "AKBNK" }
];

function normalizeSymbol(value) {
  let code = (value || "").trim().toUpperCase().replace(/\s+/g, "");
  if (!code) return "";
  if (!code.includes(":")) code = `BIST:${code}`;
  return code;
}

function symbolLabel(symbol) {
  return symbol.replace(/^BIST:/, "");
}

function getFavorites() {
  try {
    const stored = JSON.parse(localStorage.getItem("bistFavorites"));
    return Array.isArray(stored) ? stored : defaultFavorites;
  } catch {
    return defaultFavorites;
  }
}

function saveFavorites(items) {
  localStorage.setItem("bistFavorites", JSON.stringify(items));
}

function isFavorite(symbol) {
  return getFavorites().some(item => item.symbol === symbol);
}

function updateFavoriteButton() {
  const btn = $("#addFavoriteBtn");
  const active = isFavorite(currentSymbol);
  btn.classList.toggle("active", active);
  btn.textContent = active ? "★ Favorilerde" : "☆ Favoriye ekle";
}

function renderFavorites() {
  const list = $("#favoriteList");
  const items = getFavorites();

  if (!items.length) {
    list.innerHTML = '<div class="favorite-empty">Henüz favori hisse eklenmedi.</div>';
    return;
  }

  list.innerHTML = items.map(item => `
    <div class="favorite-item">
      <button class="favorite-open" type="button" data-symbol="${item.symbol}">
        <span class="favorite-symbol">
          <strong>${item.name || symbolLabel(item.symbol)}</strong>
          <small>${item.symbol}</small>
        </span>
        <span>Grafiği aç →</span>
      </button>
      <button class="favorite-remove" type="button" data-remove="${item.symbol}" aria-label="${item.symbol} favorilerden çıkar">×</button>
    </div>
  `).join("");

  list.querySelectorAll("[data-symbol]").forEach(button => {
    button.addEventListener("click", () => openSymbol(button.dataset.symbol));
  });

  list.querySelectorAll("[data-remove]").forEach(button => {
    button.addEventListener("click", () => {
      const symbol = button.dataset.remove;
      saveFavorites(getFavorites().filter(item => item.symbol !== symbol));
      renderFavorites();
      updateFavoriteButton();
    });
  });
}

function renderChart(symbol = "BIST:XU100") {
  const box = $("#chartContainer");
  box.innerHTML = "";
  const widget = document.createElement("div");
  widget.className = "tradingview-widget-container";
  widget.style.height = "100%";
  widget.innerHTML = '<div class="tradingview-widget-container__widget" style="height:100%"></div>';

  const script = document.createElement("script");
  script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
  script.async = true;
  script.text = JSON.stringify({
    autosize: true,
    symbol,
    interval: "D",
    timezone: "Europe/Istanbul",
    theme: document.body.classList.contains("light") ? "light" : "dark",
    style: "1",
    locale: "tr",
    allow_symbol_change: true,
    calendar: false,
    support_host: "https://www.tradingview.com"
  });

  widget.appendChild(script);
  box.appendChild(widget);
}

function openSymbol(symbol) {
  currentSymbol = normalizeSymbol(symbol);
  if (!currentSymbol) return;

  $("#chartTitle").textContent = symbolLabel(currentSymbol);
  $("#symbolSearchInput").value = symbolLabel(currentSymbol);
  renderChart(currentSymbol);
  updateFavoriteButton();

  const matchingOption = [...$("#symbolSelect").options].find(o => o.value === currentSymbol);
  $("#symbolSelect").value = matchingOption ? currentSymbol : "BIST:XU100";
}

function marketStatus() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone:"Europe/Istanbul", weekday:"short", hour:"2-digit", minute:"2-digit", hour12:false
  }).formatToParts(now);
  const get = t => parts.find(p=>p.type===t)?.value;
  const day = get("weekday"), minutes = Number(get("hour"))*60 + Number(get("minute"));
  const open = !["Sat","Sun"].includes(day) && minutes >= 600 && minutes < 1080;
  const el = $("#marketStatus");
  el.textContent = open ? "● Borsa İstanbul açık" : "○ Borsa İstanbul kapalı";
  el.classList.toggle("open", open);
}

function escapeHtml(value="") {
  return value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

function formatDate(date) {
  try { return new Intl.DateTimeFormat("tr-TR",{dateStyle:"medium",timeStyle:"short"}).format(new Date(date)); }
  catch { return date || ""; }
}

function renderNews() {
  const q = $("#searchInput").value.toLocaleLowerCase("tr");
  const sentiment = $("#sentimentFilter").value;
  const items = allNews.filter(n => {
    const hay = `${n.title} ${n.summary} ${(n.tags||[]).join(" ")}`.toLocaleLowerCase("tr");
    return (!q || hay.includes(q)) && (sentiment === "all" || n.sentiment === sentiment);
  });
  $("#newsList").innerHTML = items.length ? items.map(n => `
    <a class="news-item" href="${escapeHtml(n.link)}" target="_blank" rel="noopener">
      <div class="news-meta">
        <span class="badge ${n.sentiment}">${n.sentimentLabel}</span>
        <span>${escapeHtml(n.source)}</span><span>•</span><span>${formatDate(n.published)}</span>
      </div>
      <h3>${escapeHtml(n.title)}</h3>
      <p>${escapeHtml(n.summary || "Haberi kaynağında okumak için dokunun.")}</p>
      <div class="tags">${(n.tags||[]).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>
    </a>`).join("") : '<div class="empty">Aramanızla eşleşen haber bulunamadı.</div>';
}

async function loadNews() {
  try {
    const res = await fetch(`data/news.json?v=${Date.now()}`);
    if (!res.ok) throw new Error("Haber dosyası alınamadı");
    const payload = await res.json();
    allNews = payload.items || [];
    $("#newsCount").textContent = allNews.length;
    $("#lastUpdate").textContent = new Intl.DateTimeFormat("tr-TR",{hour:"2-digit",minute:"2-digit"}).format(new Date(payload.updatedAt));
    renderNews();
  } catch (err) {
    $("#newsList").innerHTML = '<div class="empty">Haber akışı şu anda yüklenemedi. GitHub Actions çalıştıktan sonra yeniden deneyin.</div>';
  }
}

$("#symbolSelect").addEventListener("change", e => openSymbol(e.target.value));

$("#symbolSearchForm").addEventListener("submit", e => {
  e.preventDefault();
  const symbol = normalizeSymbol($("#symbolSearchInput").value);
  if (!symbol) return;
  openSymbol(symbol);
});

$("#addFavoriteBtn").addEventListener("click", () => {
  const items = getFavorites();
  if (isFavorite(currentSymbol)) {
    saveFavorites(items.filter(item => item.symbol !== currentSymbol));
  } else {
    items.unshift({ symbol: currentSymbol, name: symbolLabel(currentSymbol) });
    saveFavorites(items.slice(0, 30));
  }
  renderFavorites();
  updateFavoriteButton();
});

$("#resetFavoritesBtn").addEventListener("click", () => {
  saveFavorites(defaultFavorites);
  renderFavorites();
  updateFavoriteButton();
});

$("#searchInput").addEventListener("input", renderNews);
$("#sentimentFilter").addEventListener("change", renderNews);

$("#themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("light");
  localStorage.setItem("theme", document.body.classList.contains("light") ? "light" : "dark");
  renderChart(currentSymbol);
});

if (localStorage.getItem("theme") === "light") document.body.classList.add("light");

$("#year").textContent = new Date().getFullYear();
marketStatus();
setInterval(marketStatus, 60000);
renderFavorites();
openSymbol(currentSymbol);
loadNews();
