import React, { useState, useCallback } from 'react';
import OpenAIStreamingComponent from './OpenAIStreamingComponent';
import './Weather.css';

const Weather = () => {
  const [city, setCity] = useState('San Francisco');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [prompt, setPrompt] = useState('');

  const handleGetWeather = useCallback(() => {
    setIsLoading(true);
    setPrompt(`What's the weather like in ${city}?`);
  }, [city]);

  const handleResponseUpdate = useCallback((newResponse) => {
    setResponse(newResponse);
    setIsLoading(false);
  }, []);

  return (
    <div className="container">
      <div className="card">
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Enter city name"
          className="input"
        />
        <button
          onClick={handleGetWeather}
          className="button"
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Get Weather'}
        </button>
        <div className="response">
          <h3 className="text-lg font-semibold">Response:</h3>
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <pre className="ascii-response">{response}</pre>
          )}
        </div>
      </div>
      <OpenAIStreamingComponent 
        prompt={prompt} 
        onResponseUpdate={handleResponseUpdate}
      />
    </div>
  );
};

export default Weather;
