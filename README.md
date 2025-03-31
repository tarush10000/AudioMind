# AudioMind

## Overview

AudioMind is a web application designed to analyze audio recordings. It takes an uploaded audio file and processes it using various machine learning techniques to provide valuable insights. The application performs several key tasks, including transcribing the audio into text, identifying different speakers within the recording, and extracting important information such as keywords and named entities.

## Screenshots
![image](https://github.com/user-attachments/assets/b58a13d9-9063-4d8d-8aec-641d209bff38)
![image](https://github.com/user-attachments/assets/2c926e97-383d-4bcc-8f97-dc6f97bf6264)

## Machine Learning Technologies Used

This project leverages the following machine learning technologies:

* **Speech-to-Text (Transcription):**
    * [`whisper.cpp`](https://github.com/ggerganov/whisper.cpp): This project utilizes a C++ implementation of the Whisper model by OpenAI for high-accuracy audio transcription.

* **Speaker Diarization (Speaker Identification):**
    * [`pyannote.audio`](https://github.com/pyannote/pyannote-audio): This Python library is used to identify and segment the audio based on who is speaking at different times.

* **Keyword Extraction:**
    * [`rake-nltk`](https://github.com/csurfer/rake-nltk): This Python library implements the Rapid Automatic Keyword Extraction (RAKE) algorithm to identify the most important keywords and phrases in the transcribed text.

* **Named Entity Recognition:**
    * [`nltk`](https://www.nltk.org/): The Natural Language Toolkit (NLTK) is used for various natural language processing tasks, including identifying named entities (like people, organizations, locations) within the transcribed text.

## Project Structure

The project is organized into the following main parts:

* **`backend/`:** Contains the Python Flask application that handles audio processing and serves the results. (flask run --port 5001)
* **`frontend/`:** Contains the Next.js web application that provides the user interface for uploading audio and viewing the analysis results. (npm run dev)

