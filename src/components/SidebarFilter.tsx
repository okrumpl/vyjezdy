import React from 'react';
import { EventIcon, getTypeConfig } from './EventIcon';

export const EVENT_TYPES = [
  { id: 'Všechny', label: 'Všechny výjezdy' },
  { id: 'Požár', label: 'Požáry' },
  { id: 'Dopravní nehoda', label: 'Dopravní nehody' },
  { id: 'Technická pomoc', label: 'Technická pomoc' },
  { id: 'Záchrana osob', label: 'Záchrana osob' },
  { id: 'Záchrana osob a zvířat', label: 'Záchrana zvířat' },
  { id: 'Únik látek', label: 'Úniky látek' },
  { id: 'Planý poplach', label: 'Planý poplach' },
  { id: 'Ostatní', label: 'Ostatní' },
];

const DISTRICTS = [
  'Všechny okresy',
  'Pardubice', 'Chrudim', 'Svitavy', 'Ústí nad Orlicí',
];

interface SidebarFilterProps {
  selectedType: string;
  onSelectType: (type: string) => void;
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;
  counts: Record<string, number>;
}

export const SidebarFilter: React.FC<SidebarFilterProps> = ({
  selectedType,
  onSelectType,
  selectedDistrict,
  onSelectDistrict,
  counts
}) => {
  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="sidebar glass-panel">
      <h3>Okres (Oblast)</h3>
      <select
        value={selectedDistrict}
        onChange={(e) => onSelectDistrict(e.target.value)}
        className="district-select"
      >
        {DISTRICTS.map(d => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      <h3>Typ události</h3>

      <div className="filter-list">
        {EVENT_TYPES.map(type => {
          // Pro "Všechny" ukážeme součet, pro ostatní jejich počet
          const count = type.id === 'Všechny'
            ? totalCount
            : (counts[type.id] || 0);

          // Skrýt typy s nulovým počtem (kromě "Všechny")
          if (type.id !== 'Všechny' && count === 0) return null;

          const config = getTypeConfig(type.id);

          return (
            <button
              key={type.id}
              className={`filter-btn ${selectedType === type.id ? 'active' : ''}`}
              onClick={() => onSelectType(type.id)}
              style={{ '--btn-color': config.color } as React.CSSProperties}
            >
              {type.id === 'Všechny' ? (
                <div className="filter-dot" style={{ background: 'var(--text-primary)' }} />
              ) : (
                <div className="filter-icon-wrap">
                  <EventIcon type={type.id} size={16} />
                </div>
              )}
              <span style={{ flex: 1 }}>{type.label}</span>
              <span className="filter-count">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
