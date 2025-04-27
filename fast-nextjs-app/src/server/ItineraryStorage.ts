import fs from 'fs';
import path from 'path';

const filePath = path.resolve(process.cwd(), 'itineraries.json');

interface SavedItinerary {
  destination: string;
  response: string;
}

export async function getSavedItineraries(): Promise<SavedItinerary[]> {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const data = await fs.promises.readFile(filePath, 'utf-8');
  return JSON.parse(data);
}

export async function saveItinerary(itinerary: SavedItinerary): Promise<void> {
  const itineraries = await getSavedItineraries();
  itineraries.push(itinerary);
  await fs.promises.writeFile(filePath, JSON.stringify(itineraries, null, 2));
}
