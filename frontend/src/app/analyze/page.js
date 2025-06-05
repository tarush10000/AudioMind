// frontend/src/app/analyze/page.js
'use client';

import { AlertCircle, CheckCircle, Loader2, Upload } from 'lucide-react'; // Using lucide-react for icons (optional nice touch)
import { useEffect, useState } from 'react';
const tier = process.env.NEXT_PUBLIC_TIER || 'free';
const isFree = tier === 'free';

// Optional: Install lucide-react for icons: npm install lucide-react

export default function Home() {
  const [backendMessage, setBackendMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null); // State to hold results

  // Test connection to backend
  useEffect(() => {
    fetch('http://localhost:5001/api/hello') // Backend URL
      .then(res => res.ok ? res.json() : Promise.reject('Backend not responding'))
      .then(data => setBackendMessage(data.message))
      .catch(err => {
        console.error("Error connecting to backend:", err);
        setBackendMessage("Connection failed.");
        setError("Could not connect to the backend service.");
      });
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadStatus(`Selected file: ${file.name}`);
      setError(null); // Clear previous errors
      setResults(null); // Clear previous results
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      setError('Please select an audio file first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setUploadStatus('Processing audio...');
    setResults(null);

    const formData = new FormData();
    formData.append('audioFile', selectedFile);

    try {
      const response = await fetch('http://localhost:5001/api/process-audio', { // Backend URL
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      setUploadStatus(`Processing complete for ${selectedFile.name}.`);
      const processed = data.results || [];
      const filtered = isFree ? processed.filter(item => item.end <= 300) : processed;
      setResults(filtered); // Limit duration in free tier
      console.log("Backend response:", data);
    } catch (err) {
      console.error("Upload failed:", err);
      setError(err.message || 'Failed to process audio.');
      setUploadStatus(''); // Clear status on error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 text-gray-800 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-6 sm:p-10">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">AudioMind</h1>
          <p className="text-lg text-gray-600">Analyze your audio with AI</p>
          <p className={`text-sm mt-2 ${backendMessage === 'Connection failed.' ? 'text-red-500' : 'text-green-600'}`}>
            Backend Status: {backendMessage}
          </p>
        </div>

          {isFree && <p className="text-sm text-gray-500 mt-1">Free tier: up to 5 minutes of audio</p>}
        {/* Upload Section */}
        <form onSubmit={handleSubmit} className="mb-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
          <label
            htmlFor="audio-upload"
            className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-100 transition duration-150 ease-in-out"
          >
            <Upload className="w-10 h-10 mb-3 text-gray-500" />
            <p className="mb-2 text-sm text-gray-600"><span className="font-semibold">Click to upload</span> or drag and drop</p>
            <p className="text-xs text-gray-500">Any common audio format (MP3, WAV, M4A...)</p>
            <input id="audio-upload" type="file" className="hidden" accept="audio/*" onChange={handleFileChange} />
          </label>

          {/* File Info & Upload Button */}
          {selectedFile && <p className="mt-4 text-sm text-center text-gray-700">File: {selectedFile.name}</p>}
          <button
            type="submit"
            disabled={!selectedFile || isLoading}
            className={`mt-4 w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${isLoading || !selectedFile
                ? 'bg-indigo-300 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              } transition duration-150 ease-in-out`}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                Processing...
              </>
            ) : (
              'Upload and Analyze'
            )}
          </button>
        </form>

        {/* Status & Error Messages */}
        {error && (
          <div className="mb-6 p-4 border-l-4 border-red-400 bg-red-50 text-red-700 rounded-r-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-3 text-red-500" />
            <span>Error: {error}</span>
          </div>
        )}
        {uploadStatus && !error && !isLoading && (
          <div className="mb-6 p-4 border-l-4 border-blue-400 bg-blue-50 text-blue-700 rounded-r-lg flex items-center">
            <CheckCircle className="h-5 w-5 mr-3 text-blue-500" />
            <span>{uploadStatus}</span>
          </div>
        )}


        {/* Results Section */}
        {results && results.length > 0 && (
          <div className="mt-10">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Analysis Results</h2>
            <div className="space-y-6">
              {results.map((item, index) => (
                <div key={index} className="p-5 border border-gray-200 rounded-lg shadow-sm bg-white">
                  <p className="text-sm font-medium text-indigo-600 mb-2">
                    Speaker {item.speaker} ({item.start?.toFixed(2) ?? 'N/A'}s - {item.end?.toFixed(2) ?? 'N/A'}s)
                  </p>
                  <p className="text-gray-700 mb-3 leading-relaxed">{item.text || 'No transcript available.'}</p>
                  <div className="flex flex-wrap gap-2 text-xs mb-3">
                    <span className="font-semibold mr-2 text-gray-600">Keywords:</span>
                    {item.keywords?.length > 0 ? (
                      item.keywords.map((kw, i) => <span key={i} className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full">{kw}</span>)
                    ) : (<span className="text-gray-500 italic">None</span>)}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="font-semibold mr-2 text-gray-600">Entities:</span>
                    {item.entities?.length > 0 ? (
                      item.entities.map((ent, i) => <span key={i} className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full">{ent[0]} ({ent[1]})</span>)
                    ) : (<span className="text-gray-500 italic">None</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {results && results.length === 0 && !isLoading && (
          <p className="text-center text-gray-500 mt-6">No results found or returned from the backend.</p>
        )}

      </div>
    </div>
  );
}
