"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAndProcessRSS = exports.classifyEventType = void 0;
const node_fetch_1 = __importDefault(require("node-fetch")); // Requires node-fetch or native fetch in Node 18+
const db_1 = require("./db");
const push_1 = require("./push");
const CITY_COORDS = {
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
    'holice': [50.0647, 15.9985]
};
const assignCoords = (location) => {
    const l = location.toLowerCase();
    for (const [key, coords] of Object.entries(CITY_COORDS)) {
        if (l.includes(key.replace(' - ', '')))
            return coords;
        if (l.startsWith(key.split(' - ')[0]))
            return coords;
    }
    return [49.95 + (Math.random() - 0.5) * 0.5, 16.0 + (Math.random() - 0.5) * 0.8];
};
const classifyEventType = (title) => {
    const t = title.toLowerCase();
    if (t.includes('požár'))
        return 'Požár';
    if (t.includes('dopravní nehoda'))
        return 'Dopravní nehoda';
    if (t.includes('technická pomoc'))
        return 'Technická pomoc';
    if (t.includes('záchrana'))
        return 'Záchrana osob';
    if (t.includes('únik nebezpečných látek') || t.includes('únik'))
        return 'Únik látek';
    if (t.includes('planý poplach'))
        return 'Planý poplach';
    return 'Ostatní';
};
exports.classifyEventType = classifyEventType;
const decodeWMO = (code) => {
    if (code === 0)
        return 'Jasno';
    if (code <= 2)
        return 'Polojasno';
    if (code === 3)
        return 'Zataženo';
    if (code >= 45 && code <= 48)
        return 'Mlha';
    if (code >= 51 && code <= 67)
        return 'Déšť';
    if (code >= 71 && code <= 77)
        return 'Sněžení';
    if (code >= 80 && code <= 82)
        return 'Přeháňky';
    if (code >= 95)
        return 'Bouřka';
    return 'Oblačno';
};
const weatherCache = new Map();
const fetchRealWeather = async (lat, lon) => {
    const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    const cached = weatherCache.get(key);
    if (cached && Date.now() - cached.ts < 15 * 60 * 1000)
        return cached.data;
    try {
        const res = await (0, node_fetch_1.default)(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&wind_speed_unit=kmh`, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
            const data = await res.json();
            if (data.current_weather) {
                const result = {
                    temp: Math.round(data.current_weather.temperature),
                    condition: decodeWMO(data.current_weather.weathercode),
                    wind: Math.round(data.current_weather.windspeed)
                };
                if (weatherCache.size > 200) {
                    const firstKey = weatherCache.keys().next().value;
                    if (firstKey)
                        weatherCache.delete(firstKey);
                }
                weatherCache.set(key, { data: result, ts: Date.now() });
                return result;
            }
        }
    }
    catch (e) {
        //
    }
    return null;
};
const parseRSSItem = (itemText, index) => {
    try {
        const titleMatch = itemText.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/s);
        const fullTitle = titleMatch ? titleMatch[1].trim() : '';
        const descMatch = itemText.match(/<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/s);
        const rawDesc = descMatch ? descMatch[1] : '';
        const altMatch = rawDesc.match(/alt="([^"]+)"/);
        const typeText = altMatch ? altMatch[1].trim() : '';
        let cleanDescription = rawDesc.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
        if (!cleanDescription)
            cleanDescription = typeText || 'Výjezd hasičů';
        const dateMatch = itemText.match(/<pubDate>(.*?)<\/pubDate>/);
        const pubDate = dateMatch ? new Date(dateMatch[1].trim()) : new Date();
        const guidMatch = itemText.match(/<guid[^>]*>(.*?)<\/guid>/);
        const id = guidMatch ? `live-${guidMatch[1].trim().split('id=')[1]?.split('#')[0] || index}` : `live-${index}`;
        const location = fullTitle;
        const type = (0, exports.classifyEventType)(typeText || fullTitle);
        const displayTitle = typeText || type;
        const coords = assignCoords(location);
        return {
            id,
            type,
            title: displayTitle,
            location,
            description: cleanDescription,
            time: pubDate.toISOString(),
            source: 'live',
            lat: coords[0],
            lon: coords[1]
        };
    }
    catch (e) {
        return null;
    }
};
const fetchAndProcessRSS = async () => {
    console.log('Fetching RSS from HZS...');
    try {
        const res = await (0, node_fetch_1.default)('https://www.hzspa.cz/api/hzs/vyjezdy/rss-aktualni-vyjezdy.php');
        if (!res.ok) {
            console.warn('RSS fetch failed');
            return;
        }
        const text = await res.text();
        const itemMatches = text.match(/<item>([\s\S]*?)<\/item>/g);
        if (!itemMatches)
            return;
        const parsedItems = itemMatches.map((item, i) => parseRSSItem(item, i)).filter(i => i !== null);
        const db = (0, db_1.getDb)();
        let newEventsCount = 0;
        for (const item of parsedItems) {
            if (!item)
                continue;
            const existing = await db.get('SELECT id FROM dispatches WHERE id = ?', item.id);
            if (!existing) {
                newEventsCount++;
                // Fetch weather for new event
                const weather = await fetchRealWeather(item.lat, item.lon);
                await db.run(`
          INSERT INTO dispatches (id, type, title, location, description, time, source, lat, lon, weather_temp, weather_condition, weather_wind)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
                    item.id, item.type, item.title, item.location, item.description, item.time, item.source, item.lat, item.lon,
                    weather?.temp || null, weather?.condition || null, weather?.wind || null
                ]);
                console.log(`Saved new dispatch: ${item.id} - ${item.type}`);
                // Push notification logic
                const eventObj = {
                    ...item,
                    weather
                };
                await (0, push_1.sendPushNotification)(eventObj);
            }
        }
        if (newEventsCount > 0) {
            console.log(`Processed ${newEventsCount} new events.`);
        }
        else {
            console.log('No new events.');
        }
    }
    catch (err) {
        console.error('Error fetching RSS:', err);
    }
};
exports.fetchAndProcessRSS = fetchAndProcessRSS;
//# sourceMappingURL=rss.js.map