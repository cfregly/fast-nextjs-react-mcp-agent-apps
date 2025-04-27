import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const filePath = path.resolve(process.cwd(), 'itineraries.json');

interface SavedItinerary {
  destination: string;
  response: string;
}

async function getSavedItineraries(): Promise<SavedItinerary[]> {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const data = await fs.promises.readFile(filePath, 'utf-8');
  return JSON.parse(data);
}

async function saveItinerary(itinerary: SavedItinerary): Promise<void> {
  const itineraries = await getSavedItineraries();
  itineraries.push(itinerary);
  await fs.promises.writeFile(filePath, JSON.stringify(itineraries, null, 2));
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const itineraries = await getSavedItineraries();
    const total = itineraries.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedItineraries = itineraries.slice(start, end);

    return NextResponse.json({
      itineraries: paginatedItineraries,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error('Error fetching itineraries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch itineraries' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const itinerary: SavedItinerary = await request.json();
    await saveItinerary(itinerary);
    return NextResponse.json(
      { message: 'Itinerary saved successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving itinerary:', error);
    return NextResponse.json(
      { error: 'Failed to save itinerary' },
      { status: 500 }
    );
  }
} 