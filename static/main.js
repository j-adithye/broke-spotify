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

// Step B — Detect clicks on any song card
document.querySelectorAll('.song-card').forEach(function(card) {
    card.addEventListener('click', function() {

        // Read the data- attributes we stored on the card
        const url = card.dataset.url;
        const title = card.dataset.title;
        const artist = card.dataset.artist;
        const image = card.dataset.image;

        // Load into audio player
        audioPlayer.src = url;
        audioPlayer.play();

        // Update the player bar UI
        playerTitle.textContent = title;
        playerArtist.textContent = artist;
        playerImage.src = image;
        playPauseBtn.textContent = 'Pause';
    });
});

// Step C — Play/Pause button
playPauseBtn.addEventListener('click', function() {
    if (audioPlayer.paused) {
        audioPlayer.play();
        playPauseBtn.textContent = 'Pause';
    } else {
        audioPlayer.pause();
        playPauseBtn.textContent = 'Play';
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

