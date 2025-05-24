from flask import Flask, render_template, request, send_from_directory, redirect, url_for, jsonify, session, send_file
import os
import json
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
import requests
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.secret_key = os.urandom(24)  # Required for session management

UPLOAD_FOLDER = 'music'
PLAYLIST_FILE = 'playlist.json'
DEFAULT_ALBUM_IMAGE = 'static/images/default-album.png'

# Create required directories if they don't exist
for directory in [UPLOAD_FOLDER, 'static/images']:
    if not os.path.exists(directory):
        os.makedirs(directory)

# Create a default album image if it doesn't exist
if not os.path.exists(DEFAULT_ALBUM_IMAGE):
    try:
        from PIL import Image
        img = Image.new('RGB', (300, 300), color='#36454F')
        img.save(DEFAULT_ALBUM_IMAGE)
        print(f"Created default album image at {DEFAULT_ALBUM_IMAGE}")
    except ImportError:
        print("PIL not installed, skipping default image creation")

# Spotify API credentials
SPOTIFY_CLIENT_ID = os.getenv('SPOTIFY_CLIENT_ID')
SPOTIFY_CLIENT_SECRET = os.getenv('SPOTIFY_CLIENT_SECRET')
GENIUS_ACCESS_TOKEN = os.getenv('GENIUS_ACCESS_TOKEN')

# Initialize Spotify client
spotify = spotipy.Spotify(client_credentials_manager=SpotifyClientCredentials(
    client_id=SPOTIFY_CLIENT_ID,
    client_secret=SPOTIFY_CLIENT_SECRET
))

@app.route('/')
def index():
    """Render main page with list of songs."""
    songs = [f for f in os.listdir(UPLOAD_FOLDER) if f.endswith(('.mp3', '.wav'))]
    return render_template('index.html', songs=songs)

@app.route('/upload', methods=['POST'])
def upload_file():
    """Handle file upload."""
    if 'file' not in request.files:
        return redirect(request.url)
    
    file = request.files['file']
    if file.filename and file.filename.endswith(('.mp3', '.wav')):
        file.save(os.path.join(UPLOAD_FOLDER, file.filename))
    return redirect(url_for('index'))

@app.route('/music/<filename>')
def play(filename):
    """Serve music files."""
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/save_playlist', methods=['POST'])
def save_playlist():
    """Save playlist to file."""
    with open(PLAYLIST_FILE, 'w') as f:
        json.dump(request.json, f)
    return jsonify({'status': 'success'})

@app.route('/load_playlist')
def load_playlist():
    """Load playlist from file."""
    if os.path.exists(PLAYLIST_FILE):
        with open(PLAYLIST_FILE) as f:
            return jsonify(json.load(f))
    return jsonify([])

@app.route('/search_spotify', methods=['POST'])
def search_spotify():
    try:
        query = request.json.get('query')
        if not query:
            return jsonify({'error': 'No search query provided'}), 400

        # Search Spotify
        results = spotify.search(q=query, type='track', limit=10)
        tracks = results['tracks']['items']

        # Format results
        formatted_tracks = []
        for track in tracks:
            preview_url = track['preview_url']
            formatted_track = {
                'id': track['id'],
                'name': track['name'],
                'artist': track['artists'][0]['name'],
                'preview_url': preview_url,
                'has_preview': bool(preview_url),
                'image': track['album']['images'][0]['url'] if track['album']['images'] else None,
                'spotify_url': track['external_urls']['spotify']
            }
            formatted_tracks.append(formatted_track)

        return jsonify(formatted_tracks)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get_lyrics', methods=['POST'])
def get_lyrics():
    try:
        track_name = request.json.get('track_name')
        artist_name = request.json.get('artist_name')
        if not track_name or not artist_name:
            return jsonify({'error': 'Track name and artist name are required'}), 400

        if not GENIUS_ACCESS_TOKEN:
            return jsonify({'error': 'Genius API token not configured'}), 500

        # Search for the song on Genius
        search_url = 'https://api.genius.com/search'
        headers = {'Authorization': f'Bearer {GENIUS_ACCESS_TOKEN}'}
        params = {'q': f'{track_name} {artist_name}'}
        
        response = requests.get(search_url, headers=headers, params=params)
        response.raise_for_status()
        
        data = response.json()
        if not data['response']['hits']:
            return jsonify({
                'error': 'No lyrics found',
                'message': f'Could not find lyrics for {track_name} by {artist_name}'
            }), 404

        # Get the first hit
        hit = data['response']['hits'][0]
        song = hit['result']

        # Get additional song metadata
        song_url = f"https://api.genius.com/songs/{song['id']}"
        song_response = requests.get(song_url, headers=headers)
        song_response.raise_for_status()
        song_data = song_response.json()['response']['song']

        return jsonify({
            'title': song['title'],
            'artist': song['primary_artist']['name'],
            'lyrics_url': song['url'],
            'album': song_data.get('album', {}).get('name', 'Unknown Album'),
            'release_date': song_data.get('release_date'),
            'image_url': song_data.get('song_art_image_url'),
            'genius_id': song['id']
        })
    except requests.exceptions.RequestException as e:
        return jsonify({
            'error': 'Failed to fetch lyrics',
            'message': str(e)
        }), 503
    except Exception as e:
        return jsonify({
            'error': 'An unexpected error occurred',
            'message': str(e)
        }), 500

@app.route('/static/default-album.png')
def default_album():
    return send_file(DEFAULT_ALBUM_IMAGE, mimetype='image/png')

if __name__ == '__main__':
    app.run(debug=True)