import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const CACHE_TTL = 60 * 60 * 24; // 24 hours in seconds

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is not set');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Simple in-memory cache
const memoryCache = new Map<string, { data: string; timestamp: number }>();

export async function POST(request: NextRequest) {
  try {
    const { prompt, regenerate } = await request.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }
    
    // Generate a cache key from the prompt
    const cacheKey = `openai:${Buffer.from(prompt).toString('base64')}`;
    
    // Only check cache if not regenerating
    if (!regenerate) {
      const cachedResponse = memoryCache.get(cacheKey);
      if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_TTL * 1000) {
        return NextResponse.json(
          { response: cachedResponse.data },
          { status: 200 }
        );
      }
    }

    const stream = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      max_tokens: 500,
      temperature: 0.7,
    });

    let fullResponse = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
      }
    }

    // Cache the response
    if (fullResponse) {
      memoryCache.set(cacheKey, {
        data: fullResponse,
        timestamp: Date.now(),
      });
    }

    return NextResponse.json(
      { response: fullResponse },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in OpenAI API route:', error);
    
    if (error?.code === 'insufficient_quota') {
      return NextResponse.json(
        { 
          error: 'OpenAI API quota exceeded. Please check your billing details at https://platform.openai.com/account/billing',
          details: error.message
        },
        { status: 429 }
      );
    }
    
    if (error?.code === 'rate_limit_exceeded') {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please try again in a few minutes.',
          details: error.message
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to generate response',
        details: error?.message || 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
} 