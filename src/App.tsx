import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { DispatchEvent, fetchDispatches } from './services/api'
import { DispatchCard } from './components/DispatchCard'
import { SidebarFilter } from './components/SidebarFilter'
import { MapView } from './components/MapView'
import { StatisticsView } from './components/StatisticsView'
import { EventIcon, getTypeConfig } from './components/EventIcon'
import { EventDetailDrawer } from './components/EventDetailDrawer'
import {
  Map as MapIcon, List, BarChart3, Search, X,
  Navigation, MapPin, Cloud, Wind, Thermometer,
  BellRing, Filter, ChevronDown, ChevronUp,
  Share2, Bell, BellOff, RefreshCw
} from 'lucide-react'

const REFRESH_INTERVAL = 3 * 60 * 1000 // 3 minuty

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
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string } | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL / 1000)
  const [isRefreshing, setIsRefreshing] = useState(false)
  // Pull-to-refresh
  const [pullY, setPullY] = useState(0)
  const touchStartY = useRef(0)
  const lastRefresh = useRef(Date.now())
  const prevFirstId = useRef<string | null>(null)

  // ===== Načítání dat =====
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setIsRefreshing(true)
    const data = await fetchDispatches()

    // Notifikace při nové události
    const firstId = data.find(d => d.source === 'live')?.id ?? null
    if (
      notificationsEnabled &&
      prevFirstId.current !== null &&
      firstId !== prevFirstId.current &&
      firstId !== null
    ) {
      const newest = data.find(d => d.id === firstId)
      if (newest && Notification.permission === 'granted') {
        new Notification(`🚒 Nový výjezd – ${newest.location}`, {
          body: `${newest.type} · ${newest.time.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}`,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: 'hzs-dispatch'
        })
      }
      setToastMessage({ title: 'Nový výjezd', desc: `${newest?.type} – ${newest?.location}` })
      setTimeout(() => setToastMessage(null), 5000)
    }
    prevFirstId.current = firstId

    setDispatches(data)
    setIsLive(data.some(d => d.source === 'live'))
    setLoading(false)
    setIsRefreshing(false)
    lastRefresh.current = Date.now()
    setCountdown(REFRESH_INTERVAL / 1000)
  }, [notificationsEnabled])

  useEffect(() => {
    loadData()
    const interval = setInterval(() => loadData(true), REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [loadData])

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : REFRESH_INTERVAL / 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Debounced search
  useEffect(() => {
    const h = setTimeout(() => setSearchQuery(searchInput), 300)
    return () => clearTimeout(h)
  }, [searchInput])

  // Notifikace – povolení
  const requestNotifications = async () => {
    if (!('Notification' in window)) return
    const perm = await Notification.requestPermission()
    setNotificationsEnabled(perm === 'granted')
    if (perm === 'granted') {
      setToastMessage({ title: '🔔 Notifikace povoleny', desc: 'Dostanete upozornění při novém výjezdu' })
      setTimeout(() => setToastMessage(null), 3000)
    }
  }

  // Pull-to-refresh (touch)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }
  const handleTouchMove = (e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - touchStartY.current
    if (delta > 0 && window.scrollY === 0) setPullY(Math.min(delta * 0.5, 80))
  }
  const handleTouchEnd = () => {
    if (pullY > 60) loadData(true)
    setPullY(0)
  }

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

  const hasActiveFilters = selectedType !== 'Všechny' || selectedDistrict !== 'Všechny okresy' || searchQuery !== ''

  const formatCountdown = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div
      className="container"
      style={{ position: 'relative' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indikátor */}
      {pullY > 10 && (
        <div className="pull-indicator" style={{ height: pullY, opacity: pullY / 80 }}>
          <RefreshCw size={20} style={{ transform: `rotate(${pullY * 3}deg)` }} />
          <span>{pullY > 60 ? 'Pustit pro aktualizaci' : 'Stáhnout dolů...'}</span>
        </div>
      )}

      {/* Header */}
      <header style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <h1 className="title">HZS ČR <span style={{ color: 'var(--text-secondary)' }}>Dashboard</span></h1>
            <p className="subtitle">Přehled výjezdů Hasičského záchranného sboru</p>
          </div>
          <div className="header-actions">
            <button
              className={`icon-btn ${notificationsEnabled ? 'active' : ''}`}
              onClick={requestNotifications}
              title={notificationsEnabled ? 'Notifikace zapnuty' : 'Zapnout notifikace'}
            >
              {notificationsEnabled ? <Bell size={18} /> : <BellOff size={18} />}
            </button>
            <button className="icon-btn" onClick={() => handleShare()} title="Sdílet aplikaci">
              <Share2 size={18} />
            </button>
            <button
              className={`icon-btn ${isRefreshing ? 'spinning' : ''}`}
              onClick={() => loadData(true)}
              title="Aktualizovat data"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="status-bar">
          <div className="status-indicator">
            <div className={`status-dot ${!isLive ? 'offline' : ''}`} />
            <span className="status-label">{loading ? 'Načítám...' : isLive ? 'Live RSS' : 'Demo data'}</span>
          </div>

          <div className="nav-tabs" style={{ display: 'flex', gap: '0.25rem' }}>
            <button id="tab-feed" className={`nav-tab ${activeTab === 'feed' ? 'active' : ''}`} onClick={() => setActiveTab('feed')}>
              <List size={16} /> <span className="nav-label">Seznam</span>
            </button>
            <button id="tab-map" className={`nav-tab ${activeTab === 'map' ? 'active' : ''}`} onClick={() => setActiveTab('map')}>
              <MapIcon size={16} /> <span className="nav-label">Mapa</span>
            </button>
            <button id="tab-stats" className={`nav-tab ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>
              <BarChart3 size={16} /> <span className="nav-label">Statistiky</span>
            </button>
          </div>

          <div className="status-indicator" style={{ justifyContent: 'flex-end', gap: '0.75rem' }}>
            <span className="countdown-badge" title="Automatická aktualizace">
              ⏱ {formatCountdown(countdown)}
            </span>
            <span className="status-label">{activeDispatches.length} aktivních</span>
          </div>
        </div>
      </header>

      {/* Mobile toolbar */}
      <div className="mobile-toolbar">
        <div className="search-box glass-panel" style={{ flex: 1 }}>
          <Search size={15} className="search-icon" />
          <input
            type="text"
            placeholder="Hledat..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="search-input"
          />
          {searchInput && (
            <button onClick={() => setSearchInput('')} className="search-clear">
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

      {/* Mobile filter panel */}
      <div className={`mobile-filter-panel ${filtersOpen ? 'open' : ''}`}>
        <SidebarFilter
          selectedType={selectedType} onSelectType={setSelectedType}
          selectedDistrict={selectedDistrict} onSelectDistrict={setSelectedDistrict}
          counts={counts}
        />
      </div>

      {/* Dashboard layout */}
      <div className="dashboard-layout">
        {/* Desktop sidebar */}
        <div className="sidebar-column">
          <div className="search-box glass-panel">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Hledat adresu, událost..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="search-input"
            />
            {searchInput && (
              <button onClick={() => setSearchInput('')} className="search-clear">
                <X size={15} />
              </button>
            )}
          </div>
          <SidebarFilter
            selectedType={selectedType} onSelectType={setSelectedType}
            selectedDistrict={selectedDistrict} onSelectDistrict={setSelectedDistrict}
            counts={counts}
          />
        </div>

        <main style={{ minWidth: 0 }}>
          {loading && dispatches.length === 0 ? (
            <div className="loader"><div className="spinner" /></div>
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
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-secondary)' }}>
                      <div style={{ marginBottom: '1rem', opacity: 0.4 }}>
                        <Search size={48} style={{ margin: '0 auto' }} />
                      </div>
                      <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                        Nenalezeny žádné aktivní události
                      </h3>
                      <p>V posledních 12 hodinách nejsou evidovány výjezdy pro zvolené filtry.<br/>
                        Starší události si prohlédněte v záložce <strong>Statistiky</strong>.</p>
                      {hasActiveFilters && (
                        <button
                          onClick={() => { setSelectedType('Všechny'); setSelectedDistrict('Všechny okresy'); setSearchInput('') }}
                          className="nav-tab"
                          style={{ margin: '1.5rem auto 0', background: 'var(--surface-color)', border: '1px solid var(--surface-border)' }}
                        >
                          Zrušit filtry
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
                  onDispatchClick={d => setSelectedDispatch(d)}
                />
              )}

              {activeTab === 'stats' && <StatisticsView dispatches={filteredDispatches} />}
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

      {/* Toast */}
      {toastMessage && (
        <div className="toast">
          <div style={{ background: '#ef4444', padding: '0.5rem', borderRadius: '50%', flexShrink: 0 }}>
            <BellRing size={18} color="white" />
          </div>
          <div style={{ minWidth: 0 }}>
            <strong style={{ display: 'block', color: 'white', fontSize: '0.9rem' }}>{toastMessage.title}</strong>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{toastMessage.desc}</span>
          </div>
          <button onClick={() => setToastMessage(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', flexShrink: 0 }}>
            <X size={16} />
          </button>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes slideInUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}} />
    </div>
  )
}

export default App
