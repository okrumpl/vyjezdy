import React from 'react';
import { DispatchEvent } from '../services/api';
import { EventIcon, getTypeConfig } from './EventIcon';

interface TimelineViewProps {
  dispatches: DispatchEvent[];
  onDispatchClick: (d: DispatchEvent) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ dispatches, onDispatchClick }) => {
  // Group by date
  const grouped: Record<string, DispatchEvent[]> = {};
  dispatches.forEach(d => {
    const key = d.time.toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(d);
  });

  return (
    <div style={{ maxWidth: 700 }}>
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date} style={{ marginBottom: '2rem' }}>
          <div style={{ 
            fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
            color: 'var(--text-secondary)', marginBottom: '1rem', paddingLeft: '2.5rem'
          }}>
            {date}
          </div>
          <div className="timeline">
            {items.map((d, i) => {
              const config = getTypeConfig(d.type);
              const isRecent = (Date.now() - d.time.getTime()) < 60 * 60 * 1000;
              return (
                <div key={d.id} className="timeline-item" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div 
                    className={`timeline-dot ${isRecent ? 'active' : ''}`} 
                    style={{ '--dot-color': config.color } as React.CSSProperties}
                  />
                  <div className="timeline-time">
                    {d.time.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
                    {d.source === 'live' && <span style={{ color: '#10b981', marginLeft: '0.5rem', fontSize: '0.7rem' }}>● LIVE</span>}
                  </div>
                  <div 
                    className="timeline-card glass-panel" 
                    onClick={() => onDispatchClick(d)}
                    style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateX(4px)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                      <div style={{ 
                        width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: config.bg, flexShrink: 0 
                      }}>
                        <EventIcon type={d.type} size={16} animated={isRecent && d.type === 'Požár'} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ fontSize: '0.9rem' }}>{d.type}</strong>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginLeft: '0.5rem' }}>
                          {d.location}
                        </span>
                      </div>
                    </div>
                    {d.description && d.description !== d.type && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>{d.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {dispatches.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
          Žádné události k zobrazení
        </div>
      )}
    </div>
  );
};
