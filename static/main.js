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

// ── STATE ──
let repeatOn  = false;
let mpOpen    = false;

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

    // sync mobile player immediately with new metadata (don't wait for fetch)
    if (mpOpen) syncMobilePlayer();

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
async function playNext() {
    const res  = await fetch('/queue/next');
    const song = await res.json();
    await playSong(song.videoId, song.title, song.singers, song.image);
}

audioPlayer.addEventListener('ended', playNext);
nextBtn.addEventListener('click', playNext);

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

// ── MOBILE FULL-SCREEN PLAYER ──
const mobilePlayer    = document.getElementById('mobile-player');
const mpBackdrop      = document.getElementById('mp-backdrop');
const mpImage         = document.getElementById('mp-image');
const mpTitle         = document.getElementById('mp-title');
const mpArtist        = document.getElementById('mp-artist');
const mpSeekBar       = document.getElementById('mp-seek-bar');
const mpCurrentTime   = document.getElementById('mp-current-time');
const mpDuration      = document.getElementById('mp-duration');
const mpPlayPauseBtn  = document.getElementById('mp-play-pause-btn');
const mpIconPlay      = document.getElementById('mp-icon-play');
const mpIconPause     = document.getElementById('mp-icon-pause');
const mpPrevBtn       = document.getElementById('mp-prev-btn');
const mpNextBtn       = document.getElementById('mp-next-btn');
const mpQueueBtn       = document.getElementById('mp-queue-btn');
const mpQueuePanel     = document.getElementById('mp-queue-panel');
const mpCloseQueueBtn  = document.getElementById('mp-close-queue-btn');
const mpQueueList      = document.getElementById('mp-queue-list');
const mpShuffleBtn     = null; // removed
const mpRepeatBtn     = document.getElementById('mp-repeat-btn');
const repeatBtn       = document.getElementById('repeat-btn');
const mpHandleBar     = document.querySelector('.mp-handle-bar');

let mpTouchStartY  = null;

function openMobilePlayer() {
    mobilePlayer.classList.remove('hidden');
    mpBackdrop.classList.remove('hidden');
    mpOpen = true;
    syncMobilePlayer();
}
function closeMobilePlayer() {
    mobilePlayer.classList.add('hidden');
    mpBackdrop.classList.add('hidden');
    mpQueuePanel.classList.add('hidden');
    mpOpen = false;
}
function syncMobilePlayer() {
    mpImage.src              = playerImage.src;
    mpTitle.textContent      = playerTitle.textContent;
    mpArtist.textContent     = playerArtist.textContent;
    mpSeekBar.value          = seekBar.value;
    mpCurrentTime.textContent = currentTimeEl.textContent;
    mpDuration.textContent    = durationEl.textContent;
    updateRangeFill(mpSeekBar, Number(mpSeekBar.value));
    const paused = audioPlayer.paused;
    mpIconPlay.style.display  = paused ? 'block' : 'none';
    mpIconPause.style.display = paused ? 'none'  : 'block';
}

// tap player bar (not its buttons) → open
document.querySelector('.player-bar').addEventListener('click', function(e) {
    if (window.innerWidth > 640) return;
    if (e.target.closest('#play-pause-btn') || e.target.closest('#mobile-queue-btn')) return;
    openMobilePlayer();
});

// close
mpBackdrop.addEventListener('click', closeMobilePlayer);
mpHandleBar.addEventListener('click', closeMobilePlayer);

// swipe down to close
mobilePlayer.addEventListener('touchstart', function(e) {
    mpTouchStartY = e.touches[0].clientY;
}, { passive: true });
mobilePlayer.addEventListener('touchend', function(e) {
    if (mpTouchStartY === null) return;
    const dy = e.changedTouches[0].clientY - mpTouchStartY;
    if (dy > 60) closeMobilePlayer();
    mpTouchStartY = null;
}, { passive: true });

// mp controls mirror main player
mpPlayPauseBtn.addEventListener('click', function() {
    playPauseBtn.click();
    const paused = audioPlayer.paused;
    mpIconPlay.style.display  = paused ? 'block' : 'none';
    mpIconPause.style.display = paused ? 'none'  : 'block';
});
mpPrevBtn.addEventListener('click', function() { prevBtn.click(); });
mpNextBtn.addEventListener('click', playNext);

mpSeekBar.addEventListener('input', function() {
    seekBar.value = mpSeekBar.value;
    audioPlayer.currentTime = (mpSeekBar.value / 100) * audioPlayer.duration;
    updateRangeFill(mpSeekBar, Number(mpSeekBar.value));
});

// mp queue panel
mpQueueBtn.addEventListener('click', async function() {
    mpQueuePanel.classList.remove('hidden');
    const res  = await fetch('/queue');
    const data = await res.json();
    mpQueueList.innerHTML = '';
    data.tracks.forEach(function(song, i) {
        const item = document.createElement('div');
        item.className = 'mp-queue-item' + (i === data.cur_idx ? ' now-playing' : '');
        item.innerHTML = `
            <img src="${song.image}" alt="${song.title}">
            <div class="mp-queue-item-info">
                <p class="mp-queue-item-title">${song.title}</p>
                <p class="mp-queue-item-artist">${song.singers}</p>
            </div>
            ${i === data.cur_idx ? '<span class="mp-queue-now-label">NOW</span>' : ''}
        `;
        mpQueueList.appendChild(item);
    });
    const nowPlaying = mpQueueList.querySelector('.now-playing');
    if (nowPlaying) nowPlaying.scrollIntoView({ block: 'center' });
});
mpCloseQueueBtn.addEventListener('click', function() {
    mpQueuePanel.classList.add('hidden');
});
repeatBtn.addEventListener('click', function() {
    repeatOn = !repeatOn;
    repeatBtn.classList.toggle('active', repeatOn);
    mpRepeatBtn.classList.toggle('active', repeatOn);
    audioPlayer.loop = repeatOn;
});

// keep mp in sync with audio events
audioPlayer.addEventListener('timeupdate', function() {
    if (!mpOpen) return;
    mpSeekBar.value = seekBar.value;
    mpCurrentTime.textContent = currentTimeEl.textContent;
    mpDuration.textContent    = durationEl.textContent;
    updateRangeFill(mpSeekBar, Number(mpSeekBar.value));
});
audioPlayer.addEventListener('play', function() {
    if (!mpOpen) return;
    mpIconPlay.style.display  = 'none';
    mpIconPause.style.display = 'block';
});
audioPlayer.addEventListener('pause', function() {
    if (!mpOpen) return;
    mpIconPlay.style.display  = 'block';
    mpIconPause.style.display = 'none';
});
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
            playNext();
            break;
    }
});
