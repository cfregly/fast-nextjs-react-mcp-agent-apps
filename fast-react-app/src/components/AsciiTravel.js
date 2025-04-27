import React, { useState, useCallback, useEffect } from 'react';
import OpenAIStreamingComponent from './OpenAIStreamingComponent';
import './AsciiTravel.css';

const AsciiTravel = () => {
  const [destination, setDestination] = useState('San Francisco');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [prompt, setPrompt] = useState('');

  // Load response from API when component mounts
  useEffect(() => {
    const fetchResponse = async () => {
      const response = await fetch('http://localhost:3001/api/getResponse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(""),
      });
      setResponse(response.json());

      // const res = await fetch('/api/getResponse');
      // const data = await res.json();
      // setResponse(data.response);
    };
    fetchResponse();
  }, []);

  const handleDrawAsciiArt = useCallback(() => {
    setIsLoading(true);
    setPrompt(`An ASCII art interpretation of ${destination} with a focus on this landmark that I want to visit.  Describe what you create and tell me what I should see when at this landmark.  Keep it fun and simple.  Please do not apologize for creating a poor rendition.  And please do not warn about anything else.  It will look great!  The response should use plaintext and not markdown or bash or yaml or anything fancy.`);
  }, [destination]);

  const handleResponseUpdate = useCallback(async (newResponse) => {
    setResponse(newResponse);
    setIsLoading(false);
    // Save response to API
    await fetch('http://localhost:3001/api/saveResponse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newResponse),
    });

    // await fetch('/api/saveResponse', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({ response: newResponse }),
    // });
  }, []);

  return (
    <div className="container">
      <div className="card">
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Enter destination name"
          className="input"
        />
        <button
          onClick={handleDrawAsciiArt}
          className="button"
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Draw ASCII Art'}
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

export default AsciiTravel;
