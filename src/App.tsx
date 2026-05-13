import { useState, useEffect, useMemo } from 'react'
import { DispatchEvent, fetchDispatches } from './services/api'
import { DispatchCard } from './components/DispatchCard'
import { SidebarFilter } from './components/SidebarFilter'
import { MapView } from './components/MapView'
import { StatisticsView } from './components/StatisticsView'
import { Activity, Map as MapIcon, List, BarChart3, Search, X, Navigation, MapPin, Cloud, Wind, Thermometer, BellRing } from 'lucide-react'

function App() {
  const [dispatches, setDispatches] = useState<DispatchEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState('Všechny')
  const [selectedDistrict, setSelectedDistrict] = useState('Všechny okresy')
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLive, setIsLive] = useState(false)
  const [activeTab, setActiveTab] = useState<'feed' | 'map' | 'stats'>('feed')
  
  // New State for Location and Detail Drawer
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [selectedDispatch, setSelectedDispatch] = useState<DispatchEvent | null>(null)
  const [toastMessage, setToastMessage] = useState<{title: string, desc: string} | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      const data = await fetchDispatches()
      
      // Simulate Toast notification if new live data came (just randomly here for demo)
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
    
    // Type Filter
    if (selectedType !== 'Všechny') {
      result = result.filter(d => d.type === selectedType);
    }

    // District Filter
    if (selectedDistrict !== 'Všechny okresy') {
      result = result.filter(d => d.location.toLowerCase().includes(selectedDistrict.toLowerCase()));
    }
    
    // Search Filter
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

  // Oddělení aktivních událostí (ne starších než 12 hodin) pro mapu a výpis
  const activeDispatches = useMemo(() => {
    const limit = new Date(Date.now() - 12 * 60 * 60 * 1000);
    return filteredDispatches.filter(d => d.time >= limit);
  }, [filteredDispatches]);

  const counts = useMemo(() => {
    // Only base counts on dispatches that match the search and district query
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
  }, [dispatches, searchQuery])

  return (
    <div className="container" style={{ position: 'relative' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="title">
          HZS ČR <span style={{ color: 'var(--text-secondary)' }}>Dashboard</span>
        </h1>
        <p className="subtitle">Přehled aktivních výjezdů a statistik hasičského záchranného sboru</p>
        
        <div className="status-bar">
          <div className="status-indicator">
            <Activity size={18} style={{ color: isLive ? '#10b981' : '#f59e0b' }} />
            <span>Zdroj dat: {isLive ? 'Aktuální RSS' : 'Generovaná data'}</span>
          </div>
          
          <div className="nav-tabs" style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className={`nav-tab ${activeTab === 'feed' ? 'active' : ''}`}
              onClick={() => setActiveTab('feed')}
            >
              <List size={18} /> Seznam výjezdů
            </button>
            <button 
              className={`nav-tab ${activeTab === 'map' ? 'active' : ''}`}
              onClick={() => setActiveTab('map')}
            >
              <MapIcon size={18} /> Interaktivní mapa
            </button>
            <button 
              className={`nav-tab ${activeTab === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveTab('stats')}
            >
              <BarChart3 size={18} /> Statistiky
            </button>
          </div>

          <div className="status-indicator">
            <div className={`status-dot ${!isLive ? 'offline' : ''}`}></div>
            <span>Stav: {loading ? 'Aktualizuji...' : 'Aktivní'}</span>
          </div>
        </div>
      </header>

      <div className="dashboard-layout">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '2rem', zIndex: 10 }}>
          {/* Search Box */}
          <div className="glass-panel" style={{ padding: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                placeholder="Hledat adresu, událost..." 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '8px 30px 8px 34px', 
                  borderRadius: '6px',
                  border: '1px solid var(--surface-border)',
                  background: 'rgba(0,0,0,0.2)',
                  color: 'white',
                  outline: 'none'
                }}
              />
              {searchInput && (
                <button 
                  onClick={() => setSearchInput('')}
                  style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}
                  title="Vymazat hledání"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
          
          <SidebarFilter 
            selectedType={selectedType}
            onSelectType={setSelectedType}
            selectedDistrict={selectedDistrict}
            onSelectDistrict={setSelectedDistrict}
            counts={counts}
          />
        </div>
        
        <main style={{ position: 'relative' }}>
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
                      onClick={() => {
                        setSelectedDispatch(dispatch);
                        // Pokud přejdeme na mapu, chceme tam být vycentrováni
                        if (dispatch.coords) {
                          setUserLocation(dispatch.coords); 
                        }
                      }}
                      style={{ animationDelay: `${(i % 10) * 0.05}s` }}
                    />
                  ))}
                  
                  {activeDispatches.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-secondary)' }}>
                      <div style={{ marginBottom: '1rem', opacity: 0.5 }}>
                        <Search size={48} style={{ margin: '0 auto' }} />
                      </div>
                      <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Nenalezeny žádné aktivní události</h3>
                      <p>V posledních 12 hodinách nejsou evidovány žádné výjezdy pro zvolené filtry.<br/>Starší události si můžete prohlédnout v záložce <strong>Statistiky</strong>.</p>
                      {(selectedType !== 'Všechny' || selectedDistrict !== 'Všechny okresy' || searchQuery !== '') && (
                        <button 
                          onClick={() => {
                            setSelectedType('Všechny');
                            setSelectedDistrict('Všechny okresy');
                            setSearchInput('');
                          }}
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

      {/* Side Drawer Modal */}
      {selectedDispatch && (
        <div 
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 100,
            display: 'flex',
            justifyContent: 'flex-end'
          }}
          onClick={() => setSelectedDispatch(null)}
        >
          <div 
            className="drawer"
            style={{
              width: '100%', maxWidth: '450px',
              height: '100%',
              backgroundColor: 'var(--bg-color)',
              borderLeft: '1px solid var(--surface-border)',
              padding: '2rem',
              overflowY: 'auto',
              boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
              animation: 'slideIn 0.3s forwards',
              display: 'flex', flexDirection: 'column', gap: '1.5rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedDispatch(null)}
              style={{ alignSelf: 'flex-end', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            
            <div>
              <div className="badge" style={{ marginBottom: '1rem', background: 'var(--surface-color)', color: 'var(--text-primary)' }}>
                {selectedDispatch.type}
              </div>
              <h2 style={{ fontSize: '1.8rem', lineHeight: 1.2, marginBottom: '0.5rem' }}>{selectedDispatch.title}</h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Čas události</h3>
              <p style={{ fontSize: '1.1rem' }}>
                {selectedDispatch.time.toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                <br/><strong>{selectedDispatch.time.toLocaleTimeString('cs-CZ')}</strong>
              </p>
            </div>

            {selectedDispatch.weather && (
              <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Počasí na místě</h3>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Thermometer size={16} color="#ef4444" /> {selectedDispatch.weather.temp}°C</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Cloud size={16} color="#3b82f6" /> {selectedDispatch.weather.condition}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Wind size={16} color="#94a3b8" /> {selectedDispatch.weather.wind} km/h</span>
                  </div>
                </div>
              </div>
            )}

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Popis</h3>
              <p style={{ lineHeight: 1.6 }}>{selectedDispatch.description || 'Pro tuto událost není k dispozici bližší popis.'}</p>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Průběh zásahu (Simulováno)</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, position: 'relative' }}>
                <div style={{ position: 'absolute', left: '7px', top: '10px', bottom: '10px', width: '2px', backgroundColor: 'var(--surface-border)' }}></div>
                {[
                  { label: 'Ohlášení události', time: new Date(selectedDispatch.time.getTime() - 1000*60*5).toLocaleTimeString('cs-CZ', {hour:'2-digit', minute:'2-digit'}), active: true },
                  { label: 'Výjezd jednotek', time: selectedDispatch.time.toLocaleTimeString('cs-CZ', {hour:'2-digit', minute:'2-digit'}), active: true },
                  { label: 'Příjezd na místo', time: new Date(selectedDispatch.time.getTime() + 1000*60*8).toLocaleTimeString('cs-CZ', {hour:'2-digit', minute:'2-digit'}), active: selectedDispatch.time.getTime() + 1000*60*8 < Date.now() },
                  { label: 'Likvidace', time: '—', active: false }
                ].map((step, idx) => (
                  <li key={idx} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', opacity: step.active ? 1 : 0.5 }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: step.active ? '#3b82f6' : 'var(--surface-color)', border: '2px solid var(--surface-border)', zIndex: 2 }}></div>
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
      )}
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000,
          background: 'var(--surface-color)', border: '1px solid #ef4444',
          borderRadius: '8px', padding: '1rem 1.5rem',
          boxShadow: '0 10px 25px rgba(239, 68, 68, 0.2)',
          display: 'flex', alignItems: 'center', gap: '1rem',
          animation: 'slideInUp 0.3s forwards'
        }}>
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
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes slideInUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}} />
    </div>
  )
}

export default App
