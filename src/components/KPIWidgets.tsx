import React from 'react';
import { DispatchEvent } from '../services/api';
import { Flame, TrendingUp, Clock, Thermometer } from 'lucide-react';

interface KPIWidgetsProps {
  dispatches: DispatchEvent[];
  isLive: boolean;
}

export const KPIWidgets: React.FC<KPIWidgetsProps> = ({ dispatches }) => {
  const now = Date.now();
  const h12 = 12 * 60 * 60 * 1000;
  const h24 = 24 * 60 * 60 * 1000;

  const activeNow = dispatches.filter(d => d.source === 'live' && (now - d.time.getTime()) < h12).length;
  const todayTotal = dispatches.filter(d => (now - d.time.getTime()) < h24).length;

  // Počasí – z nejnovější události
  const latestWeather = dispatches.find(d => d.weather && d.source === 'live')?.weather;

  // Nejčastější typ dnes
  const todayTypes: Record<string, number> = {};
  dispatches.filter(d => (now - d.time.getTime()) < h24).forEach(d => {
    todayTypes[d.type] = (todayTypes[d.type] || 0) + 1;
  });
  const topType = Object.entries(todayTypes).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="kpi-row">
      <div className="kpi-card glass-panel" style={{ '--kpi-glow': 'rgba(239,68,68,0.1)', '--kpi-bg': 'rgba(239,68,68,0.12)' } as React.CSSProperties}>
        <div className="kpi-icon" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
          <Flame size={22} />
        </div>
        <div>
          <div className={`kpi-value ${activeNow > 0 ? 'pulse' : ''}`}>{activeNow}</div>
          <div className="kpi-label">Aktivních výjezdů</div>
        </div>
      </div>

      <div className="kpi-card glass-panel" style={{ '--kpi-glow': 'rgba(59,130,246,0.1)', '--kpi-bg': 'rgba(59,130,246,0.12)' } as React.CSSProperties}>
        <div className="kpi-icon" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>
          <TrendingUp size={22} />
        </div>
        <div>
          <div className="kpi-value">{todayTotal}</div>
          <div className="kpi-label">Dnes celkem</div>
        </div>
      </div>

      <div className="kpi-card glass-panel" style={{ '--kpi-glow': 'rgba(139,92,246,0.1)', '--kpi-bg': 'rgba(139,92,246,0.12)' } as React.CSSProperties}>
        <div className="kpi-icon" style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}>
          <Clock size={22} />
        </div>
        <div>
          <div className="kpi-value">{topType ? topType[0].split(' ')[0] : '–'}</div>
          <div className="kpi-label">Nejčastější typ</div>
        </div>
      </div>

      {latestWeather && (
        <div className="kpi-card glass-panel" style={{ '--kpi-glow': 'rgba(16,185,129,0.1)', '--kpi-bg': 'rgba(16,185,129,0.12)' } as React.CSSProperties}>
          <div className="kpi-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
            <Thermometer size={22} />
          </div>
          <div>
            <div className="kpi-value">{latestWeather.temp}°C</div>
            <div className="kpi-label">{latestWeather.condition} · {latestWeather.wind} km/h</div>
          </div>
        </div>
      )}
    </div>
  );
};
