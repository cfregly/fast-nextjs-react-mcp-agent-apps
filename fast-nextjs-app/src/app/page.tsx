"use client";

import React, { useState, useCallback, useEffect, ChangeEvent, KeyboardEvent, useMemo } from "react";
import dynamic from 'next/dynamic';
import OpenAIStreaming from "./components/OpenAIStreaming";
import LoadingSpinner from "./components/LoadingSpinner";
import ErrorBoundary from "./components/ErrorBoundary";
import VirtualizedList from "./components/VirtualizedList";
import { FixedSizeList as List } from 'react-window';
import Image from 'next/image';

// Dynamically import the OpenAIStreaming component with no SSR
const DynamicOpenAIStreaming = dynamic(() => import('./components/OpenAIStreaming'), {
  ssr: false,
  loading: () => <LoadingSpinner size="lg" />,
});

const DynamicVirtualizedList = dynamic(() => import('./components/VirtualizedList'), {
  loading: () => <LoadingSpinner size="lg" />,
  ssr: false,
});

interface SavedItinerary {
  destination: string;
  response: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

const ITINERARY_ITEM_HEIGHT = 200; // Approximate height of each itinerary item

// Add batch size constant
const BATCH_SIZE = 10;

export default function Home() {
  const [destination, setDestination] = useState<string>("");
  const [prompt, setPrompt] = useState<string>("");
  const [savedItineraries, setSavedItineraries] = useState<SavedItinerary[]>([]);
  const [currentResponse, setCurrentResponse] = useState<string>("");
  const [expandedItineraries, setExpandedItineraries] = useState<boolean[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [batchIndex, setBatchIndex] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Memoize the visible items
  const visibleItineraries = useMemo(() => {
    return savedItineraries.slice(0, (batchIndex + 1) * BATCH_SIZE);
  }, [savedItineraries, batchIndex]);

  // Optimize the loadItineraries function with batching
  const loadItineraries = useCallback(async (page: number = 1, shouldAppend: boolean = false) => {
    if (shouldAppend) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    try {
      const response = await fetch(`/api/itineraries?page=${page}&limit=${BATCH_SIZE}`);
      if (!response.ok) {
        throw new Error('Failed to load itineraries');
      }
      const data = await response.json();
      if (shouldAppend) {
        setSavedItineraries(prev => [...prev, ...data.itineraries]);
      } else {
        setSavedItineraries(data.itineraries);
      }
      setPagination(data.pagination);
      setExpandedItineraries(prev => {
        const newExpanded = new Array(data.itineraries.length).fill(false);
        return shouldAppend ? [...prev, ...newExpanded] : newExpanded;
      });
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  // Add infinite scroll handler
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && !isLoadingMore && pagination.currentPage < pagination.totalPages) {
      setBatchIndex(prev => prev + 1);
      loadItineraries(pagination.currentPage + 1, true);
    }
  }, [isLoadingMore, pagination.currentPage, pagination.totalPages, loadItineraries]);

  useEffect(() => {
    loadItineraries();
  }, [loadItineraries]);

  const handleSubmit = useCallback(() => {
    if (!destination.trim()) {
      setError('Please enter a destination');
      return;
    }
    setIsLoading(true);
    setError(null);
    setCurrentResponse(""); // Clear any previous response
    const newPrompt = `Draw an ASCII art interpretation of a single landmark at ${destination} that I would want to visit.  Describe what you create and tell me why I should visit this landmark at this destination.  Keep it fun and simple.  Please do not apologize for creating a poor rendition.  And please do not warn about anything else.  It will look great!`;
    setPrompt(newPrompt);
  }, [destination]);

  const handleSave = useCallback(async () => {
    if (!currentResponse || !destination) {
      setError('Please generate and save a valid response');
      return;
    }
    try {
      const newItinerary: SavedItinerary = { destination, response: currentResponse };
      const response = await fetch('/api/itineraries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItinerary),
      });
      if (response.ok) {
        await loadItineraries(1);
        setCurrentResponse("");
        setDestination("");
      } else {
        throw new Error('Failed to save itinerary');
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
    }
  }, [currentResponse, destination, loadItineraries]);

  const toggleItinerary = useCallback((index: number) => {
    setExpandedItineraries((prev: boolean[]) => {
      const newExpanded = [...prev];
      newExpanded[index] = !newExpanded[index];
      return newExpanded;
    });
  }, []);

  const handleDestinationChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setDestination(e.target.value);
    setError(null);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit();
    }
  }, [handleSubmit, isLoading]);

  const handlePageChange = useCallback((page: number) => {
    loadItineraries(page);
  }, [loadItineraries]);

  const renderItineraryItem = useCallback((itinerary: SavedItinerary, index: number) => {
    if (!itinerary) {
      return null;
    }

    return (
      <div key={index} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden mb-4 transform transition-all duration-300 hover:shadow-xl">
        <button 
          onClick={() => toggleItinerary(index)}
          className="w-full bg-gradient-to-r from-slate-50 to-indigo-50 px-6 py-4 font-semibold text-slate-800 text-left flex justify-between items-center hover:from-slate-100 hover:to-indigo-100 transition-all duration-200"
          aria-expanded={expandedItineraries[index]}
          aria-controls={`itinerary-${index}`}
        >
          <span className="text-lg">{itinerary.destination}</span>
          <span className="transform transition-transform duration-300">
            {expandedItineraries[index] ? '▼' : '▶'}
          </span>
        </button>
        <div 
          id={`itinerary-${index}`}
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            expandedItineraries[index] ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="p-6 border-t border-slate-200">
            <div className="bg-slate-50/50 rounded-lg p-4 backdrop-blur-sm h-[250px] overflow-y-auto">
              <pre className="font-mono text-sm whitespace-pre-wrap break-words text-slate-800 leading-relaxed">
                {itinerary.response}
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  }, [expandedItineraries, toggleItinerary]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-slate-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-0 left-1/2 w-80 h-80 bg-emerald-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-indigo-600">
              ASCII Travel Generator
            </h1>
            <p className="text-lg text-gray-600">
              Generate beautiful ASCII art of your dream destinations
            </p>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            {/* Input Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 transform transition-all hover:scale-[1.01]">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    value={destination}
                    onChange={handleDestinationChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter a destination (e.g., Paris, Tokyo, New York)"
                    className="w-full p-4 border border-gray-200 rounded-lg text-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all bg-white/50 backdrop-blur-sm"
                    aria-label="Destination input"
                    disabled={isLoading}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="px-6 py-4 bg-gradient-to-r from-slate-800 to-indigo-600 text-white rounded-lg hover:from-slate-900 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all transform hover:scale-105 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Generate itinerary"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Generating...</span>
                    </div>
                  ) : (
                    'Generate'
                  )}
                </button>
              </div>
            </div>

            {/* Response Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 transform transition-all hover:scale-[1.01]">
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg animate-fade-in">
                  <p className="text-red-800 font-medium">Error:</p>
                  <p className="text-red-600">{error}</p>
                  {error.includes('quota') && (
                    <div className="mt-2 space-y-2">
                      <p className="text-red-600 text-sm">
                        Your OpenAI account has exceeded its quota. Please check your billing status at <a href="https://platform.openai.com/account/billing" target="_blank" rel="noopener noreferrer" className="underline">OpenAI's billing page</a>.
                      </p>
                      <p className="text-red-600 text-sm">
                        You may need to add credits to your account or upgrade your plan.
                      </p>
                    </div>
                  )}
                  {error.includes('API_KEY') && (
                    <div className="mt-2 space-y-2">
                      <p className="text-red-600 text-sm">
                        The OpenAI API key is not set. Please add your API key to the <code className="bg-red-100 px-1 py-0.5 rounded">.env.local</code> file:
                      </p>
                      <pre className="bg-red-100 p-2 rounded text-sm overflow-x-auto">
                        OPENAI_API_KEY=your_api_key_here
                      </pre>
                      <p className="text-red-600 text-sm">
                        You can get an API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">OpenAI's website</a>.
                      </p>
                    </div>
                  )}
                </div>
              )}
              <div className="bg-gray-50/50 rounded-lg p-4 backdrop-blur-sm min-h-[200px]">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-[200px] space-y-4">
                    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin"></div>
                    <p className="text-slate-600">Generating your travel itinerary...</p>
                  </div>
                ) : !currentResponse ? (
                  <div className="flex flex-col items-center justify-center h-[200px] text-gray-400 space-y-4">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                    </svg>
                    <div className="text-center space-y-2">
                      <p className="text-lg font-medium">Ready to Generate</p>
                      <p className="text-sm">Enter a destination above and click Generate to create your travel itinerary</p>
                    </div>
                  </div>
                ) : (
                  <DynamicOpenAIStreaming prompt={prompt} onResponse={setCurrentResponse} />
                )}
              </div>
              {currentResponse && (
                <button
                  onClick={handleSave}
                  className="mt-4 w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all transform hover:scale-105 font-medium shadow-lg hover:shadow-xl"
                  aria-label="Save itinerary"
                >
                  Save Itinerary
                </button>
              )}
            </div>

            {/* Saved Itineraries Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-indigo-600">
                Saved Itineraries
              </h2>
              {isLoadingMore ? (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-3 border-slate-200 border-t-slate-600 rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div 
                    className="h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                    onScroll={handleScroll}
                  >
                    <div className="space-y-4">
                      {visibleItineraries.map((itinerary, index) => renderItineraryItem(itinerary, index))}
                    </div>
                  </div>
                  {pagination.totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-4 py-2 rounded-lg transition-all transform hover:scale-105 ${
                            page === pagination.currentPage
                              ? 'bg-gradient-to-r from-slate-800 to-indigo-600 text-white shadow-lg'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          aria-current={page === pagination.currentPage ? 'page' : undefined}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
