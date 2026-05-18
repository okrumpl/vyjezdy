import React, { useState, useEffect } from 'react';
import { X, Bell, Plus, Check, Info } from 'lucide-react';
import { NotificationSettings as SettingsType, loadSettings, saveSettings, requestPermission } from '../services/notificationService';
import { EVENT_TYPES } from './SidebarFilter';
import { EventIcon, getTypeConfig } from './EventIcon';

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange?: (settings: SettingsType) => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  isOpen,
  onClose,
  onSettingsChange
}) => {
  const [settings, setSettings] = useState<SettingsType>(loadSettings());
  const [newLocality, setNewLocality] = useState('');
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (isOpen) {
      setSettings(loadSettings());
      if ('Notification' in window) {
        setPermissionStatus(Notification.permission);
      }
    }
  }, [isOpen]);

  const handleToggleEnabled = async () => {
    if (!settings.enabled && permissionStatus !== 'granted') {
      const granted = await requestPermission();
      setPermissionStatus(granted ? 'granted' : 'denied');
      if (!granted) return;
    }

    const newSettings = { ...settings, enabled: !settings.enabled };
    setSettings(newSettings);
  };

  const handleToggleType = (typeId: string) => {
    let newTypes = [...settings.types];
    if (newTypes.includes(typeId)) {
      newTypes = newTypes.filter(t => t !== typeId);
    } else {
      newTypes.push(typeId);
    }
    setSettings({ ...settings, types: newTypes });
  };

  const handleAddLocality = () => {
    const trimmed = newLocality.trim();
    if (trimmed && !settings.localities.includes(trimmed)) {
      const newLocalities = [...settings.localities, trimmed];
      setSettings({ ...settings, localities: newLocalities });
      setNewLocality('');
    }
  };

  const handleRemoveLocality = (locality: string) => {
    const newLocalities = settings.localities.filter(l => l !== locality);
    setSettings({ ...settings, localities: newLocalities });
  };

  const handleSave = () => {
    saveSettings(settings);
    if (onSettingsChange) {
      onSettingsChange(settings);
    }
    onClose();
  };

  const handleSelectAllTypes = () => {
    // Všechny typy kromě "Všechny"
    const allTypes = EVENT_TYPES.filter(t => t.id !== 'Všechny').map(t => t.id);
    setSettings({ ...settings, types: allTypes });
  };

  const handleClearAllTypes = () => {
    setSettings({ ...settings, types: [] });
  };

  if (!isOpen) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer notification-settings-drawer" onClick={e => e.stopPropagation()}>
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={20} color="#ef4444" />
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Nastavení notifikací</h2>
          </div>
          <button onClick={onClose} className="icon-btn" title="Zavřít">
            <X size={20} />
          </button>
        </div>

        <div className="drawer-content">
          {/* Hlavní přepínač */}
          <div className="glass-panel setting-section" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.2rem' }}>Povolit upozornění</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  {settings.enabled ? 'Notifikace jsou aktivní' : 'Notifikace jsou vypnuté'}
                </p>
              </div>
              <button 
                className={`toggle-switch ${settings.enabled ? 'active' : ''}`}
                onClick={handleToggleEnabled}
              >
                <div className="toggle-thumb" />
              </button>
            </div>
            
            {permissionStatus === 'denied' && (
              <div className="status-message error" style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#ef4444' }}>
                <Info size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                Notifikace jsou v prohlížeči zablokovány. Povolte je v nastavení prohlížeče.
              </div>
            )}
          </div>

          {settings.enabled && (
            <>
              {/* Výběr typů */}
              <div className="glass-panel setting-section" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                  <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Typy událostí</h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="text-btn" onClick={handleSelectAllTypes}>Vybrat vše</button>
                    <button className="text-btn" onClick={handleClearAllTypes}>Zrušit</button>
                  </div>
                </div>

                <div className="types-grid">
                  {EVENT_TYPES.filter(t => t.id !== 'Všechny').map(type => {
                    const isSelected = settings.types.includes(type.id);
                    const config = getTypeConfig(type.id);
                    
                    return (
                      <button
                        key={type.id}
                        className={`type-checkbox ${isSelected ? 'active' : ''}`}
                        onClick={() => handleToggleType(type.id)}
                        style={{ '--type-color': config.color } as React.CSSProperties}
                      >
                        <div className="checkbox-icon">
                          <EventIcon type={type.id} size={14} />
                        </div>
                        <span style={{ fontSize: '0.85rem', flex: 1, textAlign: 'left' }}>{type.label}</span>
                        {isSelected && <Check size={14} className="check-icon" />}
                      </button>
                    );
                  })}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                  {settings.types.length === 0 ? '🔔 Notifikace budou chodit pro všechny typy událostí.' : `🔔 Vybráno ${settings.types.length} typů událostí.`}
                </p>
              </div>

              {/* Výběr lokalit */}
              <div className="glass-panel setting-section" style={{ padding: '1rem' }}>
                <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '0.8rem' }}>Lokality (Města/Obce)</h3>
                
                <div className="locality-input-wrap">
                  <input
                    type="text"
                    placeholder="Např. Heřmanův Městec..."
                    value={newLocality}
                    onChange={e => setNewLocality(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleAddLocality()}
                    className="locality-input"
                  />
                  <button onClick={handleAddLocality} className="add-btn" title="Přidat lokalitu">
                    <Plus size={18} />
                  </button>
                </div>

                <div className="locality-chips">
                  {settings.localities.map(locality => (
                    <div key={locality} className="chip">
                      <span>{locality}</span>
                      <button onClick={() => handleRemoveLocality(locality)} className="chip-remove">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                  {settings.localities.length === 0 
                    ? '🌍 Notifikace budou chodit ze všech lokalit.' 
                    : '🌍 Notifikace budou chodit pouze pokud lokace obsahuje některý z výše uvedených názvů.'}
                </p>
              </div>
            </>
          )}

          {/* Info o fungování */}
          <div className="info-box" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '0.5rem' }}>
            <Info size={14} style={{ verticalAlign: 'middle', marginRight: '4px', color: '#3b82f6' }} />
            Notifikace se kontrolují každé 3 minuty při aktualizaci dat. Aplikace musí být spuštěna na pozadí nebo v aktivním okně.
          </div>

          {/* Tlačítko Uložit */}
          <button className="save-btn" onClick={handleSave}>
            Uložit nastavení
          </button>
        </div>
      </div>
    </div>
  );
};
