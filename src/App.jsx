import React, { useState } from 'react';
import AudioUploader from './components/AudioUploader';
import AudioProcessor from './components/AudioProcessor';

function App() {
  const [audioData, setAudioData] = useState(null);

  const handleAudioUpload = (data) => {
    console.log('Received audio data:', data); // Debug log
    setAudioData(data);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <h1 className="text-2xl font-bold text-center mb-8">Voice Isolation Tool</h1>
          
          <div className="space-y-8">
            <AudioUploader onAudioUpload={handleAudioUpload} />
            {audioData && <AudioProcessor audioData={audioData} />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;