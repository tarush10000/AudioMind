from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import tempfile
import librosa
import soundfile as sf
import numpy as np
import noisereduce as nr
from pyannote.audio import Pipeline
from rake_nltk import Rake
import nltk
import subprocess
import json
from pydub import AudioSegment
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Updated paths based on your information
WHISPER_CPP_PATH = "whisper.cpp/build/bin/Release/whisper-cli.exe"
WHISPER_MODEL_PATH = "whisper.cpp/ggml-large-v3.bin"

try:
    huggingface_token = os.getenv("HUGGINGFACE_API_TOKEN")
    diarization_pipeline = Pipeline.from_pretrained("pyannote/speaker-diarization",
                                                    use_auth_token=huggingface_token,)
except Exception as e:
    print(f"Error loading pyannote pipeline: {e}")
    diarization_pipeline = None

rake = Rake()

@app.route('/api/hello', methods=['GET'])
def hello():
    return jsonify({"message": "Hello from the AudioMind Backend with processing!"})

@app.route('/api/process-audio', methods=['POST'])
def process_audio():
    if 'audioFile' not in request.files:
        return jsonify({"error": "No audio file found in request"}), 400

    audio_file = request.files['audioFile']

    if audio_file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        # Save the uploaded file to a temporary location
        with tempfile.NamedTemporaryFile(delete=False) as tmp_uploaded_file:
            audio_file.save(tmp_uploaded_file.name)
            uploaded_file_path = tmp_uploaded_file.name

        # Convert to WAV if necessary
        if not uploaded_file_path.lower().endswith(".wav"):
            try:
                print("Converting to WAV format...")
                sound = AudioSegment.from_file(uploaded_file_path)
                with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_wav_file:
                    sound.export(tmp_wav_file.name, format="wav")
                    temp_audio_path = tmp_wav_file.name
                print("Conversion to WAV completed.")
            except Exception as e:
                os.remove(uploaded_file_path)
                return jsonify({"error": f"Error converting to WAV: {e}"}), 400
            finally:
                os.remove(uploaded_file_path)
        else:
            temp_audio_path = uploaded_file_path

        # 1. Noise Reduction
        print("Performing noise reduction...")
        audio, sr = librosa.load(temp_audio_path, sr=None)
        reduced_noise = nr.reduce_noise(y=audio, sr=sr)
        print("Noise reduction completed.")

        # Save the noise-reduced audio to another temporary file for whisper.cpp
        print("Saving noise-reduced audio...")
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_noise_reduced_file:
            sf.write(tmp_noise_reduced_file.name, reduced_noise, sr)
            noise_reduced_path = tmp_noise_reduced_file.name

        # 2. Transcription with whisper.cpp
        print("Transcribing audio with whisper.cpp...")
        command = [
            WHISPER_CPP_PATH,
            "-m", WHISPER_MODEL_PATH,
            "-f", noise_reduced_path,
            # "-oj", # Remove or comment out the JSON flag
        ]
        print(f"Running command: {' '.join(command)}")
        process = subprocess.run(command, capture_output=True, text=True, check=True)
        whisper_output_text = process.stdout
        print("Parsing text output from whisper.cpp...")

        segments = []
        full_text = ""
        for line in whisper_output_text.strip().split('\n'):
            line = line.strip() # Trim leading/trailing whitespace from the line
            if line.startswith('['):
                try:
                    timestamp_part, text_part_with_potential_leading_spaces = line.split("]", 1)
                    text_part = text_part_with_potential_leading_spaces.strip()
                    start_time_str, end_time_str = timestamp_part.strip("[]").split(" --> ")
                    def time_to_seconds(time_str):
                        parts = time_str.split(":")
                        return int(parts[0]) * 3600 + int(parts[1]) * 60 + float(parts[2])

                    start_time = time_to_seconds(start_time_str)
                    end_time = time_to_seconds(end_time_str)
                    text = text_part.strip()
                    segments.append({"start": start_time, "end": end_time, "text": text})
                    full_text += text + " "
                except ValueError as e:
                    print(f"Error parsing line: {line} - {e}")
            else:
                full_text += line.strip() + " "

        full_text = full_text.strip()
        print("Transcription completed.")
        print(f"Full text: {full_text}")
        print(f"Segments: {segments}")
        
        # 3. Speaker Identification (Diarization)
        print("Performing speaker identification...")
        speaker_segments = []
        if diarization_pipeline:
            try:
                diarization = diarization_pipeline(noise_reduced_path)
                for segment in diarization.itertracks(yield_label=True):
                    speaker = segment[1]
                    start = segment[0].start
                    end = segment[0].end
                    segment_text = ""
                    for item in segments:
                        if item["start"] >= start and item["end"] <= end:
                            segment_text += item["text"] + " "
                        elif item["start"] < end and item["end"] > start:
                            segment_text += item["text"] + " "
                    speaker_segments.append({"speaker": speaker, "start": start, "end": end, "text": segment_text.strip()})
            except Exception as e:
                print(f"Error during diarization: {e}")
                speaker_segments.append({"speaker": "Speaker 1", "start": 0, "end": librosa.get_duration(y=reduced_noise, sr=sr), "text": full_text})
        else:
            speaker_segments.append({"speaker": "Speaker 1", "start": 0, "end": librosa.get_duration(y=reduced_noise, sr=sr), "text": full_text})

        results = []
        for segment_data in speaker_segments:
            speaker_text = segment_data["text"]
            speaker = segment_data["speaker"]
            start_time = segment_data["start"]
            end_time = segment_data["end"]

            rake.extract_keywords_from_text(speaker_text)
            keywords = rake.get_ranked_phrases()[:5]

            sentences = nltk.sent_tokenize(speaker_text)
            entities = []
            for sentence in sentences:
                words = nltk.word_tokenize(sentence)
                tagged = nltk.pos_tag(words)
                named_entities = nltk.ne_chunk(tagged)
                for subtree in named_entities:
                    if isinstance(subtree, nltk.tree.Tree):
                        entity_name = " ".join(word for word, tag in subtree.leaves())
                        entity_type = subtree.label()
                        entities.append((entity_name, entity_type))

            results.append({
                "speaker": speaker,
                "start": start_time,
                "end": end_time,
                "text": speaker_text,
                "keywords": keywords,
                "entities": list(set(entities))
            })

        # Clean up temporary files
        if temp_audio_path != uploaded_file_path:
            os.remove(temp_audio_path)
        os.remove(noise_reduced_path)

        return jsonify({"message": f"File '{audio_file.filename}' processed successfully.", "results": results})

    except subprocess.CalledProcessError as e:
        print(f"Error running whisper.cpp: {e}")
        print(f"Stderr: {e.stderr}")
        return jsonify({"error": f"Failed to process audio (whisper.cpp error): {e.stderr}"}), 500
    except FileNotFoundError:
        return jsonify({"error": f"whisper.cpp executable not found at {WHISPER_CPP_PATH}. Please check the path."}), 500
    except Exception as e:
        print(f"Error processing audio: {e}")
        return jsonify({"error": f"Failed to process audio: {e}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)