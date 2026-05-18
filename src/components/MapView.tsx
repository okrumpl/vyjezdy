import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DispatchEvent } from '../services/api';
import { Locate } from 'lucide-react';
import { getTypeConfig } from './EventIcon';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

const DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconRetinaUrl: iconRetina, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

interface MapViewProps {
  dispatches: DispatchEvent[];
  userLocation: [number, number] | null;
  setUserLocation: (loc: [number, number]) => void;
  onDispatchClick: (dispatch: DispatchEvent) => void;
}

const MapBounds: React.FC<{ dispatches: DispatchEvent[], userLocation: [number, number] | null }> = ({ dispatches, userLocation }) => {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 100);
    const validCoords = dispatches.map(d => d.coords).filter((c): c is [number, number] => c !== undefined);
    if (validCoords.length > 0 && !userLocation) {
      map.fitBounds(L.latLngBounds(validCoords), { padding: [50, 50], maxZoom: 12 });
    }
  }, [dispatches, map, userLocation]);
  return null;
};

const LocationControl: React.FC<{ userLocation: [number, number] | null, setUserLocation: (l: [number, number]) => void }> = ({ userLocation, setUserLocation }) => {
  const map = useMap();
  const [locating, setLocating] = useState(false);
  const locateUser = () => {
    setLocating(true);
    map.locate().on("locationfound", (e) => {
      setUserLocation([e.latlng.lat, e.latlng.lng]);
      map.flyTo(e.latlng, map.getZoom() > 14 ? map.getZoom() : 14);
      setLocating(false);
    }).on("locationerror", () => { alert("Nepodařilo se zjistit polohu."); setLocating(false); });
  };
  useEffect(() => { if (userLocation) map.flyTo(userLocation, 14); }, [userLocation, map]);

  return (
    <div className="leaflet-top leaflet-right" style={{ top: '80px' }}>
      <div className="leaflet-control leaflet-bar" style={{ border: 'none' }}>
        <button onClick={locateUser} title="Zaměřit mou polohu" style={{
          backgroundColor: 'var(--surface-color)', color: userLocation ? '#3b82f6' : 'var(--text-primary)',
          width: '34px', height: '34px', border: '1px solid var(--surface-border)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', backdropFilter: 'blur(8px)', borderRadius: '8px'
        }}>
          {locating ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <Locate size={18} />}
        </button>
      </div>
    </div>
  );
};

const getMapIcon = (type: string, isRecent: boolean) => {
  const config = getTypeConfig(type);
  const color = typeof config.color === 'string' && config.color.startsWith('#') ? config.color : '#8b5cf6';
  const colorMap: Record<string, string> = {
    'Požár': '#ef4444', 'Dopravní nehoda': '#f97316', 'Technická pomoc': '#3b82f6',
    'Záchrana osob': '#10b981', 'Záchrana osob a zvířat': '#10b981',
    'Únik látek': '#eab308', 'Planý poplach': '#64748b'
  };
  const c = colorMap[type] || color;
  const size = isRecent ? 18 : 14;
  const pulse = isRecent ? `<div style="position:absolute;inset:-6px;border-radius:50%;border:2px solid ${c};opacity:0.4;animation:pulse-ring 2s ease infinite;"></div>` : '';

  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;">
      ${pulse}
      <div style="background:${c};width:${size}px;height:${size}px;border-radius:50%;border:2.5px solid white;box-shadow:0 0 8px ${c}80;display:flex;align-items:center;justify-content:center;font-size:${size-6}px;">
        ${config.emoji}
      </div>
    </div>`,
    iconSize: [size + 12, size + 12],
    iconAnchor: [(size + 12) / 2, (size + 12) / 2]
  });
};

const getUserIcon = () => L.divIcon({
  className: 'user-location-icon',
  html: `<div style="background:#3b82f6;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 12px rgba(59,130,246,0.8);"></div>`,
  iconSize: [16, 16], iconAnchor: [8, 8]
});

export const MapView: React.FC<MapViewProps> = ({ dispatches, userLocation, setUserLocation, onDispatchClick }) => {
  return (
    <div className="glass-panel" style={{ height: '600px', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
      <MapContainer center={[50.0343, 15.7704]} zoom={10} style={{ height: '100%', width: '100%' }} zoomControl={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <LocationControl userLocation={userLocation} setUserLocation={setUserLocation} />
        <MapBounds dispatches={dispatches} userLocation={userLocation} />

        {userLocation && <Marker position={userLocation} icon={getUserIcon()}><Popup>Vaše poloha</Popup></Marker>}

        {dispatches.map((d) => {
          if (!d.coords) return null;
          const isRecent = (Date.now() - d.time.getTime()) < 60 * 60 * 1000;
          return (
            <Marker key={d.id} position={d.coords} icon={getMapIcon(d.type, isRecent)} eventHandlers={{ click: () => onDispatchClick(d) }}>
              <Popup>
                <div style={{ minWidth: 180 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>{getTypeConfig(d.type).emoji}</span>
                    <strong>{d.type}</strong>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                    {d.time.toLocaleDateString('cs-CZ')} {d.time.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div style={{ marginBottom: '0.4rem' }}>{d.location}</div>
                  {d.weather && <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>🌡️ {d.weather.temp}°C · {d.weather.condition}</div>}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
