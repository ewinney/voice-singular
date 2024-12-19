import React, { useEffect, useRef, useState } from 'react';
import { 
  initializeAudioContext, 
  initializeVAD, 
  processAudioFrame, 
  createAudioBlob 
} from '../utils/audioProcessing';
import ProcessingIndicator from './ProcessingIndicator';
import IsolatedAudioPlayer from './IsolatedAudioPlayer';

const AudioProcessor = ({ audioFile }) => {
  const [processing, setProcessing] = useState(false);
  const [isolatedAudio, setIsolatedAudio] = useState(null);
  const [progress, setProgress] = useState(0);
  const audioContext = useRef(null);
  const vad = useRef(null);

  useEffect(() => {
    const init = async () => {
      audioContext.current = initializeAudioContext();
      vad.current = await initializeVAD();
    };

    init();
    return () => {
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, []);

  const processAudio = async () => {
    if (!audioFile || !audioContext.current || !vad.current) return;

    setProcessing(true);
    setProgress(0);
    
    try {
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioBuffer = await audioContext.current.decodeAudioData(arrayBuffer);
      const audioData = audioBuffer.getChannelData(0);

      // Calculate frame size for 20ms at original sample rate
      const frameDurationSec = 0.02; // 20ms
      const frameSize = Math.floor(audioBuffer.sampleRate * frameDurationSec);
      const totalFrames = Math.ceil(audioData.length / frameSize);

      // Create a buffer for the isolated speech
      const isolatedBuffer = audioContext.current.createBuffer(
        1, // mono output
        audioBuffer.length,
        audioBuffer.sampleRate
      );
      const isolatedChannel = isolatedBuffer.getChannelData(0);

      // Process frames
      for (let i = 0; i < audioData.length; i += frameSize) {
        const frame = audioData.slice(i, i + frameSize);
        const isSpeech = await processAudioFrame(frame, vad.current, audioBuffer.sampleRate);
        
        if (isSpeech) {
          // Copy this frame to isolatedChannel
          for (let j = 0; j < frame.length && (i + j) < audioData.length; j++) {
            isolatedChannel[i + j] = frame[j];
          }
        }

        // Update progress
        const currentFrame = Math.floor(i / frameSize);
        setProgress(Math.round((currentFrame / totalFrames) * 100));
      }

      // Create WAV blob from the isolated buffer
      const blob = await createAudioBlob(isolatedBuffer);
      setIsolatedAudio(URL.createObjectURL(blob));
    } catch (error) {
      console.error('Error processing audio:', error);
      alert('Error processing audio file. Please try again.');
    } finally {
      setProcessing(false);
      setProgress(100);
    }
  };

  useEffect(() => {
    if (audioFile) {
      processAudio();
    }
  }, [audioFile]);

  return (
    <div className="mt-8">
      {processing && (
        <div className="space-y-4">
          <ProcessingIndicator />
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-center text-sm text-gray-600">
            Processing: {progress}%
          </p>
        </div>
      )}
      {isolatedAudio && !processing && (
        <IsolatedAudioPlayer audioUrl={isolatedAudio} />
      )}
    </div>
  );
};

export default AudioProcessor;