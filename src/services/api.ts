export interface DispatchEvent {
  id: string;
  type: string;
  title: string;
  location: string;
  description: string;
  time: Date;
  source: 'live' | 'mock';
  coords?: [number, number]; // Added coordinates for map
  weather?: { temp: number; condition: string; wind: number }; // Simulated weather
}

export const classifyEventType = (title: string): string => {
  const t = title.toLowerCase();
  if (t.includes('požár')) return 'Požár';
  if (t.includes('dopravní nehoda')) return 'Dopravní nehoda';
  if (t.includes('technická pomoc')) return 'Technická pomoc';
  if (t.includes('únik nebezpečných látek') || t.includes('únik')) return 'Únik látek';
  if (t.includes('planý poplach')) return 'Planý poplach';
  return 'Ostatní';
};

// Generování počasí
const generateWeather = () => {
  const conditions = ['Jasno', 'Polojasno', 'Oblačno', 'Déšť', 'Silný vítr', 'Sněžení'];
  return {
    temp: Math.floor(Math.random() * 35) - 5, // -5 to 30
    condition: conditions[Math.floor(Math.random() * conditions.length)],
    wind: Math.floor(Math.random() * 80) // 0 to 80 km/h
  };
};

// Generování rozsáhlejších ukázkových dat pro statistiky a mapu
const generateMockData = (): DispatchEvent[] => {
  const types = ['Požár', 'Dopravní nehoda', 'Technická pomoc', 'Únik látek', 'Planý poplach', 'Ostatní'];
  const locations = [
    { name: 'Pardubice', coords: [50.0343, 15.7704] as [number, number] },
    { name: 'Svitavy', coords: [49.7565, 16.4682] as [number, number] },
    { name: 'Ústí nad Orlicí', coords: [49.9739, 16.3933] as [number, number] },
    { name: 'Chrudim', coords: [49.9515, 15.7958] as [number, number] },
    { name: 'Přemouč', coords: [50.0400, 15.5658] as [number, number] },
    { name: 'Hlinsko', coords: [49.7618, 15.9076] as [number, number] }
  ];

  const data: DispatchEvent[] = [];
  const now = new Date();
  
  // Přidáme 150 fiktivních historických i nedávných událostí napříč posledními 3 lety
  for (let i = 0; i < 150; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const loc = locations[Math.floor(Math.random() * locations.length)];
    
    // Zaručíme, že prvních 20 událostí bude aktivních (mladších než 12 hodin) pro testování mapy a feedu
    let time: Date;
    if (i < 20) {
      // V rámci posledních 11 hodin
      time = new Date(now.getTime() - Math.random() * 1000 * 60 * 60 * 11);
    } else {
      // Zbytek v rámci 3 let
      time = new Date(now.getTime() - Math.random() * 1000 * 60 * 60 * 24 * 365 * 3);
    }
    
    // Slight jitter to coordinates so they don't overlap exactly
    const jitteredCoords: [number, number] = [
      loc.coords[0] + (Math.random() - 0.5) * 0.05,
      loc.coords[1] + (Math.random() - 0.5) * 0.05
    ];

    data.push({
      id: `mock-${i}`,
      type: type,
      title: `${type.toUpperCase()} - ${loc.name}`,
      location: loc.name,
      description: `Ukázková data pro událost typu ${type} v obci ${loc.name}.`,
      time: time,
      source: 'mock',
      coords: jitteredCoords,
      weather: generateWeather()
    });
  }

  return data.sort((a, b) => b.time.getTime() - a.time.getTime());
};

const fullMockData = generateMockData();

// Pokusíme se souřadnice odhadnout i pro live data (pro zjednodušení použijeme hrubý slovník měst)
const assignCoords = (location: string): [number, number] | undefined => {
  const l = location.toLowerCase();
  if (l.includes('pardubice')) return [50.0343, 15.7704];
  if (l.includes('svitavy')) return [49.7565, 16.4682];
  if (l.includes('ústí')) return [49.9739, 16.3933];
  if (l.includes('chrudim')) return [49.9515, 15.7958];
  // Default to somewhere near Pardubice if not found
  return [50.0343 + (Math.random()-0.5)*0.1, 15.7704 + (Math.random()-0.5)*0.1];
};

export const fetchDispatches = async (): Promise<DispatchEvent[]> => {
  try {
    const response = await fetch('/api/hzs/rss-aktualni-vyjezdy.php');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    
    const items = xml.querySelectorAll('item');
    if (items.length === 0) {
      console.warn("No items found, using mock data");
      return fullMockData;
    }
    
    const liveData: DispatchEvent[] = Array.from(items).map((item, index) => {
      const fullTitle = item.querySelector('title')?.textContent || '';
      let title = fullTitle;
      let location = 'Neznámá lokace';
      const parts = fullTitle.split('-');
      if (parts.length >= 2) {
        title = parts[1].trim();
        if (parts.length >= 3) {
          location = parts.slice(2).join('-').trim();
        }
      }
      const pubDateStr = item.querySelector('pubDate')?.textContent || '';
      const pubDate = pubDateStr ? new Date(pubDateStr) : new Date();
      
      const rawDescription = item.querySelector('description')?.textContent || '';
      // Strip HTML tags safely and decode HTML entities if any basic ones exist
      let cleanDescription = rawDescription.replace(/<[^>]*>?/gm, '').trim();
      cleanDescription = cleanDescription.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
      
      return {
        id: `live-${index}`,
        type: classifyEventType(title),
        title: title,
        location: location,
        description: cleanDescription,
        time: pubDate,
        source: 'live',
        coords: assignCoords(location),
        weather: generateWeather()
      };
    });
    
    // Smícháme Live data (aktuální) s historií Mock dat, aby grafy nebyly prázdné
    const combined = [...liveData, ...fullMockData.filter(d => d.time < liveData[liveData.length-1]?.time || new Date())];
    return combined.sort((a, b) => b.time.getTime() - a.time.getTime());
    
  } catch (error) {
    console.warn("Failed to fetch live data, using complete mock history.", error);
    return fullMockData;
  }
};
