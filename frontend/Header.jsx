import React from 'react';
import { Landmark, CheckCircle2, AlertTriangle, RefreshCw, BookOpen } from 'lucide-react';

export default function Header({ systemStatus, onRetryConnection, supportedScriptsCount }) {
  const isOnline = systemStatus === 'operational' || systemStatus === 'ok';

  return (
    <header style={{
      borderBottom: '1px solid var(--border-medium)',
      padding: '0.85rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: '#000000',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.9)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: 'var(--radius-sm)',
          background: '#111111',
          border: '1px solid var(--border-medium)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-gold)'
        }}>
          <Landmark size={22} color="var(--gold-primary)" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.25rem',
              letterSpacing: '1px',
              color: 'var(--text-primary)',
              margin: 0,
              lineHeight: 1.2
            }}>
              Neural Archaeologist AI
            </h1>
            <span style={{
              fontSize: '0.65rem',
              fontFamily: 'var(--font-mono)',
              padding: '0.15rem 0.45rem',
              background: 'rgba(212, 175, 55, 0.15)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '3px',
              color: 'var(--gold-light)'
            }}>
              v0.1.0
            </span>
          </div>
          <span style={{
            fontSize: '0.78rem',
            color: 'var(--text-secondary)'
          }}>
            Epigraphic Vision & Classical Epigraphy Dashboard
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {supportedScriptsCount > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            background: '#0e0e0e',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-xs)',
            border: '1px solid #222222'
          }}>
            <BookOpen size={14} color="var(--gold-primary)" />
            <span><strong>{supportedScriptsCount}</strong> Ancient Script Models</span>
          </div>
        )}

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          padding: '0.4rem 0.85rem',
          borderRadius: '9999px',
          background: isOnline ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.12)',
          border: `1px solid ${isOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.35)'}`,
          fontSize: '0.82rem',
          fontFamily: 'var(--font-mono)'
        }}>
          {isOnline ? (
            <>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--emerald-accent)',
                boxShadow: '0 0 10px var(--emerald-accent)'
              }} />
              <span style={{ color: '#34d399' }}>FastAPI Backend: Online</span>
            </>
          ) : (
            <>
              <AlertTriangle size={14} color="var(--crimson-accent)" />
              <span style={{ color: '#f87171' }}>Backend Offline</span>
              <button
                onClick={onRetryConnection}
                title="Retry connecting to FastAPI"
                style={{
                  background: 'transparent',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <RefreshCw size={12} color="var(--gold-primary)" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
