import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { debounce } from 'lodash';
import LoadingSpinner from './LoadingSpinner';
import ErrorBoundary from './ErrorBoundary';

// Define the props for the component
interface OpenAIStreamingProps {
  prompt: string; // The prompt to send to the OpenAI API
  onResponse: (response: string) => void; // Callback function to handle the response
}

// Cache for storing responses
const responseCache = new Map<string, string>();

// Define the OpenAIStreaming component
const OpenAIStreaming: React.FC<OpenAIStreamingProps> = ({ prompt, onResponse }) => {
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [regenerateCount, setRegenerateCount] = useState(0);

  const fetchResponse = useCallback(async (promptText: string, shouldRegenerate: boolean = false) => {
    if (!promptText.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setResponse("");

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: promptText,
          regenerate: shouldRegenerate 
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          throw new Error(errorData.error || 'Rate limit or quota exceeded');
        }
        throw new Error(errorData.error || 'Failed to generate response');
      }

      const data = await response.json();
      setResponse(data.response);
      onResponse(data.response);
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          console.log('Request was aborted');
        } else {
          setError(err.message);
        }
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [onResponse]);

  // Debounce the fetch function
  const debouncedFetch = useCallback(
    debounce((promptText: string) => {
      fetchResponse(promptText, false);
    }, 500),
    [fetchResponse]
  );

  useEffect(() => {
    if (prompt) {
      debouncedFetch(prompt);
    }
    return () => {
      debouncedFetch.cancel();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [prompt, debouncedFetch]);

  // Add regenerate handler
  const handleRegenerate = useCallback(() => {
    if (prompt) {
      fetchResponse(prompt, true);
    }
  }, [prompt, fetchResponse]);

  return (
    <div className="w-full">
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600"></div>
        </div>
      )}
      {error && (
        <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="font-medium text-red-800">Error:</div>
          <div className="mt-1 text-red-600">{error}</div>
          {error.includes('quota') && (
            <div className="mt-2 text-sm">
              Please check your OpenAI account billing details at{' '}
              <a 
                href="https://platform.openai.com/account/billing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                https://platform.openai.com/account/billing
              </a>
            </div>
          )}
        </div>
      )}
      {response && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 leading-relaxed">
            {response}
          </pre>
          <button
            onClick={handleRegenerate}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm font-medium"
          >
            Regenerate
          </button>
        </div>
      )}
    </div>
  );
};

// Export the component wrapped in React.memo for performance optimization
export default React.memo(OpenAIStreaming);