import React, { useState, useRef, useEffect } from 'react';
import {
  Layers,
  SplitSquareVertical,
  Columns,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  AlertTriangle,
  Info,
  Sparkles,
  ShieldCheck,
  Eye,
  Sliders
} from 'lucide-react';
import { resolveImageUrl, downloadImage } from '../services/api';

export default function Viewer3D({
  currentArtifact,
  activeLayer = 'enhanced', // 'raw', 'enhanced', 'restored'
  comparisonMode = 'slider', // 'slider', 'sideBySide', 'single'
  onComparisonModeChange,
  ocrResult,
  selectedGlyph,
  onSelectGlyph,
  onRequestReconstruction,
  isProcessing,
  onExportImage,
  isDownloadingImage
}) {
  const [sliderPosition, setSliderPosition] = useState(50); // 0 to 100%
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [lightingAngle, setLightingAngle] = useState(45); // simulated RTI raking light angle

  const containerRef = useRef(null);
  const sliderRef = useRef(null);

  const rawUrl = resolveImageUrl(currentArtifact?.raw_image_url || '/static/raw/ashoka_brahmi_edict.png');
  const enhancedUrl = resolveImageUrl(currentArtifact?.enhanced_image_url || '/static/processed/ashoka_brahmi_edict_enhanced.png');
  const restoredUrl = resolveImageUrl(currentArtifact?.restored_image_url || enhancedUrl);

  const activeSecondaryUrl = activeLayer === 'restored' ? restoredUrl : enhancedUrl;
  const secondaryLabel = activeLayer === 'restored' ? 'Neural Restored' : 'MSRCR Enhanced';

  // Mouse drag handler for split slider
  const handleSliderMouseDown = (e) => {
    e.preventDefault();
    setIsDraggingSlider(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingSlider || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(5, Math.min(95, (x / rect.width) * 100));
      setSliderPosition(pct);
    };

    const handleMouseUp = () => {
      setIsDraggingSlider(false);
    };

    if (isDraggingSlider) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSlider]);

  const handleResetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setSliderPosition(50);
  };

  const handleDownloadEnhanced = () => {
    if (onExportImage) {
      onExportImage(activeLayer);
    } else {
      const filename = activeLayer === 'restored'
        ? 'neural-archaeologist-restored.png'
        : 'neural-archaeologist-enhanced.png';
      downloadImage(activeSecondaryUrl, filename);
    }
  };

  const glyphs = ocrResult?.glyph_details || [];

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '620px' }}>
      {/* Viewport Header Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h3 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.15rem',
              color: 'var(--gold-primary)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
              <Layers size={18} />
              Epigraphic Surface & Inspection Viewport
            </h3>
            {ocrResult?.detected_script && (
              <span className="metric-pill gold" style={{ fontSize: '0.72rem' }}>
                {ocrResult.detected_script}
              </span>
            )}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {currentArtifact ? `${currentArtifact.title} [${currentArtifact.period || 'Epoch'}]` : 'Select an inscription artifact to inspect'}
          </span>
        </div>

        {/* View Mode Selectors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#0a0a0a', padding: '0.25rem 0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid #222222' }}>
          <button
            type="button"
            className={`btn-secondary ${comparisonMode === 'slider' ? 'active' : ''}`}
            onClick={() => onComparisonModeChange?.('slider')}
            style={{
              padding: '0.35rem 0.65rem',
              fontSize: '0.75rem',
              background: comparisonMode === 'slider' ? 'rgba(212, 175, 55, 0.18)' : 'transparent',
              borderColor: comparisonMode === 'slider' ? 'var(--gold-primary)' : 'transparent',
              color: comparisonMode === 'slider' ? 'var(--gold-light)' : 'var(--text-secondary)'
            }}
            title="Interactive Before-and-After Split Curtain Slider"
          >
            <SplitSquareVertical size={14} />
            <span>Split Curtain</span>
          </button>

          <button
            type="button"
            className={`btn-secondary ${comparisonMode === 'sideBySide' ? 'active' : ''}`}
            onClick={() => onComparisonModeChange?.('sideBySide')}
            style={{
              padding: '0.35rem 0.65rem',
              fontSize: '0.75rem',
              background: comparisonMode === 'sideBySide' ? 'rgba(212, 175, 55, 0.18)' : 'transparent',
              borderColor: comparisonMode === 'sideBySide' ? 'var(--gold-primary)' : 'transparent',
              color: comparisonMode === 'sideBySide' ? 'var(--gold-light)' : 'var(--text-secondary)'
            }}
            title="Synchronized Side-by-Side Comparison"
          >
            <Columns size={14} />
            <span>Side-by-Side</span>
          </button>

          <button
            type="button"
            className={`btn-secondary ${comparisonMode === 'single' ? 'active' : ''}`}
            onClick={() => onComparisonModeChange?.('single')}
            style={{
              padding: '0.35rem 0.65rem',
              fontSize: '0.75rem',
              background: comparisonMode === 'single' ? 'rgba(212, 175, 55, 0.18)' : 'transparent',
              borderColor: comparisonMode === 'single' ? 'var(--gold-primary)' : 'transparent',
              color: comparisonMode === 'single' ? 'var(--gold-light)' : 'var(--text-secondary)'
            }}
            title="Single Layer View"
          >
            <Eye size={14} />
            <span>Layer Only</span>
          </button>
        </div>
      </div>

      {/* Viewport Secondary Bar: Zoom, Box Overlay, and Export */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.45rem 0.85rem',
        background: '#070707',
        borderRadius: 'var(--radius-xs)',
        border: '1px solid #202020',
        marginBottom: '0.75rem',
        fontSize: '0.78rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <input
              type="checkbox"
              checked={showBoundingBoxes}
              onChange={(e) => setShowBoundingBoxes(e.target.checked)}
              style={{ accentColor: 'var(--gold-primary)' }}
            />
            <span>OCR Bounding Cells ({glyphs.length})</span>
          </label>

          <span style={{ color: '#2a2a2a' }}>|</span>

          {/* Quick Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
              <span style={{ color: 'var(--text-muted)' }}>Confident</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
              <span style={{ color: 'var(--text-muted)' }}>Low Conf (&lt;80%)</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
              <span style={{ color: 'var(--text-muted)' }}>Physical Damage</span>
            </span>
          </div>
        </div>

        {/* Zoom & Download Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn-icon"
            onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
            title="Zoom In"
            style={{ width: '28px', height: '28px', padding: 0, background: '#111111', border: '1px solid #222222' }}
          >
            <ZoomIn size={14} color="#ffffff" />
          </button>
          <button
            type="button"
            className="btn-icon"
            onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
            title="Zoom Out"
            style={{ width: '28px', height: '28px', padding: 0, background: '#111111', border: '1px solid #222222' }}
          >
            <ZoomOut size={14} color="#ffffff" />
          </button>
          <button
            type="button"
            className="btn-icon"
            onClick={handleResetView}
            title="Reset View"
            style={{ width: '28px', height: '28px', padding: 0, background: '#111111', border: '1px solid #222222' }}
          >
            <RotateCcw size={13} color="#ffffff" />
          </button>

          <span style={{ color: '#2a2a2a', margin: '0 0.1rem' }}>|</span>

          <button
            type="button"
            id="download-enhanced-image-viewer-btn"
            className="btn-gold-subtle"
            onClick={handleDownloadEnhanced}
            disabled={!currentArtifact || isDownloadingImage}
            style={{
              padding: '0.35rem 0.85rem',
              fontSize: '0.76rem',
              gap: '0.4rem',
              cursor: (!currentArtifact || isDownloadingImage) ? 'not-allowed' : 'pointer'
            }}
            title={`Download ${activeLayer === 'restored' ? 'Restored' : 'Enhanced'} Image as PNG`}
          >
            {isDownloadingImage ? (
              <span className="spinner" style={{ width: '12px', height: '12px', borderWidth: '1.5px' }} />
            ) : (
              <Download size={13} color="var(--gold-primary)" />
            )}
            <span style={{ fontWeight: 600 }}>Download {activeLayer === 'restored' ? 'Restored' : 'Enhanced'} Image</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas Container */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          borderRadius: 'var(--radius-sm)',
          background: '#000000',
          border: '1px solid #222222',
          position: 'relative',
          overflow: 'hidden',
          minHeight: '400px',
          display: 'flex',
          userSelect: 'none'
        }}
      >
        {!currentArtifact ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.8rem', opacity: 0.6 }}>🏛️</div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.35rem' }}>No Inscription Loaded</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '380px' }}>
              Select a cataloged reference artifact or upload an archaeological stone rubbing from the intake panel.
            </p>
          </div>
        ) : comparisonMode === 'slider' ? (
          /* ================= MODE 1: INTERACTIVE SPLIT CURTAIN SLIDER ================= */
          <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
            {/* Base Image: Enhanced / Restored */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'center center',
                transition: isDraggingSlider ? 'none' : 'transform 0.15s ease'
              }}
            >
              <img
                src={activeSecondaryUrl}
                alt="Enhanced Inscription"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />

              {/* Bounding Box Overlays on Enhanced Layer */}
              {showBoundingBoxes && glyphs.map((g) => {
                const bb = g.bounding_box;
                if (!bb) return null;
                const isSelected = selectedGlyph?.id === g.id;
                const isUncertain = g.is_uncertain;
                const isCritical = g.uncertainty_category === 'critical_uncertainty';

                const borderColor = isCritical
                  ? '#ef4444'
                  : isUncertain
                  ? '#f59e0b'
                  : '#10b981';

                const bgColor = isCritical
                  ? 'rgba(239, 68, 68, 0.18)'
                  : isUncertain
                  ? 'rgba(245, 158, 11, 0.14)'
                  : 'rgba(16, 185, 129, 0.08)';

                return (
                  <div
                    key={g.id}
                    onClick={() => onSelectGlyph?.(g)}
                    title={`${g.glyph} (${g.transliteration}) - Model Conf: ${(g.model_confidence * 100).toFixed(1)}%`}
                    style={{
                      position: 'absolute',
                      left: `${bb.x}%`,
                      top: `${bb.y}%`,
                      width: `${bb.w}%`,
                      height: `${bb.h}%`,
                      border: `2px ${isCritical ? 'dashed' : 'solid'} ${borderColor}`,
                      background: isSelected ? 'rgba(212, 175, 55, 0.35)' : bgColor,
                      boxShadow: isSelected ? '0 0 12px var(--gold-primary)' : 'none',
                      cursor: 'pointer',
                      borderRadius: '2px',
                      transition: 'all 0.15s ease',
                      zIndex: isSelected ? 30 : 10
                    }}
                  >
                    <span style={{
                      position: 'absolute',
                      top: '-14px',
                      left: '0',
                      fontSize: '0.62rem',
                      fontFamily: 'var(--font-mono)',
                      background: borderColor,
                      color: '#000',
                      fontWeight: 700,
                      padding: '1px 3px',
                      borderRadius: '2px',
                      whiteSpace: 'nowrap'
                    }}>
                      {(g.model_confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Overlaid Image: Raw Original Clipped by Slider Position */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                width: `${sliderPosition}%`,
                overflow: 'hidden',
                borderRight: '2px solid var(--gold-primary)',
                boxShadow: '4px 0 16px rgba(0,0,0,0.6)',
                zIndex: 20
              }}
            >
              <div
                style={{
                  width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%',
                  height: '100%',
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'center center'
                }}
              >
                <img
                  src={rawUrl}
                  alt="Original Raw Rubbing"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>

              {/* Watermark badge on Left */}
              <div style={{
                position: 'absolute',
                bottom: '12px',
                left: '12px',
                background: 'rgba(0,0,0,0.75)',
                color: '#e5c365',
                padding: '0.25rem 0.6rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                border: '1px solid rgba(212, 175, 55, 0.3)'
              }}>
                RAW ARTIFACT (BEFORE)
              </div>
            </div>

            {/* Watermark badge on Right */}
            <div style={{
              position: 'absolute',
              bottom: '12px',
              right: '12px',
              background: 'rgba(0,0,0,0.75)',
              color: '#60a5fa',
              padding: '0.25rem 0.6rem',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              border: '1px solid rgba(96, 165, 250, 0.3)',
              zIndex: 15
            }}>
              {secondaryLabel.toUpperCase()} (AFTER)
            </div>

            {/* Draggable Divider Handle */}
            <div
              ref={sliderRef}
              onMouseDown={handleSliderMouseDown}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `calc(${sliderPosition}% - 14px)`,
                width: '28px',
                cursor: 'ew-resize',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 40
              }}
            >
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #e5c365 0%, #b88d1d 100%)',
                boxShadow: '0 0 14px rgba(212, 175, 55, 0.75)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#080b12',
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}>
                ⇄
              </div>
            </div>
          </div>
        ) : comparisonMode === 'sideBySide' ? (
          /* ================= MODE 2: SYNCHRONIZED SIDE-BY-SIDE ================= */
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', width: '100%', height: '100%', gap: '1px', background: 'var(--border-subtle)' }}>
            {/* Left Card: Raw */}
            <div style={{ position: 'relative', height: '100%', background: '#080a0f', overflow: 'hidden' }}>
              <div style={{ width: '100%', height: '100%', transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}>
                <img src={rawUrl} alt="Raw" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.7)', color: 'var(--gold-light)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                ORIGINAL RAW CAPTURE
              </div>
            </div>

            {/* Right Card: Enhanced */}
            <div style={{ position: 'relative', height: '100%', background: '#080a0f', overflow: 'hidden' }}>
              <div style={{ width: '100%', height: '100%', transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}>
                <img src={activeSecondaryUrl} alt="Enhanced" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.7)', color: '#60a5fa', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                {secondaryLabel.toUpperCase()}
              </div>
            </div>
          </div>
        ) : (
          /* ================= MODE 3: SINGLE LAYER VIEW ================= */
          <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
            <div style={{ width: '100%', height: '100%', transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}>
              <img src={activeSecondaryUrl} alt="Layer" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.7)', color: 'var(--gold-light)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
              LAYER: {activeLayer.toUpperCase()}
            </div>
          </div>
        )}
      </div>

      {/* Selected Glyph Inspector Card Overlay */}
      {selectedGlyph && (
        <div style={{
          marginTop: '0.85rem',
          padding: '0.85rem 1.15rem',
          background: '#0d0d0d',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid #282828',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.85)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              fontSize: '2rem',
              color: 'var(--gold-light)',
              background: 'rgba(212, 175, 55, 0.1)',
              padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--border-subtle)'
            }}>
              {selectedGlyph.glyph}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {selectedGlyph.transliteration}
                </span>
                <span style={{
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  background: selectedGlyph.is_uncertain ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: selectedGlyph.is_uncertain ? '#f59e0b' : '#10b981',
                  border: `1px solid ${selectedGlyph.is_uncertain ? '#f59e0b' : '#10b981'}`
                }}>
                  Model Confidence: {(selectedGlyph.model_confidence * 100).toFixed(1)}%
                </span>
              </div>

              {selectedGlyph.heuristic_warnings?.length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem', color: '#f59e0b', fontSize: '0.76rem' }}>
                  <AlertTriangle size={13} />
                  <span>Physical Stone Warning: {selectedGlyph.heuristic_warnings[0]}</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem', color: '#10b981', fontSize: '0.76rem' }}>
                  <ShieldCheck size={13} />
                  <span>Stroke geometry intact with high signal-to-noise ratio</span>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn-gold"
              onClick={() => onRequestReconstruction?.(selectedGlyph)}
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem' }}
            >
              <Sparkles size={14} />
              <span>Examine AI Reconstruction</span>
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onSelectGlyph?.(null)}
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.65rem' }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
