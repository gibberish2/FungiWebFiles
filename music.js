let player;
let queue = [];
let currentIndex = 0;
let playerReady = false;

/* -----------------------------
   LOADER (shows/hides the animation)
----------------------------- */
function setLoading(isLoading) {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.toggle('active', isLoading);
}

/* -----------------------------
   INIT YOUTUBE PLAYER
----------------------------- */
function onYouTubeIframeAPIReady() {
    console.log("YT API Loaded");

    player = new YT.Player('ytplayer', {
        height: '1',
        width: '1',
        videoId: '',
        playerVars: {
            autoplay: 1,
            playsinline: 1
        },
        events: {
            onReady: () => {
                playerReady = true;
                console.log("YouTube Player Ready");
            },
            onStateChange: onStateChange,
            onError: () => setLoading(false) // don't leave the loader stuck if a video fails
        }
    });
}

function onStateChange(e) {
    if (e.data === YT.PlayerState.BUFFERING) {
        setLoading(true);
    } else if (e.data === YT.PlayerState.PLAYING || e.data === YT.PlayerState.PAUSED) {
        setLoading(false);
    }

    if (e.data === YT.PlayerState.ENDED) {
        currentIndex++;
        if (currentIndex < queue.length) {
            playFromQueue();
        } else {
            setLoading(false);
        }
    }
}

/* -----------------------------
    SEARCH YOUTUBE (Updated)
----------------------------- */
window.searchYouTube = async function () {
    const query = document.getElementById("search-input").value;
    if (!query) return;

    setLoading(true);

    const blopyblim = "AIzaSyDB3ijq7TdKKElkH16woL4htaUCCHVVCB4";

    try {
        const res = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&maxResults=10&key=${blopyblim}`
        );

        const data = await res.json();

        if (!data.items) {
            console.error("API Error:", data);
            alert("Search failed (check API key or quota)");
            setLoading(false);
            return;
        }

        // ADDED: item.snippet.channelTitle
        queue = data.items.map(item => ({
            id: item.id.videoId,
            title: item.snippet.title,
            channel: item.snippet.channelTitle, 
            image: item.snippet.thumbnails.medium.url
        }));

        currentIndex = 0;
        renderQueue();

        // Don't auto-play: just show the results and wait for a click
        setLoading(false);

    } catch (err) {
        console.error("Fetch error:", err);
        setLoading(false);
    }
}
/* -----------------------------
   PLAYBACK
----------------------------- */
function playFromQueue() {
    const item = queue[currentIndex];
    if (!item) return;

    const nowPlayingContainer = document.getElementById("now-playing");
    
    if (nowPlayingContainer) {
        nowPlayingContainer.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px; text-align: left;">
                <img src="${item.image}" style="width: 80px; height: 60px; border-radius: 8px; object-fit: cover; border: 1px solid var(--accent-color);">
                <div>
                    <div style="font-weight: bold; font-size: 16px;">${item.title}</div>
                    <div style="font-size: 13px; color: var(--accent-color); opacity: 0.8;">${item.channel}</div>
                </div>
            </div>
        `;
    }

    setLoading(true);

    if (player && player.loadVideoById) {
        try {
            player.loadVideoById(item.id);
            player.playVideo();
        } catch (err) {
            console.error("Playback error:", err);
            setLoading(false);
        }
    }
}
function togglePlay() {
    if (!player || !playerReady) return;

    const state = player.getPlayerState();

    if (state === YT.PlayerState.PLAYING) {
        player.pauseVideo();
    } else {
        player.playVideo();
    }
}
function skip(seconds) {
    if (!player) return;
    let t = player.getCurrentTime();
    player.seekTo(t + seconds, true);
}

function adjustVolume(v) {
    if (!player) return;
    player.setVolume(v * 100);
}

/* -----------------------------
   QUEUE RENDER
----------------------------- */
function renderQueue() {
    const el = document.getElementById("playlist");
    if (!el) return;
    el.innerHTML = "";

    queue.forEach((song, i) => {
        const div = document.createElement("div");
        div.className = "track";

        div.innerHTML = `
            <img src="${song.image}" class="track-thumb" style="pointer-events: none;" />
            <div class="track-info" style="pointer-events: none;">
                <div class="track-title" style="font-weight: bold;">${song.title}</div>
                <div class="track-channel" style="font-size: 12px; color: #aaa; margin-top: 4px;">
                    ${song.channel}
                </div>
            </div>
        `;

        // Using arrow function to ensure 'i' stays correct for the click
        div.addEventListener("click", () => {
            currentIndex = i;
            playFromQueue();
        });

        el.appendChild(div);
    });
}
window.togglePlay = togglePlay;
