import React, { useState } from 'react';
import {
  Sliders,
  Wand2,
  FileText,
  Layers,
  Activity,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  Download,
  FileDown,
  Info,
  BookOpen,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Edit3,
  Check
} from 'lucide-react';

export default function AnalysisPanel({
  activeArtifact,
  onRunEnhance,
  onRunOCR,
  onRunInpaint,
  onRunReconstruct,
  onExportTxt,
  onExportPdf,
  onExportImage,
  isDownloadingImage,
  isEnhancing,
  isExtractingOCR,
  isInpainting,
  isReconstructing,
  isExportingPdf,
  ocrResult,
  reconstructionResult,
  selectedGlyph,
  onSelectGlyph,
  supportedScripts = [],
  enhancementMetrics
}) {
  const [filterType, setFilterType] = useState('multiscale_retinex');
  const [applyDenoising, setApplyDenoising] = useState(true);
  const [estimateDepth, setEstimateDepth] = useState(true);

  const [targetScript, setTargetScript] = useState('auto');
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.80);

  const [glyphFilter, setGlyphFilter] = useState('all'); // 'all', 'uncertain', 'confident'
  const [showResearchInfo, setShowResearchInfo] = useState(false);
  const [showReconstructionModal, setShowReconstructionModal] = useState(true);

  // Text editing state
  const [isEditingText, setIsEditingText] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [editedTransliteration, setEditedTransliteration] = useState('');
  const [editedTranslation, setEditedTranslation] = useState('');
  const [hasCustomEdits, setHasCustomEdits] = useState(false);

  React.useEffect(() => {
    if (ocrResult) {
      setEditedText(ocrResult.extracted_text || '');
      setEditedTransliteration(ocrResult.transliteration || '');
      setEditedTranslation(ocrResult.translation_en || '');
      setHasCustomEdits(false);
      setIsEditingText(false);
    }
  }, [ocrResult?.extracted_text, ocrResult?.transliteration, ocrResult?.translation_en, activeArtifact?.id]);


  const isBusy = isEnhancing || isExtractingOCR || isInpainting || isReconstructing;

  const handleEnhanceClick = () => {
    if (!activeArtifact) return;
    onRunEnhance({
      image_id: activeArtifact.id,
      enhancement_filter: filterType,
      apply_denoising: applyDenoising,
      estimate_depth: estimateDepth,
    });
  };

  const handleOCRClick = () => {
    if (!activeArtifact) return;
    onRunOCR({
      image_id: activeArtifact.id,
      script: targetScript,
      transliterate: true,
      confidence_threshold: confidenceThreshold,
    });
  };

  const handleInpaintClick = () => {
    if (!activeArtifact) return;
    onRunInpaint({
      image_id: activeArtifact.id,
      crack_mask_threshold: 0.75,
      inpaint_iterations: 50,
      preserve_stroke_edges: true,
    });
  };

  const glyphs = ocrResult?.glyph_details || [];
  const uncertainCount = ocrResult?.uncertain_glyphs_count || glyphs.filter((g) => g.is_uncertain).length;

  const filteredGlyphs = glyphs.filter((g) => {
    if (glyphFilter === 'uncertain') return g.is_uncertain;
    if (glyphFilter === 'confident') return !g.is_uncertain;
    return true;
  });

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Panel Master Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
        <h3 className="academic-heading" style={{
          fontSize: '1.15rem',
          color: 'var(--gold-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          margin: 0
        }}>
          <Sliders size={18} />
          Epigraphic Analysis & Decipherment
        </h3>
        <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          PIPELINE v2.4
        </span>
      </div>

      {!activeArtifact && (
        <div className="state-banner warning" style={{ fontSize: '0.82rem' }}>
          <span>Please select a cataloged artifact or upload an image to activate pipeline controls.</span>
        </div>
      )}

      {/* SECTION 1: Photometric Image Enhancement */}
      <div style={{
        background: '#0a0a0a',
        border: '1px solid #1f1f1f',
        borderRadius: 'var(--radius-sm)',
        padding: '1.1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Wand2 size={16} color="var(--gold-primary)" />
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              1. Photometric Enhancement
            </span>
          </div>
          {enhancementMetrics?.contrast_gain_db && (
            <span className="metric-pill high">
              +{enhancementMetrics.contrast_gain_db} dB Contrast
            </span>
          )}
        </div>

        <div style={{ marginBottom: '0.75rem' }}>
          <label style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
            Filtering Algorithm
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            disabled={isBusy || !activeArtifact}
            style={{ width: '100%', padding: '0.45rem 0.65rem', fontSize: '0.82rem' }}
          >
            <option value="multiscale_retinex">Multi-scale Retinex (MSRCR) — Micro-contrast</option>
            <option value="bilateral">Edge-Preserving Bilateral — Chisel Boundary Smoothing</option>
            <option value="rti_sim">Virtual RTI Simulation — Raking Light Relief</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.85rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={applyDenoising}
              onChange={(e) => setApplyDenoising(e.target.checked)}
              disabled={isBusy || !activeArtifact}
              style={{ accentColor: 'var(--gold-primary)' }}
            />
            Lapidary Denoise
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={estimateDepth}
              onChange={(e) => setEstimateDepth(e.target.checked)}
              disabled={isBusy || !activeArtifact}
              style={{ accentColor: 'var(--gold-primary)' }}
            />
            Depth Normalization
          </label>
        </div>

        <button
          type="button"
          onClick={handleEnhanceClick}
          disabled={isBusy || !activeArtifact}
          className="btn-gold"
          style={{ width: '100%', fontSize: '0.84rem' }}
        >
          {isEnhancing ? (
            <>
              <span className="spinner" />
              <span>Filtering Surface Relief...</span>
            </>
          ) : (
            <>
              <Wand2 size={15} />
              <span>Enhance Inscription Surface</span>
            </>
          )}
        </button>
      </div>

      {/* SECTION 2: Epigraphic OCR & Uncertainty Detection */}
      <div style={{
        background: '#0a0a0a',
        border: '1px solid #222222',
        borderRadius: 'var(--radius-sm)',
        padding: '1.1rem',
        boxShadow: '0 4px 16px rgba(0,0,0,0.8)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FileText size={16} color="var(--gold-primary)" />
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              2. Epigraphic OCR & Decipherment
            </span>
          </div>
          {ocrResult?.overall_confidence && (
            <span className="metric-pill gold">
              {(ocrResult.overall_confidence * 100).toFixed(1)}% Conf
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '0.75rem' }}>
          <div>
            <label style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
              Target Script
            </label>
            <select
              value={targetScript}
              onChange={(e) => setTargetScript(e.target.value)}
              disabled={isBusy || !activeArtifact}
              style={{ width: '100%', padding: '0.45rem', fontSize: '0.8rem' }}
            >
              <option value="auto">Auto-detect Profile</option>
              {supportedScripts.map((s) => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
              <span>Confidence Threshold</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold-light)' }}>
                {Math.round(confidenceThreshold * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.40"
              max="0.95"
              step="0.05"
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
              disabled={isBusy || !activeArtifact}
              style={{ width: '100%', accentColor: 'var(--gold-primary)', marginTop: '0.35rem' }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleOCRClick}
          disabled={isBusy || !activeArtifact}
          className="btn-gold"
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #e5c365 0%, #b88d1d 100%)',
            boxShadow: '0 4px 18px rgba(212, 175, 55, 0.35)',
            fontSize: '0.86rem'
          }}
        >
          {isExtractingOCR ? (
            <>
              <span className="spinner" />
              <span>Segmenting Epigraphic Glyphs...</span>
            </>
          ) : (
            <>
              <FileText size={16} />
              <span>Extract Inscription Text (OCR)</span>
            </>
          )}
        </button>
      </div>

      {/* SECTION 3: Decipherment Transcription & Uncertainty Audit */}
      {ocrResult && (
        <div style={{
          background: '#0a0a0a',
          border: '1px solid #222222',
          borderRadius: 'var(--radius-sm)',
          padding: '1.1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Deciphered Text & Confidence Audit
            </span>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              {hasCustomEdits && (
                <span style={{
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-mono)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  border: '1px solid #38bdf8'
                }}>
                  SCHOLAR EDITED
                </span>
              )}
              {uncertainCount > 0 && (
                <span style={{
                  fontSize: '0.7rem',
                  fontFamily: 'var(--font-mono)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#f59e0b',
                  border: '1px solid #f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <AlertTriangle size={12} />
                  {uncertainCount} Uncertain
                </span>
              )}
              <button
                type="button"
                onClick={() => setIsEditingText(!isEditingText)}
                className="btn-secondary"
                style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem', gap: '0.3rem' }}
                title="Edit extracted epigraphic transcription"
              >
                <Edit3 size={12} color="var(--gold-primary)" />
                <span>{isEditingText ? 'Close Editor' : 'Edit Text'}</span>
              </button>
            </div>
          </div>

          {isEditingText ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '0.25rem' }}>
                  EDIT EPIGRAPHIC TEXT (RAW GLYPHS / CHARACTERS)
                </label>
                <textarea
                  value={editedText}
                  onChange={(e) => { setEditedText(e.target.value); setHasCustomEdits(true); }}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    fontSize: '1.05rem',
                    fontFamily: 'var(--font-serif)',
                    color: 'var(--gold-light)',
                    background: '#050505',
                    border: '1px solid #222222',
                    borderRadius: 'var(--radius-xs)'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '0.25rem' }}>
                  EDIT ROMANIZATION / TRANSLITERATION
                </label>
                <input
                  type="text"
                  value={editedTransliteration}
                  onChange={(e) => { setEditedTransliteration(e.target.value); setHasCustomEdits(true); }}
                  style={{
                    width: '100%',
                    padding: '0.45rem',
                    fontSize: '0.85rem',
                    fontStyle: 'italic',
                    color: 'var(--text-primary)',
                    background: '#050505',
                    border: '1px solid #222222',
                    borderRadius: 'var(--radius-xs)'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '0.25rem' }}>
                  EDIT HISTORICAL TRANSLATION (ENGLISH)
                </label>
                <textarea
                  value={editedTranslation}
                  onChange={(e) => { setEditedTranslation(e.target.value); setHasCustomEdits(true); }}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    fontSize: '0.84rem',
                    color: '#93c5fd',
                    background: '#050505',
                    border: '1px solid #222222',
                    borderRadius: 'var(--radius-xs)'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setEditedText(ocrResult.extracted_text || '');
                    setEditedTransliteration(ocrResult.transliteration || '');
                    setEditedTranslation(ocrResult.translation_en || '');
                    setHasCustomEdits(false);
                  }}
                  className="btn-secondary"
                  style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem', gap: '0.25rem' }}
                >
                  <RotateCcw size={12} />
                  <span>Reset to OCR</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingText(false)}
                  className="btn-gold"
                  style={{ fontSize: '0.72rem', padding: '0.25rem 0.65rem', gap: '0.25rem' }}
                >
                  <Check size={12} />
                  <span>Save Edits</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Extracted Script Box */}
              <div style={{
                background: '#050505',
                padding: '0.85rem',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid #1f1f1f',
                marginBottom: '0.75rem'
              }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '0.35rem' }}>
                  EXTRACTED EPIGRAPHIC TEXT {hasCustomEdits ? '(SCHOLAR VERIFIED)' : '(RAW OCR)'}
                </div>
                <div style={{
                  fontSize: '1.15rem',
                  color: 'var(--gold-light)',
                  fontFamily: 'var(--font-serif)',
                  letterSpacing: '0.05em',
                  lineHeight: 1.5,
                  wordBreak: 'break-word'
                }}>
                  {hasCustomEdits ? editedText : ocrResult.extracted_text}
                </div>
              </div>

              {/* Transliteration & English Translation */}
              <div style={{ marginBottom: '0.85rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '0.2rem' }}>
                  ACADEMIC ROMANIZATION (IAST / ALA-LC)
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '0.5rem' }}>
                  "{hasCustomEdits ? editedTransliteration : ocrResult.transliteration}"
                </div>

                {(hasCustomEdits ? editedTranslation : ocrResult.translation_en) && (
                  <>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '0.2rem' }}>
                      HISTORICAL TRANSLATION
                    </div>
                    <div style={{ fontSize: '0.84rem', color: '#93c5fd', lineHeight: 1.4 }}>
                      "{hasCustomEdits ? editedTranslation : ocrResult.translation_en}"
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {/* Uncertainty Filter Pills */}
          <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setGlyphFilter('all')}
              style={{
                fontSize: '0.72rem',
                padding: '2px 8px',
                borderRadius: '4px',
                background: glyphFilter === 'all' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255,255,255,0.05)',
                color: glyphFilter === 'all' ? 'var(--gold-light)' : 'var(--text-muted)',
                border: '1px solid transparent'
              }}
            >
              All Glyphs ({glyphs.length})
            </button>
            <button
              type="button"
              onClick={() => setGlyphFilter('uncertain')}
              style={{
                fontSize: '0.72rem',
                padding: '2px 8px',
                borderRadius: '4px',
                background: glyphFilter === 'uncertain' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.05)',
                color: glyphFilter === 'uncertain' ? '#f59e0b' : 'var(--text-muted)',
                border: '1px solid transparent'
              }}
            >
              Uncertain Only ({uncertainCount})
            </button>
            <button
              type="button"
              onClick={() => setGlyphFilter('confident')}
              style={{
                fontSize: '0.72rem',
                padding: '2px 8px',
                borderRadius: '4px',
                background: glyphFilter === 'confident' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                color: glyphFilter === 'confident' ? '#10b981' : 'var(--text-muted)',
                border: '1px solid transparent'
              }}
            >
              Confident ({glyphs.length - uncertainCount})
            </button>
          </div>

          {/* Interactive Glyphs Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))',
            gap: '0.4rem',
            maxHeight: '220px',
            overflowY: 'auto',
            paddingRight: '0.25rem'
          }}>
            {filteredGlyphs.map((g) => {
              const isSelected = selectedGlyph?.id === g.id;
              const isUncertain = g.is_uncertain;
              const isCritical = g.uncertainty_category === 'critical_uncertainty';

              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => onSelectGlyph?.(isSelected ? null : g)}
                  style={{
                    padding: '0.4rem 0.35rem',
                    background: isSelected
                      ? 'rgba(212, 175, 55, 0.25)'
                      : isCritical
                      ? 'rgba(239, 68, 68, 0.12)'
                      : isUncertain
                      ? 'rgba(245, 158, 11, 0.1)'
                      : '#080808',
                    border: `1px solid ${
                      isSelected
                        ? 'var(--gold-primary)'
                        : isCritical
                        ? '#ef4444'
                        : isUncertain
                        ? '#f59e0b'
                        : '#1c1c1c'
                    }`,
                    borderRadius: 'var(--radius-xs)',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontSize: '1.15rem', color: 'var(--gold-light)', lineHeight: 1.2 }}>
                    {g.glyph}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {g.transliteration}
                  </div>
                  <div style={{
                    fontSize: '0.66rem',
                    fontFamily: 'var(--font-mono)',
                    color: isCritical ? '#ef4444' : isUncertain ? '#f59e0b' : '#10b981',
                    marginTop: '2px'
                  }}>
                    {(g.model_confidence * 100).toFixed(0)}%
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 4: Experimental Text Reconstruction Panel */}
      <div style={{
        background: '#0a0a0a',
        border: '1px solid #222222',
        borderRadius: 'var(--radius-sm)',
        padding: '1.1rem',
        boxShadow: '0 4px 18px rgba(0,0,0,0.8)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={16} color="var(--gold-primary)" />
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              3. Experimental Text Reconstruction
            </span>
          </div>

          <button
            type="button"
            className="btn-gold"
            disabled={isBusy || !activeArtifact}
            onClick={() => onRunReconstruct({
              image_id: activeArtifact?.id,
              target_glyph_id: selectedGlyph?.id,
              script: targetScript
            })}
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
          >
            {isReconstructing ? (
              <>
                <span className="spinner" />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <Sparkles size={13} />
                <span>Evaluate Hypotheses</span>
              </>
            )}
          </button>
        </div>

        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
          Examine damaged, chipped, or lacunose characters against attested historical formulaic corpora.
        </p>

        {reconstructionResult && (
          <div>
            {/* Prominent Scholarly Disclaimer Banner */}
            <div style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid #f59e0b',
              borderRadius: 'var(--radius-xs)',
              padding: '0.65rem 0.85rem',
              marginBottom: '0.85rem',
              fontSize: '0.76rem',
              color: '#fcd34d'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                <AlertTriangle size={15} color="#f59e0b" />
                <span>AI-GENERATED HYPOTHESIS NOTICE</span>
              </div>
              <span>
                All candidate reconstructions are non-binding machine proposals. They do NOT represent verified historical facts. Original OCR output is preserved.
              </span>
            </div>

            {reconstructionResult.method_available ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  <span>Method: {reconstructionResult.method_name}</span>
                  <span style={{ color: 'var(--gold-light)' }}>Original Span: {reconstructionResult.original_ocr_span}</span>
                </div>

                {reconstructionResult.hypotheses?.map((hyp) => (
                  <div
                    key={hyp.hypothesis_id}
                    style={{
                      background: '#050505',
                      border: '1px solid #1c1c1c',
                      borderRadius: 'var(--radius-xs)',
                      padding: '0.75rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.05rem', color: 'var(--gold-light)' }}>
                          {hyp.proposed_text}
                        </span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          ({hyp.proposed_transliteration})
                        </span>
                      </div>
                      <span className="metric-pill gold" style={{ fontSize: '0.7rem' }}>
                        {(hyp.plausibility_score * 100).toFixed(1)}% Plausibility
                      </span>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: '#93c5fd', marginBottom: '0.35rem' }}>
                      Meaning: "{hyp.proposed_translation_en}"
                    </div>

                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                      {hyp.scholarly_rationale}
                    </div>

                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      Parallels: {hyp.supporting_parallels?.join('; ')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #ef4444',
                borderRadius: 'var(--radius-xs)',
                padding: '0.75rem',
                color: '#fca5a5',
                fontSize: '0.78rem'
              }}>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <AlertTriangle size={14} />
                  <span>Reconstruction Method Unavailable</span>
                </div>
                <p style={{ margin: 0 }}>
                  {reconstructionResult.reason_if_unavailable}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 5: Neural Inpainting */}
      <div style={{
        background: '#080808',
        border: '1px solid #1c1c1c',
        borderRadius: 'var(--radius-sm)',
        padding: '1.1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.65rem' }}>
          <Activity size={16} color="var(--gold-primary)" />
          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            4. Neural Stroke & Crack Inpainting
          </span>
        </div>
        <button
          type="button"
          onClick={handleInpaintClick}
          disabled={isBusy || !activeArtifact}
          className="btn-secondary"
          style={{ width: '100%', fontSize: '0.82rem' }}
        >
          {isInpainting ? (
            <>
              <span className="spinner" />
              <span>Inpainting Micro-fissures...</span>
            </>
          ) : (
            <>
              <Layers size={15} />
              <span>Synthesize Inpainted Inscription</span>
            </>
          )}
        </button>
      </div>

      {/* SECTION 6: Export Suite */}
      <div style={{
        background: '#0a0a0a',
        border: '1px solid #1f1f1f',
        borderRadius: 'var(--radius-sm)',
        padding: '1.1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
          <Download size={16} color="var(--gold-primary)" />
          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            5. Export Dossier & Artifacts
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => onExportTxt({
              custom_text: hasCustomEdits ? editedText : null,
              custom_transliteration: hasCustomEdits ? editedTransliteration : null,
              custom_translation: hasCustomEdits ? editedTranslation : null
            })}
            disabled={!activeArtifact}
            style={{ fontSize: '0.74rem', padding: '0.45rem', gap: '0.35rem' }}
            title="Download Deciphered Text & Confidence Audit as TXT"
          >
            <FileDown size={14} color="var(--gold-primary)" />
            <span>TXT Text</span>
          </button>

          <button
            type="button"
            id="export-png-image-btn"
            className="btn-secondary"
            onClick={() => onExportImage?.()}
            disabled={!activeArtifact || isDownloadingImage}
            style={{ fontSize: '0.74rem', padding: '0.45rem', gap: '0.35rem' }}
            title="Download Enhanced / Restored Inscription Image as PNG"
          >
            {isDownloadingImage ? (
              <span className="spinner" style={{ width: '12px', height: '12px', borderWidth: '1.5px' }} />
            ) : (
              <Download size={14} color="var(--gold-primary)" />
            )}
            <span>PNG Image</span>
          </button>

          <button
            type="button"
            className="btn-gold"
            onClick={() => onExportPdf({
              custom_text: hasCustomEdits ? editedText : null,
              custom_transliteration: hasCustomEdits ? editedTransliteration : null,
              custom_translation: hasCustomEdits ? editedTranslation : null
            })}
            disabled={!activeArtifact || isExportingPdf}
            style={{ fontSize: '0.74rem', padding: '0.45rem', gap: '0.35rem' }}
            title="Compile Complete Epigraphic PDF Dossier"
          >
            {isExportingPdf ? (
              <span className="spinner" />
            ) : (
              <FileText size={14} />
            )}
            <span>PDF Dossier</span>
          </button>
        </div>
      </div>

      {/* SECTION 7: Research Information & Scholarly Notes */}
      <div style={{
        background: '#080808',
        border: '1px solid #1a1a1a',
        borderRadius: 'var(--radius-sm)',
        padding: '0.85rem 1.1rem'
      }}>
        <button
          type="button"
          onClick={() => setShowResearchInfo(!showResearchInfo)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'transparent',
            border: 'none',
            color: 'var(--gold-light)',
            cursor: 'pointer',
            padding: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>
            <BookOpen size={15} />
            <span>Research Information & Model Limitations</span>
          </div>
          {showResearchInfo ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {showResearchInfo && (
          <div style={{ marginTop: '0.85rem', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Processing Method: </strong>
              {ocrResult?.research_info?.processing_method || 'Multi-scale Retinex with Photometric Normalization (MSRCR)'}
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Model Architecture: </strong>
              {ocrResult?.research_info?.model_name || 'EpigraphNet Vision-BiLSTM'} ({ocrResult?.research_info?.model_version || 'v2.1'})
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Training Corpus: </strong>
              {ocrResult?.research_info?.training_corpus || 'Corpus Inscriptionum Indicarum & South Indian Inscriptions'}
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong style={{ color: '#f59e0b' }}>Scholarly Limitations: </strong>
              <ul style={{ margin: '0.25rem 0 0.5rem 1rem', padding: 0 }}>
                {(ocrResult?.research_info?.known_limitations || [
                  'Model requires min 250 DPI optical rubbing resolution',
                  'Erosion grooves crossing vertical stems elevate uncertainty',
                  'Not calibrated for cursive cursive paper or palm-leaf palimpsests'
                ]).map((lim, idx) => (
                  <li key={idx}>{lim}</li>
                ))}
              </ul>
            </div>
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>Epigraphic Notes: </strong>
              {ocrResult?.research_info?.epigraphic_notes || ocrResult?.historical_notes || 'Standard classical epigraphic formula with imperial titulature.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
