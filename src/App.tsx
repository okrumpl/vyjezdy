import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { DispatchEvent, fetchDispatches } from './services/api'
import { DispatchCard } from './components/DispatchCard'
import { SidebarFilter } from './components/SidebarFilter'
import { MapView } from './components/MapView'
import { StatisticsView } from './components/StatisticsView'
import { TimelineView } from './components/TimelineView'
import { KPIWidgets } from './components/KPIWidgets'
import { EventDetailDrawer } from './components/EventDetailDrawer'
import { NotificationSettings } from './components/NotificationSettings'
import { NotificationSettings as SettingsType, loadSettings } from './services/notificationService'
import {
  Map as MapIcon, List, BarChart3, Search, X,
  BellRing, Filter, ChevronDown, ChevronUp,
  Share2, Bell, BellOff, RefreshCw, Sun, Moon, Clock,
  Timer
} from 'lucide-react'

const REFRESH_INTERVAL = 3 * 60 * 1000

function App() {
  const [dispatches, setDispatches] = useState<DispatchEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState('Všechny')
  const [selectedDistrict, setSelectedDistrict] = useState('Všechny okresy')
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLive, setIsLive] = useState(false)
  const [activeTab, setActiveTab] = useState<'feed' | 'map' | 'stats' | 'timeline'>('feed')
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [selectedDispatch, setSelectedDispatch] = useState<DispatchEvent | null>(null)
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string } | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [notificationSettings, setNotificationSettings] = useState<SettingsType>(loadSettings())
  const [notificationSettingsOpen, setNotificationSettingsOpen] = useState(false)
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL / 1000)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('hzs-theme')
    if (saved) return saved as 'dark' | 'light'
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  })
  const [pullY, setPullY] = useState(0)
  const touchStartY = useRef(0)
  // seenEventIds no longer used because of backend push
  const [sinceLastEvent, setSinceLastEvent] = useState(0)

  // Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('hzs-theme', theme)
  }, [theme])

  // Data loading
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setIsRefreshing(true)
    const data = await fetchDispatches()
    
    // Local notification polling removed - handled by Backend Push Notifications

    setDispatches(data)
    setIsLive(data.some(d => d.source === 'live'))
    setLoading(false)
    setIsRefreshing(false)
    setCountdown(REFRESH_INTERVAL / 1000)
  }, [notificationSettings])

  useEffect(() => { loadData(); const i = setInterval(() => loadData(true), REFRESH_INTERVAL); return () => clearInterval(i) }, [loadData])
  useEffect(() => { const t = setInterval(() => setCountdown(p => p > 0 ? p - 1 : REFRESH_INTERVAL / 1000), 1000); return () => clearInterval(t) }, [])
  useEffect(() => { const h = setTimeout(() => setSearchQuery(searchInput), 300); return () => clearTimeout(h) }, [searchInput])

  // Resume from background (iOS PWA fix)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData(true);
        // Force reset countdown to show fresh cycle
        setCountdown(REFRESH_INTERVAL / 1000);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loadData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      switch (e.key) {
        case '1': setActiveTab('feed'); break
        case '2': setActiveTab('map'); break
        case '3': setActiveTab('stats'); break
        case '4': setActiveTab('timeline'); break
        case 'r': case 'R': loadData(true); break
        case 'Escape': setSelectedDispatch(null); setFiltersOpen(false); break
        case '/': case 'f': case 'F': e.preventDefault(); document.querySelector<HTMLInputElement>('.search-input')?.focus(); break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [loadData])

  const handleTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY }
  const handleTouchMove = (e: React.TouchEvent) => { const d = e.touches[0].clientY - touchStartY.current; if (d > 0 && window.scrollY === 0) setPullY(Math.min(d * 0.5, 80)) }
  const handleTouchEnd = () => { if (pullY > 60) loadData(true); setPullY(0) }

  // Debounced search
  useEffect(() => {
    const h = setTimeout(() => setSearchQuery(searchInput), 300)
    return () => clearTimeout(h)
  }, [searchInput])

  // Share
  const handleShare = async (dispatch?: DispatchEvent) => {
    const url = window.location.href
    const shareData = dispatch 
      ? { title: dispatch.title || dispatch.type, text: `${dispatch.type} – ${dispatch.location}`, url }
      : { title: 'HZS ČR Dashboard', url }

    if (navigator.share) {
      try { await navigator.share(shareData) } catch { /* ignored */ }
    } else {
      await navigator.clipboard.writeText(url)
      setToastMessage({ title: '📋 Odkaz zkopírován', desc: url })
      setTimeout(() => setToastMessage(null), 3000)
    }
  }

  // ===== Filtry =====
  const baseFilteredDispatches = useMemo(() => {
    let result = dispatches
    if (selectedDistrict !== 'Všechny okresy') {
      result = result.filter(d => d.location.toLowerCase().includes(selectedDistrict.toLowerCase()))
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.location.toLowerCase().includes(q) ||
        (d.description && d.description.toLowerCase().includes(q))
      )
    }
    return result
  }, [dispatches, selectedDistrict, searchQuery])

  const filteredDispatches = useMemo(() => {
    let result = baseFilteredDispatches
    if (selectedType !== 'Všechny') {
      result = result.filter(d =>
        selectedType === 'Záchrana osob'
          ? d.type === 'Záchrana osob' || d.type === 'Záchrana osob a zvířat'
          : d.type === selectedType
      )
    }
    return result
  }, [baseFilteredDispatches, selectedType])

  const activeDispatches = useMemo(() => {
    const limit = new Date(Date.now() - 12 * 60 * 60 * 1000)
    return filteredDispatches.filter(d => d.time >= limit)
  }, [filteredDispatches])

  const counts = useMemo(() => {
    return baseFilteredDispatches.reduce((acc, curr) => {
      acc[curr.type] = (acc[curr.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }, [baseFilteredDispatches])

  // Time since last event counter
  const latestEventTime = useMemo(() => {
    if (dispatches.length === 0) return null
    return dispatches.reduce((latest, d) => d.time > latest ? d.time : latest, dispatches[0].time)
  }, [dispatches])

  useEffect(() => {
    if (!latestEventTime) return
    const update = () => setSinceLastEvent(Math.floor((Date.now() - latestEventTime.getTime()) / 1000))
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [latestEventTime])

  const fmtElapsed = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${m}:${String(s).padStart(2, '0')}`
  }

  const hasActiveFilters = selectedType !== 'Všechny' || selectedDistrict !== 'Všechny okresy' || searchQuery !== ''
  const fmtCountdown = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="container" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      {pullY > 10 && <div className="pull-indicator" style={{ height: pullY, opacity: pullY / 80 }}><RefreshCw size={20} style={{ transform: `rotate(${pullY * 3}deg)` }} /><span>{pullY > 60 ? 'Pustit' : 'Stáhnout...'}</span></div>}

      {/* STICKY HEADER */}
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
          <div>
            <h1 className="title">🚒 HZS ČR <span style={{ fontWeight: 400 }}>Dashboard</span></h1>
            <p className="subtitle">Přehled výjezdů Hasičského záchranného sboru</p>
          </div>
          <div className="header-actions">
            <button className={`icon-btn ${notificationSettings.enabled ? 'active' : ''}`} onClick={() => setNotificationSettingsOpen(true)} title="Nastavení notifikací">
              {notificationSettings.enabled ? <Bell size={18} /> : <BellOff size={18} />}
            </button>
            <button className="icon-btn" onClick={() => handleShare()} title="Sdílet aplikaci">
              <Share2 size={18} />
            </button>
            <button className="icon-btn" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} title="Tmavý/světlý režim">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className={`icon-btn ${isRefreshing ? 'spinning' : ''}`} onClick={() => loadData(true)} title="Aktualizovat [R]">
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        <div className="status-bar" style={{ marginTop: '0.6rem' }}>
          <div className="status-indicator">
            <div className={`status-dot ${!isLive ? 'offline' : ''}`} />
            <span>{loading ? 'Načítám...' : isLive ? 'Live RSS' : 'Demo data'}</span>
          </div>
          <div className="nav-tabs">
            {([['feed', List, 'Seznam'], ['map', MapIcon, 'Mapa'], ['stats', BarChart3, 'Statistiky'], ['timeline', Clock, 'Časová osa']] as const).map(([key, Icon, label]) => (
              <button key={key} className={`nav-tab ${activeTab === key ? 'active' : ''}`} onClick={() => setActiveTab(key as typeof activeTab)}>
                <Icon size={15} /> <span className="nav-label">{label}</span>
              </button>
            ))}
          </div>
          <div className="status-indicator" style={{ justifyContent: 'flex-end', gap: '0.6rem' }}>
            {latestEventTime && (
              <span className={`since-last-badge ${sinceLastEvent < 60 ? 'fresh' : sinceLastEvent < 300 ? 'recent' : ''}`}>
                <Timer size={13} /> {fmtElapsed(sinceLastEvent)}
              </span>
            )}
            <span className="countdown-badge">⏱ {fmtCountdown(countdown)}</span>
            <span className="status-label">✦ {activeDispatches.length} aktivních</span>
          </div>
        </div>
      </header>

      {/* KPI */}
      <KPIWidgets dispatches={dispatches} isLive={isLive} />

      {/* Mobile toolbar */}
      <div className="mobile-toolbar">
        <div className="search-box glass-panel" style={{ flex: 1 }}>
          <Search size={15} className="search-icon" />
          <input type="text" placeholder="Hledat..." value={searchInput} onChange={e => setSearchInput(e.target.value)} className="search-input" />
          {searchInput && <button onClick={() => setSearchInput('')} className="search-clear"><X size={15} /></button>}
        </div>
        <button className={`filter-toggle-btn glass-panel ${filtersOpen ? 'active' : ''} ${hasActiveFilters ? 'has-filters' : ''}`} onClick={() => setFiltersOpen(f => !f)}>
          <Filter size={16} /><span>Filtry</span>{filtersOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>
      <div className={`mobile-filter-panel ${filtersOpen ? 'open' : ''}`}>
        <SidebarFilter selectedType={selectedType} onSelectType={setSelectedType} selectedDistrict={selectedDistrict} onSelectDistrict={setSelectedDistrict} counts={counts} />
      </div>

      {/* Dashboard */}
      <div className="dashboard-layout">
        <div className="sidebar-column">
          <div className="search-box glass-panel">
            <Search size={15} className="search-icon" />
            <input type="text" placeholder="Hledat adresu, událost..." value={searchInput} onChange={e => setSearchInput(e.target.value)} className="search-input" />
            {searchInput && <button onClick={() => setSearchInput('')} className="search-clear"><X size={15} /></button>}
          </div>
          <SidebarFilter selectedType={selectedType} onSelectType={setSelectedType} selectedDistrict={selectedDistrict} onSelectDistrict={setSelectedDistrict} counts={counts} />
        </div>

        <main style={{ minWidth: 0 }}>
          {loading && dispatches.length === 0 ? <div className="loader"><div className="spinner" /></div> : (
            <>
              {activeTab === 'feed' && (
                <div className="feed-grid">
                  {activeDispatches.map((d, i) => <DispatchCard key={d.id} dispatch={d} userLocation={userLocation} onClick={() => setSelectedDispatch(d)} style={{ animationDelay: `${(i % 12) * 0.04}s` }} />)}
                  {activeDispatches.length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
                      <Search size={48} style={{ margin: '0 auto 1rem', opacity: 0.3, display: 'block' }} />
                      <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Žádné aktivní události</h3>
                      <p>V posledních 12 hodinách nejsou výjezdy pro zvolené filtry.</p>
                      {hasActiveFilters && <button onClick={() => { setSelectedType('Všechny'); setSelectedDistrict('Všechny okresy'); setSearchInput('') }} className="nav-tab" style={{ margin: '1rem auto 0', background: 'var(--surface-color)', border: '1px solid var(--surface-border)' }}>Zrušit filtry</button>}
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'map' && <MapView dispatches={activeDispatches} userLocation={userLocation} setUserLocation={setUserLocation} onDispatchClick={d => setSelectedDispatch(d)} />}
              {activeTab === 'stats' && <StatisticsView dispatches={filteredDispatches} />}
              {activeTab === 'timeline' && <TimelineView dispatches={activeDispatches} onDispatchClick={d => setSelectedDispatch(d)} />}
            </>
          )}
        </main>
      </div>

      {/* Detail Drawer */}
      {selectedDispatch && (
        <EventDetailDrawer 
          dispatch={selectedDispatch} 
          onClose={() => setSelectedDispatch(null)} 
          onShare={handleShare} 
        />
      )}

      {/* Notification Settings Drawer */}
      <NotificationSettings 
        isOpen={notificationSettingsOpen} 
        onClose={() => setNotificationSettingsOpen(false)}
        onSettingsChange={setNotificationSettings}
      />

      {/* Toast */}
      {toastMessage && (
        <div className="toast">
          <div style={{ background: '#ef4444', padding: '0.5rem', borderRadius: '50%', flexShrink: 0 }}><BellRing size={18} color="white" /></div>
          <div style={{ minWidth: 0 }}><strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '0.9rem' }}>{toastMessage.title}</strong><span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{toastMessage.desc}</span></div>
          <button onClick={() => setToastMessage(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={16} /></button>
        </div>
      )}
    </div>
  )
}

export default App
