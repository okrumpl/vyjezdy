import React from 'react';
import { DispatchEvent } from '../services/api';
import { AlertTriangle, Car, Flame, Info, Wrench, Navigation } from 'lucide-react';

interface DispatchCardProps {
  dispatch: DispatchEvent;
  style?: React.CSSProperties;
  userLocation?: [number, number] | null;
  onClick?: () => void;
}

// Distance calculation using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const DispatchCard: React.FC<DispatchCardProps> = ({ dispatch, style, userLocation, onClick }) => {
  let colorVar = '--color-other';
  let bgVar = '--color-other-bg';
  let Icon = Info;

  switch (dispatch.type) {
    case 'Požár':
      colorVar = '--color-fire';
      bgVar = '--color-fire-bg';
      Icon = Flame;
      break;
    case 'Dopravní nehoda':
      colorVar = '--color-accident';
      bgVar = '--color-accident-bg';
      Icon = Car;
      break;
    case 'Technická pomoc':
      colorVar = '--color-technical';
      bgVar = '--color-technical-bg';
      Icon = Wrench;
      break;
    case 'Únik látek':
      colorVar = '--color-hazard';
      bgVar = '--color-hazard-bg';
      Icon = AlertTriangle;
      break;
  }

  const timeString = dispatch.time.toLocaleTimeString('cs-CZ', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const dateString = dispatch.time.toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'short'
  });

  let distanceStr = null;
  if (userLocation && dispatch.coords) {
    const dist = calculateDistance(userLocation[0], userLocation[1], dispatch.coords[0], dispatch.coords[1]);
    distanceStr = dist < 1 ? `${(dist*1000).toFixed(0)} m` : `${dist.toFixed(1)} km`;
  }

  return (
    <div 
      className="dispatch-card glass-panel animate-fade-in" 
      onClick={onClick}
      style={{
        ...style,
        '--card-color': `var(${colorVar})`,
        '--card-bg': `var(${bgVar})`
      } as React.CSSProperties}
    >
      <div className="card-header">
        <div className="badge">
          <Icon size={14} style={{ marginRight: '6px' }} />
          {dispatch.type}
        </div>
        <div className="card-time">
          <span>{dateString}</span>
          <strong>{timeString}</strong>
        </div>
      </div>
      
      <h3 className="card-title">{dispatch.title}</h3>
      
      <div className="card-location" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          {dispatch.location}
        </span>
        
        {distanceStr && (
          <span style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
            <Navigation size={12} /> {distanceStr}
          </span>
        )}
      </div>
      
      {dispatch.description && (
        <p className="card-desc">
          {dispatch.description}
        </p>
      )}
    </div>
  );
};
