const API = {
  okx: {
    name: "OKX",
    tickers(marketType) {
      return `https://www.okx.com/api/v5/market/tickers?instType=${marketType === "perp" ? "SWAP" : "SPOT"}`;
    },
    candles(symbol, interval) {
      const okxInterval = { "1H": "1H", "4H": "4H", "1D": "1D" }[interval] || interval;
      return `https://www.okx.com/api/v5/market/candles?instId=${symbol.raw}&bar=${okxInterval}&limit=120`;
    },
  },
  binance: {
    name: "Binance",
    tickers(marketType) {
      return marketType === "perp"
        ? "https://fapi.binance.com/fapi/v1/ticker/24hr"
        : "https://api.binance.com/api/v3/ticker/24hr";
    },
    candles(symbol, interval, marketType) {
      const binanceInterval = { "1H": "1h", "4H": "4h", "1D": "1d" }[interval] || interval;
      const host = marketType === "perp" ? "https://fapi.binance.com/fapi/v1" : "https://api.binance.com/api/v3";
      return `${host}/klines?symbol=${symbol.raw}&interval=${binanceInterval}&limit=220`;
    },
    fundingRates: "https://fapi.binance.com/fapi/v1/premiumIndex",
    spotTrades(symbol) {
      return `https://api.binance.com/api/v3/trades?symbol=${symbol}&limit=500`;
    },
    marketTrades(symbol, marketType) {
      const host = marketType === "perp" ? "https://fapi.binance.com/fapi/v1" : "https://api.binance.com/api/v3";
      return `${host}/trades?symbol=${symbol}&limit=500`;
    },
    openInterestHistory(symbol) {
      return `https://fapi.binance.com/futures/data/openInterestHist?symbol=${symbol}&period=5m&limit=12`;
    },
    coinGeckoMarkets(page) {
      return `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=${page}&sparkline=false`;
    },
  },
};

const MARKET_LABELS = {
  spot: "现货",
  perp: "USDT 永续",
};

const SAMPLE_TICKERS = [
  ["BTCUSDT", 65380, 2.4, 4210000000, 66810, 63220, 155000],
  ["ETHUSDT", 3220, 3.7, 1890000000, 3335, 3098, 128000],
  ["SOLUSDT", 148.2, 8.9, 620000000, 153.8, 134.1, 88000],
  ["LABUSDT", 0.771, 20.77, 203500000, 0.785, 0.605, 44000],
  ["DOGEUSDT", 0.168, 6.2, 315000000, 0.172, 0.154, 73000],
  ["LINKUSDT", 15.42, 4.6, 196000000, 15.9, 14.4, 38000],
  ["ENAUSDT", 0.91, 12.4, 287000000, 0.94, 0.77, 51000],
  ["ARBUSDT", 1.18, -2.9, 128000000, 1.24, 1.11, 25000],
  ["TIAUSDT", 10.7, 7.4, 174000000, 11.1, 9.8, 33000],
  ["AVAXUSDT", 39.4, 5.8, 244000000, 40.6, 36.1, 48000],
  ["WIFUSDT", 2.83, 16.1, 252000000, 2.96, 2.39, 61000],
  ["PEPEUSDT", 0.0000089, 10.7, 308000000, 0.0000092, 0.0000076, 79000],
];

const STABLE_BASES = new Set([
  "USDT",
  "USDC",
  "FDUSD",
  "TUSD",
  "DAI",
  "BUSD",
  "USDP",
  "EUR",
  "TRY",
  "BRL",
]);

const PANEL_DEFAULT_ORDER = ["selected", "queue", "trend", "fundflow", "controls", "analysis", "position", "table"];
const PANEL_DEFAULT_SPANS = {
  selected: 3,
  queue: 3,
  trend: 3,
  fundflow: 3,
  controls: 12,
  analysis: 12,
  position: 6,
  table: 6,
};
const LAYOUT_VERSION = "grid-workspace-v4";

const state = {
  provider: localStorage.getItem("coinScreener.provider") || "binance",
  marketType: localStorage.getItem("coinScreener.marketType") || "spot",
  interval: localStorage.getItem("coinScreener.interval") || "15m",
  refreshMs: Number(localStorage.getItem("coinScreener.refreshMs")) || 60000,
  tickers: [],
  filtered: [],
  selected: null,
  candles: [],
  sortKey: "pumpRadarScore",
  sortDir: "desc",
  positions: loadPositions(),
  timer: null,
  countTimer: null,
  nextAt: 0,
  usingSample: false,
  chart: {
    start: 0,
    end: 0,
    dragging: false,
    dragX: 0,
    dragStart: 0,
    dragEnd: 0,
  },
};

const els = {};

document.addEventListener("DOMContentLoaded", () => {
  bindElements();
  bindEvents();
  bindPanelControls();
  hydrateControls();
  loadMarket();
  startCountdown();
});

function bindElements() {
  [
    "lastRefresh",
    "nextRefresh",
    "feedStatus",
    "candidateCount",
    "marketTrend",
    "providerSelect",
    "refreshButton",
    "defenseTitle",
    "defenseText",
    "trendOrb",
    "strategyTitle",
    "strategyText",
    "riskPressure",
    "riskMeter",
    "riskHint",
    "selectedSymbol",
    "selectedTag",
    "selectedReason",
    "selectedChips",
    "selectedMetrics",
    "symbolJumpForm",
    "customSymbolInput",
    "customSymbolHint",
    "searchInput",
    "volumeFilter",
    "changeFilter",
    "riskFilter",
    "riskFilterLabel",
    "refreshInterval",
    "universeCount",
    "queueTime",
    "opportunityQueue",
    "trendSummary",
    "trendBoard",
    "fundFlowSummary",
    "fundFlowBoard",
    "analysisTitle",
    "marketSelect",
    "intervalSelect",
    "analysisTag",
    "priceChart",
    "structureBadge",
    "structureMetrics",
    "heatBadge",
    "heatMetrics",
    "executionText",
    "entryTrigger",
    "protectTrigger",
    "profitTrigger",
    "positionHint",
    "positionForm",
    "positionSymbolInput",
    "positionSideInput",
    "positionEntryInput",
    "positionSummary",
    "positionBoard",
    "tableSummary",
    "coinTable",
  ].forEach((id) => {
    els[id] = document.getElementById(id);
  });
}

function bindEvents() {
  els.refreshButton.addEventListener("click", loadMarket);
  els.providerSelect.addEventListener("change", () => {
    state.provider = els.providerSelect.value;
    localStorage.setItem("coinScreener.provider", state.provider);
    loadMarket();
  });
  els.marketSelect.addEventListener("change", () => {
    state.marketType = els.marketSelect.value;
    localStorage.setItem("coinScreener.marketType", state.marketType);
    els.customSymbolHint.textContent = `按 Binance ${marketLabel()} 标的查询。`;
    loadMarket();
  });
  els.intervalSelect.addEventListener("change", () => {
    state.interval = els.intervalSelect.value;
    localStorage.setItem("coinScreener.interval", state.interval);
    loadCandlesForSelected();
  });
  els.refreshInterval.addEventListener("change", () => {
    state.refreshMs = Number(els.refreshInterval.value);
    localStorage.setItem("coinScreener.refreshMs", String(state.refreshMs));
    scheduleRefresh();
  });
  els.symbolJumpForm.addEventListener("submit", (event) => {
    event.preventDefault();
    jumpToCustomSymbol();
  });
  els.positionForm.addEventListener("submit", addPosition);
  ["searchInput", "volumeFilter", "changeFilter", "riskFilter"].forEach((id) => {
    els[id].addEventListener("input", applyFilters);
  });
  document.querySelectorAll("th[data-sort]").forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.dataset.sort;
      if (state.sortKey === key) {
        state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
      } else {
        state.sortKey = key;
        state.sortDir = key === "symbol" ? "asc" : "desc";
      }
      renderTable();
    });
  });
  window.addEventListener("resize", () => renderChart(state.candles, state.selected));
  bindChartEvents();
}

function bindPanelControls() {
  migrateLayoutStorage();
  const grid = normalizeLayoutGrid();
  restorePanelLayout(grid);

  grid.querySelectorAll(":scope > .panel").forEach((panel) => {
    const id = getPanelId(panel);
    panel.dataset.panelId = id;
    const savedHeight = localStorage.getItem(`coinScreener.panelHeight.${id}`);
    if (savedHeight) {
      panel.style.height = savedHeight;
      panel.classList.add("user-sized");
    }
    const savedSpan = Number(localStorage.getItem(`coinScreener.panelSpan.${id}`));
    if (Number.isFinite(savedSpan) && savedSpan > 0) {
      setPanelSpan(panel, savedSpan);
      panel.classList.add("user-sized");
    } else {
      setPanelSpan(panel, PANEL_DEFAULT_SPANS[id] || 3);
    }

    const handle = panel.querySelector(".panel-head, .analysis-head");
    if (handle) {
      handle.draggable = true;
      handle.title = "拖拽调整位置";
      handle.addEventListener("dragstart", (event) => {
        panel.classList.add("dragging");
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", id);
      });
      handle.addEventListener("dragend", () => {
        panel.classList.remove("dragging");
        document.querySelectorAll(".layout-drop-target").forEach((item) => item.classList.remove("layout-drop-target"));
        fitPanelToContainer(panel);
        savePanelOrders();
      });
    }

    const grip = document.createElement("div");
    grip.className = "panel-resize-grip";
    grip.title = "上下拖拽调整高度";
    panel.appendChild(grip);
    grip.addEventListener("pointerdown", (event) => startPanelResize(event, panel, id, "height"));

    const cornerGrip = document.createElement("div");
    cornerGrip.className = "panel-corner-resize-grip";
    cornerGrip.title = "拖拽角落调整宽高";
    panel.appendChild(cornerGrip);
    cornerGrip.addEventListener("pointerdown", (event) => startPanelResize(event, panel, id, "both"));
  });

  grid.addEventListener("dragover", (event) => {
    const dragging = document.querySelector(".panel.dragging");
    if (!dragging) return;
    event.preventDefault();
    grid.classList.add("layout-drop-target");
    const before = getPanelInsertBefore(grid, event.clientX, event.clientY);
    if (before) grid.insertBefore(dragging, before);
    else grid.appendChild(dragging);
    fitPanelToContainer(dragging);
  });
  grid.addEventListener("dragleave", (event) => {
    if (!grid.contains(event.relatedTarget)) grid.classList.remove("layout-drop-target");
  });
  grid.addEventListener("drop", () => {
    grid.classList.remove("layout-drop-target");
    savePanelOrders();
  });
}

function migrateLayoutStorage() {
  if (localStorage.getItem("coinScreener.layoutVersion") === LAYOUT_VERSION) return;
  localStorage.removeItem("coinScreener.panelOrder.top");
  localStorage.removeItem("coinScreener.panelOrder.main");
  localStorage.removeItem("coinScreener.panelOrder.grid");
  PANEL_DEFAULT_ORDER.forEach((id) => {
    localStorage.removeItem(`coinScreener.panelSpan.${id}`);
    localStorage.removeItem(`coinScreener.panelHeight.${id}`);
  });
  localStorage.setItem("coinScreener.layoutVersion", LAYOUT_VERSION);
}

function normalizeLayoutGrid() {
  const grid = document.querySelector(".workspace");
  const panels = [...document.querySelectorAll(".workspace > .panel, .left-column > .panel, .main-column > .panel")];
  panels.forEach((panel) => grid.appendChild(panel));
  document.querySelectorAll(".left-column, .main-column").forEach((shell) => shell.remove());
  return grid;
}

function getPanelId(panel) {
  const known = ["selected", "controls", "queue", "trend", "fundflow", "analysis", "position", "table"];
  const found = known.find((name) => panel.classList.contains(`${name}-panel`));
  return found || panel.querySelector("h2")?.textContent?.trim() || "panel";
}

function getPanelInsertBefore(container, x, y) {
  return [...container.querySelectorAll(":scope > .panel:not(.dragging)")].find((child) => {
    const rect = child.getBoundingClientRect();
    const inRow = y >= rect.top && y <= rect.bottom;
    if (inRow) return x < rect.left + rect.width / 2;
    return y < rect.top + rect.height / 2;
  });
}

function getLayoutColumnCount(container) {
  if (!container) return 1;
  const count = Number(getComputedStyle(container).getPropertyValue("--layout-columns"));
  return Number.isFinite(count) && count > 0 ? count : 1;
}

function getPanelSpan(panel) {
  const match = String(panel.style.gridColumn || "").match(/span\s+(\d+)/);
  if (match) return Number(match[1]);
  return PANEL_DEFAULT_SPANS[getPanelId(panel)] || 3;
}

function setPanelSpan(panel, span) {
  const max = getLayoutColumnCount(panel.parentElement);
  const next = clamp(Math.round(span), 1, max);
  panel.style.gridColumn = `span ${next}`;
}

function fitPanelToContainer(panel) {
  setPanelSpan(panel, getPanelSpan(panel));
}

function savePanelOrders() {
  const grid = document.querySelector(".workspace");
  const order = [...grid.querySelectorAll(":scope > .panel")].map((panel) => panel.dataset.panelId);
  localStorage.setItem("coinScreener.panelOrder.grid", JSON.stringify(order));
}

function restorePanelLayout(grid) {
  const panels = [...grid.querySelectorAll(":scope > .panel")];
  const restoredIds = new Set();
  let order = PANEL_DEFAULT_ORDER;
  const raw = localStorage.getItem("coinScreener.panelOrder.grid");

  if (raw) {
    try {
      order = JSON.parse(raw);
    } catch (error) {
      localStorage.removeItem("coinScreener.panelOrder.grid");
    }
  }

  order.forEach((id) => {
    const panel = panels.find((item) => getPanelId(item) === id);
    if (panel) {
      grid.appendChild(panel);
      restoredIds.add(id);
    }
  });

  panels
    .filter((panel) => !restoredIds.has(getPanelId(panel)))
    .forEach((panel) => grid.appendChild(panel));
}

function startPanelResize(event, panel, id, mode = "height") {
  event.preventDefault();
  event.stopPropagation();
  event.currentTarget.setPointerCapture?.(event.pointerId);
  const container = panel.parentElement;
  const columnCount = getLayoutColumnCount(container);
  const startY = event.clientY;
  const startX = event.clientX;
  const startHeight = panel.offsetHeight;
  const startWidth = panel.offsetWidth;
  panel.classList.add("resizing", "user-sized");

  const move = (moveEvent) => {
    if (mode === "height" || mode === "both") {
      const nextHeight = clamp(startHeight + moveEvent.clientY - startY, 150, window.innerHeight * 1.5);
      panel.style.height = `${Math.round(nextHeight)}px`;
    }
    if (mode === "both" && container) {
      const gap = Number.parseFloat(getComputedStyle(container).gap) || 0;
      const columnWidth = Math.max(1, (container.clientWidth - gap * (columnCount - 1)) / columnCount);
      const nextWidth = clamp(startWidth + moveEvent.clientX - startX, columnWidth, container.clientWidth);
      const nextSpan = clamp(Math.round((nextWidth + gap) / (columnWidth + gap)), 1, columnCount);
      setPanelSpan(panel, nextSpan);
    }
    if (panel.classList.contains("analysis-panel")) renderChart(state.candles, state.selected);
  };
  const stop = () => {
    panel.classList.remove("resizing");
    localStorage.setItem(`coinScreener.panelHeight.${id}`, panel.style.height);
    localStorage.setItem(`coinScreener.panelSpan.${id}`, String(getPanelSpan(panel)));
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", stop);
  };

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", stop, { once: true });
}

function hydrateControls() {
  els.providerSelect.value = state.provider;
  els.marketSelect.value = state.marketType;
  els.intervalSelect.value = state.interval;
  els.refreshInterval.value = String(state.refreshMs);
  els.riskFilterLabel.textContent = els.riskFilter.value;
  els.customSymbolHint.textContent = `按 Binance ${marketLabel()} 标的查询。`;
}

async function loadMarket() {
  setFeedStatus("连接中");
  try {
    const raw = await fetchWithTimeout(API[state.provider].tickers(state.marketType));
    const tickers = await raw.json();
    state.usingSample = false;
    state.tickers = normalizeTickers(tickers, state.provider, state.marketType);
  } catch (error) {
    state.usingSample = true;
    state.tickers = normalizeSampleTickers();
    setFeedStatus("样例数据");
  }

  enrichTickers();
  await enrichMarketSignals();
  applyFilters();
  updateMarketHeader();
  await loadCandlesForSelected();
  scheduleRefresh();
}

async function loadCandlesForSelected() {
  if (!state.selected) {
    state.candles = [];
    renderAnalysis(null, []);
    return;
  }

  try {
    if (state.usingSample) {
      state.candles = generateSampleCandles(state.selected);
    } else {
      const response = await fetchWithTimeout(API[state.provider].candles(state.selected, state.interval, state.marketType));
      const json = await response.json();
      state.candles = normalizeCandles(json, state.provider).sort((a, b) => a.time - b.time);
    }
    resetChartView();
    renderAnalysis(state.selected, state.candles);
    setFeedStatus(state.usingSample ? "样例数据" : "在线");
  } catch (error) {
    state.candles = generateSampleCandles(state.selected);
    resetChartView();
    renderAnalysis(state.selected, state.candles);
    setFeedStatus("K线样例");
  }
}

function fetchWithTimeout(url, timeout = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { signal: controller.signal }).then((response) => {
    clearTimeout(timer);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response;
  });
}

function normalizeTickers(payload, provider, marketType) {
  const rows = provider === "okx" ? payload.data || [] : payload || [];
  return rows
    .map((item) => (provider === "okx" ? normalizeOkxTicker(item, marketType) : normalizeBinanceTicker(item, marketType)))
    .filter(Boolean)
    .filter((item) => item.quote === "USDT" && !isExcludedSymbol(item.base));
}

function normalizeOkxTicker(item, marketType) {
  const raw = String(item.instId || "");
  const expectedSuffix = marketType === "perp" ? "-USDT-SWAP" : "-USDT";
  if (!raw.endsWith(expectedSuffix)) return null;
  const last = Number(item.last);
  const open = Number(item.open24h);
  if (!Number.isFinite(last) || !Number.isFinite(open) || last <= 0 || open <= 0) return null;
  const base = raw.replace(expectedSuffix, "");
  return {
    raw,
    symbol: `${base}USDT`,
    base,
    quote: "USDT",
    price: last,
    change: ((last - open) / open) * 100,
    quoteVolume: Number(item.volCcy24h || item.vol24h || 0),
    high: Number(item.high24h || last),
    low: Number(item.low24h || last),
    trades: Number(item.vol24h || 0),
    source: marketSourceLabel("okx", marketType),
  };
}

function normalizeBinanceTicker(item, marketType) {
  const raw = String(item.symbol || "");
  if (!raw.endsWith("USDT")) return null;
  const base = raw.replace("USDT", "");
  return {
    raw,
    symbol: raw,
    base,
    quote: "USDT",
    price: Number(item.lastPrice),
    change: Number(item.priceChangePercent),
    quoteVolume: Number(item.quoteVolume),
    high: Number(item.highPrice),
    low: Number(item.lowPrice),
    trades: Number(item.count || 0),
    source: marketSourceLabel("binance", marketType),
  };
}

function normalizeSampleTickers() {
  return SAMPLE_TICKERS.map(([symbol, price, change, quoteVolume, high, low, trades]) => ({
    raw: getRawSymbolForProvider(symbol, state.provider, state.marketType),
    symbol,
    base: symbol.replace("USDT", ""),
    quote: "USDT",
    price,
    change,
    quoteVolume,
    high,
    low,
    trades,
    source: marketSourceLabel(state.provider, state.marketType),
  }));
}

function getRawSymbolForProvider(symbol, provider, marketType) {
  if (provider !== "okx") return symbol;
  const okxBase = symbol.replace("USDT", "-USDT");
  return marketType === "perp" ? `${okxBase}-SWAP` : okxBase;
}

function normalizeCandles(payload, provider) {
  const rows = provider === "okx" ? payload.data || [] : payload || [];
  return rows
    .map((row) => {
      if (provider === "okx") {
        return {
          time: Number(row[0]),
          open: Number(row[1]),
          high: Number(row[2]),
          low: Number(row[3]),
          close: Number(row[4]),
          volume: Number(row[7] || row[6] || row[5] || 0),
        };
      }
      return {
        time: Number(row[0]),
        open: Number(row[1]),
        high: Number(row[2]),
        low: Number(row[3]),
        close: Number(row[4]),
        volume: Number(row[7] || row[5] || 0),
      };
    })
    .filter((item) => [item.time, item.open, item.high, item.low, item.close].every(Number.isFinite));
}

function isExcludedSymbol(base) {
  return (
    STABLE_BASES.has(base) ||
    /(?:UP|DOWN|BULL|BEAR|2L|2S|3L|3S|4L|4S|5L|5S)$/.test(base)
  );
}

function enrichTickers() {
  const volumeRank = makeRanker(state.tickers.map((item) => item.quoteVolume));
  const tradeRank = makeRanker(state.tickers.map((item) => item.trades));
  const absChangeRank = makeRanker(state.tickers.map((item) => Math.abs(item.change)));
  const rangeRank = makeRanker(state.tickers.map((item) => getRangePct(item)));

  state.tickers = state.tickers
    .map((item) => {
      const rangePct = getRangePct(item);
      const volumeScore = volumeRank(item.quoteVolume);
      const tradeScore = tradeRank(item.trades);
      const heatScore = absChangeRank(Math.abs(item.change));
      const rangeScore = rangeRank(rangePct);
      const directionBonus = clamp((item.change + 4) / 16, 0, 1) * 100;
      const pullbackBonus = item.change > -4 && item.change < 3 && rangePct > 5 ? 10 : 0;
      const risk = clamp(rangePct * 2.4 + Math.max(0, Math.abs(item.change) - 10) * 1.8 + (volumeScore < 25 ? 18 : 0), 8, 98);
      const score = clamp(
        volumeScore * 0.26 + tradeScore * 0.14 + heatScore * 0.2 + rangeScore * 0.15 + directionBonus * 0.2 + pullbackBonus - risk * 0.08,
        0,
        99
      );
      return {
        ...item,
        rangePct,
        score,
        baseScore: score,
        risk,
        fundingRate: null,
        fundingScore: 0,
        change1h: null,
        change1hScore: 0,
        volumeSurge: null,
        breakoutScore: 0,
        spotBuyPressure: null,
        spotBuyScore: 0,
        activeBuySellDiff: null,
        activeBuySellScore: 0,
        openInterestChange: null,
        openInterestScore: 0,
        largeSpotBuyNotional: 0,
        largeSpotBuyCount: 0,
        circulatingSupply: null,
        totalSupply: null,
        circulatingRatio: null,
        marketCap: null,
        fdv: null,
        pumpRadarScore: 0,
        pumpRadarLabel: "常规",
        status: getCoinStatus(item.change, rangePct, score, risk),
      };
    })
    .sort((a, b) => b.score - a.score);
}

async function enrichMarketSignals() {
  if (state.usingSample) {
    applySampleSignals();
    return;
  }

  setFeedStatus("增强信号");
  await Promise.allSettled([
    enrichFundingRates(),
    enrichOneHourChanges(),
    enrichTradePressureSignals(),
    enrichOpenInterestSignals(),
    enrichTokenMetrics(),
  ]);
  applySignalScores();
}

function applySampleSignals() {
  state.tickers = state.tickers
    .map((item, index) => ({
      ...item,
      fundingRate: state.marketType === "perp" ? (index % 5 - 2) * 0.00004 : null,
      fundingScore: state.marketType === "perp" ? 2 : 0,
      change1h: -2 + ((index * 1.7) % 8),
      change1hScore: Math.max(-2, 5 - index * 0.2),
      volumeSurge: 1.1 + ((index * 0.37) % 4),
      breakoutScore: index % 3 === 0 ? 10 : 3,
      spotBuyPressure: 48 + ((index * 7) % 28),
      spotBuyScore: Math.max(0, 8 - index * 0.35),
      activeBuySellDiff: -8 + ((index * 5) % 26),
      activeBuySellScore: Math.max(-3, 6 - index * 0.3),
      openInterestChange: state.marketType === "perp" ? -2 + ((index * 3) % 10) : null,
      openInterestScore: state.marketType === "perp" ? Math.max(0, 5 - index * 0.2) : 0,
      largeSpotBuyNotional: item.quoteVolume * (0.0008 + index * 0.00005),
      largeSpotBuyCount: Math.max(0, 8 - index),
      circulatingSupply: 100_000_000 + index * 40_000_000,
      totalSupply: 160_000_000 + index * 55_000_000,
      circulatingRatio: ((100_000_000 + index * 40_000_000) / (160_000_000 + index * 55_000_000)) * 100,
      marketCap: item.price * (100_000_000 + index * 40_000_000),
      fdv: item.price * (160_000_000 + index * 55_000_000),
    }));
  applySignalScores();
}

async function enrichFundingRates() {
  if (state.provider !== "binance" || state.marketType !== "perp") return;
  const response = await fetchWithTimeout(API.binance.fundingRates, 9000);
  const payload = await response.json();
  const fundingBySymbol = new Map(
    (Array.isArray(payload) ? payload : [payload]).map((item) => [String(item.symbol), Number(item.lastFundingRate)])
  );

  state.tickers = state.tickers.map((item) => ({
    ...item,
    fundingRate: Number.isFinite(fundingBySymbol.get(item.symbol)) ? fundingBySymbol.get(item.symbol) : null,
  }));
}

async function enrichOneHourChanges() {
  const candidates = state.tickers.slice(0, 48);
  const results = await mapWithConcurrency(candidates, 8, async (item) => {
    const response = await fetchWithTimeout(API[state.provider].candles(item, "15m", state.marketType), 7000);
    const payload = await response.json();
    const candles = normalizeCandles(payload, state.provider).sort((a, b) => a.time - b.time);
    if (candles.length < 5) return [item.symbol, { change1h: null, change1hScore: 0 }];
    const start = candles.at(-5).close;
    const end = candles.at(-1).close;
    const change1h = start > 0 ? ((end - start) / start) * 100 : null;
    const recentVolume = average(candles.slice(-4).map((candle) => candle.volume));
    const baselineVolume = average(candles.slice(-28, -4).map((candle) => candle.volume));
    const volumeSurge = baselineVolume > 0 ? recentVolume / baselineVolume : null;
    const previousHigh = Math.max(...candles.slice(-36, -4).map((candle) => candle.high));
    const breakoutScore = Number.isFinite(previousHigh)
      ? end >= previousHigh * 1.001
        ? 12
        : end >= previousHigh * 0.985
          ? 5
          : 0
      : 0;
    return [item.symbol, {
      change1h,
      change1hScore: Number.isFinite(change1h) ? clamp(change1h * 1.1, -8, 12) : 0,
      volumeSurge,
      breakoutScore,
    }];
  });
  const bySymbol = new Map();
  results.forEach((result) => {
    if (result) bySymbol.set(result[0], result[1]);
  });
  state.tickers = state.tickers.map((item) => ({ ...item, ...(bySymbol.get(item.symbol) || {}) }));
}

async function enrichTradePressureSignals() {
  if (state.provider !== "binance") return;
  const candidates = state.tickers.slice(0, 28);
  const results = await mapWithConcurrency(candidates, 6, async (item) => {
      const [spotResponse, marketResponse] = await Promise.allSettled([
        fetchWithTimeout(API.binance.spotTrades(item.symbol), 7000),
        fetchWithTimeout(API.binance.marketTrades(item.symbol, state.marketType), 7000),
      ]);
      const spotTrades = spotResponse.status === "fulfilled" ? await spotResponse.value.json() : [];
      const marketTrades = marketResponse.status === "fulfilled" ? await marketResponse.value.json() : spotTrades;
      return [item.symbol, {
        ...calculateSpotBuySignal(spotTrades),
        ...calculateActiveBuySellSignal(marketTrades),
      }];
  });
  const bySymbol = new Map();
  results.forEach((result) => {
    if (result) bySymbol.set(result[0], result[1]);
  });
  state.tickers = state.tickers.map((item) => ({ ...item, ...(bySymbol.get(item.symbol) || {}) }));
}

async function enrichOpenInterestSignals() {
  if (state.provider !== "binance" || state.marketType !== "perp") return;
  const candidates = state.tickers.slice(0, 32);
  const results = await mapWithConcurrency(candidates, 6, async (item) => {
      const response = await fetchWithTimeout(API.binance.openInterestHistory(item.symbol), 7000);
      const history = await response.json();
      return [item.symbol, calculateOpenInterestSignal(history)];
  });
  const bySymbol = new Map();
  results.forEach((result) => {
    if (result) bySymbol.set(result[0], result[1]);
  });
  state.tickers = state.tickers.map((item) => ({ ...item, ...(bySymbol.get(item.symbol) || {}) }));
}

async function mapWithConcurrency(items, limit, worker) {
  const results = [];
  let index = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const currentIndex = index;
      index += 1;
      try {
        results[currentIndex] = await worker(items[currentIndex], currentIndex);
      } catch (error) {
        results[currentIndex] = null;
      }
    }
  });
  await Promise.all(runners);
  return results.filter(Boolean);
}

async function enrichTokenMetrics() {
  const pages = [1, 2, 3, 4];
  const results = await Promise.allSettled(
    pages.map(async (page) => {
      const response = await fetchWithTimeout(API.binance.coinGeckoMarkets(page), 9000);
      return response.json();
    })
  );
  const rows = results.flatMap((result) => (result.status === "fulfilled" && Array.isArray(result.value) ? result.value : []));
  const metricsBySymbol = new Map();
  rows.forEach((coin) => {
    const key = String(coin.symbol || "").toUpperCase();
    if (!key || metricsBySymbol.has(key)) return;
    metricsBySymbol.set(key, {
      circulatingSupply: Number(coin.circulating_supply),
      totalSupply: Number(coin.total_supply),
      circulatingRatio: calculateCirculatingRatio(Number(coin.circulating_supply), Number(coin.total_supply)),
      marketCap: Number(coin.market_cap),
      fdv: Number(coin.fully_diluted_valuation),
    });
  });
  state.tickers = state.tickers.map((item) => ({ ...item, ...(metricsBySymbol.get(item.base) || {}) }));
}

function calculateSpotBuySignal(trades) {
  if (!Array.isArray(trades) || !trades.length) {
    return {
      spotBuyPressure: null,
      spotBuyScore: 0,
      largeSpotBuyNotional: 0,
      largeSpotBuyCount: 0,
    };
  }

  const parsed = trades
    .map((trade) => ({
      notional: Number(trade.price) * Number(trade.qty),
      isAggressiveBuy: trade.isBuyerMaker === false,
    }))
    .filter((trade) => Number.isFinite(trade.notional) && trade.notional > 0);
  const totalNotional = parsed.reduce((sum, trade) => sum + trade.notional, 0);
  const buyNotional = parsed
    .filter((trade) => trade.isAggressiveBuy)
    .reduce((sum, trade) => sum + trade.notional, 0);
  const averageNotional = totalNotional / Math.max(1, parsed.length);
  const largeThreshold = Math.max(averageNotional * 6, totalNotional * 0.012);
  const largeBuys = parsed.filter((trade) => trade.isAggressiveBuy && trade.notional >= largeThreshold);
  const largeSpotBuyNotional = largeBuys.reduce((sum, trade) => sum + trade.notional, 0);
  const spotBuyPressure = totalNotional ? (buyNotional / totalNotional) * 100 : null;
  const largeBuyShare = totalNotional ? (largeSpotBuyNotional / totalNotional) * 100 : 0;
  const spotBuyScore = Number.isFinite(spotBuyPressure)
    ? clamp((spotBuyPressure - 52) * 0.45 + largeBuyShare * 0.5 + largeBuys.length * 0.2, -8, 18)
    : 0;

  return {
    spotBuyPressure,
    spotBuyScore,
    largeSpotBuyNotional,
    largeSpotBuyCount: largeBuys.length,
  };
}

function calculateActiveBuySellSignal(trades) {
  if (!Array.isArray(trades) || !trades.length) {
    return {
      activeBuySellDiff: null,
      activeBuySellScore: 0,
    };
  }

  const parsed = trades
    .map((trade) => ({
      notional: Number(trade.price) * Number(trade.qty),
      isAggressiveBuy: trade.isBuyerMaker === false,
    }))
    .filter((trade) => Number.isFinite(trade.notional) && trade.notional > 0);
  const totalNotional = parsed.reduce((sum, trade) => sum + trade.notional, 0);
  const buyNotional = parsed.filter((trade) => trade.isAggressiveBuy).reduce((sum, trade) => sum + trade.notional, 0);
  const sellNotional = Math.max(0, totalNotional - buyNotional);
  const activeBuySellDiff = totalNotional ? ((buyNotional - sellNotional) / totalNotional) * 100 : null;
  const activeBuySellScore = Number.isFinite(activeBuySellDiff) ? clamp(activeBuySellDiff * 0.18, -10, 12) : 0;

  return {
    activeBuySellDiff,
    activeBuySellScore,
  };
}

function calculateOpenInterestSignal(history) {
  if (!Array.isArray(history) || history.length < 2) {
    return {
      openInterestChange: null,
      openInterestScore: 0,
    };
  }

  const first = Number(history[0].sumOpenInterestValue || history[0].sumOpenInterest);
  const last = Number(history.at(-1).sumOpenInterestValue || history.at(-1).sumOpenInterest);
  const openInterestChange = first > 0 ? ((last - first) / first) * 100 : null;
  const openInterestScore = Number.isFinite(openInterestChange)
    ? clamp(openInterestChange * 0.75, -10, 12)
    : 0;

  return {
    openInterestChange,
    openInterestScore,
  };
}

function applySignalScores() {
  state.tickers = state.tickers
    .map((item) => {
      const fundingScore = getFundingScore(item.fundingRate);
      const fundingRisk = getFundingRisk(item.fundingRate);
      const change1hScore = Number.isFinite(item.change1hScore) ? item.change1hScore : 0;
      const spotBuyScore = Number.isFinite(item.spotBuyScore) ? item.spotBuyScore : 0;
      const activeBuySellScore = Number.isFinite(item.activeBuySellScore) ? item.activeBuySellScore : 0;
      const openInterestScore = Number.isFinite(item.openInterestScore) ? item.openInterestScore : 0;
      const crowdingRisk = openInterestScore > 8 && Math.abs(item.change) > 8 ? 5 : 0;
      const risk = clamp(item.risk + fundingRisk + crowdingRisk + (spotBuyScore < -3 || activeBuySellScore < -4 ? 4 : 0), 8, 98);
      const pumpRadarScore = calculatePumpRadarScore({ ...item, risk });
      const score = clamp(
        item.baseScore + change1hScore + fundingScore + spotBuyScore + activeBuySellScore + openInterestScore + pumpRadarScore * 0.12 - fundingRisk * 0.35 - crowdingRisk * 0.4,
        0,
        99
      );
      const pumpRadarLabel = getPumpRadarLabel(pumpRadarScore);
      return {
        ...item,
        fundingScore,
        change1hScore,
        activeBuySellScore,
        openInterestScore,
        pumpRadarScore,
        pumpRadarLabel,
        risk,
        score,
        status: pumpRadarScore >= 80 ? "拉盘异动" : getCoinStatus(item.change, item.rangePct, score, risk),
      };
    })
    .sort((a, b) => b.pumpRadarScore - a.pumpRadarScore || b.score - a.score);
}

function calculatePumpRadarScore(item) {
  const change1h = Number.isFinite(item.change1h) ? item.change1h : 0;
  const volumeSurge = Number.isFinite(item.volumeSurge) ? item.volumeSurge : 1;
  const activeDiff = Number.isFinite(item.activeBuySellDiff) ? item.activeBuySellDiff : 0;
  const spotBuy = Number.isFinite(item.spotBuyPressure) ? item.spotBuyPressure : 50;
  const oiChange = Number.isFinite(item.openInterestChange) ? item.openInterestChange : 0;
  const fundingPct = Number.isFinite(item.fundingRate) ? item.fundingRate * 100 : 0.01;
  const fdvRatio = Number.isFinite(item.fdv) && Number.isFinite(item.marketCap) && item.marketCap > 0 ? item.fdv / item.marketCap : null;

  const priceKick = clamp(change1h * 5, -10, 22);
  const volumeKick = clamp((volumeSurge - 1) * 12, 0, 20);
  const activeKick = clamp(activeDiff * 0.34, -12, 18);
  const spotKick = clamp((spotBuy - 50) * 0.36, -8, 16);
  const largeBuyKick = clamp((item.largeSpotBuyCount || 0) * 1.15 + Math.max(0, Math.log10((item.largeSpotBuyNotional || 0) + 1) - 3), 0, 12);
  const oiKick = getPumpOpenInterestScore(change1h, oiChange);
  const fundingKick = getPumpFundingScore(fundingPct, change1h);
  const breakoutKick = Number.isFinite(item.breakoutScore) ? item.breakoutScore : 0;
  const floatKick = getPumpFloatScore(item.marketCap, fdvRatio);
  const riskPenalty = item.risk > 76 ? (item.risk - 76) * 0.45 : 0;

  return clamp(
    36 + priceKick + volumeKick + activeKick + spotKick + largeBuyKick + oiKick + fundingKick + breakoutKick + floatKick - riskPenalty,
    0,
    99
  );
}

function getPumpOpenInterestScore(change1h, oiChange) {
  if (!Number.isFinite(oiChange)) return 0;
  if (change1h > 0.5 && oiChange > 0) return clamp(oiChange * 1.6, 0, 14);
  if (change1h > 0.5 && oiChange < -2) return clamp(oiChange * 1.6, -10, 0);
  if (Math.abs(change1h) < 0.8 && oiChange > 4) return clamp(oiChange, 0, 8);
  return clamp(oiChange * 0.45, -5, 6);
}

function getPumpFundingScore(fundingPct, change1h) {
  if (!Number.isFinite(fundingPct)) return 0;
  if (change1h > 0 && fundingPct < 0) return clamp(Math.abs(fundingPct) * 900, 3, 10);
  if (fundingPct > 0.06) return -clamp((fundingPct - 0.06) * 220, 4, 18);
  if (fundingPct >= 0 && fundingPct <= 0.02) return 5;
  return 0;
}

function getPumpFloatScore(marketCap, fdvRatio) {
  let score = 0;
  if (Number.isFinite(marketCap)) {
    if (marketCap < 100_000_000) score += 8;
    else if (marketCap < 500_000_000) score += 5;
    else if (marketCap < 1_500_000_000) score += 2;
  }
  if (Number.isFinite(fdvRatio) && fdvRatio > 5) score -= 8;
  else if (Number.isFinite(fdvRatio) && fdvRatio > 3) score -= 4;
  return score;
}

function calculateCirculatingRatio(circulatingSupply, totalSupply) {
  if (!Number.isFinite(circulatingSupply) || !Number.isFinite(totalSupply) || totalSupply <= 0) {
    return null;
  }
  return (circulatingSupply / totalSupply) * 100;
}

function getPumpRadarLabel(score) {
  if (score >= 82) return "疑似拉盘";
  if (score >= 68) return "异动启动";
  if (score >= 54) return "蓄势观察";
  return "常规";
}

function getFundingScore(fundingRate) {
  if (!Number.isFinite(fundingRate)) return 0;
  const pct = fundingRate * 100;
  if (pct < -0.03) return clamp(Math.abs(pct) * 90, 2, 8);
  if (pct > 0.08) return -8;
  if (Math.abs(pct) <= 0.03) return 3;
  return 0;
}

function getFundingRisk(fundingRate) {
  if (!Number.isFinite(fundingRate)) return 0;
  const pct = Math.abs(fundingRate * 100);
  return pct > 0.05 ? clamp((pct - 0.05) * 220, 0, 18) : 0;
}

function makeRanker(values) {
  const clean = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (clean.length < 2) return () => 50;
  return (value) => {
    const index = clean.findIndex((item) => item >= value);
    const safeIndex = index === -1 ? clean.length - 1 : index;
    return clamp((safeIndex / (clean.length - 1)) * 100, 0, 100);
  };
}

function applyFilters() {
  els.riskFilterLabel.textContent = els.riskFilter.value;
  const search = els.searchInput.value.trim().toUpperCase();
  const minVolume = Number(els.volumeFilter.value);
  const changeMode = els.changeFilter.value;
  const riskMax = Number(els.riskFilter.value);

  state.filtered = state.tickers.filter((item) => {
    if (search && !item.symbol.includes(search)) return false;
    if (item.quoteVolume < minVolume) return false;
    if (item.risk > riskMax) return false;
    if (changeMode === "positive" && item.change <= 0) return false;
    if (changeMode === "hot" && item.change < 5) return false;
    if (changeMode === "pullback" && !(item.change > -6 && item.change < 3 && item.rangePct > 4)) return false;
    return true;
  });

  if (!state.selected || !state.filtered.some((item) => item.symbol === state.selected.symbol)) {
    state.selected = state.filtered[0] || state.tickers[0] || null;
  } else {
    state.selected = state.filtered.find((item) => item.symbol === state.selected.symbol) || state.selected;
  }

  renderSelected();
  renderQueue();
  renderTrendBoard();
  renderFundFlowBoard();
  renderPositionBoard();
  renderTable();
  updateMarketHeader();
}

function updateMarketHeader() {
  const now = new Date();
  const positives = state.tickers.filter((item) => item.change > 0).length;
  const breadth = state.tickers.length ? (positives / state.tickers.length) * 100 : 0;
  const btc = state.tickers.find((item) => item.symbol === "BTCUSDT");
  const avgRisk = average(state.filtered.slice(0, 20).map((item) => item.risk)) || 0;
  const trend = breadth > 58 ? "趋势偏强" : breadth < 42 ? "趋势偏弱" : "震荡分化";
  const defenseMode = avgRisk > 72 || (btc && btc.change < -2);

  els.lastRefresh.textContent = formatTime(now);
  els.candidateCount.textContent = state.filtered.length;
  els.marketTrend.textContent = trend;
  els.universeCount.textContent = `${state.tickers.length} 个 ${marketLabel()} 标的`;
  els.queueTime.textContent = formatTime(now);
  els.riskPressure.textContent = `${Math.round(avgRisk || 0)}%`;
  els.riskMeter.style.width = `${Math.round(avgRisk || 0)}%`;
  els.riskHint.textContent = `上涨家数 ${Math.round(breadth)}% / BTC ${btc ? formatPct(btc.change) : "--"}`;
  els.trendOrb.textContent = defenseMode ? "防守" : trend.replace("趋势", "");
  els.defenseTitle.textContent = defenseMode ? "先防守，禁止乱开新仓" : "允许观察，等待结构触发";
  els.defenseText.textContent = defenseMode
    ? "高波动或权重币走弱时，优先减仓和平移保护位。"
    : "候选池有可用标的，但仍以突破确认和保护位为前置条件。";
  els.strategyTitle.textContent = defenseMode ? "账户防守 / 衰竭反手" : "轻仓试探 / 突破跟随";
  els.strategyText.textContent = defenseMode
    ? "先处理亏损和破位仓，禁止盲目抄底。"
    : "只做高流动性标的，突破失败立即回到观察。";
}

function renderSelected() {
  const item = state.selected;
  if (!item) {
    els.selectedSymbol.textContent = "--";
    els.selectedTag.textContent = "--";
    els.selectedReason.textContent = "没有符合筛选条件的币种。";
    els.selectedChips.innerHTML = "";
    els.selectedMetrics.innerHTML = "";
    return;
  }

  els.selectedSymbol.textContent = displaySymbol(item);
  els.selectedTag.textContent = item.status;
  els.selectedReason.textContent = getReason(item);
  els.selectedChips.innerHTML = [
    `24h ${formatPct(item.change)}`,
    `1h ${formatPct(item.change1h)}`,
    `持仓 ${formatOpenInterestChange(item.openInterestChange)}`,
    `主动买卖差 ${formatActiveDiff(item.activeBuySellDiff)}`,
    `波动 ${formatPct(item.rangePct)}`,
    `成交额 ${formatMoney(item.quoteVolume)}`,
    `现货买盘 ${formatSpotBuyPressure(item.spotBuyPressure)}`,
    `资金费率 ${formatFundingRate(item.fundingRate)}`,
    `拉盘雷达 ${formatNumber(item.pumpRadarScore, 1)}`,
    `执行分 ${formatNumber(item.score, 1)}`,
    item.source,
  ]
    .map((text) => `<span>${text}</span>`)
    .join("");
  els.selectedMetrics.innerHTML = [
    metric("现价", formatPrice(item.price)),
    metric("1h", formatPct(item.change1h)),
    metric("24h", formatPct(item.change)),
    metric("拉盘雷达", `${formatNumber(item.pumpRadarScore, 1)} / ${item.pumpRadarLabel}`),
    metric("量能突增", formatVolumeSurge(item.volumeSurge)),
    metric("持仓量变化", formatOpenInterestChange(item.openInterestChange)),
    metric("主动买卖差", formatActiveDiff(item.activeBuySellDiff)),
    metric("资金费率", formatFundingRate(item.fundingRate)),
    metric("流通市值", formatMoney(item.marketCap)),
  ].join("");
}

function renderQueue() {
  const top = state.filtered.slice(0, 10);
  if (!top.length) {
    els.opportunityQueue.innerHTML = `<div class="empty-state">当前筛选条件下没有候选。</div>`;
    return;
  }

  els.opportunityQueue.innerHTML = top
    .map(
      (item, index) => `
        <button class="queue-item ${state.selected?.symbol === item.symbol ? "active" : ""}" data-symbol="${item.symbol}" type="button">
          <span class="queue-rank">${index + 1}</span>
          <span class="queue-title">
            <strong>${displaySymbol(item)}</strong>
            <span>${item.pumpRadarLabel} / 雷达 ${formatNumber(item.pumpRadarScore, 0)} / 主动买卖差 ${formatActiveDiff(item.activeBuySellDiff)}</span>
          </span>
          <span class="score-badge">${formatNumber(item.pumpRadarScore, 0)}</span>
        </button>
      `
    )
    .join("");

  els.opportunityQueue.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => selectSymbol(button.dataset.symbol));
  });
}

function renderTrendBoard() {
  const rows = [...state.tickers]
    .map((item) => ({
      ...item,
      trendScore: getTrendScore(item),
    }))
    .sort((a, b) => b.trendScore - a.trendScore)
    .slice(0, 12);

  els.trendSummary.textContent = `${rows.length} 个`;
  if (!rows.length) {
    els.trendBoard.innerHTML = `<div class="empty-state">等待行情刷新</div>`;
    return;
  }

  els.trendBoard.innerHTML = rows
    .map(
      (item, index) => `
        <button class="trend-item ${state.selected?.symbol === item.symbol ? "active" : ""}" data-symbol="${item.symbol}" type="button">
          <span class="trend-rank">${index + 1}</span>
          <span class="trend-main">
            <strong>${displaySymbol(item)}</strong>
            <span>1h ${formatPct(item.change1h)} / 24h ${formatPct(item.change)} / 量 ${formatVolumeSurge(item.volumeSurge)}</span>
          </span>
          <span class="trend-score">${formatNumber(item.trendScore, 0)}</span>
        </button>
      `
    )
    .join("");

  els.trendBoard.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => selectSymbol(button.dataset.symbol));
  });
}

function renderFundFlowBoard() {
  const rows = [...state.tickers]
    .map((item) => ({
      ...item,
      fundFlowScore: getFundFlowScore(item),
      estimatedInflow1h: getEstimatedInflow1h(item),
    }))
    .filter((item) => item.estimatedInflow1h > 0 || item.fundFlowScore > 55)
    .sort((a, b) => b.fundFlowScore - a.fundFlowScore)
    .slice(0, 12);

  els.fundFlowSummary.textContent = rows.length ? `${rows.length} 个 / 估算` : "--";
  if (!rows.length) {
    els.fundFlowBoard.innerHTML = `<div class="empty-state">等待资金异动</div>`;
    return;
  }

  els.fundFlowBoard.innerHTML = rows
    .map(
      (item, index) => `
        <button class="fundflow-item ${state.selected?.symbol === item.symbol ? "active" : ""}" data-symbol="${item.symbol}" type="button">
          <span class="fundflow-rank">${index + 1}</span>
          <span class="fundflow-main">
            <strong>${displaySymbol(item)}</strong>
            <span>1h ${formatPct(item.change1h)} / 主动买卖差 ${formatActiveDiff(item.activeBuySellDiff)}</span>
          </span>
          <span class="fundflow-value">
            <strong>${formatMoney(item.estimatedInflow1h)}</strong>
            <em>${formatNumber(item.fundFlowScore, 0)}</em>
          </span>
        </button>
      `
    )
    .join("");

  els.fundFlowBoard.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => selectSymbol(button.dataset.symbol));
  });
}

function renderTable() {
  const rows = [...state.filtered].sort(sortRows);
  els.tableSummary.textContent = `${rows.length} 个候选 / 按 ${state.sortKey} ${state.sortDir === "asc" ? "升序" : "降序"}`;
  if (!rows.length) {
    els.coinTable.innerHTML = `<tr><td colspan="16" class="empty-state">没有符合条件的结果</td></tr>`;
    return;
  }

  els.coinTable.innerHTML = rows
    .map(
      (item, index) => `
        <tr class="${state.selected?.symbol === item.symbol ? "active" : ""}" data-symbol="${item.symbol}">
          <td>${index + 1}</td>
          <td>${displaySymbol(item)}</td>
          <td>${formatPrice(item.price)}</td>
          <td class="${getSignedClass(item.change1h)}">${formatPct(item.change1h)}</td>
          <td class="${item.change >= 0 ? "positive" : "negative"}">${formatPct(item.change)}</td>
          <td>${formatMoney(item.quoteVolume)}</td>
          <td class="${getSignedClass(item.openInterestChange)}">${formatOpenInterestChange(item.openInterestChange)}</td>
          <td class="${getSignedClass(item.activeBuySellDiff)}">${formatActiveDiff(item.activeBuySellDiff)}</td>
          <td class="${getSpotBuyClass(item.spotBuyPressure)}">${formatSpotBuyPressure(item.spotBuyPressure)}</td>
          <td class="${getFundingClass(item.fundingRate)}">${formatFundingRate(item.fundingRate)}</td>
          <td>${formatNumber(item.pumpRadarScore, 1)}</td>
          <td>${formatNumber(item.score, 1)}</td>
          <td>${formatMoney(item.marketCap)}</td>
          <td>${formatMoney(item.fdv)}</td>
          <td>${formatPct(item.circulatingRatio)}</td>
          <td>${item.status}</td>
        </tr>
      `
    )
    .join("");

  els.coinTable.querySelectorAll("tr[data-symbol]").forEach((row) => {
    row.addEventListener("click", () => selectSymbol(row.dataset.symbol));
  });
}

function sortRows(a, b) {
  const key = state.sortKey;
  const dir = state.sortDir === "asc" ? 1 : -1;
  if (key === "rank") return 0;
  if (key === "symbol") return a.symbol.localeCompare(b.symbol) * dir;
  return ((a[key] || 0) - (b[key] || 0)) * dir;
}

function getTrendScore(item) {
  const change1h = Number.isFinite(item.change1h) ? item.change1h : 0;
  const change24h = Number.isFinite(item.change) ? item.change : 0;
  const volumeSurge = Number.isFinite(item.volumeSurge) ? item.volumeSurge : 1;
  const activeDiff = Number.isFinite(item.activeBuySellDiff) ? item.activeBuySellDiff : 0;
  return clamp(
    45 + change1h * 7 + change24h * 1.2 + Math.max(0, volumeSurge - 1) * 10 + activeDiff * 0.18,
    0,
    99
  );
}

function getFundFlowScore(item) {
  const change1h = Number.isFinite(item.change1h) ? item.change1h : 0;
  const activeDiff = Number.isFinite(item.activeBuySellDiff) ? item.activeBuySellDiff : 0;
  const spotBuy = Number.isFinite(item.spotBuyPressure) ? item.spotBuyPressure : 50;
  const volumeSurge = Number.isFinite(item.volumeSurge) ? item.volumeSurge : 1;
  const oneHourTurnover = getEstimatedOneHourTurnover(item);
  const liquidityKick = oneHourTurnover > 0 ? clamp(Math.log10(oneHourTurnover) * 5 - 22, 0, 18) : 0;
  return clamp(
    35 + change1h * 8 + activeDiff * 0.36 + (spotBuy - 50) * 0.9 + Math.max(0, volumeSurge - 1) * 9 + liquidityKick,
    0,
    99
  );
}

function getEstimatedOneHourTurnover(item) {
  const volumeSurge = Number.isFinite(item.volumeSurge) ? clamp(item.volumeSurge, 0.35, 5) : 1;
  return Math.max(0, (item.quoteVolume || 0) / 24) * volumeSurge;
}

function getEstimatedInflow1h(item) {
  const activeDiff = Number.isFinite(item.activeBuySellDiff) ? item.activeBuySellDiff : 0;
  const spotBuy = Number.isFinite(item.spotBuyPressure) ? item.spotBuyPressure : 50;
  const change1h = Number.isFinite(item.change1h) ? item.change1h : 0;
  const turnover = getEstimatedOneHourTurnover(item);
  const buyBias = clamp(0.5 + activeDiff / 220 + (spotBuy - 50) / 170 + Math.max(0, change1h) / 120, 0.05, 0.95);
  return Math.max(0, turnover * (buyBias - 0.5) * 2);
}

function selectSymbol(symbol) {
  const found = state.tickers.find((item) => item.symbol === symbol);
  if (!found) return;
  state.selected = found;
  els.customSymbolHint.textContent = `正在查看 ${displaySymbol(found)}，不受候选池筛选限制。`;
  els.customSymbolInput.value = displaySymbol(found);
  renderSelected();
  renderQueue();
  renderTrendBoard();
  renderFundFlowBoard();
  renderPositionBoard();
  renderTable();
  loadCandlesForSelected();
}

function jumpToCustomSymbol() {
  const symbol = normalizeCustomSymbol(els.customSymbolInput.value);
  if (!symbol) {
    els.customSymbolHint.textContent = "请输入币种，例如 BTC、ETHUSDT、SOL-USDT。";
    return;
  }

  const found = state.tickers.find((item) => item.symbol === symbol);
  if (!found) {
    els.customSymbolHint.textContent = `没有找到 ${symbol} 的 Binance ${marketLabel()} 行情。`;
    return;
  }

  selectSymbol(found.symbol);
  els.customSymbolHint.textContent = `已切换到 ${displaySymbol(found)}，下方 K 线和结构分析已更新。`;
}

function normalizeCustomSymbol(raw) {
  const text = raw.trim().toUpperCase().replace(/[\s_/-]/g, "");
  if (!text) return "";
  return text.endsWith("USDT") ? text : `${text}USDT`;
}

function loadPositions() {
  try {
    const saved = JSON.parse(localStorage.getItem("coinScreener.positions") || "[]");
    return Array.isArray(saved) ? saved.filter((item) => item?.symbol && item?.side && Number.isFinite(item.entryPrice)) : [];
  } catch (error) {
    localStorage.removeItem("coinScreener.positions");
    return [];
  }
}

function savePositions() {
  localStorage.setItem("coinScreener.positions", JSON.stringify(state.positions));
}

function addPosition(event) {
  event.preventDefault();
  const symbol = normalizeCustomSymbol(els.positionSymbolInput.value);
  const side = els.positionSideInput.value === "short" ? "short" : "long";
  const item = state.tickers.find((row) => row.symbol === symbol);
  const typedEntry = Number(els.positionEntryInput.value);
  const entryPrice = Number.isFinite(typedEntry) && typedEntry > 0 ? typedEntry : item?.price;

  if (!symbol) {
    els.positionSummary.textContent = "请输入币种";
    return;
  }
  if (!item) {
    els.positionSummary.textContent = `未找到 ${displaySymbol(symbol)}`;
    return;
  }
  if (!Number.isFinite(entryPrice) || entryPrice <= 0) {
    els.positionSummary.textContent = "开仓价无效";
    return;
  }

  const existing = state.positions.find((position) => position.symbol === symbol && position.side === side);
  if (existing) {
    existing.entryPrice = entryPrice;
    existing.updatedAt = Date.now();
  } else {
    state.positions.unshift({
      id: `${symbol}-${side}-${Date.now()}`,
      symbol,
      side,
      entryPrice,
      createdAt: Date.now(),
    });
  }

  savePositions();
  els.positionSymbolInput.value = "";
  els.positionEntryInput.value = "";
  renderPositionBoard();
}

function removePosition(id) {
  state.positions = state.positions.filter((position) => position.id !== id);
  savePositions();
  renderPositionBoard();
}

function renderPositionBoard() {
  if (!els.positionBoard) return;
  const matched = state.positions
    .map((position) => ({
      position,
      item: state.tickers.find((row) => row.symbol === position.symbol),
    }))
    .filter((row) => row.item);

  els.positionSummary.textContent = state.positions.length ? `${matched.length}/${state.positions.length} 个在线` : "未添加";
  if (!state.positions.length) {
    els.positionBoard.innerHTML = `<div class="empty-state">添加已开仓币种后，这里会实时跟踪浮盈亏和离场压力。</div>`;
    return;
  }

  els.positionBoard.innerHTML = state.positions
    .map((position) => {
      const item = state.tickers.find((row) => row.symbol === position.symbol);
      if (!item) {
        return `
          <article class="position-item stale">
            <div class="position-main">
              <strong>${displaySymbol(position.symbol)}</strong>
              <span>${position.side === "long" ? "做多" : "做空"} / 开仓 ${formatPrice(position.entryPrice)}</span>
            </div>
            <div class="position-offline">当前市场没有该标的行情</div>
            <button class="ghost-button" type="button" data-remove-position="${position.id}">移除</button>
          </article>
        `;
      }

      const signal = calculateExitSignal(position, item);
      return `
        <article class="position-item ${signal.className}">
          <button class="position-main position-symbol-button" type="button" data-position-symbol="${item.symbol}">
            <strong>${displaySymbol(item)}</strong>
            <span>${position.side === "long" ? "做多" : "做空"} / 开仓 ${formatPrice(position.entryPrice)}</span>
          </button>
          <div class="position-stat">
            <span>现价</span>
            <strong>${formatPrice(item.price)}</strong>
          </div>
          <div class="position-stat">
            <span>浮盈亏</span>
            <strong class="${getSignedClass(signal.pnlPct)}">${formatPct(signal.pnlPct)}</strong>
          </div>
          <div class="position-stat">
            <span>1h / 24h</span>
            <strong>${formatPct(item.change1h)} / ${formatPct(item.change)}</strong>
          </div>
          <div class="position-signal">
            <span>离场压力</span>
            <strong>${formatNumber(signal.score, 0)}</strong>
            <em>${signal.label}</em>
          </div>
          <button class="ghost-button" type="button" data-remove-position="${position.id}">移除</button>
          <div class="position-tags">
            ${signal.reasons.map((reason) => `<span class="${reason.className}">${reason.text}</span>`).join("")}
          </div>
        </article>
      `;
    })
    .join("");

  els.positionBoard.querySelectorAll("[data-remove-position]").forEach((button) => {
    button.addEventListener("click", () => removePosition(button.dataset.removePosition));
  });
  els.positionBoard.querySelectorAll("[data-position-symbol]").forEach((button) => {
    button.addEventListener("click", () => selectSymbol(button.dataset.positionSymbol));
  });
}

function calculateExitSignal(position, item) {
  const side = position.side === "short" ? -1 : 1;
  const pnlPct = ((item.price - position.entryPrice) / position.entryPrice) * 100 * side;
  const oneHourPressure = -side * (Number.isFinite(item.change1h) ? item.change1h : 0);
  const activePressure = -side * (Number.isFinite(item.activeBuySellDiff) ? item.activeBuySellDiff : 0);
  const fundingPct = Number.isFinite(item.fundingRate) ? item.fundingRate * 100 : 0;
  const fundingPressure = side * fundingPct;
  const spotBuy = Number.isFinite(item.spotBuyPressure) ? item.spotBuyPressure : 50;
  const spotPressure = position.side === "short" ? spotBuy - 52 : 50 - spotBuy;
  const oiChange = Number.isFinite(item.openInterestChange) ? item.openInterestChange : 0;
  const volumeSurge = Number.isFinite(item.volumeSurge) ? item.volumeSurge : 1;
  const pumpRadar = Number.isFinite(item.pumpRadarScore) ? item.pumpRadarScore : 50;
  const reasons = [];
  let score = 18;

  const addReason = (condition, weight, text, className = "neutral") => {
    if (!condition) return;
    score += weight;
    reasons.push({ text, className });
  };

  addReason(oneHourPressure > 0.4, clamp(oneHourPressure * 6, 4, 18), `1h 逆向 ${formatPct(item.change1h)}`, "negative");
  addReason(activePressure > 1, clamp(activePressure * 0.55, 4, 18), `主动买卖差转弱 ${formatActiveDiff(item.activeBuySellDiff)}`, "negative");
  addReason(spotPressure > 3, clamp(spotPressure * 0.8, 3, 14), `现货买盘转弱 ${formatSpotBuyPressure(item.spotBuyPressure)}`, "negative");
  addReason(pnlPct > 4 && volumeSurge < 0.85, 9, `量能降温 ${formatVolumeSurge(item.volumeSurge)}`, "neutral");
  addReason(pnlPct > 3 && pumpRadar < 45, 10, `拉盘雷达回落 ${formatNumber(pumpRadar, 0)}`, "neutral");
  addReason(pnlPct > 6 && item.risk > 70, clamp((item.risk - 65) * 0.6, 4, 14), `风险升高 ${formatNumber(item.risk, 0)}%`, "negative");
  addReason(fundingPressure > 0.035, clamp(fundingPressure * 180, 4, 18), `资金拥挤 ${formatFundingRate(item.fundingRate)}`, "negative");
  addReason(pnlPct > 2 && side * item.change > 3 && oiChange < -1.5, 10, `上涨减仓 ${formatOpenInterestChange(oiChange)}`, "negative");
  addReason(pnlPct < -3 && oneHourPressure > 0, 14, `亏损且短线走弱 ${formatPct(pnlPct)}`, "negative");

  if (!reasons.length) {
    reasons.push({ text: "暂未触发离场信号", className: "positive" });
    score = Math.max(8, score - 8);
  }

  score = clamp(score, 0, 99);
  const label = getExitSignalLabel(score, pnlPct);
  return {
    pnlPct,
    score,
    label,
    className: score >= 72 ? "danger" : score >= 52 ? "warning" : "healthy",
    reasons: reasons.slice(0, 6),
  };
}

function getExitSignalLabel(score, pnlPct) {
  if (score >= 78) return pnlPct >= 0 ? "止盈离场" : "风险离场";
  if (score >= 62) return "减仓保护";
  if (score >= 42) return "上移保护";
  return "继续持有";
}

function renderAnalysis(item, candles) {
  if (!item) {
    els.analysisTitle.textContent = "标的交易驾驶舱";
    renderChart([], null);
    return;
  }

  const detail = calculateDetail(item, candles);
  els.analysisTitle.textContent = `${displaySymbol(item)} / ${marketLabel()} / ${item.status} / 热度 ${formatNumber(item.score, 1)}`;
  els.analysisTag.textContent = item.status;
  els.structureBadge.textContent = detail.structure;
  els.heatBadge.textContent = detail.heatLabel;
  els.structureMetrics.innerHTML = [
    metric("现价", formatPrice(item.price)),
    metric("突破位", formatPrice(detail.breakout)),
    metric("保护位", formatPrice(detail.protect)),
    metric("止盈位", formatPrice(detail.takeProfit)),
    metric("RSI 14", formatNumber(detail.rsi, 1)),
    metric("ATR 波动", formatPct(detail.atrPct)),
    metric("结构判断", detail.structure),
    metric("建议动作", detail.action),
  ].join("");
  els.heatMetrics.innerHTML = [
    metric("热度分", formatNumber(item.score, 1)),
    metric("拉盘雷达", `${formatNumber(item.pumpRadarScore, 1)} / ${item.pumpRadarLabel}`),
    metric("趋势榜位置", `#${state.tickers.findIndex((row) => row.symbol === item.symbol) + 1}`),
    metric("24h 涨跌幅", formatPct(item.change)),
    metric("最近1h涨跌幅", formatPct(item.change1h)),
    metric("量能倍数", `${formatNumber(detail.volumeRatio, 2)}x`),
    metric("短线量能突增", formatVolumeSurge(item.volumeSurge)),
    metric("突破结构", formatBreakoutScore(item.breakoutScore)),
    metric("持仓量变化", formatOpenInterestChange(item.openInterestChange)),
    metric("主动买卖差", formatActiveDiff(item.activeBuySellDiff)),
    metric("现货买盘", formatSpotBuyPressure(item.spotBuyPressure)),
    metric("现货大单买入", formatLargeBuy(item)),
    metric("资金费率", formatFundingRate(item.fundingRate)),
    metric("代币总量", formatSupply(item.totalSupply)),
    metric("流通总量", formatSupply(item.circulatingSupply)),
    metric("流通占比", formatPct(item.circulatingRatio)),
    metric("流通市值", formatMoney(item.marketCap)),
    metric("FDV", formatMoney(item.fdv)),
    metric(`${item.source} 事件`, state.usingSample ? "样例确认" : "在线确认"),
  ].join("");
  els.executionText.textContent = detail.executionText;
  els.entryTrigger.textContent = formatPrice(detail.breakout);
  els.protectTrigger.textContent = formatPrice(detail.protect);
  els.profitTrigger.textContent = formatPrice(detail.takeProfit);
  els.positionHint.textContent = detail.positionHint;
  renderChart(candles, item, detail);
}

function bindChartEvents() {
  const canvas = els.priceChart;
  canvas.addEventListener(
    "wheel",
    (event) => {
      if (!state.candles.length) return;
      event.preventDefault();
      zoomChart(event.deltaY > 0 ? 1.22 : 0.82, event.clientX);
    },
    { passive: false }
  );
  canvas.addEventListener("pointerdown", (event) => {
    if (!state.candles.length) return;
    state.chart.dragging = true;
    state.chart.dragX = event.clientX;
    state.chart.dragStart = state.chart.start;
    state.chart.dragEnd = state.chart.end;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!state.chart.dragging) return;
    const rect = canvas.getBoundingClientRect();
    const visible = state.chart.dragEnd - state.chart.dragStart;
    const plotWidth = Math.max(1, rect.width - 80);
    const shift = Math.round(-((event.clientX - state.chart.dragX) / plotWidth) * visible);
    setChartWindow(state.chart.dragStart + shift, state.chart.dragEnd + shift);
    renderChart(state.candles, state.selected);
  });
  canvas.addEventListener("pointerup", (event) => {
    state.chart.dragging = false;
    canvas.releasePointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointercancel", () => {
    state.chart.dragging = false;
  });
}

function zoomChart(factor, clientX) {
  const length = state.candles.length;
  if (!length) return;
  const rect = els.priceChart.getBoundingClientRect();
  const ratio = clamp((clientX - rect.left) / Math.max(1, rect.width), 0, 1);
  const current = Math.max(1, state.chart.end - state.chart.start);
  const next = clamp(Math.round(current * factor), 24, length);
  const anchor = state.chart.start + current * ratio;
  const start = Math.round(anchor - next * ratio);
  setChartWindow(start, start + next);
  renderChart(state.candles, state.selected);
}

function resetChartView() {
  const length = state.candles.length;
  const visible = Math.min(length, state.interval === "1D" ? 120 : 90);
  state.chart.start = Math.max(0, length - visible);
  state.chart.end = length;
  state.chart.dragging = false;
}

function setChartWindow(start, end) {
  const length = state.candles.length;
  const size = clamp(end - start, Math.min(24, length), length || 1);
  let nextStart = Math.round(start);
  let nextEnd = Math.round(start + size);
  if (nextStart < 0) {
    nextStart = 0;
    nextEnd = size;
  }
  if (nextEnd > length) {
    nextEnd = length;
    nextStart = Math.max(0, length - size);
  }
  state.chart.start = nextStart;
  state.chart.end = nextEnd;
}

function calculateDetail(item, candles) {
  const closes = candles.map((candle) => candle.close);
  const highs = candles.map((candle) => candle.high);
  const lows = candles.map((candle) => candle.low);
  const volumes = candles.map((candle) => candle.volume);
  const atr = calculateAtr(candles, 14) || item.price * Math.max(item.rangePct / 100 / 8, 0.005);
  const atrPct = (atr / item.price) * 100;
  const rsi = calculateRsi(closes, 14) || 50;
  const ema20 = ema(closes, 20).at(-1) || item.price;
  const ema50 = ema(closes, 50).at(-1) || item.price;
  const recentHigh = Math.max(...highs.slice(-28), item.high);
  const recentLow = Math.min(...lows.slice(-28), item.low);
  const volumeRatio = (volumes.at(-1) || 0) / (average(volumes.slice(-24, -1)) || volumes.at(-1) || 1);
  const breakout = recentHigh * 1.002;
  const protect = Math.max(recentLow, item.price - atr * 1.6);
  const takeProfit = item.price + atr * (item.score > 70 ? 2.6 : 2.0);
  const trendUp = item.price > ema20 && ema20 >= ema50;
  const nearBreakout = Math.abs(recentHigh - item.price) / item.price < 0.018;
  const overheat = rsi > 74 || item.risk > 82;
  const structure = overheat ? "过热等待" : trendUp && nearBreakout ? "贴近突破" : trendUp ? "趋势跟随" : "回撤观察";
  const action = overheat ? "轻仓或等待" : trendUp && nearBreakout ? "突破确认" : trendUp ? "分批观察" : "等重新站上均线";
  const heatLabel = item.score > 74 ? "高热" : item.score > 58 ? "常规" : "低热";
  const positionHint = item.risk > 78 ? "轻仓待命" : item.score > 72 ? "小仓试探" : "观察";
  const executionText = overheat
    ? "价格过热时不追高，先等回踩或量能二次确认。"
    : "趋势结构成立后，只在突破位附近触发，保护位失守退出观察。";

  return {
    atrPct,
    breakout,
    protect,
    takeProfit,
    rsi,
    volumeRatio,
    structure,
    action,
    heatLabel,
    positionHint,
    executionText,
    ema20Series: ema(closes, 20),
  };
}

function renderChart(candles, item, detail = null) {
  const canvas = els.priceChart;
  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(600, Math.floor(rect.width * dpr));
  canvas.height = Math.max(260, Math.floor(rect.height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const width = rect.width;
  const height = rect.height;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#0a1019";
  ctx.fillRect(0, 0, width, height);

  if (!candles.length) {
    ctx.fillStyle = "#93a1b2";
    ctx.font = "16px sans-serif";
    ctx.fillText("等待 K 线数据", 24, 44);
    return;
  }

  if (state.chart.end <= state.chart.start || state.chart.end > candles.length) {
    resetChartView();
  }

  const visibleCandles = candles.slice(state.chart.start, state.chart.end);
  const pad = { top: 18, right: 64, bottom: 34, left: 16 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const highs = visibleCandles.map((candle) => candle.high);
  const lows = visibleCandles.map((candle) => candle.low);
  const max = Math.max(...highs);
  const min = Math.min(...lows);
  const range = max - min || max * 0.01;
  const xStep = plotW / visibleCandles.length;
  const y = (price) => pad.top + (max - price) / range * plotH;

  ctx.strokeStyle = "rgba(139, 163, 186, 0.12)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i += 1) {
    const gy = pad.top + (plotH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, gy);
    ctx.lineTo(width - pad.right + 10, gy);
    ctx.stroke();
  }

  visibleCandles.forEach((candle, index) => {
    const x = pad.left + index * xStep + xStep / 2;
    const up = candle.close >= candle.open;
    ctx.strokeStyle = up ? "#7df0a4" : "#ff7a88";
    ctx.fillStyle = up ? "rgba(125, 240, 164, 0.8)" : "rgba(255, 122, 136, 0.78)";
    ctx.beginPath();
    ctx.moveTo(x, y(candle.high));
    ctx.lineTo(x, y(candle.low));
    ctx.stroke();
    const bodyY = Math.min(y(candle.open), y(candle.close));
    const bodyH = Math.max(2, Math.abs(y(candle.open) - y(candle.close)));
    ctx.fillRect(x - Math.max(2, xStep * 0.28), bodyY, Math.max(4, xStep * 0.56), bodyH);
  });

  const emaSeries = ema(candles.map((candle) => candle.close), 20).slice(state.chart.start, state.chart.end);
  ctx.strokeStyle = "#ffd166";
  ctx.lineWidth = 2;
  ctx.beginPath();
  emaSeries.forEach((value, index) => {
    if (!Number.isFinite(value)) return;
    const x = pad.left + index * xStep + xStep / 2;
    const yy = y(value);
    if (index === 0) ctx.moveTo(x, yy);
    else ctx.lineTo(x, yy);
  });
  ctx.stroke();

  if (detail) {
    drawPriceLine(ctx, y(detail.breakout), width, pad, "#65e6d1", `突破 ${formatPrice(detail.breakout)}`);
    drawPriceLine(ctx, y(detail.protect), width, pad, "#ff7a88", `保护 ${formatPrice(detail.protect)}`);
  }

  ctx.fillStyle = "#93a1b2";
  ctx.font = "12px sans-serif";
  ctx.fillText(item ? `${displaySymbol(item)} ${marketLabel()} ${state.interval}` : "", pad.left, height - 12);
  ctx.textAlign = "right";
  ctx.fillText(`${state.chart.start + 1}-${state.chart.end} / ${candles.length}`, width - pad.right, height - 12);
  ctx.textAlign = "left";
}

function drawPriceLine(ctx, yy, width, pad, color, label) {
  ctx.strokeStyle = color;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(pad.left, yy);
  ctx.lineTo(width - pad.right + 8, yy);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = color;
  ctx.font = "12px sans-serif";
  ctx.fillText(label, width - pad.right + 12, yy + 4);
}

function scheduleRefresh() {
  clearTimeout(state.timer);
  state.nextAt = Date.now() + state.refreshMs;
  state.timer = setTimeout(loadMarket, state.refreshMs);
}

function startCountdown() {
  clearInterval(state.countTimer);
  state.countTimer = setInterval(() => {
    const seconds = Math.max(0, Math.ceil((state.nextAt - Date.now()) / 1000));
    els.nextRefresh.textContent = state.nextAt ? `${seconds} 秒` : "--";
  }, 500);
}

function setFeedStatus(text) {
  els.feedStatus.textContent = text;
}

function getCoinStatus(change, rangePct, score, risk) {
  if (risk > 82) return "过热";
  if (score > 72 && change > 3) return "待突破";
  if (score > 62 && change >= 0) return "强趋势";
  if (change < 0 && rangePct > 4) return "回撤";
  return "常规";
}

function getReason(item) {
  if (item.status === "待突破") return "当前队列排名靠前，价格强势且成交额足够，适合等待盘口突破确认。";
  if (item.status === "过热") return "热度较高但波动风险同步上升，优先等回踩或量能二次确认。";
  if (item.status === "回撤") return "价格处于回撤观察区，只有重新站回短周期结构才进入候选。";
  return "流动性与波动处于可观察区间，等待结构给出更明确方向。";
}

function getRangePct(item) {
  return item.price ? ((item.high - item.low) / item.price) * 100 : 0;
}

function calculateAtr(candles, period) {
  if (candles.length < period + 1) return null;
  const trs = [];
  for (let i = 1; i < candles.length; i += 1) {
    const current = candles[i];
    const prevClose = candles[i - 1].close;
    trs.push(Math.max(current.high - current.low, Math.abs(current.high - prevClose), Math.abs(current.low - prevClose)));
  }
  return average(trs.slice(-period));
}

function calculateRsi(values, period) {
  if (values.length < period + 1) return null;
  let gains = 0;
  let losses = 0;
  const slice = values.slice(-period - 1);
  for (let i = 1; i < slice.length; i += 1) {
    const diff = slice[i] - slice[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }
  if (losses === 0) return 100;
  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
}

function ema(values, period) {
  const k = 2 / (period + 1);
  const series = [];
  values.forEach((value, index) => {
    if (index === 0) {
      series.push(value);
    } else {
      series.push(value * k + series[index - 1] * (1 - k));
    }
  });
  return series;
}

function generateSampleCandles(item) {
  const candles = [];
  let price = item.price / (1 + item.change / 100 || 1);
  const now = Date.now();
  const step = intervalToMs(state.interval);
  for (let i = 119; i >= 0; i -= 1) {
    const progress = (120 - i) / 120;
    const drift = (item.price - price) * 0.045;
    const wave = Math.sin(progress * Math.PI * 8) * item.price * 0.004;
    const open = price;
    const close = Math.max(0.00000001, open + drift + wave + (Math.random() - 0.48) * item.price * 0.006);
    const high = Math.max(open, close) * (1 + 0.002 + Math.random() * 0.005);
    const low = Math.min(open, close) * (1 - 0.002 - Math.random() * 0.005);
    candles.push({
      time: now - i * step,
      open,
      high,
      low,
      close,
      volume: item.quoteVolume / 120 * (0.55 + Math.random()),
    });
    price = close;
  }
  candles[candles.length - 1].close = item.price;
  candles[candles.length - 1].high = Math.max(candles[candles.length - 1].high, item.price);
  candles[candles.length - 1].low = Math.min(candles[candles.length - 1].low, item.price);
  return candles;
}

function intervalToMs(interval) {
  return {
    "5m": 5 * 60 * 1000,
    "15m": 15 * 60 * 1000,
    "30m": 30 * 60 * 1000,
    "1H": 60 * 60 * 1000,
    "4H": 4 * 60 * 60 * 1000,
    "1D": 24 * 60 * 60 * 1000,
  }[interval];
}

function marketLabel() {
  return MARKET_LABELS[state.marketType] || MARKET_LABELS.spot;
}

function marketSourceLabel(provider, marketType) {
  const venue = provider === "okx" ? "okx" : "bn";
  const market = marketType === "perp" ? "永续" : "现货";
  return `${venue}${market}`;
}

function displaySymbol(itemOrSymbol) {
  const symbol = typeof itemOrSymbol === "string" ? itemOrSymbol : itemOrSymbol?.symbol;
  return String(symbol || "--").replace(/USDT$/, "");
}

function metric(label, value) {
  return `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`;
}

function average(values) {
  const clean = values.filter(Number.isFinite);
  if (!clean.length) return 0;
  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatTime(date) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

function formatPct(value) {
  if (!Number.isFinite(value)) return "--";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${formatNumber(value, 2)}%`;
}

function formatFundingRate(value) {
  if (!Number.isFinite(value)) return "--";
  const pct = Math.abs(value * 100) < 0.000005 ? 0 : value * 100;
  const prefix = pct > 0 ? "+" : "";
  return `${prefix}${formatNumber(pct, 5)}%`;
}

function formatSpotBuyPressure(value) {
  if (!Number.isFinite(value)) return "--";
  return `${formatNumber(value, 1)}%`;
}

function formatActiveDiff(value) {
  if (!Number.isFinite(value)) return "--";
  return formatPct(value);
}

function formatOpenInterestChange(value) {
  if (!Number.isFinite(value)) return "--";
  return formatPct(value);
}

function formatLargeBuy(item) {
  if (!Number.isFinite(item.largeSpotBuyNotional) || item.largeSpotBuyNotional <= 0) return "--";
  return `${formatMoney(item.largeSpotBuyNotional)} / ${item.largeSpotBuyCount || 0}笔`;
}

function formatVolumeSurge(value) {
  if (!Number.isFinite(value)) return "--";
  return `${formatNumber(value, 2)}x`;
}

function formatBreakoutScore(value) {
  if (!Number.isFinite(value) || value <= 0) return "未突破";
  if (value >= 10) return "突破";
  return "贴近突破";
}

function formatSupply(value) {
  if (!Number.isFinite(value)) return "--";
  if (value >= 1_000_000_000) return `${formatNumber(value / 1_000_000_000, 2)}B`;
  if (value >= 1_000_000) return `${formatNumber(value / 1_000_000, 2)}M`;
  if (value >= 1_000) return `${formatNumber(value / 1_000, 2)}K`;
  return formatNumber(value, 0);
}

function getSpotBuyClass(value) {
  if (!Number.isFinite(value)) return "";
  if (value >= 58) return "positive";
  if (value <= 44) return "negative";
  return "neutral";
}

function getFundingClass(value) {
  if (!Number.isFinite(value)) return "";
  const pct = value * 100;
  if (pct < -0.03) return "positive";
  if (pct > 0.08) return "negative";
  return "neutral";
}

function getSignedClass(value) {
  if (!Number.isFinite(value)) return "";
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "neutral";
}

function formatMoney(value) {
  if (!Number.isFinite(value)) return "--";
  if (value >= 1_000_000_000) return `${formatNumber(value / 1_000_000_000, 2)}B`;
  if (value >= 1_000_000) return `${formatNumber(value / 1_000_000, 1)}M`;
  if (value >= 1_000) return `${formatNumber(value / 1_000, 1)}K`;
  return formatNumber(value, 0);
}

function formatPrice(value) {
  if (!Number.isFinite(value)) return "--";
  if (value >= 1000) return formatNumber(value, 2);
  if (value >= 1) return formatNumber(value, 4);
  if (value >= 0.01) return formatNumber(value, 6);
  return value.toPrecision(4);
}

function formatNumber(value, digits = 2) {
  if (!Number.isFinite(value)) return "--";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}
