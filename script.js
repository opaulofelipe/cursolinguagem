const CONFIG = {
  playlistId: "PLNeIX7aaNBTU",

  /*
    Opcional.

    Coloque uma chave da YouTube Data API v3 para exibir
    títulos e durações com maior estabilidade.

    Exemplo:
    youtubeApiKey: "SUA_CHAVE_AQUI"
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
  currentVideoTitle: document.querySelector("#currentVideoTitle"),
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
let forcedLoadAttempted = false;

function loadYouTubeAPI() {
  els.statusLabel.textContent = "Carregando";
  els.currentVideoTitle.textContent = "CARREGANDO";

  const tag = document.createElement("script");

  tag.src = "https://www.youtube.com/iframe_api";

  tag.onerror = () => {
    showLoadError("A API do YouTube não carregou.");
  };

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
      controls: 1,
      origin: window.location.origin
    },

    events: {
      onReady: handlePlayerReady,
      onStateChange: handlePlayerStateChange,
      onError: handlePlayerError
    }
  });
};

async function handlePlayerReady() {
  els.statusLabel.textContent = "Sincronizando";

  if (CONFIG.youtubeApiKey.trim()) {
    const loadedFromAPI =
      await buildPlaylistFromYouTubeDataAPI();

    if (loadedFromAPI) {
      player.cuePlaylist({
        listType: "playlist",
        list: CONFIG.playlistId,
        index: 0
      });

      render();
      updateDashboard();

      return;
    }
  }

  player.cuePlaylist({
    listType: "playlist",
    list: CONFIG.playlistId,
    index: 0
  });

  setTimeout(() => collectPlaylistFromPlayer(), 700);
}

function collectPlaylistFromPlayer(attempt = 0) {
  const playlist = safeCall(
    () => player.getPlaylist(),
    []
  );

  const index = safeCall(
    () => player.getPlaylistIndex(),
    0
  );

  if (Array.isArray(playlist) && playlist.length > 0) {
    videos = playlist.map((id, videoIndex) => ({
      id,
      index: videoIndex,
      title: `Aula ${String(videoIndex + 1).padStart(2, "0")}`,
      duration: ""
    }));

    currentIndex =
      Number.isInteger(index) && index >= 0
        ? index
        : 0;

    render();
    updateDashboard();
    hydrateMetadata();

    return;
  }

  /*
    Alguns navegadores não disponibilizam a playlist imediatamente
    depois de cuePlaylist. Nesse caso, tentamos carregar e pausar.
  */
  if (attempt === 12 && !forcedLoadAttempted) {
    forcedLoadAttempted = true;

    safeCall(() => {
      player.loadPlaylist({
        listType: "playlist",
        list: CONFIG.playlistId,
        index: 0
      });
    }, null);

    setTimeout(() => {
      safeCall(() => player.pauseVideo(), null);
    }, 500);
  }

  if (attempt > 70) {
    showLoadError(
      "Não foi possível carregar a playlist."
    );

    return;
  }

  setTimeout(
    () => collectPlaylistFromPlayer(attempt + 1),
    400
  );
}

async function buildPlaylistFromYouTubeDataAPI() {
  try {
    const playlistVideos =
      await fetchPlaylistVideosFromYouTubeDataAPI();

    if (!playlistVideos.length) {
      return false;
    }

    const ids = playlistVideos.map(
      video => video.id
    );

    const details =
      await fetchVideoDetailsFromYouTubeDataAPI(ids);

    videos = playlistVideos.map((video, index) => {
      const detail = details.get(video.id);

      return {
        id: video.id,
        index,
        title:
          detail?.title ||
          video.title ||
          `Aula ${String(index + 1).padStart(2, "0")}`,
        duration: detail?.duration || ""
      };
    });

    currentIndex = 0;

    return true;
  } catch {
    return false;
  }
}

async function fetchPlaylistVideosFromYouTubeDataAPI() {
  const allVideos = [];
  let pageToken = "";

  do {
    const url = new URL(
      "https://www.googleapis.com/youtube/v3/playlistItems"
    );

    url.searchParams.set(
      "part",
      "snippet,contentDetails"
    );

    url.searchParams.set(
      "playlistId",
      CONFIG.playlistId
    );

    url.searchParams.set("maxResults", "50");

    url.searchParams.set(
      "key",
      CONFIG.youtubeApiKey.trim()
    );

    if (pageToken) {
      url.searchParams.set(
        "pageToken",
        pageToken
      );
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        "Erro ao buscar playlist."
      );
    }

    const data = await response.json();

    data.items.forEach(item => {
      const videoId =
        item.contentDetails?.videoId;

      if (!videoId) {
        return;
      }

      allVideos.push({
        id: videoId,
        title: item.snippet?.title || ""
      });
    });

    pageToken = data.nextPageToken || "";
  } while (pageToken);

  return allVideos;
}

async function fetchVideoDetailsFromYouTubeDataAPI(ids) {
  const details = new Map();
  const chunks = chunkArray(ids, 50);

  for (const chunk of chunks) {
    const url = new URL(
      "https://www.googleapis.com/youtube/v3/videos"
    );

    url.searchParams.set(
      "part",
      "snippet,contentDetails"
    );

    url.searchParams.set(
      "id",
      chunk.join(",")
    );

    url.searchParams.set(
      "key",
      CONFIG.youtubeApiKey.trim()
    );

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        "Erro ao buscar detalhes dos vídeos."
      );
    }

    const data = await response.json();

    data.items.forEach(item => {
      details.set(item.id, {
        title: item.snippet?.title || "",
        duration: formatISODuration(
          item.contentDetails?.duration || ""
        )
      });
    });
  }

  return details;
}

async function hydrateMetadata() {
  if (!videos.length) {
    return;
  }

  if (CONFIG.youtubeApiKey.trim()) {
    try {
      const ids = videos.map(video => video.id);

      const details =
        await fetchVideoDetailsFromYouTubeDataAPI(ids);

      videos = videos.map(video => {
        const detail = details.get(video.id);

        if (!detail) {
          return video;
        }

        return {
          ...video,
          title:
            detail.title || video.title,
          duration:
            detail.duration || video.duration
        };
      });

      render();
      updateDashboard();

      return;
    } catch {
      showToast("Metadados indisponíveis.");
    }
  }

  await fetchTitlesFromOEmbed();

  render();
  updateDashboard();
}

async function fetchTitlesFromOEmbed() {
  try {
    const requests = videos.map(
      async video => {
        const url = new URL(
          "https://www.youtube.com/oembed"
        );

        url.searchParams.set(
          "url",
          `https://www.youtube.com/watch?v=${video.id}`
        );

        url.searchParams.set(
          "format",
          "json"
        );

        const response = await fetch(url);

        if (!response.ok) {
          return video;
        }

        const data = await response.json();

        return {
          ...video,
          title: data.title || video.title
        };
      }
    );

    const results =
      await Promise.allSettled(requests);

    videos = results.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      }

      return videos[index];
    });
  } catch {
    /*
      Caso o oEmbed falhe, o site mantém os títulos
      Aula 01, Aula 02 etc.
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
  if (!player) {
    return;
  }

  const index = safeCall(
    () => player.getPlaylistIndex(),
    currentIndex
  );

  if (
    Number.isInteger(index) &&
    index >= 0 &&
    index < videos.length
  ) {
    currentIndex = index;

    render();
    updateDashboard();
  }
}

function getCurrentVideo() {
  return videos[currentIndex] || null;
}

function playVideo(index) {
  if (!player || !videos[index]) {
    return;
  }

  currentIndex = index;

  player.playVideoAt(index);

  render();
  updateDashboard();
}

function markCurrentAsWatched() {
  const current = getCurrentVideo();

  if (!current) {
    return;
  }

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
    const raw = localStorage.getItem(
      CONFIG.storageKey
    );

    const parsed = raw
      ? JSON.parse(raw)
      : [];

    return new Set(
      Array.isArray(parsed)
        ? parsed
        : []
    );
  } catch {
    return new Set();
  }
}

function saveProgress() {
  localStorage.setItem(
    CONFIG.storageKey,
    JSON.stringify([...watched])
  );
}

function getWatchedCount() {
  return videos.filter(
    video => watched.has(video.id)
  ).length;
}

function getProgressPercent() {
  if (!videos.length) {
    return 0;
  }

  return Math.round(
    (getWatchedCount() / videos.length) * 100
  );
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

  els.statusLabel.textContent = total
    ? `${done}/${total}`
    : "Carregando";

  els.currentVideoTitle.textContent = current
    ? formatDisplayTitle(current.title)
    : "CARREGANDO";

  if (current && watched.has(current.id)) {
    els.markBtn.textContent = "✓";
    els.markBtn.title =
      "Remover dos assistidos";
    els.markBtn.setAttribute(
      "aria-label",
      "Remover dos assistidos"
    );
  } else {
    els.markBtn.textContent = "+";
    els.markBtn.title =
      "Marcar como assistido";
    els.markBtn.setAttribute(
      "aria-label",
      "Marcar como assistido"
    );
  }
}

function render() {
  const filteredVideos = videos.filter(
    video => {
      const isWatched =
        watched.has(video.id);

      if (activeFilter === "watched") {
        return isWatched;
      }

      if (activeFilter === "pending") {
        return !isWatched;
      }

      return true;
    }
  );

  if (!filteredVideos.length) {
    els.videoGrid.innerHTML = `
      <div class="empty-state">
        Nada aqui.
      </div>
    `;

    return;
  }

  els.videoGrid.innerHTML = filteredVideos
    .map(video => {
      const isWatched =
        watched.has(video.id);

      const isActive =
        video.index === currentIndex;

      const title = escapeHTML(
        formatDisplayTitle(video.title)
      );

      const duration = escapeHTML(
        video.duration
      );

      return `
        <article
          class="
            video-card
            ${isWatched ? "watched" : ""}
            ${isActive ? "active" : ""}
          "
          data-index="${video.index}"
          aria-label="${title}"
        >
          <div class="thumb">
            <img
              src="https://img.youtube.com/vi/${video.id}/hqdefault.jpg"
              alt="${title}"
              loading="lazy"
            />

            <div class="badge">
              ${video.index + 1}
            </div>

            ${
              duration
                ? `
                  <div class="duration-badge">
                    ${duration}
                  </div>
                `
                : ""
            }

            <div class="thumb-check">
              ✓
            </div>
          </div>

          <div class="video-info">
            <div class="video-title">
              ${title}
            </div>

            <div class="video-meta">
              <span class="video-duration">
                ${duration || ""}
              </span>

              ${
                isWatched
                  ? `
                    <span class="state-pill watched">
                      Assistido
                    </span>
                  `
                  : `
                    <span class="state-pill">
                      Pendente
                    </span>
                  `
              }
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function formatDisplayTitle(value) {
  return String(value || "")
    .trim()
    .toLocaleUpperCase("pt-BR");
}

function showLoadError(message) {
  els.statusLabel.textContent = "Erro";

  els.currentVideoTitle.textContent =
    "PLAYLIST INDISPONÍVEL";

  els.videoGrid.innerHTML = `
    <div class="empty-state">
      ${escapeHTML(message)}
      <br>
      Verifique se a playlist é pública e se o ID está correto.
    </div>
  `;

  showToast(message);
}

function formatISODuration(duration) {
  const match = duration.match(
    /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/
  );

  if (!match) {
    return "";
  }

  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);

  if (hours > 0) {
    return (
      `${hours}:` +
      `${String(minutes).padStart(2, "0")}:` +
      `${String(seconds).padStart(2, "0")}`
    );
  }

  return (
    `${minutes}:` +
    `${String(seconds).padStart(2, "0")}`
  );
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

function chunkArray(array, size) {
  const chunks = [];

  for (
    let index = 0;
    index < array.length;
    index += size
  ) {
    chunks.push(
      array.slice(index, index + size)
    );
  }

  return chunks;
}

els.videoGrid.addEventListener(
  "click",
  event => {
    const card = event.target.closest(
      ".video-card"
    );

    if (!card) {
      return;
    }

    const index = Number(
      card.dataset.index
    );

    playVideo(index);
  }
);

els.markBtn.addEventListener(
  "click",
  () => {
    const current = getCurrentVideo();

    if (!current) {
      return;
    }

    toggleWatched(current.id);
  }
);

els.prevBtn.addEventListener(
  "click",
  () => {
    if (!player) {
      return;
    }

    player.previousVideo();

    setTimeout(
      syncCurrentVideo,
      350
    );
  }
);

els.nextBtn.addEventListener(
  "click",
  () => {
    if (!player) {
      return;
    }

    player.nextVideo();

    setTimeout(
      syncCurrentVideo,
      350
    );
  }
);

els.resetBtn.addEventListener(
  "click",
  () => {
    const shouldReset = confirm(
      "Zerar progresso?"
    );

    if (!shouldReset) {
      return;
    }

    watched.clear();

    saveProgress();
    render();
    updateDashboard();

    showToast("Progresso zerado.");
  }
);

els.filterButtons.forEach(button => {
  button.addEventListener(
    "click",
    () => {
      els.filterButtons.forEach(item => {
        item.classList.remove("active");
      });

      button.classList.add("active");

      activeFilter =
        button.dataset.filter;

      render();
    }
  );
});

setInterval(() => {
  if (!player || !videos.length) {
    return;
  }

  const state = safeCall(
    () => player.getPlayerState(),
    null
  );

  if (state !== YT.PlayerState.PLAYING) {
    return;
  }

  const duration = safeCall(
    () => player.getDuration(),
    0
  );

  const currentTime = safeCall(
    () => player.getCurrentTime(),
    0
  );

  const current = getCurrentVideo();

  if (!current || !duration) {
    return;
  }

  const watchedEnough =
    currentTime / duration >= 0.9;

  if (
    watchedEnough &&
    !watched.has(current.id)
  ) {
    watched.add(current.id);

    saveProgress();
    render();
    updateDashboard();
  }
}, 3000);

loadYouTubeAPI();
