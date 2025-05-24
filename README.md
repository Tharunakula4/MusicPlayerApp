# MusicPlayerApp
A sophisticated web-based music player built with Python Flask and modern web technologies. This application offers a seamless music playback experience with features like Spotify integration, real-time lyrics from Genius, audio visualization, and theme customization.

Overview:

  This full-stack music player combines local music playback with streaming capabilities. It features a modern, responsive UI with glass-morphism design elements, real-time audio visualization, and integrated music services. The application uses Flask for backend operations, managing both local files and external API interactions.
  

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/your-username/MusicPlayerApp.git
cd MusicPlayerApp
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up API keys:
Create a `.env` file with:

  SPOTIFY_CLIENT_ID=your_spotify_client_id

  SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
  
  GENIUS_ACCESS_TOKEN=your_genius_token
  
4. Run the application:
```bash
python app.py
```

5. Access at: `http://localhost:5000`

## Prerequisites
- Python 3.7+
- Flask
- Modern web browser with Web Audio API support
- API keys for Spotify and Genius

## Technology Stack

### Frontend
- HTML5 with semantic structure
- Modern CSS3 with custom properties
- Vanilla JavaScript with Web Audio API
- Canvas for audio visualization
- Material Icons for consistent UI

### Backend
- Python Flask framework
- RESTful API architecture
- External API integrations (Spotify, Genius)
- File system management for uploads

### APIs and Services
- Spotify Web API for music search
- Genius API for lyrics
- Web Audio API for visualization
- HTML5 Audio API for playback

## Key Features
- Music Playback: Smooth local playback, drag-and-drop uploads, volume control, and visualizer.
- Integrated Services: Spotify search, real-time lyrics from Genius, and rich metadata.
- Playlist Tools: Create, edit, and save playlists with smart search.
- Modern UI: Responsive design, dark/light mode, glassmorphism, and smooth transitions.
- Advanced Controls: Loop, shuffle, keyboard shortcuts, and progress/time display.

## Project structure
MusicPlayerApp/

- app.py # Flask application & API routes
- .env # API keys and configuration
- requirements.txt # Python dependencies
- music/ # Local music storage
- static/
  
        --style.css # Styling and themes
  
        --script.js # Frontend logic
  
        --images/ # Static images
- templates/
  
        --index.html # Main application template

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
