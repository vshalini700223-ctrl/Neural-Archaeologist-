import React, { useState, useRef } from 'react';
import { Upload, FileUp, Sparkles, Check, AlertCircle } from 'lucide-react';
import { uploadArtifactImage, resolveImageUrl } from '../services/api';

export default function ImageUpload({
  activeArtifact,
  onArtifactSelect,
  sampleArtifacts = [],
  onUploadSuccess,
  isProcessing
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Invalid file type. Please upload an image file (PNG, JPG, WEBP, or TIFF).');
      return;
    }

    setUploadLoading(true);
    setUploadError(null);

    try {
      const result = await uploadArtifactImage(file);
      const newArtifact = {
        id: result.image_id,
        title: result.filename,
        script: 'Auto-detection Pending',
        period: 'Uploaded Artifact',
        provenance: 'User Ingested Scan',
        description: `Orthophotograph scan (${Math.round(result.size_bytes / 1024)} KB) ingested into neural epigraphic pipeline.`,
        raw_image_url: result.raw_image_url,
        enhanced_image_url: result.enhanced_image_url,
        isUserUpload: true
      };
      onUploadSuccess(newArtifact);
    } catch (err) {
      console.error('Artifact upload failed:', err);
      setUploadError(err.message || 'Failed to upload image to backend.');
    } finally {
      setUploadLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
        <h3 className="academic-heading" style={{
          fontSize: '1.15rem',
          color: 'var(--gold-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <FileUp size={18} />
          Artifact Inscription Intake
        </h3>
        <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          STEP 1: INGEST
        </span>
      </div>

      <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
        Upload a high-resolution stone rubbing, raking-light orthophoto, or petroglyph scan to begin reconstruction.
      </p>

      {/* Drag and Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? 'var(--gold-primary)' : '#3d3d3d'}`,
          borderRadius: 'var(--radius-sm)',
          padding: '1.75rem 1rem',
          textAlign: 'center',
          background: isDragging ? '#17140b' : '#070707',
          cursor: uploadLoading || isProcessing ? 'not-allowed' : 'pointer',
          transition: 'all 0.25s ease',
          marginBottom: '1.25rem',
          position: 'relative'
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          disabled={uploadLoading || isProcessing}
        />

        {uploadLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <div className="spinner" style={{ width: '28px', height: '28px' }} />
            <p style={{ fontSize: '0.88rem', color: 'var(--gold-light)' }}>
              Ingesting and transmitting artifact to FastAPI pipeline...
            </p>
          </div>
        ) : (
          <>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'rgba(212, 175, 55, 0.1)',
              border: '1px solid var(--border-medium)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.75rem auto'
            }}>
              <Upload size={20} color="var(--gold-primary)" />
            </div>
            <p style={{ fontSize: '0.92rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              Drag & drop artifact image or <span style={{ color: 'var(--gold-primary)', textDecoration: 'underline' }}>browse</span>
            </p>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Supports RAW, TIFF, PNG, JPG, WEBP (Max 25MB)
            </span>
          </>
        )}
      </div>

      {uploadError && (
        <div className="state-banner error" style={{ marginBottom: '1.25rem' }}>
          <AlertCircle size={16} />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Reference Artifacts Catalog */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.75rem'
        }}>
          <span style={{
            fontSize: '0.82rem',
            fontFamily: 'var(--font-serif)',
            letterSpacing: '0.5px',
            color: 'var(--text-secondary)'
          }}>
            Or Choose Reference Archaeological Inscription:
          </span>
          <span style={{
            fontSize: '0.7rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--gold-light)'
          }}>
            {sampleArtifacts.length} Cataloged
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {sampleArtifacts.map((sample) => {
            const isSelected = activeArtifact?.id === sample.id;
            return (
              <button
                key={sample.id}
                type="button"
                className={`sample-card ${isSelected ? 'active' : ''}`}
                onClick={() => onArtifactSelect(sample)}
                disabled={isProcessing}
              >
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: 'var(--radius-xs)',
                  overflow: 'hidden',
                  background: '#080808',
                  border: '1px solid #222222',
                  flexShrink: 0
                }}>
                  <img
                    src={resolveImageUrl(sample.raw_image_url)}
                    alt={sample.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      color: isSelected ? 'var(--gold-light)' : 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      margin: 0
                    }}>
                      {sample.title}
                    </h4>
                    {isSelected && (
                      <span style={{ display: 'flex', alignItems: 'center', color: 'var(--gold-primary)' }}>
                        <Check size={14} />
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--gold-dark)', fontFamily: 'var(--font-mono)' }}>
                      {sample.script}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>•</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {sample.period}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
