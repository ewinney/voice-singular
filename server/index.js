import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { PythonShell } from 'python-shell';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ dest: 'uploads/' });

// Enable CORS for your React app's domain
app.use(cors({
  origin: 'http://localhost:5173', // Vite's default port
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());
app.use('/processed', express.static('processed')); // Serve processed files

// Create required directories
import fs from 'fs';
['uploads', 'processed'].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
});

app.post('/api/diarize', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('Processing file:', req.file.path);
    console.log('File details:', req.file);

    const audioPath = req.file.path;
    const transcript = req.body.transcript || '';

    // Pass the Hugging Face token through environment
    const options = {
      mode: 'text',
      pythonPath: 'python3',
      pythonOptions: ['-u'], // unbuffered output
      scriptPath: path.join(__dirname, 'python'),
      args: [audioPath, transcript],
      env: {
        ...process.env,
        HUGGING_FACE_TOKEN: process.env.HUGGING_FACE_TOKEN
      }
    };

    // Create a new PythonShell instance
    let pyshell = new PythonShell('diarize.py', options);
    
    // Collect all output
    let outputLines = [];
    let errorLines = [];

    pyshell.on('message', function (message) {
      console.log('Python output:', message);
      outputLines.push(message);
    });

    pyshell.on('stderr', function (stderr) {
      console.log('Python error:', stderr);
      errorLines.push(stderr);
    });

    // Handle the end of processing
    try {
      await new Promise((resolve, reject) => {
        pyshell.end(function (err) {
          if (err) {
            console.error('Python script failed:', err);
            reject(err);
          }
          resolve();
        });
      });

      // Find the output path in the messages
      const outputPath = outputLines[outputLines.length - 1];
      if (!outputPath || !outputPath.startsWith('processed/')) {
        throw new Error('No valid output path received from Python script');
      }

      const publicUrl = `/${outputPath}`;
      console.log('Processed file path:', outputPath);
      console.log('Public URL:', publicUrl);

      res.json({
        repAudioUrl: publicUrl
      });
    } catch (pythonError) {
      console.error('Python script error:', pythonError);
      res.status(500).json({ 
        error: 'Python processing failed',
        details: pythonError.message,
        pythonOutput: outputLines,
        pythonErrors: errorLines
      });
    }

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      error: 'Server error',
      details: error.message 
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 