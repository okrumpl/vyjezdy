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

// ===================== POČASÍ =====================

const generateWeather = () => {
  const conditions = ['Jasno', 'Polojasno', 'Oblačno', 'Déšť', 'Silný vítr', 'Sněžení'];
  return {
    temp: Math.floor(Math.random() * 25) + 5,
    condition: conditions[Math.floor(Math.random() * conditions.length)],
    wind: Math.floor(Math.random() * 40)
  };
};

const decodeWMO = (code: number) => {
  if (code === 0) return 'Jasno';
  if (code <= 2) return 'Polojasno';
  if (code === 3) return 'Zataženo';
  if (code >= 45 && code <= 48) return 'Mlha';
  if (code >= 51 && code <= 67) return 'Déšť';
  if (code >= 71 && code <= 77) return 'Sněžení';
  if (code >= 80 && code <= 82) return 'Přeháňky';
  if (code >= 95) return 'Bouřka';
  return 'Oblačno';
};

const weatherCache: Map<string, { data: { temp: number; condition: string; wind: number }, ts: number }> = new Map();

const fetchRealWeather = async (lat: number, lon: number) => {
  const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const cached = weatherCache.get(key);
  if (cached && Date.now() - cached.ts < 15 * 60 * 1000) return cached.data;

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&wind_speed_unit=kmh`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.current_weather) {
        const result = {
          temp: Math.round(data.current_weather.temperature),
          condition: decodeWMO(data.current_weather.weathercode),
          wind: Math.round(data.current_weather.windspeed)
        };
        weatherCache.set(key, { data: result, ts: Date.now() });
        return result;
      }
    }
  } catch (e) {
    // silently fall back
  }
  return generateWeather();
};

// ===================== SOUŘADNICE =====================

const CITY_COORDS: Record<string, [number, number]> = {
  'pardubice': [50.0343, 15.7704],
  'svitavy': [49.7565, 16.4682],
  'ústí nad orlicí': [49.9739, 16.3933],
  'chrudim': [49.9515, 15.7958],
  'přelouč': [50.0394, 15.5628],
  'hlinsko': [49.7618, 15.9076],
  'polička': [49.7134, 16.2655],
  'moravská třebová': [49.7588, 16.6648],
  'česká třebová': [49.9024, 16.4442],
  'hradec nad svitavou': [49.7790, 16.4834],
  'prachovice': [49.9235, 15.7558],
  'heřmanův městec': [49.9399, 15.6695],
  'chvaletice': [50.0310, 15.4245],
  'morašice': [49.8960, 15.8010],
  'moravany': [50.0001, 15.7200],
  'jaroměřice': [49.9100, 15.7800],
  'opatovice nad labem': [50.0750, 15.7460],
  'miřetice': [49.8545, 15.7960],
  'hradec králové': [50.2092, 15.8327],
  'semtín': [50.0200, 15.8000],
  'zdechovice': [50.0060, 15.5560],
  'litomyšl': [49.8714, 16.3119],
  'lanškroun': [49.9123, 16.6129],
  'žamberk': [50.0850, 16.4684],
  'vysoké mýto': [49.9548, 16.1627],
  'králíky': [50.0853, 16.7608],
  'seč': [49.8557, 15.6462],
  'skuteč': [49.8449, 16.0150],
  'holice': [50.0647, 15.9985],
  'přelouč - ': [50.0394, 15.5628],
  'svitavy - ': [49.7565, 16.4682],
  'pardubice - ': [50.0343, 15.7704],
  'chrudim - ': [49.9515, 15.7958],
};

const assignCoords = (location: string): [number, number] => {
  const l = location.toLowerCase();
  for (const [key, coords] of Object.entries(CITY_COORDS)) {
    if (l.includes(key.replace(' - ', ''))) return coords;
    if (l.startsWith(key.split(' - ')[0])) return coords;
  }
  // Fallback – střed Pardubického kraje s jitterem
  return [49.95 + (Math.random() - 0.5) * 0.5, 16.0 + (Math.random() - 0.5) * 0.8];
};

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
      weather: generateWeather()
    });
  }

  return data.sort((a, b) => b.time.getTime() - a.time.getTime());
};

const fullMockData = generateMockData();

// ===================== RSS PARSER – robustní regex místo DOMParser =====================
// DOMParser v některých prohlížečích selhává na RSS s atom: namespace nebo CDATA

const parseRSSItem = (itemText: string, index: number): DispatchEvent | null => {
  try {
    // Extrakce titulku z CDATA nebo plain textu
    const titleMatch = itemText.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/s);
    const fullTitle = titleMatch ? titleMatch[1].trim() : '';

    // Extrakce descriptionu – obsahuje HTML s alt="" typem
    const descMatch = itemText.match(/<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/s);
    const rawDesc = descMatch ? descMatch[1] : '';

    // Typ události z alt atributu ikony
    const altMatch = rawDesc.match(/alt="([^"]+)"/);
    const typeText = altMatch ? altMatch[1].trim() : '';

    // Popis bez HTML tagů
    let cleanDescription = rawDesc.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
    if (!cleanDescription) cleanDescription = typeText || 'Výjezd hasičů';

    // Datum
    const dateMatch = itemText.match(/<pubDate>(.*?)<\/pubDate>/);
    const pubDate = dateMatch ? new Date(dateMatch[1].trim()) : new Date();

    // Link pro ID
    const guidMatch = itemText.match(/<guid[^>]*>(.*?)<\/guid>/);
    const id = guidMatch ? `live-${guidMatch[1].trim().split('id=')[1]?.split('#')[0] || index}` : `live-${index}`;

    // Lokace je v titulku (nový formát HZS: jen název místa)
    const location = fullTitle;

    // Typ eventu
    const type = classifyEventType(typeText || fullTitle);
    const displayTitle = typeText || type;

    const coords = assignCoords(location);

    return {
      id,
      type,
      title: displayTitle,
      location,
      description: cleanDescription,
      time: pubDate,
      source: 'live',
      coords,
      weather: undefined // bude doplněno asynchronně
    };
  } catch (e) {
    console.error('Chyba parsování položky:', e);
    return null;
  }
};

// ===================== HLAVNÍ FUNKCE =====================

export const fetchDispatches = async (): Promise<DispatchEvent[]> => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch('/api/hzs/vyjezdy/rss-aktualni-vyjezdy.php', {
      signal: controller.signal,
      headers: { 'Accept': 'application/xml, text/xml, */*' },
      cache: 'no-store'
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`RSS fetch selhal: HTTP ${response.status}`);
      return fullMockData;
    }

    const text = await response.text();

    // Robustní regex extrakce – nepotřebuje DOMParser
    const itemMatches = text.match(/<item>([\s\S]*?)<\/item>/g);

    if (!itemMatches || itemMatches.length === 0) {
      console.warn('RSS: žádné položky nenalezeny. Délka odpovědi:', text.length);
      return fullMockData;
    }

    console.log(`RSS: načteno ${itemMatches.length} live výjezdů`);

    // Parsujeme položky
    const parsedItems = itemMatches
      .map((item, i) => parseRSSItem(item, i))
      .filter((item): item is DispatchEvent => item !== null);

    // Asynchronně stáhneme počasí (s cache, takže to nebude pomalé)
    const liveDataWithWeather = await Promise.all(
      parsedItems.map(async (item) => {
        if (item.coords) {
          item.weather = await fetchRealWeather(item.coords[0], item.coords[1]);
        } else {
          item.weather = generateWeather();
        }
        return item;
      })
    );

    // Přidáme historická mock data (>7 dní) pro statistiky
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const historicalMock = fullMockData.filter(d => d.time < sevenDaysAgo);

    const combined = [...liveDataWithWeather, ...historicalMock];
    return combined.sort((a, b) => b.time.getTime() - a.time.getTime());

  } catch (error) {
    console.warn('fetchDispatches selhal, používám mock data:', error);
    return fullMockData;
  }
};
