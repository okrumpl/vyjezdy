import React from 'react';

export const EVENT_TYPES = [
  { id: 'Všechny', label: 'Všechny výjezdy', color: 'var(--text-primary)' },
  { id: 'Požár', label: 'Požáry', color: 'var(--color-fire)' },
  { id: 'Dopravní nehoda', label: 'Dopravní nehody', color: 'var(--color-accident)' },
  { id: 'Technická pomoc', label: 'Technické pomoci', color: 'var(--color-technical)' },
  { id: 'Únik látek', label: 'Úniky látek', color: 'var(--color-hazard)' },
  { id: 'Ostatní', label: 'Ostatní', color: 'var(--color-other)' },
];

interface SidebarFilterProps {
  selectedType: string;
  onSelectType: (type: string) => void;
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;
  counts: Record<string, number>;
}

const DISTRICTS = ['Všechny okresy', 'Pardubice', 'Chrudim', 'Svitavy', 'Ústí nad Orlicí'];

export const SidebarFilter: React.FC<SidebarFilterProps> = ({ 
  selectedType, 
  onSelectType,
  selectedDistrict,
  onSelectDistrict,
  counts
}) => {
  return (
    <div className="sidebar glass-panel">
      <h3>Okres (Oblast)</h3>
      <select 
        value={selectedDistrict}
        onChange={(e) => onSelectDistrict(e.target.value)}
        style={{
          background: 'rgba(0,0,0,0.2)',
          color: 'var(--text-primary)',
          border: '1px solid var(--surface-border)',
          padding: '0.5rem',
          borderRadius: '6px',
          outline: 'none',
          marginBottom: '1rem'
        }}
      >
        {DISTRICTS.map(d => (
          <option key={d} value={d} style={{ color: '#000' }}>{d}</option>
        ))}
      </select>

      <h3>Typ události</h3>
      
      <div className="filter-list">
        {EVENT_TYPES.map(type => {
          // Všechny category shows total count
          const count = type.id === 'Všechny' 
            ? Object.values(counts).reduce((a, b) => a + b, 0)
            : (counts[type.id] || 0);
            
          return (
            <button
              key={type.id}
              className={`filter-btn ${selectedType === type.id ? 'active' : ''}`}
              onClick={() => onSelectType(type.id)}
            >
              <div 
                className="filter-dot" 
                style={{ backgroundColor: type.color }}
              />
              <span style={{ flex: 1 }}>{type.label}</span>
              <span style={{ 
                background: 'rgba(255,255,255,0.1)', 
                padding: '2px 8px', 
                borderRadius: '10px',
                fontSize: '0.8rem'
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
