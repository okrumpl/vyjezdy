import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DispatchEvent } from '../services/api';
import { Locate } from 'lucide-react';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconRetinaUrl: iconRetina,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
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
    // Překreslení mapy při zobrazení (řeší šedé pruhy při přepínání záložek)
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    // If we only want to center on points initially
    const validCoords = dispatches
      .map(d => d.coords)
      .filter((c): c is [number, number] => c !== undefined);
      
    if (validCoords.length > 0 && !userLocation) {
      const bounds = L.latLngBounds(validCoords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [dispatches, map, userLocation]);

  return null;
};

const LocationControl: React.FC<{ userLocation: [number, number] | null, setUserLocation: (l: [number, number]) => void }> = ({ userLocation, setUserLocation }) => {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const locateUser = () => {
    setLocating(true);
    map.locate().on("locationfound", function (e) {
      const latlng: [number, number] = [e.latlng.lat, e.latlng.lng];
      setUserLocation(latlng);
      map.flyTo(e.latlng, map.getZoom() > 14 ? map.getZoom() : 14);
      setLocating(false);
    }).on("locationerror", function () {
      alert("Nepodařilo se zjistit vaši polohu. Prosím povolte geolokaci v prohlížeči.");
      setLocating(false);
    });
  };

  useEffect(() => {
    if (userLocation) {
      map.flyTo(userLocation, 14);
    }
  }, [userLocation, map]);

  return (
    <div className="leaflet-top leaflet-right" style={{ top: '80px' }}>
      <div className="leaflet-control leaflet-bar" style={{ border: 'none' }}>
        <button 
          onClick={locateUser}
          title="Zaměřit mou polohu"
          style={{ 
            backgroundColor: 'var(--surface-color)', 
            color: userLocation ? '#3b82f6' : 'var(--text-primary)',
            width: '34px', height: '34px', 
            border: '1px solid var(--surface-border)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            cursor: 'pointer',
            backdropFilter: 'blur(8px)'
          }}
        >
          {locating ? <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} /> : <Locate size={18} />}
        </button>
      </div>
    </div>
  );
};

const getIconForType = (type: string) => {
  let color = '#8b5cf6';
  switch (type) {
    case 'Požár': color = '#ef4444'; break;
    case 'Dopravní nehoda': color = '#f97316'; break;
    case 'Technická pomoc': color = '#3b82f6'; break;
    case 'Únik látek': color = '#eab308'; break;
  }
  
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${color}, inset 0 0 4px rgba(255,255,255,0.8);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

const getUserIcon = () => {
  return L.divIcon({
    className: 'user-location-icon',
    html: `<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

export const MapView: React.FC<MapViewProps> = ({ dispatches, userLocation, setUserLocation, onDispatchClick }) => {
  const defaultCenter: [number, number] = [50.0343, 15.7704];

  return (
    <div className="glass-panel" style={{ height: '600px', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
      <MapContainer 
        center={defaultCenter} 
        zoom={10} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        <LocationControl userLocation={userLocation} setUserLocation={setUserLocation} />
        <MapBounds dispatches={dispatches} userLocation={userLocation} />

        {userLocation && (
          <Marker position={userLocation} icon={getUserIcon()}>
            <Popup>Vaše aktuální poloha</Popup>
          </Marker>
        )}

        {dispatches.map((dispatch) => {
          if (!dispatch.coords) return null;
          
          return (
            <Marker 
              key={dispatch.id} 
              position={dispatch.coords}
              icon={getIconForType(dispatch.type)}
              eventHandlers={{
                click: () => onDispatchClick(dispatch)
              }}
            >
              <Popup>
                <div style={{ color: '#000', cursor: 'pointer' }} onClick={() => onDispatchClick(dispatch)}>
                  <strong>{dispatch.type}</strong><br />
                  <span style={{ fontSize: '0.85em', color: '#666' }}>
                    {dispatch.time.toLocaleDateString('cs-CZ')} {dispatch.time.toLocaleTimeString('cs-CZ')}
                  </span><br />
                  {dispatch.location}<br />
                  <span style={{ color: '#3b82f6', textDecoration: 'underline', marginTop: '4px', display: 'inline-block' }}>Otevřít detail události</span>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
