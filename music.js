let player;
let queue = [];
let currentIndex = 0;
let playerReady = false;

function setLoading(isLoading) {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = isLoading ? 'block' : 'none';
    }
}

window.onYouTubeIframeAPIReady = function() {
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
            },
            onStateChange: handleStateChange,
            onError: () => setLoading(false)
        }
    });
};

function handleStateChange(e) {
    if (e.data === YT.PlayerState.PLAYING) {
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

window.searchYouTube = async function() {
    const searchInput = document.getElementById("search-input");
    const query = searchInput ? searchInput.value.trim() : "";
    if (!query) return;

    const blopyblim = "AIzaSyDB3ijq7TdKKElkH16woL4htaUCCHVVCB4";

    try {
        const res = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&maxResults=10&key=${blopyblim}`
        );

        const data = await res.json();

        if (!data.items) {
            alert("Search failed");
            return;
        }

        queue = data.items.map(item => ({
            id: item.id.videoId,
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            image: item.snippet.thumbnails.medium ? item.snippet.thumbnails.medium.url : item.snippet.thumbnails.default.url
        }));

        currentIndex = 0;
        renderQueue();

    } catch (err) {
    }
};

function playFromQueue() {
    const item = queue[currentIndex];
    if (!item) return;

    setLoading(true);

    const nowPlayingContainer = document.getElementById("now-playing");

    if (nowPlayingContainer) {
        nowPlayingContainer.innerHTML = '';

        const wrapper = document.createElement('div');
        wrapper.style.cssText = "display: flex; align-items: center; gap: 15px; text-align: left;";

        const img = document.createElement('img');
        img.src = item.image;
        img.style.cssText = "width: 80px; height: 60px; border-radius: 8px; object-fit: cover; border: 1px solid var(--accent-color);";

        const textDiv = document.createElement('div');
        
        const titleDiv = document.createElement('div');
        titleDiv.style.cssText = "font-weight: bold; font-size: 16px;";
        titleDiv.textContent = item.title;

        const channelDiv = document.createElement('div');
        channelDiv.style.cssText = "font-size: 13px; color: var(--accent-color); opacity: 0.8;";
        channelDiv.textContent = item.channel;

        textDiv.appendChild(titleDiv);
        textDiv.appendChild(channelDiv);
        wrapper.appendChild(img);
        wrapper.appendChild(textDiv);
        nowPlayingContainer.appendChild(wrapper);
    }

    if (player && player.loadVideoById) {
        try {
            player.loadVideoById(item.id);
            player.playVideo();
        } catch (err) {
            setLoading(false);
        }
    }
    
    renderQueue();
}

window.togglePlay = function() {
    if (!player || !playerReady) return;

    const state = player.getPlayerState();

    if (state === YT.PlayerState.PLAYING) {
        player.pauseVideo();
    } else {
        player.playVideo();
    }
};

window.skip = function(seconds) {
    if (!player || typeof player.getCurrentTime !== 'function') return;
    let t = player.getCurrentTime();
    player.seekTo(t + seconds, true);
};

window.adjustVolume = function(v) {
    if (!player || typeof player.setVolume !== 'function') return;
    player.setVolume(v * 100);
};

function renderQueue() {
    const el = document.getElementById("playlist");
    if (!el) return;
    el.innerHTML = "";

    queue.forEach((song, i) => {
        const div = document.createElement("div");
        div.className = "track";
        
        if (i === currentIndex && playerReady) {
            div.style.borderColor = "var(--accent-color)";
        }

        const img = document.createElement("img");
        img.src = song.image;
        img.className = "track-thumb";
        img.style.pointerEvents = "none";

        const infoDiv = document.createElement("div");
        infoDiv.className = "track-info";
        infoDiv.style.pointerEvents = "none";

        const titleDiv = document.createElement("div");
        titleDiv.className = "track-title";
        titleDiv.style.fontWeight = "bold";
        titleDiv.textContent = song.title;

        const channelDiv = document.createElement("div");
        channelDiv.className = "track-channel";
        channelDiv.style.cssText = "font-size: 12px; color: #aaa; margin-top: 4px;";
        channelDiv.textContent = song.channel;

        infoDiv.appendChild(titleDiv);
        infoDiv.appendChild(channelDiv);
        div.appendChild(img);
        div.appendChild(infoDiv);

        div.addEventListener("click", () => {
            currentIndex = i;
            playFromQueue();
        });

        el.appendChild(div);
    });
}
