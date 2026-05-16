// ── ELEMENT REFS ──
const audioPlayer   = document.getElementById('audio-player');
const playPauseBtn  = document.getElementById('play-pause-btn');
const seekBar       = document.getElementById('seek-bar');
const currentTimeEl = document.getElementById('current-time');
const durationEl    = document.getElementById('duration');
const playerTitle   = document.getElementById('player-title');
const playerArtist  = document.getElementById('player-artist');
const playerImage   = document.getElementById('player-image');
const nextBtn       = document.getElementById('next-btn');
const prevBtn       = document.getElementById('prev-btn');
const queueBtn      = document.getElementById('queue-btn');
const closeQueueBtn = document.getElementById('close-queue-btn');
const queueModal    = document.getElementById('queue-modal');
const queueList     = document.getElementById('queue-list');
const searchForm    = document.querySelector('.search-form');
const muteBtn       = document.getElementById('mute-btn');
const volumeBar     = document.getElementById('volume-bar');
const themeToggle   = document.getElementById('theme-toggle');

// ── THEME ──
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('swave-theme', theme);
}

// Load saved theme (default: dark)
applyTheme(localStorage.getItem('swave-theme') || 'dark');

themeToggle.addEventListener('click', function () {
    const current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
});

// ── VOLUME ──
let lastVolume = 1;

function updateVolIcon() {
    const v = audioPlayer.volume;
    document.getElementById('vol-icon-high').style.display = v >= 0.5 ? 'block' : 'none';
    document.getElementById('vol-icon-low').style.display  = (v > 0 && v < 0.5) ? 'block' : 'none';
    document.getElementById('vol-icon-mute').style.display = v === 0 ? 'block' : 'none';
}

function updateRangeFill(input, pct) {
    // track fill colour via background gradient
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    const surface2 = getComputedStyle(document.documentElement).getPropertyValue('--surface-2').trim();
    input.style.background = `linear-gradient(to right, ${accent} ${pct}%, ${surface2} ${pct}%)`;
}

volumeBar.addEventListener('input', function () {
    const val = Number(volumeBar.value);
    audioPlayer.volume = val / 100;
    updateVolIcon();
    updateRangeFill(volumeBar, val);
});

muteBtn.addEventListener('click', function () {
    if (audioPlayer.volume > 0) {
        lastVolume = audioPlayer.volume;
        audioPlayer.volume = 0;
        volumeBar.value = 0;
    } else {
        audioPlayer.volume = lastVolume;
        volumeBar.value = lastVolume * 100;
    }
    updateVolIcon();
    updateRangeFill(volumeBar, Number(volumeBar.value));
});

// init volume fill
updateRangeFill(volumeBar, 100);
updateVolIcon();

// ── SEARCH (SPA navigation) ──
searchForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    document.getElementById('main-content').innerHTML =
        '<div class="loader-container"><div class="loader"></div></div>';
    const query = document.querySelector('.search-form input').value;
    const res  = await fetch(`/result/?query=${encodeURIComponent(query)}`);
    const html = await res.text();
    const parser = new DOMParser();
    const doc    = parser.parseFromString(html, 'text/html');
    const newContent = doc.querySelector('#main-content');
    document.getElementById('main-content').replaceWith(newContent);
    attachCardListeners();
});

// ── HOME LINK (SPA) ──
document.querySelector('.home-icon').addEventListener('click', async function (e) {
    e.preventDefault();
    document.getElementById('main-content').innerHTML =
        '<div class="loader-container"><div class="loader"></div></div>';
    const res  = await fetch('/');
    const html = await res.text();
    const parser = new DOMParser();
    const doc    = parser.parseFromString(html, 'text/html');
    const newContent = doc.querySelector('#main-content');
    document.getElementById('main-content').replaceWith(newContent);
    attachCardListeners();
});

// ── PLAY SONG ──
async function playSong(videoId, title, artist, image, source = 'queue') {
    playerTitle.textContent  = title;
    playerArtist.textContent = artist;
    playerImage.src          = image;
    playPauseBtn.innerHTML   = '&#9646;&#9646;';

    const res        = await fetch('/now-playing', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ source, id: videoId, title, artist, image })
    });
    const { url } = await res.json();
    audioPlayer.src = url;
    audioPlayer.load();
    audioPlayer.oncanplay = () => audioPlayer.play();
}

// ── CARD CLICK LISTENERS ──
function attachCardListeners() {
    document.querySelectorAll('.song-card').forEach(function (card) {
        card.addEventListener('click', async function () {
            const { title, artist, image, videoid } = card.dataset;
            await playSong(videoid, title, artist, image, 'card');
        });
    });
}
attachCardListeners();

// ── PLAY / PAUSE ──
playPauseBtn.addEventListener('click', function () {
    if (audioPlayer.paused) {
        audioPlayer.play();
        playPauseBtn.innerHTML = '&#9646;&#9646;';
    } else {
        audioPlayer.pause();
        playPauseBtn.innerHTML = '&#9654;';
    }
});

// ── SEEK BAR ──
audioPlayer.addEventListener('timeupdate', function () {
    const current = audioPlayer.currentTime;
    const total   = audioPlayer.duration;
    if (!isNaN(total) && total > 0) {
        const pct = (current / total) * 100;
        seekBar.value = pct;
        updateRangeFill(seekBar, pct);
    }
    currentTimeEl.textContent = formatTime(current);
    durationEl.textContent    = formatTime(total);
});

seekBar.addEventListener('input', function () {
    const seekTo = (seekBar.value / 100) * audioPlayer.duration;
    audioPlayer.currentTime = seekTo;
    updateRangeFill(seekBar, Number(seekBar.value));
});

function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
}

// ── QUEUE NAVIGATION ──
audioPlayer.addEventListener('ended', async function () {
    const res  = await fetch('/queue/next');
    const song = await res.json();
    await playSong(song.videoId, song.title, song.singers, song.image);
});

nextBtn.addEventListener('click', async function () {
    const res  = await fetch('/queue/next');
    const song = await res.json();
    await playSong(song.videoId, song.title, song.singers, song.image);
});

prevBtn.addEventListener('click', async function () {
    const res  = await fetch('/queue/prev');
    const song = await res.json();
    await playSong(song.videoId, song.title, song.singers, song.image);
});

// ── QUEUE MODAL ──
queueBtn.addEventListener('click', async function () {
    queueModal.classList.toggle('hidden');
    if (!queueModal.classList.contains('hidden')) {
        await refreshQueue();
    }
});

closeQueueBtn.addEventListener('click', function () {
    queueModal.classList.add('hidden');
});

async function refreshQueue() {
    const res  = await fetch('/queue');
    const data = await res.json();
    queueList.innerHTML = '';

    data.tracks.forEach(function (song, i) {
        const item = document.createElement('div');
        item.className = 'queue-item' + (i === data.cur_idx ? ' now-playing' : '');
        item.innerHTML = `
            <img src="${song.image}" alt="${song.title}">
            <div class="queue-item-info">
                <p class="queue-item-title">${song.title}</p>
                <p class="queue-item-artist">${song.singers}</p>
            </div>
            ${i === data.cur_idx ? '<span style="font-family:var(--font-mono);font-size:9px;color:var(--accent);font-weight:500;flex-shrink:0">NOW</span>' : ''}
        `;
        queueList.appendChild(item);
    });

    const nowPlaying = queueList.querySelector('.now-playing');
    if (nowPlaying) nowPlaying.scrollIntoView({ block: 'center' });
}

// ── MOBILE QUEUE BUTTON ──
const mobileQueueBtn = document.getElementById('mobile-queue-btn');
mobileQueueBtn.addEventListener('click', async function () {
    queueModal.classList.toggle('hidden');
    if (!queueModal.classList.contains('hidden')) await refreshQueue();
});

// ── SWIPE ON PLAYER BAR (prev / next) ──
const playerBar = document.querySelector('.player-bar');
let swipeStartX = null;
let swipeStartY = null;
const SWIPE_MIN_X  = 40;   // px horizontal threshold
const SWIPE_MAX_Y  = 60;   // px vertical noise tolerance

playerBar.addEventListener('touchstart', function (e) {
    swipeStartX = e.touches[0].clientX;
    swipeStartY = e.touches[0].clientY;
}, { passive: true });

playerBar.addEventListener('touchend', async function (e) {
    if (swipeStartX === null) return;
    const dx = e.changedTouches[0].clientX - swipeStartX;
    const dy = e.changedTouches[0].clientY - swipeStartY;

    // ignore if mostly vertical scroll
    if (Math.abs(dy) > SWIPE_MAX_Y) { swipeStartX = null; return; }

    if (dx < -SWIPE_MIN_X) {
        // swipe left → next
        const res  = await fetch('/queue/next');
        const song = await res.json();
        await playSong(song.videoId, song.title, song.singers, song.image);
    } else if (dx > SWIPE_MIN_X) {
        // swipe right → prev
        const res  = await fetch('/queue/prev');
        const song = await res.json();
        await playSong(song.videoId, song.title, song.singers, song.image);
    }
    swipeStartX = null;
}, { passive: true });
document.addEventListener('keydown', function (e) {
    if (document.activeElement.tagName === 'INPUT') return;
    if (['Space', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();

    switch (e.code) {
        case 'Space':
            if (audioPlayer.paused) {
                audioPlayer.play();
                playPauseBtn.innerHTML = '&#9646;&#9646;';
            } else {
                audioPlayer.pause();
                playPauseBtn.innerHTML = '&#9654;';
            }
            break;
        case 'ArrowLeft':
            audioPlayer.currentTime = Math.max(0, audioPlayer.currentTime - 5);
            break;
        case 'ArrowRight':
            audioPlayer.currentTime = Math.min(audioPlayer.duration, audioPlayer.currentTime + 5);
            break;
        case 'Comma':   // ,
            prevBtn.click();
            break;
        case 'Period':  // .
            nextBtn.click();
            break;
    }
});
