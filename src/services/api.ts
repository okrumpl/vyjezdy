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

// Generování počasí (Fallback pro mock data)
const generateWeather = () => {
  const conditions = ['Jasno', 'Polojasno', 'Oblačno', 'Déšť', 'Silný vítr', 'Sněžení'];
  return {
    temp: Math.floor(Math.random() * 35) - 5,
    condition: conditions[Math.floor(Math.random() * conditions.length)],
    wind: Math.floor(Math.random() * 80)
  };
};

const decodeWMO = (code: number) => {
  if (code === 0) return 'Jasno';
  if (code === 1 || code === 2) return 'Polojasno';
  if (code === 3) return 'Zataženo';
  if (code >= 45 && code <= 48) return 'Mlha';
  if (code >= 51 && code <= 67) return 'Déšť';
  if (code >= 71 && code <= 77) return 'Sněžení';
  if (code >= 80 && code <= 82) return 'Přeháňky';
  if (code >= 95) return 'Bouřka';
  return 'Oblačno';
};

const fetchRealWeather = async (lat: number, lon: number) => {
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
    if (res.ok) {
      const data = await res.json();
      if (data.current_weather) {
        return {
          temp: Math.round(data.current_weather.temperature),
          condition: decodeWMO(data.current_weather.weathercode),
          wind: Math.round(data.current_weather.windspeed)
        };
      }
    }
  } catch (e) {
    console.error("Open-Meteo selhalo", e);
  }
  return generateWeather(); // fallback
};

// Generování rozsáhlejších ukázkových dat pro statistiky a mapu
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

// Rozsáhlý slovník souradnic českých měst
const CITY_COORDS: Record<string, [number, number]> = {
  'pardubice': [50.0343, 15.7704],
  'svitavy': [49.7565, 16.4682],
  'ústí nad orlicí': [49.9739, 16.3933],
  'chrudim': [49.9515, 15.7958],
  'přelouč': [50.0394, 15.5628],
  'hlinsko': [49.7618, 15.9076],
  'politička': [49.7134, 16.2655],
  'moravská třebová': [49.7588, 16.6648],
  'česká třebová': [49.9024, 16.4442],
  'hradeč nad svitavou': [49.7790, 16.4834],
  'prachovice': [49.9235, 15.7558],
  'heřmanův městec': [49.9399, 15.6695],
  'chvaletice': [50.0310, 15.4245],
  'morašice': [49.8960, 15.8010],
  'moravany': [50.0001, 15.7200],
  'jařoměřice': [49.9100, 15.7800],
  'opatovice nad labem': [50.0750, 15.7460],
  'přelouč - mělice': [50.0394, 15.5628],
  'miřetice': [49.8545, 15.7960],
  'polička': [49.7134, 16.2655],
  'hráf': [50.0343, 15.7704],
  'hradec králové': [50.2092, 15.8327],
  'prachůvá': [50.0343, 15.7704],
  'semtin': [50.0200, 15.8000],
  'zdechovice': [50.0060, 15.5560],
};

const assignCoords = (location: string): [number, number] => {
  const l = location.toLowerCase();
  // Zkusit přesnou shodu
  for (const [key, coords] of Object.entries(CITY_COORDS)) {
    if (l.includes(key)) return coords;
  }
  // Default - někde ve středních Čechách s náhodným jitterem
  return [49.95 + (Math.random() - 0.5) * 0.4, 16.0 + (Math.random() - 0.5) * 0.6];
};


export const fetchDispatches = async (): Promise<DispatchEvent[]> => {
  try {
    const response = await fetch('/api/hzs/vyjezdy/rss-aktualni-vyjezdy.php');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    
    const items = xml.querySelectorAll('item');
    if (items.length === 0) {
      console.warn("No items found, using mock data");
      return fullMockData;
    }
    
    const liveDataPromises = Array.from(items).map(async (item, index) => {
      const fullTitle = item.querySelector('title')?.textContent || '';
      const rawDescription = item.querySelector('description')?.textContent || '';
      
      // 1. Získáme Typ události z "alt" tagu obrázku v popisu
      let typeText = '';
      const altMatch = rawDescription.match(/alt="([^"]+)"/);
      if (altMatch) {
        typeText = altMatch[1];
      }

      // 2. Lokace je nyní obsažena přímo v titulku zprávy.
      // Pro jistotu zkontrolujeme, zda se nevrátili ke starému formátu s pomlčkou
      let titleForUI = typeText || classifyEventType(fullTitle); 
      let location = fullTitle.trim();
      
      // Fallback pro starý formát (kdyby náhodou)
      if (fullTitle.includes(' - ') && !typeText) {
        const parts = fullTitle.split(' - ');
        titleForUI = parts[0].trim();
        location = parts.slice(1).join(' - ').trim();
      }

      const pubDateStr = item.querySelector('pubDate')?.textContent || '';
      const pubDate = pubDateStr ? new Date(pubDateStr) : new Date();


      // Strip HTML tags safely and decode HTML entities if any basic ones exist
      let cleanDescription = rawDescription.replace(/<[^>]*>?/gm, '').trim();
      cleanDescription = cleanDescription.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
      // If description is empty, use type as description
      if (!cleanDescription) {
        cleanDescription = titleForUI;
      }
      
      const coords = assignCoords(location);
      const weather = coords ? await fetchRealWeather(coords[0], coords[1]) : generateWeather();

      return {
        id: `live-${index}`,
        type: classifyEventType(titleForUI),
        title: titleForUI,
        location: location,
        description: cleanDescription,
        time: pubDate,
        source: 'live',
        coords: coords,
        weather: weather
      } as DispatchEvent;
    });
    
    const liveData = await Promise.all(liveDataPromises);
    
    // Smícháme Live data (aktuální) s historií Mock dat, aby grafy nebyly prázdné
    const combined = [...liveData, ...fullMockData.filter(d => d.time < liveData[liveData.length-1]?.time || new Date())];
    return combined.sort((a, b) => b.time.getTime() - a.time.getTime());
    
  } catch (error) {
    console.warn("Failed to fetch live data, using complete mock history.", error);
    return fullMockData;
  }
};
