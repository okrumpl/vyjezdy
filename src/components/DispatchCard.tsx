import React from 'react';
import { DispatchEvent } from '../services/api';
import { EventIcon, getTypeConfig } from './EventIcon';
import { Navigation } from 'lucide-react';

interface DispatchCardProps {
  dispatch: DispatchEvent;
  style?: React.CSSProperties;
  userLocation?: [number, number] | null;
  onClick?: () => void;
}

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

export const DispatchCard: React.FC<DispatchCardProps> = ({ dispatch, style, userLocation, onClick }) => {
  const config = getTypeConfig(dispatch.type);
  const isLive = dispatch.source === 'live';
  const isRecent = (Date.now() - dispatch.time.getTime()) < 60 * 60 * 1000; // posledních 60 minut

  const timeString = dispatch.time.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
  const dateString = dispatch.time.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' });

  let distanceStr = null;
  if (userLocation && dispatch.coords) {
    const dist = calculateDistance(userLocation[0], userLocation[1], dispatch.coords[0], dispatch.coords[1]);
    distanceStr = dist < 1 ? `${(dist * 1000).toFixed(0)} m` : `${dist.toFixed(1)} km`;
  }

  return (
    <div
      className={`dispatch-card glass-panel animate-fade-in ${isRecent && isLive ? 'card-urgent' : ''}`}
      onClick={onClick}
      style={{
        ...style,
        '--card-color': config.color,
        '--card-bg': config.bg,
      } as React.CSSProperties}
    >
      {/* Live pulse badge pro velmi čerstvé události */}
      {isRecent && isLive && (
        <div className="card-live-dot" title="Právě probíhá" />
      )}

      <div className="card-header">
        <div className="badge">
          <EventIcon type={dispatch.type} size={14} animated={isRecent && isLive && dispatch.type === 'Požár'} />
          <span style={{ marginLeft: '5px' }}>{dispatch.type}</span>
        </div>
        <div className="card-time">
          <span>{dateString}</span>
          <strong>{timeString}</strong>
        </div>
      </div>

      <h3 className="card-title">{dispatch.title || dispatch.type}</h3>

      <div className="card-location" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dispatch.location}</span>
        </span>

        {distanceStr && (
          <span className="distance-badge">
            <Navigation size={11} /> {distanceStr}
          </span>
        )}
      </div>

      {dispatch.weather && (
        <div className="card-weather">
          <span>🌡️ {dispatch.weather.temp}°C</span>
          <span>💨 {dispatch.weather.wind} km/h</span>
          <span className="weather-condition">{dispatch.weather.condition}</span>
        </div>
      )}

      {dispatch.description && dispatch.description !== dispatch.type && (
        <p className="card-desc">{dispatch.description}</p>
      )}
    </div>
  );
};
