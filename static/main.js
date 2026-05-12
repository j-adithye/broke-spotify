//I kinda understand js but most of it is just claude

// Step A — Grab elements from the page by their id
const audioPlayer = document.getElementById('audio-player');
const playPauseBtn = document.getElementById('play-pause-btn');
const seekBar = document.getElementById('seek-bar');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const playerTitle = document.getElementById('player-title');
const playerArtist = document.getElementById('player-artist');
const playerImage = document.getElementById('player-image');
const nextBtn = document.getElementById('next-btn');
const prevBtn = document.getElementById('prev-btn');
const queueBtn = document.getElementById('queue-btn');
const closeQueueBtn = document.getElementById('close-queue-btn');
const queueModal = document.getElementById('queue-modal');
const queueList = document.getElementById('queue-list');
const searchForm = document.querySelector('.search-bar form');


searchForm.addEventListener('submit', async function(e) {
    e.preventDefault();  // stop full reload
    
    const query = document.querySelector('.search-bar input').value;
    const res = await fetch(`/result/?query=${encodeURIComponent(query)}`);
    const html = await res.text();
    
    // parse the response and extract just the content block
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');    
    const newContent = doc.querySelector('#main-content');
    document.getElementById('main-content').replaceWith(newContent);    
    // re-attach click listeners to new cards
    attachCardListeners();
});

async function playSong(videoId, title, artist, image, source= 'queue') {
    playerTitle.textContent = title;
    playerArtist.textContent = artist;
    playerImage.src = image;
    playPauseBtn.innerHTML = '&#9646;&#9646;';

    const res = await fetch('/now-playing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: source, id: videoId, title: title, artist:artist, image:image})
    });
    const { url } = await res.json();
    audioPlayer.src = url;
    audioPlayer.load();
    audioPlayer.oncanplay = () => audioPlayer.play();
}

function attachCardListeners() {
    document.querySelectorAll('.song-card').forEach(function(card) {
        card.addEventListener('click', async function() {
            const { title, artist, image, videoid } = card.dataset;
            await playSong(videoid, title, artist, image, 'card');
        });
    });
}
document.getElementById('main-content').replaceWith(newContent);
attachCardListeners();

// Step C — Play/Pause button
playPauseBtn.addEventListener('click', function() {
    if (audioPlayer.paused) {
        audioPlayer.play();
        playPauseBtn.innerHTML = '&#9646;&#9646;';
    } else {
        audioPlayer.pause();
        playPauseBtn.innerHTML = '&#9654;';          
    }
});


// Step D — Update seek bar and time as song plays
audioPlayer.addEventListener('timeupdate', function() {
    const current = audioPlayer.currentTime;   // seconds elapsed
    const total = audioPlayer.duration;        // total seconds

    // Update seek bar position
    seekBar.value = (current / total) * 100;

    // Format seconds into m:ss and display
    currentTimeEl.textContent = formatTime(current);
    durationEl.textContent = formatTime(total);
});

// Helper function to convert seconds to m:ss format
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
}

// Step E — Clicking the seek bar to jump to a position
seekBar.addEventListener('input', function() {
    const seekTo = (seekBar.value / 100) * audioPlayer.duration;
    audioPlayer.currentTime = seekTo;
});

// When song ends, auto fetch next from queue
audioPlayer.addEventListener('ended', async function() {
    const res = await fetch('/queue/next');
    const song = await res.json();
    await playSong(song.videoId, song.title, song.singers, song.image);
});

nextBtn.addEventListener('click', async function() {
    const res = await fetch('/queue/next');
    const song = await res.json();
    await playSong(song.videoId, song.title, song.singers, song.image);
});

prevBtn.addEventListener('click', async function() {
    const res = await fetch('/queue/prev');
    const song = await res.json();
    await playSong(song.videoId, song.title, song.singers, song.image);
});

const songgrid = document.querySelector('.song-grid');


// Open/close queue modal
queueBtn.addEventListener('click', async function() {
    queueModal.classList.toggle('hidden');
    if (!queueModal.classList.contains('hidden')) {
        await refreshQueue();
    }
});

closeQueueBtn.addEventListener('click', function() {
    queueModal.classList.add('hidden');
});

async function refreshQueue() {
    const res = await fetch('/queue');
    const data = await res.json();  // { tracks: [...], cur_idx: N }

    queueList.innerHTML = '';

    data.tracks.forEach(function(song, i) {
        const item = document.createElement('div');
        item.className = 'queue-item' + (i === data.cur_idx ? ' now-playing' : '');
        item.innerHTML = `
            <img src="${song.image}" alt="${song.title}">
            <div class="queue-item-info">
                <p class="queue-item-title">${song.title}</p>
                <p class="queue-item-artist">${song.singers}</p>
            </div>
            ${i === data.cur_idx ? '<span style="color:#e75858;font-size:11px;">▶ Now</span>' : ''}
        `;
        queueList.appendChild(item);
    });

    // scroll currently playing into view
    const nowPlaying = queueList.querySelector('.now-playing');
    if (nowPlaying) nowPlaying.scrollIntoView({ block: 'center' });
}