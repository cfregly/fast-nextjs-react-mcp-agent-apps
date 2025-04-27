import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import OpenAIStreamingComponent from './App';

import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

global.fetch = jest.fn();

function createMockStream(data) {
  return {
    getReader: () => ({
      read: jest.fn()
        .mockResolvedValueOnce({ value: new TextEncoder().encode(data), done: false })
        .mockResolvedValueOnce({ done: true })
    })
  };
}

describe('OpenAIStreamingComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(() => {
    process.env.REACT_APP_OPENAI_API_KEY = 'test_api_key';
  });

  afterAll(() => {
    delete process.env.REACT_APP_OPENAI_API_KEY;
  });

  test('renders Get Weather button', () => {
    render(<OpenAIStreamingComponent />);
    expect(screen.getByText('Get Weather')).toBeInTheDocument();
  });

  test('displays loading state when button is clicked', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      body: createMockStream('data: {"choices":[{"delta":{"content":"Loading..."}}]}\n\n')
    });

    render(<OpenAIStreamingComponent />);
    fireEvent.click(screen.getByText('Get Weather'));

    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  test('displays API response', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      body: createMockStream('data: {"choices":[{"delta":{"content":"The weather is sunny"}}]}\n\n')
    });

    render(<OpenAIStreamingComponent />);
    fireEvent.click(screen.getByText('Get Weather'));

    await waitFor(() => {
      expect(screen.getByText('The weather is sunny')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('handles function call from API', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      body: createMockStream(
        'data: {"choices":[{"delta":{"function_call":{"name":"get_current_weather","arguments":"{\\"location\\":\\"San Francisco\\"}"}}}]}\n\n' +
        'data: {"choices":[{"delta":{"content":"The weather in San Francisco is currently 22°C and sunny."}}]}\n\n'
      )
    });

    render(<OpenAIStreamingComponent />);
    fireEvent.click(screen.getByText('Get Weather'));

    await waitFor(() => {
      expect(screen.getByText(/The weather in San Francisco is currently 22°C and sunny./)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('handles API error', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch.mockRejectedValueOnce(new Error('API Error'));

    render(<OpenAIStreamingComponent />);
    fireEvent.click(screen.getByText('Get Weather'));

    await waitFor(() => {
      expect(screen.getByText('An error occurred while processing your request.')).toBeInTheDocument();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', expect.any(Error));
    consoleErrorSpy.mockRestore();
  });
});