import { useState, useEffect, useMemo } from 'react'
import { DispatchEvent, fetchDispatches } from './services/api'
import { DispatchCard } from './components/DispatchCard'
import { SidebarFilter } from './components/SidebarFilter'
import { MapView } from './components/MapView'
import { StatisticsView } from './components/StatisticsView'
import { Activity, Map as MapIcon, List, BarChart3, Search, X, Navigation, MapPin, Cloud, Wind, Thermometer, BellRing, Filter, ChevronDown, ChevronUp } from 'lucide-react'

function App() {
  const [dispatches, setDispatches] = useState<DispatchEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState('Všechny')
  const [selectedDistrict, setSelectedDistrict] = useState('Všechny okresy')
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLive, setIsLive] = useState(false)
  const [activeTab, setActiveTab] = useState<'feed' | 'map' | 'stats'>('feed')
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [selectedDispatch, setSelectedDispatch] = useState<DispatchEvent | null>(null)
  const [toastMessage, setToastMessage] = useState<{title: string, desc: string} | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false) // Mobile filters toggle

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      const data = await fetchDispatches()
      
      if (dispatches.length > 0 && data.length > 0 && data[0].id !== dispatches[0].id) {
        setToastMessage({ title: 'Nový poplach', desc: data[0].title });
        setTimeout(() => setToastMessage(null), 5000);
      }

      setDispatches(data)
      setIsLive(data.length > 0 && data[0].source === 'live')
      setLoading(false)
    }

    loadData()
    const interval = setInterval(loadData, 3 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const filteredDispatches = useMemo(() => {
    let result = dispatches;
    
    if (selectedType !== 'Všechny') {
      result = result.filter(d => d.type === selectedType);
    }
    if (selectedDistrict !== 'Všechny okresy') {
      result = result.filter(d => d.location.toLowerCase().includes(selectedDistrict.toLowerCase()));
    }
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(d => 
        d.title.toLowerCase().includes(query) || 
        d.location.toLowerCase().includes(query) ||
        (d.description && d.description.toLowerCase().includes(query))
      );
    }
    
    return result;
  }, [dispatches, selectedType, selectedDistrict, searchQuery])

  const activeDispatches = useMemo(() => {
    const limit = new Date(Date.now() - 12 * 60 * 60 * 1000);
    return filteredDispatches.filter(d => d.time >= limit);
  }, [filteredDispatches]);

  const counts = useMemo(() => {
    let searched = dispatches;
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      searched = searched.filter(d => 
        d.title.toLowerCase().includes(query) || 
        d.location.toLowerCase().includes(query) ||
        (d.description && d.description.toLowerCase().includes(query))
      );
    }
    if (selectedDistrict !== 'Všechny okresy') {
      searched = searched.filter(d => d.location.toLowerCase().includes(selectedDistrict.toLowerCase()));
    }

    return searched.reduce((acc, curr) => {
      acc[curr.type] = (acc[curr.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  }, [dispatches, searchQuery, selectedDistrict])

  const hasActiveFilters = selectedType !== 'Všechny' || selectedDistrict !== 'Všechny okresy' || searchQuery !== '';

  return (
    <div className="container" style={{ position: 'relative' }}>
      {/* Header */}
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 className="title">
          HZS ČR <span style={{ color: 'var(--text-secondary)' }}>Dashboard</span>
        </h1>
        <p className="subtitle">Přehled aktivních výjezdů a statistik hasičského záchranného sboru</p>
        
        {/* Status + Nav */}
        <div className="status-bar">
          <div className="status-indicator">
            <div className={`status-dot ${!isLive ? 'offline' : ''}`}></div>
            <span className="status-label">{loading ? 'Aktualizuji...' : isLive ? 'Live RSS' : 'Demo data'}</span>
          </div>
          
          <div className="nav-tabs" style={{ display: 'flex', gap: '0.25rem' }}>
            <button 
              id="tab-feed"
              className={`nav-tab ${activeTab === 'feed' ? 'active' : ''}`}
              onClick={() => setActiveTab('feed')}
            >
              <List size={16} /> <span className="nav-label">Seznam</span>
            </button>
            <button 
              id="tab-map"
              className={`nav-tab ${activeTab === 'map' ? 'active' : ''}`}
              onClick={() => setActiveTab('map')}
            >
              <MapIcon size={16} /> <span className="nav-label">Mapa</span>
            </button>
            <button 
              id="tab-stats"
              className={`nav-tab ${activeTab === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveTab('stats')}
            >
              <BarChart3 size={16} /> <span className="nav-label">Statistiky</span>
            </button>
          </div>

          <div className="status-indicator" style={{ justifyContent: 'flex-end' }}>
            <Activity size={16} style={{ color: isLive ? '#10b981' : '#f59e0b' }} />
            <span className="status-label">{activeDispatches.length} aktivních</span>
          </div>
        </div>
      </header>

      {/* Mobile Search + Filter toggle */}
      <div className="mobile-toolbar">
        <div className="search-box glass-panel">
          <Search size={15} className="search-icon" />
          <input 
            type="text" 
            placeholder="Hledat..." 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="search-input"
          />
          {searchInput && (
            <button onClick={() => setSearchInput('')} className="search-clear" title="Vymazat">
              <X size={15} />
            </button>
          )}
        </div>
        <button 
          className={`filter-toggle-btn glass-panel ${filtersOpen ? 'active' : ''} ${hasActiveFilters ? 'has-filters' : ''}`}
          onClick={() => setFiltersOpen(f => !f)}
        >
          <Filter size={16} />
          <span>Filtry</span>
          {filtersOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Mobile collapsible filter panel */}
      <div className={`mobile-filter-panel ${filtersOpen ? 'open' : ''}`}>
        <SidebarFilter 
          selectedType={selectedType}
          onSelectType={setSelectedType}
          selectedDistrict={selectedDistrict}
          onSelectDistrict={setSelectedDistrict}
          counts={counts}
        />
      </div>

      {/* Desktop layout */}
      <div className="dashboard-layout">
        {/* Desktop sidebar */}
        <div className="sidebar-column">
          <div className="search-box glass-panel">
            <Search size={15} className="search-icon" />
            <input 
              type="text" 
              placeholder="Hledat adresu, událost..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="search-input"
            />
            {searchInput && (
              <button onClick={() => setSearchInput('')} className="search-clear" title="Vymazat">
                <X size={15} />
              </button>
            )}
          </div>
          
          <SidebarFilter 
            selectedType={selectedType}
            onSelectType={setSelectedType}
            selectedDistrict={selectedDistrict}
            onSelectDistrict={setSelectedDistrict}
            counts={counts}
          />
        </div>
        
        <main style={{ minWidth: 0 }}>
          {loading && dispatches.length === 0 ? (
            <div className="loader">
              <div className="spinner"></div>
            </div>
          ) : (
            <>
              {activeTab === 'feed' && (
                <div className="feed-grid">
                  {activeDispatches.map((dispatch, i) => (
                    <DispatchCard 
                      key={dispatch.id} 
                      dispatch={dispatch} 
                      userLocation={userLocation}
                      onClick={() => setSelectedDispatch(dispatch)}
                      style={{ animationDelay: `${(i % 10) * 0.05}s` }}
                    />
                  ))}
                  
                  {activeDispatches.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-secondary)' }}>
                      <div style={{ marginBottom: '1rem', opacity: 0.5 }}>
                        <Search size={48} style={{ margin: '0 auto' }} />
                      </div>
                      <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Nenalezeny žádné aktivní události</h3>
                      <p>V posledních 12 hodinách nejsou evidovány výjezdy pro zvolené filtry.<br/>Starší události si prohlédněte v záložce <strong>Statistiky</strong>.</p>
                      {hasActiveFilters && (
                        <button 
                          onClick={() => { setSelectedType('Všechny'); setSelectedDistrict('Všechny okresy'); setSearchInput(''); }}
                          className="nav-tab"
                          style={{ margin: '1.5rem auto 0', background: 'var(--surface-color)', border: '1px solid var(--surface-border)' }}
                        >
                          Zrušit všechny filtry
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'map' && (
                <MapView 
                  dispatches={activeDispatches} 
                  userLocation={userLocation} 
                  setUserLocation={setUserLocation} 
                  onDispatchClick={(d) => setSelectedDispatch(d)}
                />
              )}

              {activeTab === 'stats' && (
                <StatisticsView dispatches={filteredDispatches} />
              )}
            </>
          )}
        </main>
      </div>

      {/* Detail Drawer */}
      {selectedDispatch && (
        <div 
          className="drawer-overlay"
          onClick={() => setSelectedDispatch(null)}
        >
          <div 
            className="drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer-header">
              <div className="badge" style={{ background: 'var(--surface-color)', color: 'var(--text-primary)' }}>
                {selectedDispatch.type}
              </div>
              <button 
                onClick={() => setSelectedDispatch(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }}
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="drawer-content">
              <h2 style={{ fontSize: 'clamp(1.3rem, 5vw, 1.8rem)', lineHeight: 1.2, marginBottom: '0.5rem' }}>
                {selectedDispatch.title}
              </h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <p style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Navigation size={16} /> {selectedDispatch.location}
                </p>
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${selectedDispatch.coords ? `${selectedDispatch.coords[0]},${selectedDispatch.coords[1]}` : encodeURIComponent(selectedDispatch.location)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="nav-tab"
                  style={{ background: '#3b82f6', color: 'white', padding: '0.4rem 0.8rem', textDecoration: 'none' }}
                >
                  <MapPin size={16} /> Navigovat
                </a>
              </div>

              <div className="glass-panel" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Čas události</h3>
                <p>
                  {selectedDispatch.time.toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  <br/><strong>{selectedDispatch.time.toLocaleTimeString('cs-CZ')}</strong>
                </p>
              </div>

              {selectedDispatch.weather && (
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>Počasí na místě</h3>
                  <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Thermometer size={16} color="#ef4444" /> {selectedDispatch.weather.temp}°C</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Cloud size={16} color="#3b82f6" /> {selectedDispatch.weather.condition}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Wind size={16} color="#94a3b8" /> {selectedDispatch.weather.wind} km/h</span>
                  </div>
                </div>
              )}

              <div className="glass-panel" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Popis</h3>
                <p style={{ lineHeight: 1.6 }}>{selectedDispatch.description || 'Pro tuto událost není k dispozici bližší popis.'}</p>
              </div>

              <div className="glass-panel" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Průběh zásahu (Orientační)</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '7px', top: '10px', bottom: '10px', width: '2px', backgroundColor: 'var(--surface-border)' }}></div>
                  {[
                    { label: 'Ohlášení události', time: new Date(selectedDispatch.time.getTime() - 1000*60*5).toLocaleTimeString('cs-CZ', {hour:'2-digit', minute:'2-digit'}), active: true },
                    { label: 'Výjezd jednotek', time: selectedDispatch.time.toLocaleTimeString('cs-CZ', {hour:'2-digit', minute:'2-digit'}), active: true },
                    { label: 'Příjezd na místo', time: new Date(selectedDispatch.time.getTime() + 1000*60*8).toLocaleTimeString('cs-CZ', {hour:'2-digit', minute:'2-digit'}), active: selectedDispatch.time.getTime() + 1000*60*8 < Date.now() },
                    { label: 'Likvidace', time: '—', active: false }
                  ].map((step, idx) => (
                    <li key={idx} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', opacity: step.active ? 1 : 0.5 }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: step.active ? '#3b82f6' : 'var(--surface-color)', border: '2px solid var(--surface-border)', zIndex: 2, flexShrink: 0 }}></div>
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.9rem' }}>{step.label}</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{step.time}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast">
          <div style={{ background: '#ef4444', padding: '0.5rem', borderRadius: '50%' }}>
            <BellRing size={20} color="white" />
          </div>
          <div>
            <strong style={{ display: 'block', color: 'white' }}>{toastMessage.title}</strong>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{toastMessage.desc}</span>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes slideInUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes drawerUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}} />
    </div>
  )
}

export default App
