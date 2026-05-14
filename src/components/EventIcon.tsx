import React from 'react';

interface EventIconProps {
  type: string;
  size?: number;
  animated?: boolean;
}

export const getTypeConfig = (type: string) => {
  switch (type) {
    case 'Požár':
      return { color: 'var(--color-fire)', bg: 'var(--color-fire-bg)', emoji: '🔥', label: 'Požár' };
    case 'Dopravní nehoda':
      return { color: 'var(--color-accident)', bg: 'var(--color-accident-bg)', emoji: '🚗', label: 'Dopravní nehoda' };
    case 'Technická pomoc':
      return { color: 'var(--color-technical)', bg: 'var(--color-technical-bg)', emoji: '🔧', label: 'Technická pomoc' };
    case 'Záchrana osob':
      return { color: '#10b981', bg: 'rgba(16,185,129,0.15)', emoji: '🧍', label: 'Záchrana osob' };
    case 'Záchrana osob a zvířat':
      return { color: '#10b981', bg: 'rgba(16,185,129,0.15)', emoji: '🐾', label: 'Záchrana' };
    case 'Únik látek':
      return { color: 'var(--color-hazard)', bg: 'var(--color-hazard-bg)', emoji: '☣️', label: 'Únik látek' };
    case 'Planý poplach':
      return { color: '#64748b', bg: 'rgba(100,116,139,0.15)', emoji: '🔕', label: 'Planý poplach' };
    default:
      return { color: 'var(--color-other)', bg: 'var(--color-other-bg)', emoji: 'ℹ️', label: type };
  }
};

export const FireIcon: React.FC<{ size: number; animated?: boolean }> = ({ size, animated }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {animated && (
      <animateTransform
        attributeName="transform"
        type="scale"
        values="1;1.05;1"
        dur="1.5s"
        repeatCount="indefinite"
        additive="sum"
      />
    )}
    <path d="M12 2C12 2 7 8 7 13a5 5 0 0010 0c0-3-2-6-2-6s-1 2-1 3a2 2 0 01-4 0c0-2 2-8 2-8z"
      fill="#ef4444" opacity="0.9"/>
    <path d="M12 8C12 8 10 11 10 13.5a2 2 0 004 0C14 11 12 8 12 8z"
      fill="#f97316"/>
    <path d="M12 11C12 11 11 12.5 11 13.5a1 1 0 002 0C13 12.5 12 11 12 11z"
      fill="#fbbf24"/>
  </svg>
);

export const CarCrashIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 17H3a2 2 0 01-2-2V9a2 2 0 012-2h14l2 4"/>
    <circle cx="7" cy="17" r="2" fill="#f97316" stroke="none"/>
    <circle cx="17" cy="17" r="2" fill="#f97316" stroke="none"/>
    <path d="M13 9l2 4H3" stroke="#f97316"/>
    <path d="M19 12l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" stroke="#f97316" strokeWidth="2"/>
  </svg>
);

export const WrenchIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
  </svg>
);

export const HazardIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" fill="#eab30820"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2.5"/>
  </svg>
);

export const RescueIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87"/>
    <path d="M16 3.13a4 4 0 010 7.75"/>
    <circle cx="9" cy="7" r="4" fill="#10b98120"/>
  </svg>
);

export const BellOffIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13.73 21a2 2 0 01-3.46 0"/>
    <path d="M18.63 13A17.89 17.89 0 0118 8"/>
    <path d="M6.26 6.26A5.86 5.86 0 006 8c0 7-3 9-3 9h14"/>
    <path d="M18 8a6 6 0 00-9.33-5"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

export const InfoIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" fill="#8b5cf620"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8" strokeWidth="2.5"/>
  </svg>
);

export const EventIcon: React.FC<EventIconProps> = ({ type, size = 20, animated = false }) => {
  switch (type) {
    case 'Požár':
      return <FireIcon size={size} animated={animated} />;
    case 'Dopravní nehoda':
      return <CarCrashIcon size={size} />;
    case 'Technická pomoc':
      return <WrenchIcon size={size} />;
    case 'Záchrana osob':
    case 'Záchrana osob a zvířat':
      return <RescueIcon size={size} />;
    case 'Únik látek':
      return <HazardIcon size={size} />;
    case 'Planý poplach':
      return <BellOffIcon size={size} />;
    default:
      return <InfoIcon size={size} />;
  }
};
