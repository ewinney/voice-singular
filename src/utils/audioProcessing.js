import { createVAD } from '@ricky0123/vad-web';

export const initializeAudioContext = () => {
  return new (window.AudioContext || window.webkitAudioContext)();
};

export const initializeVAD = async () => {
  const vad = await createVAD({
    onSpeechStart: () => {
      console.log('Speech start detected');
    },
    onSpeechEnd: () => {
      console.log('Speech end detected');
    },
    onVADMisfire: () => {
      console.log('VAD misfire');
    }
  });
  return vad;
};

export const processAudioFrame = async (frameFloat32, vad, originalSampleRate) => {
  // We need a stable 16kHz frame for VAD
  // Let's assume we want 20ms frames. At 16kHz, 20ms = 320 samples.
  const targetSampleRate = 16000;
  
  // Resample the frame from original to target sample rate
  const resampledFrame = resampleBuffer(frameFloat32, originalSampleRate, targetSampleRate);
  
  // VAD expects Int16
  const int16Frame = float32ToInt16(resampledFrame);
  
  // If frame length differs slightly, just check if we have enough samples:
  if (int16Frame.length < 320) {
    return false;
  }

  // If we have more than 320, truncate:
  const vadFrame = int16Frame.slice(0, 320);
  
  try {
    // Process the frame with VAD
    const result = await vad.process(vadFrame);
    return result.isSpeech;
  } catch (error) {
    console.error('Error processing frame with VAD:', error);
    return false;
  }
};

function float32ToInt16(float32Array) {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    // Clamp values between -1 and 1
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    // Convert to 16-bit integer
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return int16Array;
}

function resampleBuffer(buffer, inRate, outRate) {
  if (inRate === outRate) return buffer;
  
  const ratio = outRate / inRate;
  const newLength = Math.round(buffer.length * ratio);
  const resampled = new Float32Array(newLength);
  
  // Linear interpolation resampling
  for (let i = 0; i < newLength; i++) {
    const position = i / ratio;
    const index = Math.floor(position);
    const fraction = position - index;
    
    const current = buffer[index] || 0;
    const next = buffer[index + 1] || current;
    
    resampled[i] = current + fraction * (next - current);
  }
  
  return resampled;
}

export const createAudioBlob = (audioBuffer) => {
  return encodeWAV(audioBuffer);
};

function encodeWAV(audioBuffer) {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  // Extract channel data
  let channels = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(audioBuffer.getChannelData(i));
  }

  let interleaved;
  if (numChannels === 2) {
    interleaved = interleave(channels[0], channels[1]);
  } else {
    interleaved = channels[0];
  }

  const dataLength = interleaved.length * 2;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  // Write WAV header
  writeUTFBytes(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeUTFBytes(view, 8, 'WAVE');
  writeUTFBytes(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, format, true); // AudioFormat
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true); // Byte rate
  view.setUint16(32, numChannels * 2, true); // Block align
  view.setUint16(34, bitDepth, true); // Bits per sample
  writeUTFBytes(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // Write PCM samples
  let offset = 44;
  for (let i = 0; i < interleaved.length; i++) {
    const sample = Math.max(-1, Math.min(1, interleaved[i]));
    view.setInt16(offset, sample * 0x7FFF, true);
    offset += 2;
  }

  return new Blob([view], { type: 'audio/wav' });
}

function interleave(left, right) {
  const length = left.length + right.length;
  const interleaved = new Float32Array(length);
  let index = 0;
  for (let i = 0; i < left.length; i++) {
    interleaved[index++] = left[i];
    interleaved[index++] = right[i] || 0;
  }
  return interleaved;
}

function writeUTFBytes(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}