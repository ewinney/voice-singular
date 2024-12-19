import sys
import torch
import os
from pyannote.audio import Pipeline
from pydub import AudioSegment
import soundfile as sf
import subprocess

def ensure_ffmpeg():
    """Check if ffmpeg is available and print its version"""
    try:
        result = subprocess.run(['ffmpeg', '-version'], capture_output=True, text=True)
        print("FFmpeg version info:", result.stdout.split('\n')[0])
        return True
    except FileNotFoundError:
        print("FFmpeg not found. Please install FFmpeg first.")
        return False

def convert_to_wav(input_path):
    """Convert audio file to WAV format using FFmpeg directly"""
    output_path = input_path + '.wav'
    try:
        # First try using pydub
        print("Attempting conversion with pydub...")
        audio = AudioSegment.from_file(input_path)
        audio.export(output_path, format='wav')
        return output_path
    except Exception as e:
        print(f"Pydub conversion failed: {str(e)}")
        print("Attempting conversion with FFmpeg directly...")
        
        # Fallback to direct FFmpeg command
        try:
            cmd = ['ffmpeg', '-i', input_path, '-acodec', 'pcm_s16le', '-ar', '44100', output_path]
            subprocess.run(cmd, check=True, capture_output=True)
            return output_path
        except subprocess.CalledProcessError as e:
            print(f"FFmpeg error: {e.stderr.decode()}")
            raise ValueError(f"Failed to convert audio file using FFmpeg: {str(e)}")

def process_audio(audio_path, transcript=None):
    try:
        print(f"Starting audio processing for file: {audio_path}")
        
        # Check FFmpeg installation
        if not ensure_ffmpeg():
            raise ValueError("FFmpeg is required but not found")
        
        # Get token from environment variable
        hf_token = os.getenv('HUGGING_FACE_TOKEN')
        if not hf_token:
            raise ValueError("Please set the HUGGING_FACE_TOKEN environment variable")
        
        # Convert to WAV format
        print("Converting audio to WAV format...")
        wav_path = convert_to_wav(audio_path)
        print(f"Converted to WAV: {wav_path}")
        
        print("Loading pyannote.audio pipeline...")
        # Initialize the pipeline
        pipeline = Pipeline.from_pretrained(
            "pyannote/speaker-diarization",
            use_auth_token=hf_token
        )
        
        print("Performing diarization...")
        # Perform diarization
        diarization = pipeline(wav_path)
        
        # Load the WAV file for processing segments
        audio = AudioSegment.from_file(wav_path)
        
        print("Processing speaker segments...")
        # Create a new audio file with only the first speaker
        speaker_segments = []
        for turn, _, speaker in diarization.itertracks(yield_label=True):
            print(f"Found segment for {speaker}: {turn.start:.1f}s to {turn.end:.1f}s")
            if speaker == "SPEAKER_00":  # Assuming first speaker is the sales rep
                start_ms = int(turn.start * 1000)
                end_ms = int(turn.end * 1000)
                segment = audio[start_ms:end_ms]
                speaker_segments.append(segment)
        
        print(f"Found {len(speaker_segments)} segments for the target speaker")
        
        # Combine all segments
        if speaker_segments:
            print("Combining segments...")
            combined = sum(speaker_segments[1:], speaker_segments[0])
            
            # Create processed directory if it doesn't exist
            os.makedirs("processed", exist_ok=True)
            
            # Save the isolated audio
            output_path = f"processed/isolated_{os.path.basename(audio_path)}"
            print(f"Saving to {output_path}")
            combined.export(output_path, format="wav")
            
            # Clean up temporary WAV file
            if os.path.exists(wav_path) and wav_path != audio_path:
                os.remove(wav_path)
            
            # Print the path for the Node.js server to read
            print(output_path)
            return output_path
        else:
            raise ValueError("No segments found for the target speaker")
            
    except Exception as e:
        print(f"Error in process_audio: {str(e)}", file=sys.stderr)
        raise

if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            raise ValueError("Please provide an audio file path")
            
        audio_path = sys.argv[1]
        if not os.path.exists(audio_path):
            raise ValueError(f"Audio file not found: {audio_path}")
            
        transcript = sys.argv[2] if len(sys.argv) > 2 else None
        output_path = process_audio(audio_path, transcript)
        print(output_path)  # Make sure this is the last line printed
        
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1) 