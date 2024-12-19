import React, { useCallback, useState, useRef } from 'react';

const AudioUploader = ({ onAudioUpload }) => {
  const [transcript, setTranscript] = useState('');
  const selectedFileRef = useRef(null);

  const handleDiarization = useCallback(async () => {
    // Return early if no file
    if (!selectedFileRef.current) {
      alert('Please upload an audio file first.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('audio', selectedFileRef.current);
      formData.append('transcript', transcript);

      // Call your server route (POST /api/diarize)
      const response = await fetch('http://localhost:5000/api/diarize', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to isolate speaker');
      }

      // Server should return an object with { repAudioUrl: string } 
      const result = await response.json();
      console.log('Diarization response:', result);

      // Pass this back up to the parent so we can render the isolated track
      onAudioUpload({
        file: selectedFileRef.current,
        transcript,
        repAudioUrl: result.repAudioUrl // Hypothetical server response
      });
    } catch (error) {
      console.error('Diarization error:', error);
      alert('Speaker isolation failed. Check console for details.');
    }
  }, [transcript, onAudioUpload]);

  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file && file.type.includes('audio')) {
      selectedFileRef.current = file; // store the file in ref
      console.log('Audio file selected:', file.name);
    } else {
      alert('Please upload an audio file (MP3, WAV, etc.)');
    }
  }, []);

  return (
    <div className="w-full max-w-md space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Transcript (Optional)
        </label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          rows="3"
          placeholder="Paste the call transcript here to help identify the target voice..."
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
        />
      </div>

      <label className="flex flex-col items-center px-4 py-6 bg-white rounded-lg shadow-lg tracking-wide border border-blue-500 cursor-pointer hover:bg-blue-500 hover:text-white">
        <svg className="w-8 h-8" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M16.88 9.1A4 4 0 0 1 16 17H5a5 5 0 0 1-1-9.9V7a3 3 0 0 1 4.52-2.59A4.98 4.98 0 0 1 17 8c0 .38-.04.74-.12 1.1zM11 11h3l-4-4-4 4h3v3h2v-3z" />
        </svg>
        <span className="mt-2 text-sm">Upload Audio File</span>
        <input 
          type='file' 
          className="hidden" 
          accept="audio/*" 
          onChange={handleFileUpload}
          onClick={(e) => e.target.value = null} // Reset input to allow re-uploading same file
        />
      </label>

      <button
        onClick={handleDiarization}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Isolate Sales Rep's Voice
      </button>
    </div>
  );
};

export default AudioUploader;