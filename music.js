
// ==========================================
// YOUTUBE PLAYER AND PLAYLIST VARIABLES
// ==========================================

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


// ==========================================
// YOUTUBE SEARCH FUNCTION
// ==========================================

// Searches YouTube for videos matching the user's search input.
window.searchYouTube = async function() {

    // Gets the search input element from the HTML.
    const searchInput = document.getElementById("search-input");

    // Gets the text typed by the user and removes extra spaces.
    // If the input element doesn't exist, uses an empty string.
    const query = searchInput ? searchInput.value.trim() : "";

    // Stops the function if the user hasn't entered anything.
    if (!query) return;

    // YouTube Data API key used to access YouTube search results.
    const blopyblim = "AIzaSyDB3ijq7TdKKElkH16woL4htaUCCHVVCB4";

    try {

        // Sends a request to YouTube's API to search for videos.
        // encodeURIComponent makes the search text safe to put in a URL.
        const res = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&maxResults=10&key=${blopyblim}`
        );

        // Converts the API response into a JavaScript object.
        const data = await res.json();

        // If YouTube doesn't return a list of results, show an error.
        if (!data.items) {
            alert("You might wanna check your end because I know my end is a-okay");
            return;
        }

        // Converts YouTube's search results into a simpler format.
        // Each song object stores its video ID, title, channel, and thumbnail.
        queue = data.items.map(item => ({
            id: item.id.videoId,
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            image: item.snippet.thumbnails.medium ? item.snippet.thumbnails.medium.url : item.snippet.thumbnails.default.url
        }));

        // Resets playback to the first result.
        currentIndex = 0;

        // Updates the visible playlist on the page.
        renderQueue();

    } catch (err) {

        // Prints any errors that happen during the search.
        console.error(err);
    }
};


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
