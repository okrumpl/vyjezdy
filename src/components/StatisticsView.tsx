import React, { useMemo, useState } from 'react';
import { DispatchEvent } from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Download } from 'lucide-react';

interface StatisticsViewProps {
  dispatches: DispatchEvent[];
}

const COLORS = {
  'Požár': '#ef4444',
  'Dopravní nehoda': '#f97316',
  'Technická pomoc': '#3b82f6',
  'Únik látek': '#eab308',
  'Planý poplach': '#10b981',
  'Ostatní': '#8b5cf6'
};

export const StatisticsView: React.FC<StatisticsViewProps> = ({ dispatches }) => {
  const [selectedYear, setSelectedYear] = useState<string>('all');

  // Získání dostupných let
  const years = useMemo(() => {
    const y = new Set<string>();
    dispatches.forEach(d => y.add(d.time.getFullYear().toString()));
    return Array.from(y).sort((a, b) => b.localeCompare(a));
  }, [dispatches]);

  // Vyfiltrování podle roku
  const filteredData = useMemo(() => {
    if (selectedYear === 'all') return dispatches;
    return dispatches.filter(d => d.time.getFullYear().toString() === selectedYear);
  }, [dispatches, selectedYear]);

  // Agregace pro sloupcový graf (Typ události vs Počet)
  const typeStats = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach(d => {
      counts[d.type] = (counts[d.type] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({
      name: key,
      počet: counts[key]
    })).sort((a, b) => b.počet - a.počet);
  }, [filteredData]);

  // Agregace pro koláčový graf (Místa výjezdů)
  const locationStats = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach(d => {
      const city = d.location.split(',')[0].trim(); // Zjednodušení na město
      counts[city] = (counts[city] || 0) + 1;
    });
    // Zobrazíme jen top 5 měst, zbytek "Ostatní"
    const sorted = Object.keys(counts).map(key => ({
      name: key,
      value: counts[key]
    })).sort((a, b) => b.value - a.value);

    if (sorted.length > 5) {
      const top = sorted.slice(0, 5);
      const otherValue = sorted.slice(5).reduce((sum, item) => sum + item.value, 0);
      return [...top, { name: 'Ostatní lokace', value: otherValue }];
    }
    return sorted;
  }, [filteredData]);

  const exportToCSV = () => {
    // Generate CSV string
    const headers = ['ID', 'Typ', 'Název', 'Lokace', 'Datum', 'Čas', 'Zdroj'];
    const rows = filteredData.map(d => [
      d.id,
      d.type,
      `"${d.title.replace(/"/g, '""')}"`,
      `"${d.location.replace(/"/g, '""')}"`,
      d.time.toLocaleDateString('cs-CZ'),
      d.time.toLocaleTimeString('cs-CZ'),
      d.source
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `statistiky_vyjezdu_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="statistics-view" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="glass-panel" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Souhrnné statistiky</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button 
            onClick={exportToCSV}
            className="nav-tab" 
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--surface-border)' }}
            title="Exportovat tabulku do CSV"
          >
            <Download size={16} /> Export CSV
          </button>
          <select 
            value={selectedYear} 
            onChange={e => setSelectedYear(e.target.value)}
            style={{ 
              background: 'rgba(255,255,255,0.1)', 
              color: 'white', 
              border: '1px solid rgba(255,255,255,0.2)',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              outline: 'none'
            }}
          >
            <option value="all" style={{ color: '#000' }}>Všechny roky</option>
            {years.map(y => <option key={y} value={y} style={{ color: '#000' }}>{y}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        {/* Sloupcový graf - Typy výjezdů */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Počty událostí podle typu
          </h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickFormatter={(val) => val.split(' ')[0]} />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="počet" radius={[4, 4, 0, 0]}>
                  {typeStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || COLORS['Ostatní']} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Koláčový graf - Města */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Nejčastější lokace zásahů
          </h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={locationStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {locationStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
