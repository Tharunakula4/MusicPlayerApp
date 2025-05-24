document.addEventListener("DOMContentLoaded", function () {
    const audio = document.getElementById("audio");
    const playlistItems = document.querySelectorAll("#playlist li");
    const searchInput = document.getElementById("search");
    const volumeSlider = document.getElementById("volume");
    const loopBtn = document.getElementById("loop");
    const shuffleBtn = document.getElementById("shuffle");
    const dropArea = document.getElementById("drop-area");
    const fileInput = document.getElementById("fileInput");
    const toggleThemeBtn = document.getElementById("toggle-theme");
    const canvas = document.getElementById("visualizer");
    const ctx = canvas.getContext("2d");
    const playlistUl = document.getElementById("my-playlist");
    const playPauseBtn = document.getElementById("play-pause");
    const timeSlider = document.querySelector(".time-control input[type='range']");
    const currentTimeSpan = document.querySelector(".current-time");
    const durationSpan = document.querySelector(".duration");

    let audioCtx = null;
    let analyser = null;
    let source = null;
    let isPlaying = false;
    let currentSong = null;
    let myPlaylistSongs = [];

    // Initialize AudioContext on first user interaction
    function initAudioContext() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioCtx.createAnalyser();
            source = audioCtx.createMediaElementSource(audio);
            source.connect(analyser);
            analyser.connect(audioCtx.destination);
            analyser.fftSize = 256;
            drawVisualizer();
        }
        
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    // Theme handling
    const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
    
    function setTheme(theme) {
        document.documentElement.setAttribute("data-theme", theme);
        const icon = toggleThemeBtn.querySelector(".material-icons");
        const text = toggleThemeBtn.querySelector(".button-text");
        
        if (theme === "dark") {
            icon.textContent = "light_mode";
            text.textContent = "Light Mode";
        } else {
            icon.textContent = "dark_mode";
            text.textContent = "Dark Mode";
        }
        
        localStorage.setItem("theme", theme);
    }

    // Initialize theme
    const savedTheme = localStorage.getItem("theme") || 
                      (prefersDarkScheme.matches ? "dark" : "light");
    setTheme(savedTheme);

    toggleThemeBtn.addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute("data-theme");
        const newTheme = currentTheme === "light" ? "dark" : "light";
        setTheme(newTheme);
    });

    // Play/Pause button functionality
    playPauseBtn.addEventListener("click", () => {
        initAudioContext(); // Initialize on user interaction
        if (audio.paused) {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    playPauseBtn.querySelector(".material-icons").textContent = "pause";
                }).catch(error => {
                    console.error('Error playing audio:', error);
                    playPauseBtn.querySelector(".material-icons").textContent = "play_arrow";
                });
            }
        } else {
            audio.pause();
            playPauseBtn.querySelector(".material-icons").textContent = "play_arrow";
        }
    });

    // Time update handler
    audio.addEventListener("timeupdate", () => {
        const currentTime = formatTime(audio.currentTime);
        const duration = formatTime(audio.duration);
        currentTimeSpan.textContent = currentTime;
        durationSpan.textContent = duration;
        
        if (!isNaN(audio.duration)) {
            const percentage = (audio.currentTime / audio.duration) * 100;
            timeSlider.value = percentage;
        }
    });

    // Time slider functionality
    timeSlider.addEventListener("input", () => {
        const time = (timeSlider.value / 100) * audio.duration;
        audio.currentTime = time;
    });

    // Format time in MM:SS
    function formatTime(seconds) {
        if (isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
        return `${mins}:${secs}`;
    }

    // Enhanced playlist item click handler
    document.querySelectorAll("#playlist li, #my-playlist li").forEach(item => {
        item.addEventListener("click", async function(e) {
            if (!e.target.closest(".song-controls")) {
                try {
                    initAudioContext(); // Initialize on user interaction
                    const audioSrc = this.dataset.src;
                    console.log('Loading audio from:', audioSrc);
                    
                    // First pause any currently playing audio
                    audio.pause();
                    playPauseBtn.querySelector(".material-icons").textContent = "play_arrow";
                    
                    // Update track info
                    const trackName = this.querySelector(".song-name").textContent;
                    document.getElementById("track-name").textContent = trackName;
                    document.getElementById("track-artist").textContent = "Local File";
                    document.getElementById("track-image").src = "/static/images/default-album.png";
                    
                    // Set new source and load
                    audio.src = audioSrc;
                    await audio.load();
                    
                    // Try to play
                    const playPromise = audio.play();
                    if (playPromise !== undefined) {
                        playPromise.then(() => {
                            console.log('Audio playing successfully');
                            playPauseBtn.querySelector(".material-icons").textContent = "pause";
                        }).catch(error => {
                            console.error('Error playing audio:', error);
                            alert('Error playing the audio file. Please try again.');
                            playPauseBtn.querySelector(".material-icons").textContent = "play_arrow";
                        });
                    }
                    
                    // Update active state
                    document.querySelectorAll("#playlist li, #my-playlist li").forEach(item => {
                        item.classList.remove("active");
                    });
                    this.classList.add("active");
                    
                    // Add ripple effect
                    const ripple = document.createElement("span");
                    ripple.classList.add("ripple");
                    this.appendChild(ripple);
                    
                    const rect = this.getBoundingClientRect();
                    const size = Math.max(rect.width, rect.height);
                    const x = e.clientX - rect.left - size / 2;
                    const y = e.clientY - rect.top - size / 2;
                    
                    ripple.style.width = ripple.style.height = `${size}px`;
                    ripple.style.left = `${x}px`;
                    ripple.style.top = `${y}px`;
                    
                    setTimeout(() => ripple.remove(), 600);
                } catch (error) {
                    console.error('Error in click handler:', error);
                    alert('Error playing the audio file. Please try again.');
                }
            }
        });
    });

    // Audio state change handlers
    audio.addEventListener("play", () => {
        playPauseBtn.querySelector(".material-icons").textContent = "pause";
    });

    audio.addEventListener("pause", () => {
        playPauseBtn.querySelector(".material-icons").textContent = "play_arrow";
    });

    audio.addEventListener("ended", () => {
        playPauseBtn.querySelector(".material-icons").textContent = "play_arrow";
        if (shuffleBtn.classList.contains("active")) {
            const items = Array.from(document.querySelectorAll("#playlist li, #my-playlist li"));
            const random = items[Math.floor(Math.random() * items.length)];
            random.click();
        } else if (audio.loop) {
            audio.play();
        }
    });

    // Enhanced search with debouncing
    let searchTimeout;
    searchInput.addEventListener("input", () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const term = searchInput.value.toLowerCase();
            playlistItems.forEach(item => {
                const songName = item.querySelector(".song-name").textContent.toLowerCase();
                const matches = songName.includes(term);
                item.style.display = matches ? "" : "none";
                if (matches) {
                    item.style.animation = "fadeIn 0.3s ease-out forwards";
                }
            });
        }, 300);
    });

    // Volume control with smooth transition
    volumeSlider.addEventListener("input", () => {
        audio.volume = volumeSlider.value;
        const volumeIcon = volumeSlider.previousElementSibling;
        if (audio.volume === 0) {
            volumeIcon.textContent = "volume_off";
        } else if (audio.volume < 0.5) {
            volumeIcon.textContent = "volume_down";
        } else {
            volumeIcon.textContent = "volume_up";
        }
    });

    // Enhanced loop and shuffle buttons
    loopBtn.addEventListener("click", () => {
        audio.loop = !audio.loop;
        loopBtn.classList.toggle("active");
    });

    shuffleBtn.addEventListener("click", () => {
        shuffleBtn.classList.toggle("active");
        const items = Array.from(playlistItems);
        const random = items[Math.floor(Math.random() * items.length)];
        audio.src = random.dataset.src;
        audio.play();
    });

    // Improved drag and drop
    dropArea.addEventListener("dragenter", e => {
        e.preventDefault();
        dropArea.classList.add("hover");
    });

    dropArea.addEventListener("dragover", e => {
        e.preventDefault();
        dropArea.classList.add("hover");
    });

    dropArea.addEventListener("dragleave", () => {
        dropArea.classList.remove("hover");
    });

    dropArea.addEventListener("drop", e => {
        e.preventDefault();
        dropArea.classList.remove("hover");
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            dropArea.classList.add("uploading");
            fileInput.files = files;
            document.getElementById("uploadForm").submit();
        }
    });

    dropArea.addEventListener("click", () => fileInput.click());

    // Enhanced playlist management
    document.querySelectorAll(".add-to-playlist").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const songElement = e.target.closest("li");
            const song = e.target.closest("button").dataset.song;
            
            // Create new playlist item with animation
            const li = document.createElement("li");
            li.dataset.src = "/music/" + song;
            li.innerHTML = `
                <div class="song-info">
                    <span class="material-icons">music_note</span>
                    <span class="song-name">${song}</span>
                </div>
                <div class="song-controls">
                    <button class="remove-from-playlist">
                        <span class="material-icons">remove_circle_outline</span>
                    </button>
                </div>
            `;
            
            playlistItems.forEach(item => {
                item.classList.remove("active");
            });
            li.classList.add("active");
            playlistUl.appendChild(li);
            
            // Add remove functionality
            li.querySelector(".remove-from-playlist").addEventListener("click", (e) => {
                e.stopPropagation();
                li.style.animation = "fadeOut 0.3s ease-out forwards";
                setTimeout(() => {
                    li.remove();
                    savePlaylist();
                }, 300);
            });
            
            savePlaylist();
        });
    });

    function savePlaylist() {
        const songs = Array.from(playlistUl.children).map(li => 
            li.querySelector(".song-name").textContent
        );
        fetch('/save_playlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(songs)
        });
    }

    function loadPlaylist() {
        fetch('/load_playlist')
            .then(res => res.json())
            .then(songs => {
                songs.forEach(song => {
                    const li = document.createElement("li");
                    li.dataset.src = "/music/" + song;
                    li.innerHTML = `
                        <div class="song-info">
                            <span class="material-icons">music_note</span>
                            <span class="song-name">${song}</span>
                        </div>
                        <div class="song-controls">
                            <button class="remove-from-playlist">
                                <span class="material-icons">remove_circle_outline</span>
                            </button>
                        </div>
                    `;
                    playlistItems.forEach(item => {
                        item.classList.remove("active");
                    });
                    li.classList.add("active");
                    playlistUl.appendChild(li);
                    
                    li.querySelector(".remove-from-playlist").addEventListener("click", (e) => {
                        e.stopPropagation();
                        li.style.animation = "fadeOut 0.3s ease-out forwards";
                        setTimeout(() => {
                            li.remove();
                            savePlaylist();
                        }, 300);
                    });
                });
            });
    }
    loadPlaylist();

    // Enhanced visualizer
    function drawVisualizer() {
        if (!analyser) return;
        requestAnimationFrame(drawVisualizer);
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);
        
        const width = canvas.width;
        const height = canvas.height;
        const barWidth = width / bufferLength * 2.5;
        
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--primary').trim();
        
        dataArray.forEach((value, index) => {
            const x = index * barWidth;
            const h = (value / 255) * height;
            
            // Create gradient effect
            const gradient = ctx.createLinearGradient(0, height, 0, height - h);
            gradient.addColorStop(0, getComputedStyle(document.documentElement)
                .getPropertyValue('--primary').trim());
            gradient.addColorStop(1, getComputedStyle(document.documentElement)
                .getPropertyValue('--secondary').trim());
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, height - h, barWidth - 2, h);
        });
    }

    // Handle window resize for canvas
    function resizeCanvas() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }
    
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    // Spotify Search
    const spotifySearchInput = document.getElementById('spotify-search');
    const spotifyResults = document.getElementById('spotify-results');
    let spotifySearchTimeout;

    spotifySearchInput.addEventListener('input', () => {
        clearTimeout(spotifySearchTimeout);
        const query = spotifySearchInput.value.trim();
        
        // Clear results if search is empty
        if (query.length === 0) {
            spotifyResults.innerHTML = '';
            spotifyResults.classList.remove('active');
            return;
        }
        
        // Show searching message immediately
        spotifyResults.innerHTML = '<p class="loading">Searching...</p>';
        spotifyResults.classList.add('active');
        
        spotifySearchTimeout = setTimeout(() => {
            searchSpotify(query);
        }, 500);
    });

    async function searchSpotify(query) {
        try {
            console.log('Searching Spotify for:', query);
            spotifyResults.innerHTML = '<p class="loading">Searching Spotify...</p>';
            
            const response = await fetch('/search_spotify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query })
            });
            
            console.log('Search response status:', response.status);
            const data = await response.json();
            
            if (!response.ok) {
                console.error('Search error:', data.error);
                spotifyResults.innerHTML = `
                    <div class="error">
                        <p>Error searching Spotify:</p>
                        <p>${data.error || 'Unknown error occurred'}</p>
                        <p>Please try again later.</p>
                    </div>
                `;
                return;
            }
            
            if (data.error) {
                console.error('Spotify API error:', data.error);
                spotifyResults.innerHTML = `
                    <div class="error">
                        <p>Error from Spotify:</p>
                        <p>${data.error}</p>
                        <p>Please try another search.</p>
                    </div>
                `;
                return;
            }
            
            console.log('Found tracks:', data.length);
            if (data.length === 0) {
                spotifyResults.innerHTML = `
                    <div class="no-results">
                        <p>No previews found for "${query}"</p>
                        <p>Try searching for another song.</p>
                        <p>Tip: Try popular songs like "Blinding Lights" or "Dance Monkey"</p>
                    </div>
                `;
                return;
            }
            
            displaySpotifyResults(data);
        } catch (error) {
            console.error('Search error:', error);
            spotifyResults.innerHTML = `
                <div class="error">
                    <p>Error connecting to Spotify</p>
                    <p>${error.message || 'Please try again later.'}</p>
                </div>
            `;
        }
    }

    function displaySpotifyResults(tracks) {
        spotifyResults.innerHTML = '';
        
        if (tracks.length === 0) {
            spotifyResults.innerHTML = '<p class="no-results">No songs found. Try another search.</p>';
            return;
        }
        
        const resultsHeader = document.createElement('h3');
        resultsHeader.className = 'results-header';
        resultsHeader.textContent = `Found ${tracks.length} songs`;
        spotifyResults.appendChild(resultsHeader);
        
        tracks.forEach(track => {
            const trackElement = document.createElement('div');
            trackElement.className = 'spotify-track';
            
            trackElement.innerHTML = `
                <img src="${track.image || '/static/images/default-album.png'}" alt="${track.name}">
                <div class="spotify-track-info">
                    <p class="spotify-track-name">${track.name}</p>
                    <p class="spotify-track-artist">${track.artist}</p>
                    <span class="${track.has_preview ? 'preview-available' : 'preview-unavailable'}">
                        <span class="material-icons">${track.has_preview ? 'preview' : 'block'}</span>
                        ${track.has_preview ? 'Preview Available' : 'Preview Unavailable'}
                    </span>
                </div>
            `;
            
            trackElement.addEventListener('click', () => {
                if (track.preview_url) {
                    playSpotifyTrack(track);
                    getLyrics(track.name, track.artist);
                } else {
                    getLyrics(track.name, track.artist);
                    alert('Preview not available for this track, but you can view lyrics. Listen to the full song on Spotify!');
                }
            });
            
            spotifyResults.appendChild(trackElement);
        });
        
        spotifyResults.classList.add('active');
    }

    function playSpotifyTrack(track) {
        const audio = document.getElementById('audio');
        const trackImage = document.getElementById('track-image');
        const trackName = document.getElementById('track-name');
        const trackArtist = document.getElementById('track-artist');
        
        audio.src = track.preview_url;
        trackImage.src = track.image || '/static/images/default-album.png';
        trackName.textContent = track.name;
        trackArtist.textContent = track.artist;
        
        audio.play();
    }

    async function getLyrics(trackName, artistName) {
        const lyricsDiv = document.getElementById('lyrics');
        lyricsDiv.innerHTML = `
            <div class="lyrics-loading">
                <span class="material-icons">hourglass_empty</span>
                Loading lyrics...
            </div>
        `;
        
        try {
            const response = await fetch('/get_lyrics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ track_name: trackName, artist_name: artistName })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || data.error || `HTTP error! status: ${response.status}`);
            }
            
            // Create lyrics section HTML
            lyricsDiv.innerHTML = `
                <div class="lyrics-header">
                    <div class="lyrics-art">
                        <img src="${data.image_url || '/static/images/default-album.png'}" alt="${data.title} artwork">
                    </div>
                    <div class="lyrics-info">
                        <div class="lyrics-title">${data.title}</div>
                        <div class="lyrics-artist">${data.artist}</div>
                        <div class="lyrics-album">${data.album}${data.release_date ? ` • ${new Date(data.release_date).getFullYear()}` : ''}</div>
                    </div>
                </div>
                <a href="${data.lyrics_url}" target="_blank" rel="noopener noreferrer" class="lyrics-link">
                    <span class="material-icons">lyrics</span>
                    View Full Lyrics on Genius
                    <span class="material-icons">open_in_new</span>
                </a>
            `;
        } catch (error) {
            console.error('Error fetching lyrics:', error);
            lyricsDiv.innerHTML = `
                <div class="lyrics-error">
                    <span class="material-icons">error_outline</span>
                    ${error.message || 'Error loading lyrics. Please try again.'}
                </div>
                <p class="help-text">Make sure GENIUS_ACCESS_TOKEN is configured in .env file</p>
            `;
        }
    }

    // Update visualizer colors based on album art
    function updateVisualizerColors(imageUrl) {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageUrl;
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            const colors = getdominantColors(imageData);
            
            document.documentElement.style.setProperty('--visualizer-color-1', colors[0]);
            document.documentElement.style.setProperty('--visualizer-color-2', colors[1] || colors[0]);
        };
    }

    function getRandomColor() {
        return `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;
    }

    // Add ripple effect to all interactive elements
    document.querySelectorAll('.spotify-track, button').forEach(element => {
        element.addEventListener('click', createRipple);
    });

    function createRipple(event) {
        const element = event.currentTarget;
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        
        element.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    }

    // Add error handling for audio
    audio.addEventListener('error', (e) => {
        console.error('Error with audio playback:', e);
        alert('Error playing the audio file. Please try again.');
    });

    // Add loading handling
    audio.addEventListener('loadstart', () => {
        console.log('Audio started loading');
    });

    audio.addEventListener('canplay', () => {
        console.log('Audio can start playing');
        // Try to play when the audio is ready
        if (!audio.paused) {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error('Error playing audio:', error);
                });
            }
        }
    });
});
