import React, { useEffect, useState } from 'react';
import { DispatchEvent } from '../services/api';
import { EventIcon, getTypeConfig } from './EventIcon';
import { Navigation, MapPin, Cloud, Wind, Thermometer, X, Share2 } from 'lucide-react';

interface EventDetailDrawerProps {
  dispatch: DispatchEvent;
  onClose: () => void;
  onShare: (dispatch: DispatchEvent) => void;
}

export const EventDetailDrawer: React.FC<EventDetailDrawerProps> = ({ dispatch, onClose, onShare }) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // odpovídá délce CSS animace zavření
  };

  // Keyboard support for ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const config = getTypeConfig(dispatch.type);

  // Zamezení scrollování body pod drawerem
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className={`drawer-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
      <div className={`drawer ${isClosing ? 'closing' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="drawer-header">
          <div className="badge" style={{ background: config.bg, color: config.color, border: `1px solid ${config.color}40` }}>
            <EventIcon type={dispatch.type} size={16} animated={dispatch.type === 'Požár'} />
            <span style={{ marginLeft: '6px' }}>{dispatch.type}</span>
          </div>
          <div className="drawer-actions">
            <button
              className="icon-btn"
              onClick={() => onShare(dispatch)}
              title="Sdílet"
            >
              <Share2 size={18} />
            </button>
            <button onClick={handleClose} className="icon-btn" title="Zavřít">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="drawer-content">
          <h2 className="drawer-title">
            {dispatch.title || dispatch.type}
          </h2>
          <div className="drawer-location-bar">
            <p className="drawer-location-text">
              <Navigation size={16} /> {dispatch.location}
            </p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${dispatch.coords ? `${dispatch.coords[0]},${dispatch.coords[1]}` : encodeURIComponent(dispatch.location)}`}
              target="_blank" rel="noreferrer"
              className="nav-tab btn-primary"
            >
              <MapPin size={14} /> Navigovat
            </a>
          </div>

          <div className="glass-panel drawer-section">
            <h3 className="section-label">Čas události</h3>
            <p>{dispatch.time.toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="drawer-time-large">{dispatch.time.toLocaleTimeString('cs-CZ')}</p>
          </div>

          {dispatch.weather && (
            <div className="glass-panel drawer-section">
              <h3 className="section-label">Počasí na místě</h3>
              <div className="weather-tags">
                <span className="weather-tag">
                  <Thermometer size={16} color="#ef4444" /> {dispatch.weather.temp}°C
                </span>
                <span className="weather-tag">
                  <Cloud size={16} color="#3b82f6" /> {dispatch.weather.condition}
                </span>
                <span className="weather-tag">
                  <Wind size={16} color="#94a3b8" /> {dispatch.weather.wind} km/h
                </span>
              </div>
            </div>
          )}

          {dispatch.description && dispatch.description !== dispatch.type && (
            <div className="glass-panel drawer-section">
              <h3 className="section-label">Popis</h3>
              <p className="drawer-desc-text">{dispatch.description}</p>
            </div>
          )}

          <div className="glass-panel drawer-section">
            <h3 className="section-label">Průběh zásahu</h3>
            <ul className="timeline">
              <div className="timeline-line" />
              {[
                { label: 'Ohlášení události', time: new Date(dispatch.time.getTime() - 1000 * 60 * 5).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }), active: true },
                { label: 'Výjezd jednotek', time: dispatch.time.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }), active: true },
                { label: 'Příjezd na místo', time: new Date(dispatch.time.getTime() + 1000 * 60 * 8).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }), active: dispatch.time.getTime() + 1000 * 60 * 8 < Date.now() },
                { label: 'Likvidace', time: '–', active: false }
              ].map((step, idx) => (
                <li key={idx} className={`timeline-item ${step.active ? 'active' : ''}`}>
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <strong>{step.label}</strong>
                    <span>{step.time}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
