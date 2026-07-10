const CONFIG = {
  playlistId: "PLNeIX7aaNBTU",
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
      title: `Aula ${String(index + 1).padStart(2, "0")}`
    }));

    currentIndex = safeCall(() => player.getPlaylistIndex(), 0) || 0;

    render();
    updateDashboard();
    els.statusLabel.textContent = `${getWatchedCount()}/${videos.length}`;

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
    els.markBtn.title = "Remover dos vistos";
  } else {
    els.markBtn.textContent = "+";
    els.markBtn.title = "Marcar como visto";
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

    return `
      <article 
        class="video-card ${isWatched ? "watched" : ""} ${isActive ? "active" : ""}" 
        data-index="${video.index}"
      >
        <div class="thumb">
          <img 
            src="https://img.youtube.com/vi/${video.id}/hqdefault.jpg" 
            alt="${video.title}" 
            loading="lazy"
          />

          <div class="badge">${video.index + 1}</div>
          <div class="check">✓</div>
        </div>

        <div class="video-info">
          <div class="video-title">
            <span>${video.title}</span>
            <small class="video-state">${isWatched ? "ok" : ""}</small>
          </div>
        </div>
      </article>
    `;
  }).join("");
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
