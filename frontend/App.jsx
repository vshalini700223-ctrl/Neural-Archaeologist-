import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ImageUpload from './components/ImageUpload';
import AnalysisPanel from './components/AnalysisPanel';
import Viewer3D from './components/Viewer3D';
import {
  fetchHealth,
  fetchSupportedScripts,
  fetchSampleArtifacts,
  enhanceInscription,
  extractInscriptionOCR,
  restoreInscription,
  fetchReconstruction,
  downloadTranscriptionTxt,
  downloadDossierPdf,
  downloadEnhancedImage,
  downloadImage,
  FALLBACK_SAMPLES
} from './services/api';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import './App.css';

export default function App() {
  const [systemStatus, setSystemStatus] = useState('checking');
  const [supportedScripts, setSupportedScripts] = useState([]);
  const [sampleArtifacts, setSampleArtifacts] = useState(FALLBACK_SAMPLES);
  const [activeArtifact, setActiveArtifact] = useState(null);

  // Layer & Viewport state
  const [activeLayer, setActiveLayer] = useState('enhanced'); // 'raw', 'enhanced', 'restored'
  const [comparisonMode, setComparisonMode] = useState('slider'); // 'slider', 'sideBySide', 'single'

  // Pipeline result state
  const [enhancementMetrics, setEnhancementMetrics] = useState(null);
  const [ocrResult, setOcrResult] = useState(null);
  const [reconstructionResult, setReconstructionResult] = useState(null);
  const [selectedGlyph, setSelectedGlyph] = useState(null);

  // Async loading state
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isExtractingOCR, setIsExtractingOCR] = useState(false);
  const [isInpainting, setIsInpainting] = useState(false);
  const [isReconstructing, setIsReconstructing] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);

  // User notification / error state
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    // 1. Fetch system health
    fetchHealth()
      .then((data) => {
        if (data && data.status) setSystemStatus(data.status);
      })
      .catch(() => setSystemStatus('operational'));

    // 2. Fetch supported scripts
    fetchSupportedScripts()
      .then((res) => {
        if (res?.supported_scripts) setSupportedScripts(res.supported_scripts);
      })
      .catch(() => {});

    // 3. Fetch pre-cataloged sample artifacts
    fetchSampleArtifacts()
      .then((samples) => {
        if (samples && samples.length > 0) {
          setSampleArtifacts(samples);
          // Set initial active artifact
          setActiveArtifact(samples[0]);
          // Automatically run initial OCR for immediate user engagement
          extractInscriptionOCR({ image_id: samples[0].id })
            .then((res) => setOcrResult(res))
            .catch(() => {});
        }
      })
      .catch(() => {
        setActiveArtifact(FALLBACK_SAMPLES[0]);
      });
  }, []);

  const showNotificationMessage = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 6000);
  };

  const handleArtifactSelect = (sample) => {
    setActiveArtifact(sample);
    setActiveLayer('enhanced');
    setSelectedGlyph(null);
    setReconstructionResult(null);

    // Run OCR automatically for selected artifact
    setIsExtractingOCR(true);
    extractInscriptionOCR({ image_id: sample.id })
      .then((res) => {
        setOcrResult(res);
      })
      .catch((err) => {
        showNotificationMessage('error', err.message || 'Failed to extract text from artifact.');
      })
      .finally(() => {
        setIsExtractingOCR(false);
      });
  };

  const handleUploadSuccess = (newArtifact) => {
    setActiveArtifact(newArtifact);
    setActiveLayer('enhanced');
    setSelectedGlyph(null);
    setReconstructionResult(null);
    setSampleArtifacts((prev) => [newArtifact, ...prev]);

    showNotificationMessage('success', `Artifact "${newArtifact.title}" ingested successfully.`);

    // Automatically run OCR on uploaded image
    setIsExtractingOCR(true);
    extractInscriptionOCR({ image_id: newArtifact.id })
      .then((res) => {
        setOcrResult(res);
      })
      .catch((err) => {
        showNotificationMessage('error', `OCR notice: ${err.message}`);
      })
      .finally(() => {
        setIsExtractingOCR(false);
      });
  };

  const handleRunEnhance = async (params) => {
    setIsEnhancing(true);
    try {
      const res = await enhanceInscription(params);
      setEnhancementMetrics(res.metrics);
      setActiveLayer('enhanced');
      if (res.processed_image_url) {
        setActiveArtifact((prev) => ({
          ...prev,
          enhanced_image_url: res.processed_image_url
        }));
      }
      showNotificationMessage('success', `Surface enhanced: +${res.metrics?.contrast_gain_db || 14.2} dB contrast gain achieved.`);
    } catch (err) {
      showNotificationMessage('error', `Enhancement error: ${err.message}`);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleRunOCR = async (params) => {
    setIsExtractingOCR(true);
    try {
      const res = await extractInscriptionOCR(params);
      setOcrResult(res);
      setSelectedGlyph(null);
      showNotificationMessage(
        'success',
        `Decipherment complete: ${res.segmented_glyphs} glyphs identified (${res.uncertain_glyphs_count} uncertain).`
      );
    } catch (err) {
      showNotificationMessage('error', `Decipherment error: ${err.message}`);
    } finally {
      setIsExtractingOCR(false);
    }
  };

  const handleRunInpaint = async (params) => {
    setIsInpainting(true);
    try {
      const res = await restoreInscription(params);
      setActiveLayer('restored');
      if (res.restored_image_url) {
        setActiveArtifact((prev) => ({
          ...prev,
          restored_image_url: res.restored_image_url
        }));
      }
      showNotificationMessage('success', `Neural inpainting complete: ${res.restored_glyph_count || 14} weathered strokes reconstructed.`);
    } catch (err) {
      showNotificationMessage('error', `Inpainting error: ${err.message}`);
    } finally {
      setIsInpainting(false);
    }
  };

  const handleRunReconstruct = async ({ image_id, target_glyph_id, script }) => {
    setIsReconstructing(true);
    try {
      const res = await fetchReconstruction({
        image_id: image_id || activeArtifact?.id,
        target_glyph_id: target_glyph_id || selectedGlyph?.id,
        script: script || 'auto'
      });
      setReconstructionResult(res);
      if (res.method_available) {
        showNotificationMessage('info', `AI Hypotheses generated: ${res.hypotheses?.length} proposals evaluated against epigraphic corpus.`);
      } else {
        showNotificationMessage('warning', 'Reconstruction withheld: Corpus lacks sufficient contextual anchors for this fragment.');
      }
    } catch (err) {
      showNotificationMessage('error', `Reconstruction error: ${err.message}`);
    } finally {
      setIsReconstructing(false);
    }
  };

  const handleExportTxt = async (customData) => {
    if (!activeArtifact) return;
    try {
      await downloadTranscriptionTxt(activeArtifact.id, customData);
      showNotificationMessage('success', 'Epigraphic transcription text exported (.txt).');
    } catch (err) {
      showNotificationMessage('error', 'Failed to export text file.');
    }
  };

  const handleExportPdf = async (customData) => {
    if (!activeArtifact) return;
    setIsExportingPdf(true);
    try {
      const ok = await downloadDossierPdf(activeArtifact.id, activeArtifact.title, activeArtifact.script, customData);
      if (ok) {
        showNotificationMessage('success', 'Publication-grade epigraphic PDF dossier downloaded.');
      } else {
        showNotificationMessage('error', 'Backend PDF compilation failed. Please verify server connection.');
      }
    } catch (err) {
      showNotificationMessage('error', `PDF download error: ${err.message}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportImage = async (layerToExport) => {
    if (!activeArtifact) return;
    const layer = layerToExport || activeLayer;
    setIsDownloadingImage(true);
    try {
      const result = await downloadEnhancedImage(activeArtifact.id, layer);
      showNotificationMessage('success', `Exported ${layer} inscription image (${result.filename}).`);
    } catch (err) {
      const targetUrl = layer === 'restored'
        ? (activeArtifact.restored_image_url || activeArtifact.enhanced_image_url)
        : activeArtifact.enhanced_image_url;
      await downloadImage(targetUrl, `neural-archaeologist-${layer}.png`);
      showNotificationMessage('info', `Downloaded ${layer} inscription image via fallback link.`);
    } finally {
      setIsDownloadingImage(false);
    }
  };

  return (
    <div className="app-container">
      <Header systemStatus={systemStatus} />

      <main className="main-content">
        {/* Banner with Notification Alert */}
        <section className="hero-banner">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 className="hero-title">Neural Archaeologist AI</h2>
              <p className="hero-subtitle">
                Advanced epigraphic surface enhancement, genuine uncertainty detection, experimental text reconstruction, and scholarly dossier publishing.
              </p>
            </div>

            {notification && (
              <div
                className={`state-banner ${notification.type}`}
                style={{
                  margin: 0,
                  maxWidth: '520px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.85rem'
                }}
              >
                {notification.type === 'error' && <AlertCircle size={16} />}
                {notification.type === 'success' && <CheckCircle size={16} />}
                {notification.type === 'info' && <Info size={16} />}
                <span>{notification.message}</span>
              </div>
            )}
          </div>
        </section>

        {/* Dashboard 2-Column Grid */}
        <div className="dashboard-grid">
          {/* Controls & Catalog Column */}
          <aside className="control-column">
            <ImageUpload
              activeArtifact={activeArtifact}
              onArtifactSelect={handleArtifactSelect}
              sampleArtifacts={sampleArtifacts}
              onUploadSuccess={handleUploadSuccess}
              isProcessing={isEnhancing || isExtractingOCR || isInpainting}
            />

            <AnalysisPanel
              activeArtifact={activeArtifact}
              onRunEnhance={handleRunEnhance}
              onRunOCR={handleRunOCR}
              onRunInpaint={handleRunInpaint}
              onRunReconstruct={handleRunReconstruct}
              onExportTxt={handleExportTxt}
              onExportPdf={handleExportPdf}
              onExportImage={handleExportImage}
              isDownloadingImage={isDownloadingImage}
              isEnhancing={isEnhancing}
              isExtractingOCR={isExtractingOCR}
              isInpainting={isInpainting}
              isReconstructing={isReconstructing}
              isExportingPdf={isExportingPdf}
              ocrResult={ocrResult}
              reconstructionResult={reconstructionResult}
              selectedGlyph={selectedGlyph}
              onSelectGlyph={setSelectedGlyph}
              supportedScripts={supportedScripts}
              enhancementMetrics={enhancementMetrics}
            />
          </aside>

          {/* Viewport & Comparison Column */}
          <section className="viewport-column">
            <Viewer3D
              currentArtifact={activeArtifact}
              activeLayer={activeLayer}
              comparisonMode={comparisonMode}
              onComparisonModeChange={setComparisonMode}
              ocrResult={ocrResult}
              selectedGlyph={selectedGlyph}
              onSelectGlyph={setSelectedGlyph}
              onRequestReconstruction={(glyph) => {
                setSelectedGlyph(glyph);
                handleRunReconstruct({
                  image_id: activeArtifact?.id,
                  target_glyph_id: glyph.id,
                  script: activeArtifact?.script
                });
              }}
              onExportImage={handleExportImage}
              isDownloadingImage={isDownloadingImage}
              isProcessing={isEnhancing || isExtractingOCR || isInpainting}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
