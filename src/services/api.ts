export interface DispatchEvent {
  id: string;
  type: string;
  title: string;
  location: string;
  description: string;
  time: Date;
  source: 'live' | 'mock';
  coords?: [number, number];
  weather?: { temp: number; condition: string; wind: number };
}

export const classifyEventType = (title: string): string => {
  const t = title.toLowerCase();
  if (t.includes('požár')) return 'Požár';
  if (t.includes('dopravní nehoda')) return 'Dopravní nehoda';
  if (t.includes('technická pomoc')) return 'Technická pomoc';
  if (t.includes('záchrana')) return 'Záchrana osob';
  if (t.includes('únik nebezpečných látek') || t.includes('únik')) return 'Únik látek';
  if (t.includes('planý poplach')) return 'Planý poplach';
  return 'Ostatní';
};

// Weather and Coordinates moved to Backend

// ===================== MOCK DATA (jen pro historické statistiky) =====================

const generateMockData = (): DispatchEvent[] => {
  const types = ['Požár', 'Dopravní nehoda', 'Technická pomoc', 'Únik látek', 'Planý poplach', 'Ostatní'];
  const locations = [
    { name: 'Pardubice', coords: [50.0343, 15.7704] as [number, number] },
    { name: 'Svitavy', coords: [49.7565, 16.4682] as [number, number] },
    { name: 'Ústí nad Orlicí', coords: [49.9739, 16.3933] as [number, number] },
    { name: 'Chrudim', coords: [49.9515, 15.7958] as [number, number] },
    { name: 'Přelouč', coords: [50.0394, 15.5628] as [number, number] },
    { name: 'Hlinsko', coords: [49.7618, 15.9076] as [number, number] },
    { name: 'Polička', coords: [49.7134, 16.2655] as [number, number] },
    { name: 'Moravská Třebová', coords: [49.7588, 16.6648] as [number, number] },
    { name: 'Česká Třebová', coords: [49.9024, 16.4442] as [number, number] },
    { name: 'Heřmanův Městec', coords: [49.9399, 15.6695] as [number, number] },
  ];

  const data: DispatchEvent[] = [];
  const now = new Date();

  // Generujeme POUZE historická data starší než 7 dní – nikdy nebudou v aktuálním feedu
  for (let i = 0; i < 200; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const loc = locations[Math.floor(Math.random() * locations.length)];
    // Všechna mock data jsou 8–1000 dní stará
    const daysAgo = 8 + Math.random() * 992;
    const time = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    const jitteredCoords: [number, number] = [
      loc.coords[0] + (Math.random() - 0.5) * 0.08,
      loc.coords[1] + (Math.random() - 0.5) * 0.08
    ];

    data.push({
      id: `mock-${i}`,
      type,
      title: type,
      location: loc.name,
      description: `Historická událost – ${type.toLowerCase()} v obci ${loc.name}.`,
      time,
      source: 'mock',
      coords: jitteredCoords,
      weather: { temp: 15, condition: 'Oblačno', wind: 5 } // Mock historical weather
    });
  }

  return data.sort((a, b) => b.time.getTime() - a.time.getTime());
};

const fullMockData = generateMockData();

export const fetchDispatches = async (): Promise<DispatchEvent[]> => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('/api/dispatches', {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`Backend fetch failed: HTTP ${response.status}`);
      return fullMockData;
    }

    const data = await response.json();
    
    // Parse strings to Dates
    const liveData = data.map((item: any) => ({
      ...item,
      time: new Date(item.time)
    }));

    // Add historical mock data (>7 days) for statistics, similar to before
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const historicalMock = fullMockData.filter(d => d.time < sevenDaysAgo);

    const combined = [...liveData, ...historicalMock];
    return combined.sort((a: DispatchEvent, b: DispatchEvent) => b.time.getTime() - a.time.getTime());

  } catch (error) {
    console.warn('fetchDispatches failed, using mock data:', error);
    return fullMockData;
  }
};
