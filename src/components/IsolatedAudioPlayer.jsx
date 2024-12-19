import React from 'react';

const IsolatedAudioPlayer = ({ audioUrl }) => (
  <div className="mt-4 space-y-4">
    <h3 className="text-lg font-semibold">Isolated Voice</h3>
    <div className="bg-white p-4 rounded-lg shadow">
      {audioUrl ? (
        <>
          <audio 
            controls 
            src={audioUrl} 
            className="w-full mb-4"
          >
            Your browser does not support the audio element.
          </audio>
          <a 
            href={audioUrl} 
            download="isolated-voice.wav"
            className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Download Isolated Voice
          </a>
        </>
      ) : (
        <p className="text-gray-500">No isolated audio available yet.</p>
      )}
    </div>
  </div>
);

export default IsolatedAudioPlayer;