import React, { useMemo, useState } from 'react';
import { DispatchEvent } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Download } from 'lucide-react';

interface StatisticsViewProps { dispatches: DispatchEvent[]; }

const COLORS: Record<string, string> = {
  'Požár': '#ef4444', 'Dopravní nehoda': '#f97316', 'Technická pomoc': '#3b82f6',
  'Záchrana osob': '#10b981', 'Záchrana osob a zvířat': '#10b981',
  'Únik látek': '#eab308', 'Planý poplach': '#64748b', 'Ostatní': '#8b5cf6'
};

const tooltipStyle = { backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' };

export const StatisticsView: React.FC<StatisticsViewProps> = ({ dispatches }) => {
  const [selectedYear, setSelectedYear] = useState<string>('all');

  const years = useMemo(() => {
    const y = new Set<string>();
    dispatches.forEach(d => y.add(d.time.getFullYear().toString()));
    return Array.from(y).sort((a, b) => b.localeCompare(a));
  }, [dispatches]);

  const filteredData = useMemo(() =>
    selectedYear === 'all' ? dispatches : dispatches.filter(d => d.time.getFullYear().toString() === selectedYear)
  , [dispatches, selectedYear]);

  const typeStats = useMemo(() => {
    const c: Record<string, number> = {};
    filteredData.forEach(d => { c[d.type] = (c[d.type] || 0) + 1; });
    return Object.entries(c).map(([name, počet]) => ({ name, počet })).sort((a, b) => b.počet - a.počet);
  }, [filteredData]);

  const locationStats = useMemo(() => {
    const c: Record<string, number> = {};
    filteredData.forEach(d => { c[d.location.split(',')[0].split(' - ')[0].trim()] = (c[d.location.split(',')[0].split(' - ')[0].trim()] || 0) + 1; });
    const sorted = Object.entries(c).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    if (sorted.length > 6) {
      const top = sorted.slice(0, 6);
      const rest = sorted.slice(6).reduce((s, i) => s + i.value, 0);
      return [...top, { name: 'Ostatní', value: rest }];
    }
    return sorted;
  }, [filteredData]);

  // Hourly distribution
  const hourlyStats = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, počet: 0 }));
    filteredData.forEach(d => { hours[d.time.getHours()].počet++; });
    return hours;
  }, [filteredData]);

  // Daily trend (last 30 days)
  const trendStats = useMemo(() => {
    const days: Record<string, number> = {};
    const now = Date.now();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      days[d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' })] = 0;
    }
    filteredData.forEach(d => {
      const key = d.time.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' });
      if (key in days) days[key]++;
    });
    return Object.entries(days).map(([datum, počet]) => ({ datum, počet }));
  }, [filteredData]);

  const exportToCSV = () => {
    const headers = ['ID', 'Typ', 'Název', 'Lokace', 'Datum', 'Čas', 'Zdroj'];
    const rows = filteredData.map(d => [d.id, d.type, `"${d.title}"`, `"${d.location}"`, d.time.toLocaleDateString('cs-CZ'), d.time.toLocaleTimeString('cs-CZ'), d.source]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `statistiky_${selectedYear}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2 style={{ fontSize: '1.15rem', margin: 0 }}>📊 Souhrnné statistiky</h2>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button onClick={exportToCSV} className="nav-tab" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--surface-border)' }}>
            <Download size={16} /> CSV
          </button>
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="district-select" style={{ width: 'auto' }}>
            <option value="all">Vše</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.25rem' }}>
        {/* Bar chart – typy */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Počty podle typu</h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickFormatter={v => v.split(' ')[0]} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="počet" radius={[6, 6, 0, 0]}>
                  {typeStats.map((e, i) => <Cell key={i} fill={COLORS[e.name] || COLORS['Ostatní']} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie chart – lokace */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Nejčastější lokace</h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={locationStats} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={4} dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {locationStats.map((_, i) => <Cell key={i} fill={Object.values(COLORS)[i % Object.values(COLORS).length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly distribution */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Rozložení podle hodin</h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={10} interval={2} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="počet" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trend 30 days */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Trend posledních 30 dní</h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="datum" stroke="#64748b" fontSize={10} interval={4} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="počet" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2, fill: '#3b82f6' }} activeDot={{ r: 5, fill: '#3b82f6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
