// ==========================================
// YOUTUBE PLAYER AND PLAYLIST VARIABLES
// ==========================================

// YouTube Data API key. Restrict this key to your site and the YouTube Data API.
const FUNGI_YOUTUBE_API_KEY = "AIzaSyDB3ijq7TdKKElkH16woL4htaUCCHVVCB4";

// Stores the YouTube player object once the YouTube API creates it.
let player;

// Stores the songs currently in the main playback queue.
let queue = [];

// Tracks which song in the queue is currently selected.
let currentIndex = 0;

// Tracks whether the YouTube player has finished initializing.
let playerReady = false;

// Loads previously saved custom playlists from the browser's localStorage.
// If no playlists have been saved yet, starts with an empty object.
let customPlaylists = JSON.parse(localStorage.getItem('fungi_custom_playlists')) || {};

// Stores the name of the custom playlist currently selected by the user.
let currentCustomPlaylistName = "";
let selectedArtist = null;


// ==========================================
// LOADING INDICATOR
// ==========================================

// Shows or hides the loading indicator depending on the isLoading value.
function setLoading(isLoading) {
    const loader = document.getElementById('loader');

    // Only changes the loader if the element exists on the page.
    if (loader) {
        loader.style.display = isLoading ? 'block' : 'none';
    }
}


// ==========================================
// YOUTUBE PLAYER INITIALIZATION
// ==========================================

// This function is automatically called by the YouTube API
// when its iframe player code has finished loading.
window.onYouTubeIframeAPIReady = function() {

    // Creates the YouTube player inside the HTML element with the ID "ytplayer".
    player = new YT.Player('ytplayer', {
        height: '1',
        width: '1',
        videoId: '',

        // Settings passed to the YouTube player.
        playerVars: {
            autoplay: 1,
            playsinline: 1
        },

        // Events that run when something happens to the player.
        events: {

            // Runs when the YouTube player is ready to be used.
            onReady: () => {
                playerReady = true;
            },

            // Runs whenever the player's playback state changes.
            onStateChange: handleStateChange,

            // Runs if the player encounters an error.
            // Hides the loading indicator when that happens.
            onError: () => setLoading(false)
        }
    });

    // Fills the custom playlist dropdown with saved playlists.
    initPlaylistDropdown();
};


// ==========================================
// YOUTUBE PLAYBACK STATE HANDLER
// ==========================================

// Handles changes in the YouTube player's playback state.
// For example: playing, paused, or finished.
function handleStateChange(e) {

    // If a video starts playing, hide the loading indicator.
    if (e.data === YT.PlayerState.PLAYING) {
        setLoading(false);
    }

    // If a video finishes playing, move to the next song in the queue.
    if (e.data === YT.PlayerState.ENDED) {
        currentIndex++;

        // If another song exists, play it.
        if (currentIndex < queue.length) {
            playFromQueue();
        } else {
            // Otherwise, the queue is finished.
            setLoading(false);
        }
    }
}


// The combined Fungi search is defined in the artist/search section below.

// ==========================================
// PLAY SONG FROM QUEUE
// ==========================================

// Plays whichever song is currently selected by currentIndex.
function playFromQueue() {

    // Gets the song at the current position in the queue.
    const item = queue[currentIndex];

    // Stops if there isn't a song at that position.
    if (!item) return;

    // Shows the loading indicator while the video loads.
    setLoading(true);

    // Finds the HTML container where the currently playing song is displayed.
    const nowPlayingContainer = document.getElementById("now-playing");

    if (nowPlayingContainer) {

        // Clears the previous song information.
        nowPlayingContainer.innerHTML = '';

        // Creates a container for the thumbnail and song information.
        const wrapper = document.createElement('div');
        wrapper.style.cssText = "display: flex; align-items: center; gap: 15px; text-align: left;";

        // Creates the song's thumbnail image.
        const img = document.createElement('img');
        img.src = item.image;
        img.style.cssText = "width: 80px; height: 60px; border-radius: 8px; object-fit: cover; border: 1px solid var(--accent-color);";

        // Creates a container for the title and channel name.
        const textDiv = document.createElement('div');

        // Creates and styles the song title.
        const titleDiv = document.createElement('div');
        titleDiv.style.cssText = "font-weight: bold; font-size: 16px;";
        titleDiv.textContent = item.title;

        // Creates and styles the YouTube channel name.
        const channelDiv = document.createElement('div');
        channelDiv.style.cssText = "font-size: 13px; color: var(--accent-color); opacity: 0.8;";
        channelDiv.textContent = item.channel;

        // Places the title and channel inside their text container.
        textDiv.appendChild(titleDiv);
        textDiv.appendChild(channelDiv);

        // Places the thumbnail and text inside the main wrapper.
        wrapper.appendChild(img);
        wrapper.appendChild(textDiv);

        // Adds the finished song information to the page.
        nowPlayingContainer.appendChild(wrapper);
    }

    // Checks that the YouTube player exists and has the loadVideoById method.
    if (player && player.loadVideoById) {
        try {

            // Loads the selected YouTube video using its video ID.
            player.loadVideoById(item.id);

            // Tells the player to start playing the video.
            player.playVideo();

        } catch (err) {

            // Hides the loading indicator if something goes wrong.
            setLoading(false);
        }
    }

    // Updates the visible queue to reflect the current song.
    renderQueue();
}


// ==========================================
// PLAY / PAUSE BUTTON
// ==========================================

// Switches between playing and pausing the current YouTube video.
window.togglePlay = function() {

    // Makes sure the player exists and is ready before doing anything.
    if (!player || !playerReady) return;

    // Gets the current playback state from YouTube.
    const state = player.getPlayerState();

    // If the video is playing, pause it.
    if (state === YT.PlayerState.PLAYING) {
        player.pauseVideo();
    } else {

        // If it isn't playing, tell YouTube to play it.
        player.playVideo();
    }
};


// ==========================================
// SKIP FORWARD / BACKWARD
// ==========================================

// Moves the video forward or backward by the number of seconds provided.
// Example: skip(10) skips forward 10 seconds.
// Example: skip(-10) skips backward 10 seconds.
window.skip = function(seconds) {

    // Makes sure the player exists and supports getting its current time.
    if (!player || typeof player.getCurrentTime !== 'function') return;

    // Gets the current playback position in seconds.
    let t = player.getCurrentTime();

    // Moves the playback position by the requested number of seconds.
    player.seekTo(t + seconds, true);
};


// ==========================================
// VOLUME CONTROL
// ==========================================

// Changes the YouTube player's volume.
// The input value is expected to be between 0 and 1.
window.adjustVolume = function(v) {

    // Makes sure the player exists and supports volume adjustment.
    if (!player || typeof player.setVolume !== 'function') return;
        // YouTube expects volume values from 0 to 100,
    // so multiplying by 100 converts the input value.
    player.setVolume(v * 100);
};


// ==========================================
// RENDER MAIN PLAYLIST / SEARCH RESULTS
// ==========================================

// Displays all songs currently stored in the main queue.
function renderQueue() {

    // Finds the HTML element where the queue will be displayed.
    const el = document.getElementById("playlist");

    // Stops if the playlist element doesn't exist.
    if (!el) return;

    // Clears the old playlist before adding the updated results.
    el.innerHTML = "";

    // Goes through every song in the queue.
    // "song" represents the current song, and "i" is its position.
    queue.forEach((song, i) => {

        // Creates a container for this individual track.
        const div = document.createElement("div");
        div.className = "track";

        // Highlights the currently selected song.
        if (i === currentIndex && playerReady) {
            div.style.borderColor = "var(--accent-color)";
        }

        // Creates the song thumbnail.
        const img = document.createElement("img");
        img.src = song.image;
        img.className = "track-thumb";

        // Creates a container for the song title and channel.
        const infoDiv = document.createElement("div");
        infoDiv.className = "track-info";
        infoDiv.style.flex = "1";

        // Creates the song title.
        const titleDiv = document.createElement("div");
        titleDiv.className = "track-title";
        titleDiv.style.fontWeight = "bold";
        titleDiv.textContent = song.title;

        // Creates the channel name.
        const channelDiv = document.createElement("div");
        channelDiv.style.cssText = "font-size: 12px; color: #aaa; margin-top: 4px;";
        channelDiv.textContent = song.channel;

        // Adds the title and channel to the information container.
        infoDiv.appendChild(titleDiv);
        infoDiv.appendChild(channelDiv);

        // Adds the thumbnail and information to the track container.
        div.appendChild(img);
        div.appendChild(infoDiv);

        // Creates a button to add this song to a custom playlist.
        const addBtn = document.createElement("button");
        addBtn.textContent = "+";
        addBtn.title = "Add to active custom playlist";
        addBtn.style.cssText = "padding: 5px 10px; font-size: 14px; border-radius: 5px; background: var(--glass-border); color: white;";

        // Runs when the plus button is clicked.
        addBtn.onclick = (e) => {

            // Prevents clicking the plus button from also playing the track.
            e.stopPropagation();

            // Adds this song to the currently selected custom playlist.
            addSongToCustomPlaylist(song);
        };

        div.appendChild(addBtn);

        // Runs when the track itself is clicked.
        // Changes the selected song and starts playing it.
        div.addEventListener("click", () => {
            currentIndex = i;
            playFromQueue();
        });

        // Adds the finished track to the playlist on the page.
        el.appendChild(div);
    });
}


// ==========================================
// CREATE A CUSTOM PLAYLIST
// ==========================================

// Creates a new custom playlist using the name entered by the user.
window.createCustomPlaylist = function() {

    // Gets the playlist name input from the HTML.
    const input = document.getElementById("playlist-name-input");

    // Gets the entered name and removes extra spaces.
    const name = input ? input.value.trim() : "";

    // Stops if the user didn't enter a playlist name.
    if (!name) {
        alert("Ohh, I love that name!");
        return;
    }

    // Prevents the user from creating a playlist with a name that already exists.
    if (customPlaylists[name]) {
        alert("Do you potentionally have dimentia? That already exists gramps");
        return;
    }

    // Creates a new empty playlist using the entered name as its key.
    customPlaylists[name] = [];

    // Saves the updated playlists in localStorage.
    savePlaylists();

    // Clears the playlist name input.
    input.value = "";

    // Refreshes the playlist dropdown so the new playlist appears.
    initPlaylistDropdown();

    // Automatically selects the playlist that was just created.
    document.getElementById("playlist-select").value = name;

    // Switches the page to display the newly created playlist.
    switchCustomPlaylist();
};


// ==========================================
// SAVE CUSTOM PLAYLISTS
// ==========================================

// Converts the custom playlists object into JSON text
// and saves it in the browser's localStorage.
// This allows playlists to remain saved after refreshing the page.
function savePlaylists() {
    localStorage.setItem('fungi_custom_playlists', JSON.stringify(customPlaylists));
}


// ==========================================
// INITIALIZE PLAYLIST DROPDOWN
// ==========================================

// Adds all saved custom playlists to the playlist selection dropdown.
function initPlaylistDropdown() {

    // Finds the dropdown element in the HTML.
    const select = document.getElementById("playlist-select");

    // Stops if the dropdown doesn't exist.
    if (!select) return;

    // Clears the dropdown and adds its default placeholder option.
    select.innerHTML = '<option value="">choose a playlist twin✌</option>';

    // Gets every playlist name and creates an option for each one.
    Object.keys(customPlaylists).forEach(name => {

        // Creates a new dropdown option.
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;

        // Adds the option to the dropdown.
        select.appendChild(opt);
    });
}


// ==========================================
// SWITCH BETWEEN CUSTOM PLAYLISTS
// ==========================================

// Changes which custom playlist is currently selected.
window.switchCustomPlaylist = function() {

    // Gets the selected playlist name from the dropdown.
    const select = document.getElementById("playlist-select");
    currentCustomPlaylistName = select ? select.value : "";

    // Updates the visible custom playlist to show the selected playlist.
    renderCustomPlaylistView();
};


// ==========================================
// ADD SONG TO CUSTOM PLAYLIST
// ==========================================

// Adds a song object to whichever custom playlist is currently selected.
function addSongToCustomPlaylist(song) {

    // Makes sure the user has selected a custom playlist first.
    if (!currentCustomPlaylistName) {
        alert("May I ask you, what are you adding that song to? Ohh, no playlist, okay.");
        return;
    }


    customPlaylists[currentCustomPlaylistName].push(song);
    // Saves the updated playlists.
    savePlaylists();

    // Refreshes the custom playlist display.
    renderCustomPlaylistView();

    // Tells the user the song was added.
    alert(`Added "${song.title}" to "${currentCustomPlaylistName}"!`);
}


// ==========================================
// DISPLAY CUSTOM PLAYLIST
// ==========================================

// Builds and displays the contents and controls of the selected custom playlist.
function renderCustomPlaylistView() {

    // Finds the HTML container where the custom playlist will appear.
    const container = document.getElementById("custom-playlist-container");

    // Stops if the container doesn't exist.
    if (!container) return;

    // Clears the previous playlist display.
    container.innerHTML = "";

    // If no playlist is selected, show a placeholder message.
    if (!currentCustomPlaylistName || !customPlaylists[currentCustomPlaylistName]) {
        container.innerHTML = "<p style='color: #aaa; font-size: 14px;'>Ah yes, I love the sound of a placeholder</p>";
        return;
    }

    // Gets the songs stored in the currently selected playlist.
    const songs = customPlaylists[currentCustomPlaylistName];
        // Creates a toolbar for the playlist title and its buttons.
    const toolbar = document.createElement("div");
    toolbar.style.cssText = "grid-column: 1 / -1; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;";

    // Creates the playlist title and displays how many tracks it contains.
    const titleSpan = document.createElement("span");
    titleSpan.style.fontWeight = "bold";
    titleSpan.textContent = `${currentCustomPlaylistName} (${songs.length} tracks)`;

    // Creates a container for the playlist action buttons.
    const actionsDiv = document.createElement("div");
    actionsDiv.style.display = "flex";
    actionsDiv.style.gap = "10px";

    // Creates the button that plays every song in the playlist in order.
    const playAllBtn = document.createElement("button");
    playAllBtn.textContent = "play";
    playAllBtn.style.cssText = "padding: 6px 12px; font-size: 12px;";

    // Runs when the user clicks the play button.
    playAllBtn.onclick = () => {

        // Prevents trying to play an empty playlist.
        if (songs.length === 0) {
            alert("*you can't resist tapping your foot to the sweet beat of silence*");
            return;
        }

        // Copies the custom playlist into the main playback queue.
        queue = [...songs];

        // Starts at the first song.
        currentIndex = 0;

        // Plays the first song.
        playFromQueue();
    };

    // Creates the button used to delete the entire custom playlist.
    const deleteListBtn = document.createElement("button");
    deleteListBtn.textContent = "Delete Playlist";
    deleteListBtn.style.cssText = "padding: 6px 12px; font-size: 12px; background: #ff4d4d; color: white;";

    // Runs when the user clicks the delete playlist button.
    deleteListBtn.onclick = () => {

        // Asks the user to confirm before deleting the playlist.
        if (confirm(`Are you sure you want to delete playlist "${currentCustomPlaylistName}"?`)) {

            // Removes the selected playlist from the custom playlists object.
            delete customPlaylists[currentCustomPlaylistName];

            // Saves the updated playlists.
            savePlaylists();

            // Clears the currently selected playlist name.
            currentCustomPlaylistName = "";

            // Refreshes the dropdown and playlist display.
            initPlaylistDropdown();
            renderCustomPlaylistView();
        }
    };

    // Adds both action buttons to the toolbar.
    actionsDiv.appendChild(playAllBtn);
    actionsDiv.appendChild(deleteListBtn);

    // Adds the title and buttons to the toolbar.
    toolbar.appendChild(titleSpan);
    toolbar.appendChild(actionsDiv);

    // Adds the toolbar to the custom playlist container.
    container.appendChild(toolbar);

    // If the playlist is empty, display a message and stop here.
    if (songs.length === 0) {
        const emptyMsg = document.createElement("p");
        emptyMsg.style.cssText = "grid-column: 1 / -1; color: #888; font-size: 13px;";
        emptyMsg.textContent = "*you can resist tapping your foot to the sweet beat of silence*";
        container.appendChild(emptyMsg);
        return;
    }

    // Goes through each song in the selected custom playlist.
    songs.forEach((song, i) => {

        // Creates the container for an individual song.
        const div = document.createElement("div");
        div.className = "track";

        // Creates the song thumbnail.
        const img = document.createElement("img");
        img.src = song.image;
        img.className = "track-thumb";

        // Creates a container for the song's title and channel.
        const infoDiv = document.createElement("div");
        infoDiv.className = "track-info";
        infoDiv.style.flex = "1";

        // Creates the song title.
        const titleDiv = document.createElement("div");
        titleDiv.style.fontWeight = "bold";
        titleDiv.textContent = song.title;

        // Creates the YouTube channel name.
        const channelDiv = document.createElement("div");
        channelDiv.style.cssText = "font-size: 12px; color: #aaa; margin-top: 4px;";
        channelDiv.textContent = song.channel;

        // Adds the title and channel to the information container.
        infoDiv.appendChild(titleDiv);
        infoDiv.appendChild(channelDiv);

        // Adds the thumbnail and information to the track container.
        div.appendChild(img);
        div.appendChild(infoDiv);

        // Creates the button for removing a song from the custom playlist.
        const removeBtn = document.createElement("button");
        removeBtn.textContent = "✕";
        removeBtn.title = "Remove from playlist";
        removeBtn.style.cssText = "padding: 5px 10px; font-size: 12px; background: #ff4d4d; color: white; border-radius: 5px;";

        // Runs when the remove button is clicked.
        removeBtn.onclick = (e) => {

            // Prevents the click from also triggering the song's play action.
            e.stopPropagation();

            // Removes this song from the custom playlist using its position.
            customPlaylists[currentCustomPlaylistName].splice(i, 1);

            // Saves the updated playlists.
            savePlaylists();

            // Refreshes the displayed playlist.
            renderCustomPlaylistView();
        };

        // Adds the remove button to the song container.
        div.appendChild(removeBtn);

        // Runs when the song itself is clicked.
        // Copies the custom playlist into the main queue and plays this song.
        div.addEventListener("click", () => {
            queue = [...songs];
            currentIndex = i;
            playFromQueue();
        });

        // Adds the finished song to the page.
        container.appendChild(div);
    });
}

// ==========================================
// FUNGI ARTIST + COMBINED SEARCH SYSTEM
// ==========================================

// Artists saved on this browser. This does not require a database.
let fungiSavedArtists = [];
try {
    fungiSavedArtists = JSON.parse(localStorage.getItem("fungi_saved_artists")) || [];
} catch (error) {
    console.warn("Could not read saved artists:", error);
    fungiSavedArtists = [];
}

// The channel currently open in the artist profile.
selectedArtist = null;


// ==========================================
// YOUTUBE DATA API HELPER
// ==========================================

async function fungiYouTubeRequest(resource, parameters) {
    if (!FUNGI_YOUTUBE_API_KEY || FUNGI_YOUTUBE_API_KEY === "PASTE_YOUR_YOUTUBE_DATA_API_KEY_HERE") {
        throw new Error("Add your YouTube Data API key at the top of music.js.");
    }

    const url = new URL(`https://www.googleapis.com/youtube/v3/${resource}`);

    // Adds each setting (search term, channel ID, result count, etc.) to the URL.
    Object.entries(parameters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            url.searchParams.set(key, value);
        }
    });
    url.searchParams.set("key", FUNGI_YOUTUBE_API_KEY);

    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok || data.error) {
        throw new Error(data.error?.message || `YouTube API error (${response.status}).`);
    }
    return data;
}


// ==========================================
// ONE SEARCH BOX: SEARCH FOR SONGS AND ARTISTS
// ==========================================

window.searchYouTube = async function() {
    const input = document.getElementById("search-input");
    const query = input ? input.value.trim() : "";
    const artistResults = document.getElementById("artist-results");
    const songStatus = document.getElementById("song-search-status");
    const songResults = document.getElementById("playlist");

    if (!query) {
        songStatus.textContent = "Type something to search for artists and songs.";
        artistResults.innerHTML = "";
        songResults.innerHTML = "";
        return;
    }

    artistResults.textContent = "Finding artists...";
    songStatus.textContent = "Finding songs and videos...";
    songResults.innerHTML = "";

    try {
        // These two requests happen together: one finds channels, one finds videos.
        const [artistData, videoData] = await Promise.all([
            fungiYouTubeRequest("search", {
                part: "snippet", type: "channel", q: query, maxResults: 12
            }),
            fungiYouTubeRequest("search", {
                part: "snippet", type: "video", q: query, maxResults: 15, order: "relevance"
            })
        ]);

        // Draw the artist circles.
        fungiRenderArtistCircles(artistResults, (artistData.items || []).map(item => ({
            channelId: item.id.channelId,
            title: item.snippet.title,
            description: item.snippet.description || "",
            thumbnail: item.snippet.thumbnails?.high?.url ||
                item.snippet.thumbnails?.medium?.url ||
                item.snippet.thumbnails?.default?.url || ""
        })));

        // Convert YouTube video results into the song format the existing player uses.
        queue = (videoData.items || []).map(item => fungiConvertVideo(item)).filter(Boolean);
        currentIndex = 0;
        renderQueue();
        songStatus.textContent = queue.length
                    ? `${queue.length} songs/videos found for “${query}”. Click one to play it.`
            : "No songs or videos found for that search.";

    } catch (error) {
        console.error("Combined search error:", error);
        artistResults.textContent = "Artist search couldn't load.";
        songStatus.textContent = `Search failed: ${error.message}`;
    }
};

// Keep the old function name working for any existing button or script that calls it.
window.searchArtists = window.searchYouTube;


// ==========================================
// SHOW ARTISTS AS CLICKABLE CIRCLES
// ==========================================

function fungiRenderArtistCircles(container, artists) {
    container.innerHTML = "";
    if (!artists.length) {
        container.textContent = "No matching artists or channels found.";
        return;
    }

    artists.forEach(artist => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "artist-circle";
        button.title = `Open ${artist.title}'s channel`;
        button.addEventListener("click", () => fungiOpenArtist(artist));

        const image = document.createElement("img");
        image.src = artist.thumbnail || "";
        image.alt = `${artist.title} profile picture`;
        image.loading = "lazy";

        const name = document.createElement("span");
        name.textContent = artist.title;

        button.appendChild(image);
        button.appendChild(name);
        container.appendChild(button);
    });
}


// ==========================================
// SAVE AND DISPLAY ARTISTS
// ==========================================

function fungiSaveArtist(artist) {
    if (fungiSavedArtists.some(saved => saved.channelId === artist.channelId)) {
        alert("That artist is already saved.");
        return;
    }
    fungiSavedArtists.push(artist);
    localStorage.setItem("fungi_saved_artists", JSON.stringify(fungiSavedArtists));
    fungiRenderSavedArtists();
}

function fungiRenderSavedArtists() {
    const container = document.getElementById("saved-artists");
    if (!container) return;

    // Keep the saved-artist circles clickable; right-click is not needed to remove one.
    container.innerHTML = "";
    if (!fungiSavedArtists.length) {
        container.textContent = "No saved artists yet. Save an artist from their channel profile.";
        return;
    }

    fungiSavedArtists.forEach(artist => {
        const wrapper = document.createElement("div");
        wrapper.style.cssText = "display:flex; flex-direction:column; align-items:center; gap:5px;";

        const button = document.createElement("button");
        button.type = "button";
        button.className = "artist-circle";
        button.addEventListener("click", () => fungiOpenArtist(artist));

        const image = document.createElement("img");
        image.src = artist.thumbnail || "";
        image.alt = `${artist.title} profile picture`;
        image.loading = "lazy";

        const name = document.createElement("span");
        name.textContent = artist.title;
        button.appendChild(image);
        button.appendChild(name);

        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "Remove";
        remove.style.cssText = "font-size:11px; padding:5px 9px;";
        remove.addEventListener("click", () => {
            fungiSavedArtists = fungiSavedArtists.filter(item => item.channelId !== artist.channelId);
            localStorage.setItem("fungi_saved_artists", JSON.stringify(fungiSavedArtists));
            fungiRenderSavedArtists();
        });

        wrapper.appendChild(button);
        wrapper.appendChild(remove);
        container.appendChild(wrapper);
    });
}


// ==========================================
// OPEN A CHANNEL PROFILE
// ==========================================

async function fungiOpenArtist(artist) {
    selectedArtist = artist;

    const view = document.getElementById("artist-channel-view");
    const info = document.getElementById("artist-channel-info");
    const videos = document.getElementById("artist-channel-videos");
    const playlists = document.getElementById("artist-channel-playlists");

    view.style.display = "block";
    info.textContent = "Loading channel information...";
    videos.textContent = "Loading most viewed videos...";
    playlists.innerHTML = "";

    try {
        const data = await fungiYouTubeRequest("channels", {
            part: "snippet,statistics,contentDetails", id: artist.channelId
        });
        if (!data.items || !data.items.length) {
            info.textContent = "Channel information is unavailable.";
            return;
        }

        const channel = data.items[0];
        selectedArtist = {
            channelId: channel.id,
            title: channel.snippet.title,
            description: channel.snippet.description || "",
            thumbnail: channel.snippet.thumbnails?.high?.url ||
                channel.snippet.thumbnails?.medium?.url || artist.thumbnail || "",
            uploadsPlaylistId: channel.contentDetails?.relatedPlaylists?.uploads || ""
        };

        info.innerHTML = "";
        const image = document.createElement("img");
        image.className = "artist-profile-avatar";
        image.src = selectedArtist.thumbnail;
        image.alt = `${selectedArtist.title} profile picture`;

        const title = document.createElement("h2");
        title.textContent = selectedArtist.title;
        title.style.margin = "4px 0";

        const description = document.createElement("p");
        description.style.cssText = "color:#aaa; white-space:pre-wrap; margin:0;";
        description.textContent = selectedArtist.description || "No channel description provided.";

        const subscribers = channel.statistics?.hiddenSubscriberCount
            ? "Hidden"
            : channel.statistics?.subscriberCount
                ? Number(channel.statistics.subscriberCount).toLocaleString()
                : "Unavailable";
        const videoCount = channel.statistics?.videoCount
            ? Number(channel.statistics.videoCount).toLocaleString()
            : "Unavailable";

        const stats = document.createElement("p");
        stats.textContent = `Subscribers: ${subscribers} | Videos: ${videoCount}`;

        const link = document.createElement("a");
        link.href = `https://www.youtube.com/channel/${channel.id}`;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "Visit YouTube Channel";
        link.style.color = "var(--accent-color)";

        const saveButton = document.createElement("button");
        saveButton.type = "button";
        saveButton.textContent = "Save Artist";
        saveButton.addEventListener("click", () => fungiSaveArtist(selectedArtist));

        info.append(image, title, description, stats, link, saveButton);

        // First show the channel's most-viewed videos, not just its newest uploads.
        await loadArtistMostViewed();

    } catch (error) {
        console.error("Channel loading error:", error);
        info.textContent = `Couldn't load this channel: ${error.message}`;
    }
}


// ==========================================
// CONVERT YOUTUBE VIDEO RESULTS TO OUR SONG FORMAT
// ==========================================

function fungiConvertVideo(item, fallbackChannelId = "") {
    const snippet = item.snippet || {};
    const videoId = item.id?.videoId || snippet.resourceId?.videoId || item.contentDetails?.videoId;
    if (!videoId) return null;

    return {
        id: videoId,
        title: snippet.title || "Untitled video",
        channel: snippet.channelTitle || selectedArtist?.title || "YouTube channel",
        channelId: snippet.channelId || fallbackChannelId,
        image: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url ||
            `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
    };
}

function fungiRenderArtistVideos(container, songs) {
    container.innerHTML = "";
    if (!songs.length) {
        container.textContent = "No videos found for this channel and search.";
        return;
    }

    songs.forEach((song, index) => {
        const card = document.createElement("div");
        card.className = "track";
        card.title = "Click to play this video";

        const image = document.createElement("img");
        image.className = "track-thumb";
        image.src = song.image;
        image.alt = song.title;
        image.loading = "lazy";

        const info = document.createElement("div");
        info.className = "track-info";
        const title = document.createElement("div");
        title.className = "track-title";
        title.textContent = song.title;
        const channel = document.createElement("div");
        channel.style.cssText = "font-size:12px; color:#aaa; margin-top:4px;";
        channel.textContent = song.channel;
        info.append(title, channel);
        card.append(image, info);

        card.addEventListener("click", () => {
            queue = songs;
            currentIndex = index;
            playFromQueue();
        });
        container.appendChild(card);
    });
}

// ==========================================
// MOST VIEWED VIDEOS FROM THE SELECTED CHANNEL
// ==========================================

window.loadArtistMostViewed = async function() {
    if (!selectedArtist) return;
    const container = document.getElementById("artist-channel-videos");
    container.textContent = "Loading most viewed videos...";

    try {
        const data = await fungiYouTubeRequest("search", {
            part: "snippet",
            type: "video",
            channelId: selectedArtist.channelId,
            order: "viewCount",
            maxResults: 20
        });
        const songs = (data.items || [])
            .map(item => fungiConvertVideo(item, selectedArtist.channelId))
            .filter(Boolean);
        fungiRenderArtistVideos(container, songs);
    } catch (error) {
        console.error("Most viewed videos error:", error);
        container.textContent = `Couldn't load popular videos: ${error.message}`;
    }
};

// Kept as a compatibility alias for any old button or code.
window.loadArtistUploads = window.loadArtistMostViewed;


// ==========================================
// SEARCH USING THE SAME SINGLE SEARCH BOX, BUT INSIDE THIS CHANNEL
// ==========================================

window.searchArtistChannel = async function() {
    if (!selectedArtist) {
        alert("Open an artist's channel first.");
        return;
    }

    const input = document.getElementById("search-input");
    const query = input ? input.value.trim() : "";
    const container = document.getElementById("artist-channel-videos");
    if (!query) {
        container.textContent = "Type a search in the main Fungi search box first.";
        return;
    }

    container.textContent = `Loading all uploads from ${selectedArtist.title} so Fungi can search them...`;
    try {
        // A channel's uploads are stored in a special playlist. We walk through
        // every page (50 videos at a time), instead of only searching a small
        // sample of the channel's videos.
        if (!selectedArtist.uploadsPlaylistId) {
            throw new Error("This channel's uploads playlist is unavailable.");
        }

        const allUploads = [];
        let pageToken = "";
        let pageNumber = 0;

        do {
            const page = await fungiYouTubeRequest("playlistItems", {
                part: "snippet,contentDetails",
                playlistId: selectedArtist.uploadsPlaylistId,
                maxResults: 50,
                pageToken
            });

            allUploads.push(...(page.items || []));
            pageToken = page.nextPageToken || "";
            pageNumber++;
            container.textContent = `Loading channel uploads... ${allUploads.length} videos checked`;
        } while (pageToken);

        // Search the title and description of every upload we retrieved.
        const searchWords = query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
        const matchingSongs = allUploads
            .filter(item => {
                const searchableText = `${item.snippet?.title || ""} ${item.snippet?.description || ""}`.toLocaleLowerCase();
                return searchWords.every(word => searchableText.includes(word));
            })
            .map(item => fungiConvertVideo(item, selectedArtist.channelId))
            .filter(Boolean);

        fungiRenderArtistVideos(container, matchingSongs);
        if (!matchingSongs.length) {
            container.textContent = `No uploaded videos from ${selectedArtist.title} matched “${query}”. Checked ${allUploads.length} uploads.`;
        }
    } catch (error) {
        console.error("Channel search error:", error);
        container.textContent = `Channel search failed: ${error.message}`;
    }
};


// ==========================================
// LOAD A CHANNEL'S PUBLIC PLAYLISTS
// ==========================================

window.loadArtistPlaylists = async function() {
    if (!selectedArtist) return;
    const container = document.getElementById("artist-channel-playlists");
    container.textContent = "Loading public playlists...";

    try {
        const data = await fungiYouTubeRequest("playlists", {
            part: "snippet,contentDetails",
            channelId: selectedArtist.channelId,
            maxResults: 15
        });
        container.innerHTML = "";
        if (!data.items || !data.items.length) {
            container.textContent = "No public playlists found.";
            return;
        }

        data.items.forEach(playlist => {
            const row = document.createElement("div");
            row.className = "track";
            const title = document.createElement("div");
            title.className = "track-info";
            title.textContent = `${playlist.snippet.title} (${playlist.contentDetails?.itemCount ?? "?"} videos)`;
            const openButton = document.createElement("button");
            openButton.type = "button";
            openButton.textContent = "Open";
            openButton.addEventListener("click", () => fungiLoadPublicPlaylist(playlist.id));
            row.append(title, openButton);
            container.appendChild(row);
        });
    } catch (error) {
        console.error("Channel playlists error:", error);
        container.textContent = `Couldn't load playlists: ${error.message}`;
    }
};

async function fungiLoadPublicPlaylist(playlistId) {
    const container = document.getElementById("artist-channel-videos");
    container.textContent = "Loading playlist videos...";
    try {
        const data = await fungiYouTubeRequest("playlistItems", {
            part: "snippet,contentDetails", playlistId, maxResults: 50
        });
        const songs = (data.items || [])
            .map(item => fungiConvertVideo(item, selectedArtist?.channelId || ""))
            .filter(Boolean);
        fungiRenderArtistVideos(container, songs);
    } catch (error) {
        console.error("Public playlist error:", error);
        container.textContent = `Couldn't load playlist: ${error.message}`;
    }
}


// ==========================================
// RECOMMENDED SONGS FROM SAVED ARTISTS
// ==========================================

window.loadRecommendedSongs = async function() {

    const container = document.getElementById("recommended-songs");

    if (!fungiSavedArtists.length) {
        container.textContent = "Save some artists first to get recommendations.";
        return;
    }

    container.textContent = "Finding recommendations...";

    try {
        const artistsToSearch = fungiSavedArtists.slice(0, 4);

        const results = await Promise.all(
            artistsToSearch.map(artist => fungiYouTubeRequest("search", {
                part: "snippet",
                type: "video",
                channelId: artist.channelId,
                q: "official song",
                maxResults: 4
            }))
        );

        const alreadyQueued = new Set(queue.map(song => song.id));
        const uniqueSongs = new Map();

        results.flatMap(result => result.items || []).forEach(item => {
            const song = fungiConvertVideo(item);
            if (song && !alreadyQueued.has(song.id)) {
                uniqueSongs.set(song.id, song);
            }
        });

        fungiRenderArtistVideos(container, Array.from(uniqueSongs.values()));

    } catch (error) {
        console.error("Recommendations error:", error);
        container.textContent = `Couldn't load recommendations: ${error.message}`;
    }
};


// ==========================================
// INITIALIZE THE ARTIST DIRECTORY AND ONE SEARCH BOX
// ==========================================

fungiRenderSavedArtists();

const fungiSearchForm = document.getElementById("fungi-search-form");
if (fungiSearchForm) {
    fungiSearchForm.addEventListener("submit", event => {
        event.preventDefault(); // Stops the form from refreshing the page.
        searchYouTube();       // Searches for both channels and videos.
    });
}

const artistChannelSearchButton = document.getElementById("artist-channel-search-button");
if (artistChannelSearchButton) {
    artistChannelSearchButton.addEventListener("click", searchArtistChannel);
}
