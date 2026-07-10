Perfeito. Abaixo estão os códigos completos. O **HTML praticamente não mudou**, mas envio tudo separado para você copiar e colar.

Para aparecer **título real + duração**, coloque uma chave da **YouTube Data API v3** aqui no JavaScript:

```js
youtubeApiKey: ""
```

Sem chave, o site continua funcionando. Ele tenta buscar o **título** por `oEmbed`, mas a **duração** só aparece com API.

---

## `index.html`

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dashboard</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <main class="app">
    <header class="topbar">
      <div class="brand">
        <div class="brand-icon">▶</div>

        <div>
          <h1>Playlist</h1>
          <p id="statusLabel">Carregando</p>
        </div>
      </div>

      <button id="resetBtn" class="icon-btn" aria-label="Zerar progresso" title="Zerar progresso">
        ↺
      </button>
    </header>

    <section class="dashboard">
      <div class="player-card">
        <div class="player-frame">
          <div id="player"></div>
        </div>
      </div>

      <aside class="progress-card">
        <div class="stats">
          <div class="stat">
            <strong id="totalVideos">0</strong>
            <span>Total</span>
          </div>

          <div class="stat">
            <strong id="watchedVideos">0</strong>
            <span>Vistos</span>
          </div>

          <div class="stat">
            <strong id="progressPercent">0%</strong>
            <span>Progresso</span>
          </div>
        </div>

        <div class="progress-bar" aria-label="Progresso da playlist">
          <div id="progressFill" class="progress-fill"></div>
        </div>

        <div class="player-actions">
          <button id="prevBtn" class="action-btn" aria-label="Vídeo anterior">←</button>
          <button id="markBtn" class="action-btn primary" aria-label="Marcar como visto">✓</button>
          <button id="nextBtn" class="action-btn" aria-label="Próximo vídeo">→</button>
        </div>
      </aside>
    </section>

    <section class="playlist-area">
      <div class="section-head">
        <h2>Aulas</h2>

        <div class="filters" aria-label="Filtros">
          <button class="filter-btn active" data-filter="all">Todas</button>
          <button class="filter-btn" data-filter="pending">Pendentes</button>
          <button class="filter-btn" data-filter="watched">Vistas</button>
        </div>
      </div>

      <div id="videoGrid" class="video-grid"></div>
    </section>
  </main>

  <div id="toast" class="toast" role="status" aria-live="polite"></div>

  <script src="script.js"></script>
</body>
</html>
```

---

## `style.css`

```css
:root {
  --bg: #f6f7fb;
  --card: #ffffff;
  --text: #17181c;
  --muted: #777d8c;
  --line: #e6e8ef;
  --soft: #f0f2f7;
  --accent: #151515;

  --green: #16803c;
  --green-bg: #e7f7ed;
  --green-line: #bce6ca;

  --radius-xl: 28px;
  --radius-lg: 22px;
  --radius-md: 16px;
  --shadow: 0 20px 60px rgba(20, 22, 30, 0.08);
  --shadow-soft: 0 12px 30px rgba(20, 22, 30, 0.06);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background:
    radial-gradient(circle at top left, #ffffff 0, transparent 34rem),
    var(--bg);
  color: var(--text);
}

button {
  font: inherit;
}

.app {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  padding: 28px 0 56px;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.brand-icon {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 15px;
  background: var(--accent);
  color: #fff;
  font-size: 17px;
  box-shadow: var(--shadow-soft);
}

h1,
h2,
p {
  margin: 0;
}

h1 {
  font-size: clamp(1.35rem, 2vw, 1.8rem);
  letter-spacing: -0.04em;
}

#statusLabel {
  margin-top: 2px;
  color: var(--muted);
  font-size: 0.92rem;
}

.icon-btn {
  width: 44px;
  height: 44px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.72);
  color: var(--text);
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
}

.icon-btn:hover {
  transform: translateY(-1px);
  background: #fff;
  border-color: #d7dae3;
}

.dashboard {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 330px;
  gap: 18px;
  align-items: stretch;
}

.player-card,
.progress-card {
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(230, 232, 239, 0.85);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow);
  backdrop-filter: blur(14px);
}

.player-card {
  overflow: hidden;
  padding: 12px;
}

.player-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 22px;
  background: #111;
}

.player-frame iframe,
#player {
  width: 100%;
  height: 100%;
  border: 0;
}

.progress-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 24px;
  min-height: 100%;
}

.stats {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.stat {
  padding: 18px;
  border-radius: 20px;
  background: var(--soft);
}

.stat strong {
  display: block;
  font-size: clamp(1.6rem, 3vw, 2.35rem);
  line-height: 1;
  letter-spacing: -0.06em;
}

.stat span {
  display: block;
  margin-top: 7px;
  color: var(--muted);
  font-size: 0.82rem;
}

.progress-bar {
  width: 100%;
  height: 12px;
  margin: 26px 0;
  overflow: hidden;
  border-radius: 999px;
  background: var(--soft);
}

.progress-fill {
  width: 0%;
  height: 100%;
  border-radius: inherit;
  background: var(--accent);
  transition: width 0.4s ease;
}

.player-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.action-btn {
  height: 48px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: #fff;
  color: var(--text);
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
}

.action-btn:hover {
  transform: translateY(-1px);
  border-color: #d5d8e2;
}

.action-btn.primary {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.playlist-area {
  margin-top: 26px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
}

h2 {
  font-size: 1.05rem;
  letter-spacing: -0.03em;
}

.filters {
  display: flex;
  gap: 8px;
  padding: 4px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
}

.filter-btn {
  border: 0;
  border-radius: 999px;
  padding: 8px 13px;
  background: transparent;
  color: var(--muted);
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.filter-btn.active {
  background: var(--accent);
  color: #fff;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.video-card {
  position: relative;
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.88);
  box-shadow: var(--shadow-soft);
  cursor: pointer;
  transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
}

.video-card:hover {
  transform: translateY(-3px);
  border-color: #cfd3df;
}

.video-card.active {
  border-color: var(--accent);
  box-shadow: 0 18px 48px rgba(20, 22, 30, 0.12);
}

.video-card.watched {
  border-color: var(--green-line);
  background: linear-gradient(180deg, #ffffff 0%, #fbfffc 100%);
}

.thumb {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: #111;
}

.thumb::after {
  content: "";
  position: absolute;
  inset: 0;
  opacity: 0;
  background:
    linear-gradient(180deg, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.36)),
    rgba(22, 128, 60, 0.18);
  transition: opacity 0.28s ease;
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  filter: saturate(0.95);
  transition: transform 0.28s ease, opacity 0.28s ease, filter 0.28s ease;
}

.video-card:hover .thumb img {
  transform: scale(1.04);
}

.video-card.watched .thumb::after {
  opacity: 1;
}

.video-card.watched .thumb img {
  opacity: 0.5;
  filter: grayscale(1) contrast(0.9);
}

.badge {
  position: absolute;
  left: 10px;
  top: 10px;
  z-index: 2;
  display: grid;
  place-items: center;
  min-width: 34px;
  height: 28px;
  padding: 0 9px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: var(--text);
  font-size: 0.78rem;
  font-weight: 700;
  backdrop-filter: blur(8px);
}

.duration-badge {
  position: absolute;
  right: 10px;
  bottom: 10px;
  z-index: 2;
  min-width: 42px;
  padding: 5px 8px;
  border-radius: 999px;
  background: rgba(20, 20, 20, 0.78);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  backdrop-filter: blur(8px);
}

.thumb-check {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 3;
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  border-radius: 999px;
  background: rgba(22, 128, 60, 0.94);
  color: #fff;
  font-size: 1.35rem;
  font-weight: 800;
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.86);
  box-shadow: 0 16px 36px rgba(22, 128, 60, 0.32);
  transition: opacity 0.24s ease, transform 0.24s ease;
}

.video-card.watched .thumb-check {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

.video-info {
  padding: 13px 14px 15px;
}

.video-title {
  display: -webkit-box;
  min-height: 2.45em;
  overflow: hidden;
  color: var(--text);
  font-size: 0.9rem;
  font-weight: 650;
  line-height: 1.23;
  letter-spacing: -0.02em;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.video-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 10px;
}

.video-duration {
  color: var(--muted);
  font-size: 0.76rem;
  font-weight: 600;
}

.state-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 24px;
  padding: 4px 8px;
  border-radius: 999px;
  background: var(--soft);
  color: var(--muted);
  font-size: 0.72rem;
  font-weight: 700;
}

.state-pill.watched {
  background: var(--green-bg);
  color: var(--green);
}

.state-pill.watched::before {
  content: "✓";
  display: grid;
  place-items: center;
  width: 15px;
  height: 15px;
  border-radius: 999px;
  background: var(--green);
  color: #fff;
  font-size: 0.62rem;
  line-height: 1;
}

.empty-state {
  grid-column: 1 / -1;
  padding: 32px;
  border: 1px dashed var(--line);
  border-radius: var(--radius-lg);
  color: var(--muted);
  text-align: center;
}

.toast {
  position: fixed;
  left: 50%;
  bottom: 22px;
  z-index: 10;
  max-width: calc(100% - 32px);
  padding: 12px 16px;
  border-radius: 999px;
  background: var(--accent);
  color: #fff;
  font-size: 0.88rem;
  box-shadow: var(--shadow);
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, 12px);
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.toast.show {
  opacity: 1;
  transform: translate(-50%, 0);
}

@media (max-width: 980px) {
  .dashboard {
    grid-template-columns: 1fr;
  }

  .progress-card {
    min-height: auto;
  }

  .stats {
    grid-template-columns: repeat(3, 1fr);
  }

  .video-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .app {
    width: min(100% - 22px, 1180px);
    padding-top: 18px;
  }

  .topbar {
    margin-bottom: 16px;
  }

  .brand-icon {
    width: 42px;
    height: 42px;
    border-radius: 14px;
  }

  .player-card {
    padding: 8px;
    border-radius: 22px;
  }

  .player-frame {
    border-radius: 17px;
  }

  .progress-card {
    padding: 16px;
    border-radius: 22px;
  }

  .stats {
    gap: 8px;
  }

  .stat {
    padding: 14px 12px;
    border-radius: 16px;
  }

  .stat strong {
    font-size: 1.45rem;
  }

  .stat span {
    font-size: 0.72rem;
  }

  .section-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .filters {
    width: 100%;
    overflow-x: auto;
  }

  .filter-btn {
    flex: 1;
    white-space: nowrap;
  }

  .video-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 11px;
  }

  .video-info {
    padding: 11px 12px 13px;
  }

  .video-title {
    font-size: 0.85rem;
  }

  .thumb-check {
    width: 48px;
    height: 48px;
    font-size: 1.18rem;
  }
}

@media (max-width: 420px) {
  .video-grid {
    grid-template-columns: 1fr;
  }
}
```

---

## `script.js`

```javascript
const CONFIG = {
  playlistId: "PLNeIX7aaNBTU",

  /*
    Opcional.

    Para exibir título real + duração de todos os vídeos,
    coloque aqui uma chave da YouTube Data API v3.

    Exemplo:
    youtubeApiKey: "SUA_CHAVE_AQUI"

    Recomendado: restringir a chave ao domínio do seu GitHub Pages.
  */
  youtubeApiKey: "",

  storageKey: "youtube-dashboard-progress-PLNeIX7aaNBTU"
};

const els = {
  statusLabel: document.querySelector("#statusLabel"),
  totalVideos: document.querySelector("#totalVideos"),
  watchedVideos: document.querySelector("#watchedVideos"),
  progressPercent: document.querySelector("#progressPercent"),
  progressFill: document.querySelector("#progressFill"),
  videoGrid: document.querySelector("#videoGrid"),
  resetBtn: document.querySelector("#resetBtn"),
  prevBtn: document.querySelector("#prevBtn"),
  nextBtn: document.querySelector("#nextBtn"),
  markBtn: document.querySelector("#markBtn"),
  toast: document.querySelector("#toast"),
  filterButtons: document.querySelectorAll(".filter-btn")
};

let player = null;
let videos = [];
let currentIndex = 0;
let activeFilter = "all";
let watched = loadProgress();

function loadYouTubeAPI() {
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
}

window.onYouTubeIframeAPIReady = function () {
  player = new YT.Player("player", {
    width: "100%",
    height: "100%",
    playerVars: {
      listType: "playlist",
      list: CONFIG.playlistId,
      rel: 0,
      modestbranding: 1,
      playsinline: 1,
      controls: 1
    },
    events: {
      onReady: handlePlayerReady,
      onStateChange: handlePlayerStateChange,
      onError: handlePlayerError
    }
  });
};

function handlePlayerReady() {
  player.cuePlaylist({
    listType: "playlist",
    list: CONFIG.playlistId,
    index: 0
  });

  waitForPlaylist();
}

function waitForPlaylist(attempt = 0) {
  const playlist = safeCall(() => player.getPlaylist(), []);

  if (Array.isArray(playlist) && playlist.length > 0) {
    videos = playlist.map((id, index) => ({
      id,
      index,
      title: `Aula ${String(index + 1).padStart(2, "0")}`,
      duration: ""
    }));

    currentIndex = safeCall(() => player.getPlaylistIndex(), 0) || 0;

    render();
    updateDashboard();

    hydrateMetadata();

    return;
  }

  if (attempt > 40) {
    els.videoGrid.innerHTML = `
      <div class="empty-state">
        Não foi possível carregar a lista de vídeos.
      </div>
    `;

    showToast("Abra a playlist pelo player.");
    return;
  }

  setTimeout(() => waitForPlaylist(attempt + 1), 300);
}

async function hydrateMetadata() {
  if (!videos.length) return;

  if (CONFIG.youtubeApiKey.trim()) {
    await fetchMetadataFromYouTubeDataAPI();
  } else {
    await fetchTitlesFromOEmbed();
  }

  render();
  updateDashboard();
}

async function fetchMetadataFromYouTubeDataAPI() {
  try {
    const ids = videos.map(video => video.id).join(",");

    const url = new URL("https://www.googleapis.com/youtube/v3/videos");
    url.searchParams.set("part", "snippet,contentDetails");
    url.searchParams.set("id", ids);
    url.searchParams.set("key", CONFIG.youtubeApiKey.trim());

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Erro ao buscar dados da API.");
    }

    const data = await response.json();
    const detailsById = new Map();

    data.items.forEach(item => {
      detailsById.set(item.id, {
        title: item.snippet?.title || "",
        duration: formatISODuration(item.contentDetails?.duration || "")
      });
    });

    videos = videos.map(video => {
      const details = detailsById.get(video.id);

      if (!details) return video;

      return {
        ...video,
        title: details.title || video.title,
        duration: details.duration || video.duration
      };
    });
  } catch {
    showToast("Metadados indisponíveis.");
  }
}

async function fetchTitlesFromOEmbed() {
  try {
    const requests = videos.map(async video => {
      const url = new URL("https://www.youtube.com/oembed");
      url.searchParams.set("url", `https://www.youtube.com/watch?v=${video.id}`);
      url.searchParams.set("format", "json");

      const response = await fetch(url);

      if (!response.ok) return video;

      const data = await response.json();

      return {
        ...video,
        title: data.title || video.title
      };
    });

    const results = await Promise.allSettled(requests);

    videos = results.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      }

      return videos[index];
    });
  } catch {
    /*
      Sem problema.

      Se o oEmbed falhar por bloqueio, rede ou limite,
      o site continua usando Aula 01, Aula 02 etc.
    */
  }
}

function handlePlayerStateChange(event) {
  syncCurrentVideo();

  if (event.data === YT.PlayerState.ENDED) {
    markCurrentAsWatched();
  }
}

function handlePlayerError() {
  showToast("Vídeo indisponível.");
}

function syncCurrentVideo() {
  const index = safeCall(() => player.getPlaylistIndex(), currentIndex);

  if (Number.isInteger(index) && index >= 0) {
    currentIndex = index;
    render();
    updateDashboard();
  }
}

function getCurrentVideo() {
  return videos[currentIndex] || null;
}

function playVideo(index) {
  if (!player || !videos[index]) return;

  currentIndex = index;
  player.playVideoAt(index);
  render();
  updateDashboard();
}

function markCurrentAsWatched() {
  const current = getCurrentVideo();

  if (!current) return;

  watched.add(current.id);
  saveProgress();
  render();
  updateDashboard();
}

function toggleWatched(id) {
  if (watched.has(id)) {
    watched.delete(id);
  } else {
    watched.add(id);
  }

  saveProgress();
  render();
  updateDashboard();
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(CONFIG.storageKey);
    const parsed = raw ? JSON.parse(raw) : [];

    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function saveProgress() {
  localStorage.setItem(CONFIG.storageKey, JSON.stringify([...watched]));
}

function getWatchedCount() {
  return videos.filter(video => watched.has(video.id)).length;
}

function getProgressPercent() {
  if (!videos.length) return 0;

  return Math.round((getWatchedCount() / videos.length) * 100);
}

function updateDashboard() {
  const total = videos.length;
  const done = getWatchedCount();
  const percent = getProgressPercent();
  const current = getCurrentVideo();

  els.totalVideos.textContent = total;
  els.watchedVideos.textContent = done;
  els.progressPercent.textContent = `${percent}%`;
  els.progressFill.style.width = `${percent}%`;
  els.statusLabel.textContent = total ? `${done}/${total}` : "Carregando";

  if (current && watched.has(current.id)) {
    els.markBtn.textContent = "✓";
    els.markBtn.title = "Remover dos assistidos";
  } else {
    els.markBtn.textContent = "+";
    els.markBtn.title = "Marcar como assistido";
  }
}

function render() {
  const filteredVideos = videos.filter(video => {
    const isWatched = watched.has(video.id);

    if (activeFilter === "watched") return isWatched;
    if (activeFilter === "pending") return !isWatched;

    return true;
  });

  if (!filteredVideos.length) {
    els.videoGrid.innerHTML = `
      <div class="empty-state">
        Nada aqui.
      </div>
    `;

    return;
  }

  els.videoGrid.innerHTML = filteredVideos.map(video => {
    const isWatched = watched.has(video.id);
    const isActive = video.index === currentIndex;
    const title = escapeHTML(video.title);
    const duration = escapeHTML(video.duration);

    return `
      <article 
        class="video-card ${isWatched ? "watched" : ""} ${isActive ? "active" : ""}" 
        data-index="${video.index}"
      >
        <div class="thumb">
          <img 
            src="https://img.youtube.com/vi/${video.id}/hqdefault.jpg" 
            alt="${title}" 
            loading="lazy"
          />

          <div class="badge">${video.index + 1}</div>

          ${duration ? `<div class="duration-badge">${duration}</div>` : ""}

          <div class="thumb-check">✓</div>
        </div>

        <div class="video-info">
          <div class="video-title">${title}</div>

          <div class="video-meta">
            <span class="video-duration">${duration || ""}</span>

            ${
              isWatched
                ? `<span class="state-pill watched">Assistido</span>`
                : `<span class="state-pill">Pendente</span>`
            }
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function formatISODuration(duration) {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

  if (!match) return "";

  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {
    els.toast.classList.remove("show");
  }, 1800);
}

function safeCall(callback, fallback) {
  try {
    return callback();
  } catch {
    return fallback;
  }
}

els.videoGrid.addEventListener("click", event => {
  const card = event.target.closest(".video-card");

  if (!card) return;

  const index = Number(card.dataset.index);

  playVideo(index);
});

els.markBtn.addEventListener("click", () => {
  const current = getCurrentVideo();

  if (!current) return;

  toggleWatched(current.id);
});

els.prevBtn.addEventListener("click", () => {
  if (!player) return;

  player.previousVideo();

  setTimeout(syncCurrentVideo, 350);
});

els.nextBtn.addEventListener("click", () => {
  if (!player) return;

  player.nextVideo();

  setTimeout(syncCurrentVideo, 350);
});

els.resetBtn.addEventListener("click", () => {
  const shouldReset = confirm("Zerar progresso?");

  if (!shouldReset) return;

  watched.clear();
  saveProgress();
  render();
  updateDashboard();
  showToast("Progresso zerado.");
});

els.filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    els.filterButtons.forEach(item => item.classList.remove("active"));

    button.classList.add("active");
    activeFilter = button.dataset.filter;

    render();
  });
});

setInterval(() => {
  if (!player || !videos.length) return;

  const state = safeCall(() => player.getPlayerState(), null);

  if (state !== YT.PlayerState.PLAYING) return;

  const duration = safeCall(() => player.getDuration(), 0);
  const currentTime = safeCall(() => player.getCurrentTime(), 0);
  const current = getCurrentVideo();

  if (!current || !duration) return;

  const watchedEnough = currentTime / duration >= 0.9;

  if (watchedEnough && !watched.has(current.id)) {
    watched.add(current.id);
    saveProgress();
    render();
    updateDashboard();
  }
}, 3000);

loadYouTubeAPI();
```

Ficou assim: vídeo assistido agora ganha **thumb mais apagada em P&B**, **overlay verde discreto**, **check central verde** e etiqueta **“Assistido”** em verde.
