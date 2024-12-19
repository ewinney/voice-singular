# Voice Singular

A web application for isolating and processing voice audio using Voice Activity Detection (VAD) technology.

## Features

- Upload audio files (MP3, WAV)
- Real-time voice activity detection
- Isolate speech segments from audio
- Download processed audio files
- Progress tracking during processing

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Audio Processing: Web Audio API + VAD
- Styling: Tailwind CSS

## Setup

1. Install dependencies:
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
```

2. Set up environment variables:
- Create a `.env` file in the server directory
- Add your Hugging Face token:
```
HUGGING_FACE_TOKEN=your_token_here
PORT=5000
```

3. Start the development servers:
```bash
# Start frontend (in project root)
npm run dev

# Start backend (in server directory)
node index.js
```

## Usage

1. Open the application in your browser (default: http://localhost:5173)
2. Upload an audio file using the upload button
3. Wait for the processing to complete
4. Listen to the isolated voice audio
5. Download the processed file if desired

## License

MIT License
