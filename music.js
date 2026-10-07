let player;
let queue = [];
let currentIndex = 0;
let playerReady = false;

let customPlaylists = JSON.parse(localStorage.getItem('fungi_custom_playlists')) || {};
let currentCustomPlaylistName = "";

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
    initPlaylistDropdown();
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
            alert("You might wanna check your end because I know my end is a-okay");
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
        console.error(err);
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

        const infoDiv = document.createElement("div");
        infoDiv.className = "track-info";
        infoDiv.style.flex = "1";

        const titleDiv = document.createElement("div");
        titleDiv.className = "track-title";
        titleDiv.style.fontWeight = "bold";
        titleDiv.textContent = song.title;

        const channelDiv = document.createElement("div");
        channelDiv.style.cssText = "font-size: 12px; color: #aaa; margin-top: 4px;";
        channelDiv.textContent = song.channel;

        infoDiv.appendChild(titleDiv);
        infoDiv.appendChild(channelDiv);
        div.appendChild(img);
        div.appendChild(infoDiv);

        const addBtn = document.createElement("button");
        addBtn.textContent = "+";
        addBtn.title = "Add to active custom playlist";
        addBtn.style.cssText = "padding: 5px 10px; font-size: 14px; border-radius: 5px; background: var(--glass-border); color: white;";
        addBtn.onclick = (e) => {
            e.stopPropagation();
            addSongToCustomPlaylist(song);
        };
        div.appendChild(addBtn);

        div.addEventListener("click", () => {
            currentIndex = i;
            playFromQueue();
        });

        el.appendChild(div);
    });
}


window.createCustomPlaylist = function() {
    const input = document.getElementById("playlist-name-input");
    const name = input ? input.value.trim() : "";
    if (!name) {
        alert("Ohh, I love that name!");
        return;
    }
    if (customPlaylists[name]) {
        alert("Do you potentionally have dimentia? That already exists gramps");
        return;
    }

    customPlaylists[name] = [];
    savePlaylists();
    input.value = "";
    initPlaylistDropdown();
    document.getElementById("playlist-select").value = name;
    switchCustomPlaylist();
};

function savePlaylists() {
    localStorage.setItem('fungi_custom_playlists', JSON.stringify(customPlaylists));
}

function initPlaylistDropdown() {
    const select = document.getElementById("playlist-select");
    if (!select) return;
    select.innerHTML = '<option value="">choose a playlist twin✌</option>';

    Object.keys(customPlaylists).forEach(name => {
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        select.appendChild(opt);
    });
}

window.switchCustomPlaylist = function() {
    const select = document.getElementById("playlist-select");
    currentCustomPlaylistName = select ? select.value : "";
    renderCustomPlaylistView();
};

function addSongToCustomPlaylist(song) {
    if (!currentCustomPlaylistName) {
        alert("May I ask you, what are you adding that song to? Ohh, no playlist, okay.");
        return;
    }
    const list = customPlaylists[currentCustomPlaylistName];
    if (list.some(s => s.id === song.id)) {
        alert("You must really like this song, noice");
        return;
    }

    list.push(song);
    savePlaylists();
    renderCustomPlaylistView();
    alert(`Added "${song.title}" to "${currentCustomPlaylistName}"!`);
}

function renderCustomPlaylistView() {
    const container = document.getElementById("custom-playlist-container");
    if (!container) return;
    container.innerHTML = "";

    if (!currentCustomPlaylistName || !customPlaylists[currentCustomPlaylistName]) {
        container.innerHTML = "<p style='color: #aaa; font-size: 14px;'>Ah yes, I love the sound of a placeholder</p>";
        return;
    }

    const songs = customPlaylists[currentCustomPlaylistName];

    const toolbar = document.createElement("div");
    toolbar.style.cssText = "grid-column: 1 / -1; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;";
    
    const titleSpan = document.createElement("span");
    titleSpan.style.fontWeight = "bold";
    titleSpan.textContent = `${currentCustomPlaylistName} (${songs.length} tracks)`;

    const actionsDiv = document.createElement("div");
    actionsDiv.style.display = "flex";
    actionsDiv.style.gap = "10px";

    const playAllBtn = document.createElement("button");
    playAllBtn.textContent = "play";
    playAllBtn.style.cssText = "padding: 6px 12px; font-size: 12px;";
    playAllBtn.onclick = () => {
        if (songs.length === 0) {
            alert("*you can't resist tapping your foot to the sweet beat of silence*");
            return;
        }
        queue = [...songs];
        currentIndex = 0;
        playFromQueue();
    };

    const deleteListBtn = document.createElement("button");
    deleteListBtn.textContent = "Delete Playlist";
    deleteListBtn.style.cssText = "padding: 6px 12px; font-size: 12px; background: #ff4d4d; color: white;";
    deleteListBtn.onclick = () => {
        if (confirm(`Are you sure you want to delete playlist "${currentCustomPlaylistName}"?`)) {
            delete customPlaylists[currentCustomPlaylistName];
            savePlaylists();
            currentCustomPlaylistName = "";
            initPlaylistDropdown();
            renderCustomPlaylistView();
        }
    };

    actionsDiv.appendChild(playAllBtn);
    actionsDiv.appendChild(deleteListBtn);
    toolbar.appendChild(titleSpan);
    toolbar.appendChild(actionsDiv);
    container.appendChild(toolbar);

    if (songs.length === 0) {
        const emptyMsg = document.createElement("p");
        emptyMsg.style.cssText = "grid-column: 1 / -1; color: #888; font-size: 13px;";
        emptyMsg.textContent = "*you can resist tapping your foot to the sweet beat of silence*";
        container.appendChild(emptyMsg);
        return;
    }

    songs.forEach((song, i) => {
        const div = document.createElement("div");
        div.className = "track";

        const img = document.createElement("img");
        img.src = song.image;
        img.className = "track-thumb";

        const infoDiv = document.createElement("div");
        infoDiv.className = "track-info";
        infoDiv.style.flex = "1";

        const titleDiv = document.createElement("div");
        titleDiv.style.fontWeight = "bold";
        titleDiv.textContent = song.title;

        const channelDiv = document.createElement("div");
        channelDiv.style.cssText = "font-size: 12px; color: #aaa; margin-top: 4px;";
        channelDiv.textContent = song.channel;

        infoDiv.appendChild(titleDiv);
        infoDiv.appendChild(channelDiv);
        div.appendChild(img);
        div.appendChild(infoDiv);

        const removeBtn = document.createElement("button");
        removeBtn.textContent = "✕";
        removeBtn.title = "Remove from playlist";
        removeBtn.style.cssText = "padding: 5px 10px; font-size: 12px; background: #ff4d4d; color: white; border-radius: 5px;";
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            customPlaylists[currentCustomPlaylistName].splice(i, 1);
            savePlaylists();
            renderCustomPlaylistView();
        };
        div.appendChild(removeBtn);

        div.addEventListener("click", () => {
            queue = [...songs];
            currentIndex = i;
            playFromQueue();
        });

        container.appendChild(div);
    });
}
