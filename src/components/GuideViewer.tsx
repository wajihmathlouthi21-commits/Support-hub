import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Guide, Step } from '../types';
import Icon from './Icon';

interface GuideViewerProps {
  guide: Guide;
  steps: Step[];
  onBack: () => void;
  hasNextGuide?: boolean;
  onNextGuide?: () => void;
}

const confettiColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'];

function VideoPlayer({ url, title }: { url: string; title: string }) {
  // Try to parse embeddable youtube link
  const getYoutubeId = (urlStr: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = urlStr.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getVimeoId = (urlStr: string) => {
    const regExp = /vimeo\.com\/([0-9]+)/;
    const match = urlStr.match(regExp);
    return match ? match[1] : null;
  };

  const ytId = getYoutubeId(url);
  const vimeoId = getVimeoId(url);
  const isDirectVideo = url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm') || url.toLowerCase().endsWith('.ogg');

  if (ytId) {
    return (
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-stone-200/60 shadow-sm bg-stone-900 group">
        <iframe
          src={`https://www.youtube.com/embed/${ytId}`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        />
      </div>
    );
  }

  if (vimeoId) {
    return (
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-stone-200/60 shadow-sm bg-stone-900 group">
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}`}
          title={title}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        />
      </div>
    );
  }

  if (isDirectVideo) {
    return (
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-stone-200/60 shadow-sm bg-stone-900 group">
        <video
          src={url}
          title={title}
          controls
          className="absolute inset-0 w-full h-full object-contain"
        />
      </div>
    );
  }

  // Fallback link button
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-stone-200 hover:border-indigo-300 bg-[#FAFAF9] hover:bg-indigo-50/50 rounded-2xl transition-all group h-full text-center"
    >
      <div className="w-14 h-14 bg-white group-hover:bg-indigo-600 group-hover:text-white text-indigo-600 rounded-full flex items-center justify-center shadow-sm border border-stone-200 group-hover:border-indigo-600 transition-all mb-4">
        <Icon name="ExternalLink" size={24} />
      </div>
      <h5 className="text-sm font-bold text-stone-800 font-sans mb-1">{title || "Ouvrir le lien externe"}</h5>
      <p className="text-[10px] text-stone-500 font-sans tracking-wide truncate max-w-full px-4">{url}</p>
    </a>
  );
}

function SupportVideos({ videos }: { videos: { title: string; url: string }[] }) {
  if (!videos || videos.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl border border-stone-200/60 shadow-sm p-8 mt-8" id="support-videos-container">
      <h3 className="text-sm font-bold text-stone-900 mb-6 uppercase tracking-widest font-sans flex items-center gap-2.5 border-b border-stone-100 pb-4">
        <Icon name="Video" size={18} className="text-indigo-500" />
        Vidéos annexes ({videos.length})
      </h3>
      <div className={`grid gap-8 ${videos.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
        {videos.map((video, index) => (
          <div key={index} className="space-y-4 flex flex-col justify-between h-full bg-[#FAFAF9] p-5 border border-stone-200/60 rounded-2xl shadow-inner">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-[10px] font-bold text-stone-600 uppercase tracking-widest font-sans mb-3 shadow-sm">
                Ressource {index + 1}
              </span>
              <h4 className="text-base font-bold text-stone-900 tracking-tight font-sans mb-2 line-clamp-1">
                {video.title || `Support visuel #${index + 1}`}
              </h4>
            </div>
            <VideoPlayer url={video.url} title={video.title} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GuideViewer({ guide, steps, onBack, hasNextGuide, onNextGuide }: GuideViewerProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [viewMode, setViewMode] = useState<'slides' | 'walkthrough'>('slides');
  const [started, setStarted] = useState(false);

  if (steps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center" id="empty-steps-container">
        <div className="w-16 h-16 bg-amber-50 border border-amber-100 text-amber-500 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
          <Icon name="AlertTriangle" size={32} />
        </div>
        <h3 className="text-xl font-display font-bold text-stone-900 mb-3">Aucune Étape Ajoutée</h3>
        <p className="text-sm text-stone-500 max-w-sm mb-8 leading-relaxed">
          Ce guide a été créé mais aucune étape d'instruction détaillée n'a encore été rédigée.
        </p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2.5 px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-900"
          id="btn-back-empty"
        >
          <Icon name="ArrowLeft" size={16} />
          Retour aux Guides
        </button>
      </div>
    );
  }

  let videos: { title: string; url: string }[] = [];
  if (guide.video_urls) {
    try {
      videos = JSON.parse(guide.video_urls);
      if (!Array.isArray(videos)) {
        videos = [];
      }
    } catch (e) {
      videos = [{ title: 'Vidéo de support', url: guide.video_urls }];
    }
  }

  const currentStep = steps[currentStepIndex];
  const totalStepsCount = steps.length;
  const currentProgressPercent = Math.round(((currentStepIndex + 1) / totalStepsCount) * 100);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
    setIsCompleted(false);
    setStarted(false);
  };

  return (
    <div className="max-w-5xl mx-auto" id="guide-viewer-root">
      
      {/* Back Header & View Mode Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 mb-8 pb-5 border-b border-stone-200/60" id="viewer-header">
        <button
          onClick={started ? () => setStarted(false) : onBack}
          className="inline-flex items-center gap-2.5 text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors cursor-pointer group uppercase tracking-widest font-sans outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 rounded-md p-1 -ml-1"
          id="btn-back-header"
        >
          <Icon name="ArrowLeft" className="transition-transform group-hover:-translate-x-1.5 text-stone-400 group-hover:text-stone-900" size={16} />
          {started ? "Retour à l'accueil" : "Retour aux guides"}
        </button>

        {/* Dynamic View Mode Tabs (Visible only after start) */}
        {started && !isCompleted && (
          <div className="flex items-center gap-3" id="viewer-controls">
            <div className="flex bg-stone-100/80 p-1.5 rounded-xl relative shadow-inner" id="view-mode-tabs">
              {(['slides', 'walkthrough'] as const).map((mode) => {
                const isActive = viewMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest relative rounded-lg transition-all duration-200 cursor-pointer flex items-center gap-2 z-10 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 ${
                      isActive ? 'text-indigo-700' : 'text-stone-500 hover:text-stone-800'
                    }`}
                    id={`tab-mode-${mode}`}
                  >
                    <Icon name={mode === 'slides' ? 'BookOpen' : 'FileText'} size={14} />
                    <span>{mode === 'slides' ? 'Présentation' : 'Manuel Complet'}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeViewModeTab"
                        className="absolute inset-0 bg-white shadow-sm rounded-lg border border-stone-200/50 -z-10"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
            <span className="hidden sm:inline-block text-[10px] text-stone-400 font-sans font-bold tracking-widest uppercase ml-2 border-l border-stone-200 pl-3">
              REF #{guide.id}
            </span>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!started ? (
          /* Custom Cover Welcome / Introduction Page */
          <motion.div
            key="start-screen"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="bg-white rounded-3xl border border-stone-200/60 shadow-sm p-8 md:p-14 max-w-3xl mx-auto font-sans relative overflow-hidden"
            id="guide-start-card"
          >
            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/40 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-50/30 rounded-full blur-3xl pointer-events-none" />

            {/* Guide image / Cover Logo */}
            {guide.image_url ? (
              <div className="relative w-full max-h-[300px] rounded-2xl overflow-hidden border border-stone-200/60 shadow-sm mb-10 bg-[#FAFAF9]">
                <img
                  src={guide.image_url}
                  alt={guide.title}
                  className="w-full h-auto max-h-[300px] object-cover mx-auto transition-transform duration-700 hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="mx-auto w-28 h-28 bg-indigo-50/80 text-indigo-600 rounded-3xl flex items-center justify-center shadow-sm border border-indigo-100 mb-10 relative">
                <Icon name="BookOpen" size={48} className="text-indigo-500" />
                <div className="absolute -bottom-2 bg-indigo-600 text-white font-sans text-[10px] font-bold px-3 py-1 rounded-full border border-indigo-500 shadow-sm uppercase tracking-widest">
                  MANUEL
                </div>
              </div>
            )}

            <div className="text-center space-y-5 relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-[10px] font-bold text-indigo-700 uppercase tracking-widest font-sans shadow-inner">
                Guide Interactif
              </span>
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-stone-900 tracking-tight leading-tight">
                {guide.title}
              </h1>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                <span className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border uppercase tracking-widest font-sans shadow-inner ${
                  guide.difficulty === 'Easy' ? 'bg-teal-50 text-teal-700 border-teal-100' :
                  guide.difficulty === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                  'bg-rose-50 text-rose-700 border-rose-100'
                }`}>
                  {guide.difficulty === 'Easy' ? 'Facile' : guide.difficulty === 'Medium' ? 'Moyen' : 'Difficile'}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-stone-600 font-sans font-medium bg-[#FAFAF9] border border-stone-200/80 px-3 py-1.5 rounded-lg shadow-inner">
                  <Icon name="Clock" size={14} className="text-stone-400" />
                  {guide.duration}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-stone-600 font-sans font-medium bg-[#FAFAF9] border border-stone-200/80 px-3 py-1.5 rounded-lg shadow-inner">
                  <Icon name="FileText" size={14} className="text-stone-400" />
                  {steps.length} {steps.length > 1 ? 'étapes' : 'étape'}
                </span>
              </div>

              {guide.description && (
                <div className="mt-8 text-sm md:text-base text-stone-600 leading-relaxed max-w-2xl mx-auto bg-[#FAFAF9] p-6 rounded-2xl border border-stone-200/60 text-left whitespace-pre-line font-sans shadow-inner">
                  {guide.description}
                </div>
              )}

              {/* Start Action Button */}
              <div className="pt-10">
                <button
                  onClick={() => setStarted(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-5 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md hover:shadow-lg hover:-translate-y-0.5 transform font-sans outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-900"
                  id="btn-start-guide"
                >
                  <span>Commencer le guide</span>
                  <Icon name="ArrowRight" size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        ) : isCompleted ? (
          /* Dynamic Completion Celebration Card */
          <motion.div
            key="completion-screen"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-3xl border border-stone-200/60 shadow-sm p-10 md:p-14 text-center max-w-2xl mx-auto font-sans relative overflow-hidden"
            id="guide-completion-card"
          >
            {/* Falling Confetti System */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" id="confetti-container">
              {Array.from({ length: 45 }).map((_, i) => {
                const color = confettiColors[i % confettiColors.length];
                const size = Math.random() * 8 + 6;
                const xStart = Math.random() * 100;
                const delay = Math.random() * 2.5;
                const duration = Math.random() * 2 + 2.5;
                
                return (
                  <motion.div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      backgroundColor: color,
                      width: size,
                      height: size,
                      left: `${xStart}%`,
                      top: `-20px`,
                    }}
                    animate={{
                      y: ['0vh', '110vh'],
                      x: [`0px`, `${(Math.random() - 0.5) * 150}px`],
                      rotate: [0, Math.random() * 360],
                    }}
                    transition={{
                      duration: duration,
                      repeat: Infinity,
                      delay: delay,
                      ease: 'linear',
                    }}
                  />
                );
              })}
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-teal-50/80 text-teal-600 rounded-3xl mb-8 border border-teal-100 shadow-sm" id="complete-badge-container">
                <Icon name="CheckCircle2" size={36} />
              </div>
              
              <h2 className="text-3xl md:text-4xl font-display font-bold text-stone-900 mb-4 tracking-tight" id="complete-title">
                Manuel Terminé
              </h2>
              
              <p className="text-base text-stone-500 max-w-md mx-auto mb-10 font-sans leading-relaxed font-medium" id="complete-description">
                Vous avez terminé toutes les étapes de <strong>"{guide.title}"</strong>. Nous espérons que cela a permis de configurer ou de résoudre votre requête avec succès.
              </p>

              <div className="bg-[#FAFAF9] rounded-2xl p-6 mb-10 text-left border border-stone-200/60 font-sans w-full shadow-inner" id="complete-feedback-panel">
                <h4 className="text-[10px] font-bold text-stone-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Icon name="Info" size={14} className="text-indigo-500" />
                  AIDE SUPPLÉMENTAIRE
                </h4>
                <p className="text-sm text-stone-500 leading-relaxed font-medium">
                  Si ce manuel n'a pas entièrement résolu votre problème, veuillez ouvrir un ticket d'incident sur votre tableau de bord d'assistance IT ou contacter un administrateur système.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center w-full" id="complete-actions">
                <button
                  onClick={handleReset}
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-4 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer font-sans shadow-sm outline-none focus:ring-2 focus:ring-stone-400"
                  id="btn-restart-guide"
                >
                  <Icon name="Activity" size={16} />
                  Recommencer
                </button>
                <button
                  onClick={onBack}
                  className={`inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer font-sans outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-900 ${
                    hasNextGuide 
                      ? 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 shadow-sm' 
                      : 'bg-stone-900 hover:bg-stone-800 text-white shadow-md'
                  }`}
                  id="btn-finish-guide-back"
                >
                  <Icon name="Check" size={14} />
                  Terminer & Quitter
                </button>
                {hasNextGuide && onNextGuide && (
                  <button
                    onClick={() => {
                      handleReset();
                      onNextGuide();
                    }}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-md font-mono"
                    id="btn-next-guide-complete"
                  >
                    <span>Guide Suivant</span>
                    <Icon name="ArrowRight" size={14} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ) : viewMode === 'slides' ? (
          /* Slides Mode (Classic Slider + Sidebar Steps Timeline) */
          <motion.div
            key="slides-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            id="slides-view-root"
          >
            {/* Left Steps Timeline Checklist (Desktop screens only) */}
            <div className="hidden lg:block lg:col-span-3 sticky top-6" id="slides-timeline-sidebar">
              <div className="bg-[#FAFAF9] border border-stone-200/80 rounded-3xl p-6 space-y-6 shadow-sm">
                <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest font-sans flex items-center gap-2">
                  <Icon name="List" size={14} className="text-indigo-400" />
                  Progression
                </h4>
                
                <div className="relative border-l-2 border-stone-100 pl-5 space-y-6 text-sm font-sans" id="timeline-list">
                  {steps.map((step, idx) => {
                    const isCurrent = idx === currentStepIndex;
                    const isPast = idx < currentStepIndex;
                    
                    return (
                      <button
                        key={step.id || idx}
                        onClick={() => setCurrentStepIndex(idx)}
                        className="flex flex-col items-start text-left w-full relative group cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 rounded-lg p-1 -ml-1"
                        id={`timeline-step-${step.step_number}`}
                      >
                        {/* Circle Indicator */}
                        <span className={`absolute -left-[31px] top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[9px] font-bold transition-all shadow-sm ${
                          isCurrent ? 'bg-indigo-600 border-indigo-600 text-white ring-4 ring-indigo-100 scale-110' :
                          isPast ? 'bg-teal-500 border-teal-500 text-white' :
                          'bg-white border-stone-200 text-stone-400 group-hover:border-stone-300'
                        }`}>
                          {isPast ? <Icon name="Check" size={12} /> : idx + 1}
                        </span>
                        
                        <span className={`font-semibold transition-colors line-clamp-1 leading-snug ${
                          isCurrent ? 'text-indigo-700' : 
                          isPast ? 'text-stone-500 group-hover:text-stone-800' : 'text-stone-400 group-hover:text-stone-700'
                        }`}>
                          {step.title}
                        </span>
                        <span className="text-[10px] text-stone-400 mt-1 font-sans font-medium uppercase tracking-widest">
                          Étape {idx + 1}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Slides Step Card */}
            <div className="col-span-1 lg:col-span-9" id="slide-card-container">
              <div className="bg-white rounded-3xl border border-stone-200/60 shadow-sm overflow-hidden flex flex-col h-full">
                
                {/* Guide Info Intro Header */}
                <div className="px-8 py-6 bg-[#FAFAF9] border-b border-stone-200/60" id="guide-meta-banner">
                  <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
                    <span className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border uppercase tracking-widest shadow-inner ${
                      guide.difficulty === 'Easy' ? 'bg-teal-50 text-teal-700 border-teal-100' :
                      guide.difficulty === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                      'bg-rose-50 text-rose-700 border-rose-100'
                    }`} id="difficulty-badge">
                      {guide.difficulty === 'Easy' ? 'Facile' : guide.difficulty === 'Medium' ? 'Moyen' : 'Difficile'}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-stone-500 font-sans font-medium" id="duration-badge">
                      <Icon name="Clock" size={14} className="text-stone-400" />
                      {guide.duration}
                    </span>
                  </div>
                  <h1 className="text-xl md:text-2xl font-display font-bold text-stone-900 tracking-tight" id="guide-viewer-title">
                    {guide.title}
                  </h1>
                </div>

                {/* Progress Bar Fill */}
                <div className="bg-stone-100 h-2 w-full relative overflow-hidden" id="progress-container">
                  <motion.div
                    className="bg-indigo-500 h-full absolute top-0 left-0"
                    style={{ width: `${currentProgressPercent}%` }}
                    layoutId="progress-bar-fill"
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </div>

                {/* Main Content Area */}
                <div className="flex flex-col gap-8 p-8 md:p-12" id="step-content-grid">
                  {/* Step Image */}
                  <div className="w-full flex flex-col gap-6" id="step-image-column">
                    <div className="relative w-full bg-[#FAFAF9] rounded-2xl overflow-hidden border border-stone-200/80 shadow-sm group">
                      <img
                        src={currentStep.image_url}
                        alt={currentStep.title}
                        className="w-full h-auto max-h-[75vh] object-contain mx-auto transition-transform duration-700 group-hover:scale-101"
                        referrerPolicy="no-referrer"
                        id={`step-img-${currentStep.step_number}`}
                      />
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-stone-900 font-sans text-sm font-bold w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border border-stone-200/80 z-10">
                        {currentStep.step_number}
                      </div>
                    </div>
                    {currentStep.video_url && (
                      <div className="space-y-2">
                        <span className="block text-[10px] font-bold text-stone-500 uppercase font-sans tracking-widest flex items-center gap-1.5">
                          <Icon name="Video" size={14} className="text-indigo-500" />
                          Vidéo de l'étape :
                        </span>
                        <VideoPlayer url={currentStep.video_url} title={`Étape ${currentStep.step_number} : ${currentStep.title}`} />
                      </div>
                    )}
                  </div>

                  {/* Step Instructions */}
                  <div className="w-full flex flex-col justify-between" id="step-instruction-column">
                    <div id="step-info">
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest font-sans flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        ÉTAPE {currentStepIndex + 1} SUR {totalStepsCount}
                      </span>
                      <h3 className="text-2xl md:text-3xl font-display font-bold text-stone-900 mt-3 tracking-tight leading-tight" id="step-title">
                        {currentStep.title}
                      </h3>
                      <div className="mt-6 text-base text-stone-600 leading-loose space-y-4 font-sans whitespace-pre-line border-l-2 border-indigo-100 pl-6">
                        {currentStep.description}
                      </div>
                    </div>

                    {/* Navigation Actions */}
                    <div className="flex items-center gap-4 mt-12 pt-8 border-t border-stone-200/60" id="step-nav-bar">
                      <button
                        onClick={handlePrev}
                        disabled={currentStepIndex === 0}
                        className={`flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl border border-stone-200 text-xs font-bold uppercase tracking-wider transition-all font-sans outline-none focus:ring-2 focus:ring-stone-400 ${
                          currentStepIndex === 0
                            ? 'opacity-40 cursor-not-allowed text-stone-400 bg-stone-50/50'
                            : 'text-stone-700 hover:bg-stone-50 cursor-pointer shadow-sm'
                        }`}
                        id="btn-prev-step"
                      >
                        <Icon name="ChevronLeft" size={16} />
                        Précédent
                      </button>
                      <button
                        onClick={handleNext}
                        className="flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md transition-colors cursor-pointer font-sans outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-900"
                        id="btn-next-step"
                      >
                        {currentStepIndex === totalStepsCount - 1 ? 'Terminer' : 'Suivant'}
                        <Icon name="ChevronRight" size={16} />
                      </button>
                    </div>

                    {currentStepIndex < totalStepsCount - 1 && (
                      <div className="text-center mt-6">
                        <button
                          onClick={() => setIsCompleted(true)}
                          className="inline-flex items-center gap-2 text-xs text-stone-400 hover:text-stone-900 transition-colors cursor-pointer font-sans font-semibold uppercase tracking-widest outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 rounded-md p-1"
                          id="btn-skip-to-end"
                        >
                          <Icon name="ChevronsRight" size={14} />
                          Passer à la fin
                        </button>
                      </div>
                    )}

                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        ) : (
          /* Walkthrough Book Mode (Full detailed continuous document list) */
          <motion.div
            key="walkthrough-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
            id="walkthrough-view-root"
          >
            {/* Header Description Block */}
            <div className="bg-[#FAFAF9] rounded-3xl border border-stone-200/60 shadow-sm overflow-hidden relative" id="walkthrough-meta-header">
              {guide.image_url && (
                <div className="w-full h-48 sm:h-64 bg-stone-100 border-b border-stone-200/60 overflow-hidden relative">
                  <img
                    src={guide.image_url}
                    alt={guide.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover animate-fade-in transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900/30 to-transparent" />
                </div>
              )}
              <div className="p-8 md:p-12 relative">
                <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl pointer-events-none" />
                <div className="flex flex-wrap items-center justify-between mb-5 gap-3 relative z-10">
                  <span className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border uppercase tracking-widest font-sans shadow-inner ${
                    guide.difficulty === 'Easy' ? 'bg-teal-50 text-teal-700 border-teal-100' :
                    guide.difficulty === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                    'bg-rose-50 text-rose-700 border-rose-100'
                  }`}>
                    {guide.difficulty === 'Easy' ? 'Facile' : guide.difficulty === 'Medium' ? 'Moyen' : 'Difficile'}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-stone-500 font-sans font-medium">
                    <Icon name="Clock" size={14} className="text-stone-400" />
                    {guide.duration}
                  </span>
                </div>
                <h1 className="text-2xl md:text-4xl font-display font-bold text-stone-900 tracking-tight leading-tight relative z-10">
                  {guide.title}
                </h1>
                <p className="text-base text-stone-500 mt-4 leading-relaxed font-sans relative z-10 max-w-3xl">
                  {guide.description}
                </p>
              </div>
            </div>

            <SupportVideos videos={videos} />

            {/* Continuous stream of all steps */}
            <div className="space-y-6" id="walkthrough-steps-stream">
              {steps.map((step, idx) => (
                <div 
                  key={step.id || idx}
                  className="bg-white rounded-3xl border border-stone-200/60 shadow-sm overflow-hidden flex flex-col gap-8 p-8 md:p-10 transition-all hover:shadow-md hover:border-stone-300"
                  id={`walkthrough-step-card-${step.step_number}`}
                >
                  {/* Step image */}
                  <div className="w-full shrink-0">
                    <div className="relative w-full rounded-2xl overflow-hidden border border-stone-200/80 shadow-sm bg-[#FAFAF9]">
                      <img 
                        src={step.image_url} 
                        alt={step.title}
                        className="w-full h-auto max-h-[75vh] object-contain mx-auto"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-stone-900 font-sans text-[10px] font-bold px-3 py-1.5 rounded-xl border border-stone-200/80 shadow-sm z-10 uppercase tracking-widest">
                        ÉTAPE {step.step_number}
                      </span>
                    </div>
                  </div>
                  
                  {/* Step textual metadata */}
                  <div className="w-full flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest font-sans flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        SECTION {step.step_number}
                      </span>
                      <h3 className="text-xl md:text-2xl font-display font-bold text-stone-900 mt-2 tracking-tight">
                        {step.title}
                      </h3>
                      <div className="mt-5 text-base text-stone-600 leading-loose space-y-4 font-sans whitespace-pre-line border-l-2 border-indigo-100 pl-6">
                        {step.description}
                      </div>
                      {step.video_url && (
                        <div className="mt-8 space-y-2">
                          <span className="block text-[10px] font-bold text-stone-500 uppercase font-sans tracking-widest flex items-center gap-1.5">
                            <Icon name="Video" size={14} className="text-indigo-500" />
                            Vidéo de l'étape :
                          </span>
                          <VideoPlayer url={step.video_url} title={`Étape ${step.step_number} : ${step.title}`} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Finish walkthrough summary panel */}
            <div className="bg-white rounded-3xl p-10 text-center border border-stone-200/60 shadow-sm flex flex-col items-center" id="walkthrough-completion-box">
              <div className="w-16 h-16 rounded-2xl bg-teal-50/80 border border-teal-100 text-teal-600 flex items-center justify-center mb-5 shadow-sm">
                <Icon name="Check" size={24} />
              </div>
              <h3 className="text-lg font-display font-bold text-stone-900">Fin du manuel continu</h3>
              <p className="text-sm text-stone-500 mt-2 max-w-md mx-auto leading-relaxed">
                Vous avez parcouru toutes les {totalStepsCount} étapes. Cliquez ci-dessous pour valider la complétion.
              </p>
              <button
                onClick={() => setIsCompleted(true)}
                className="mt-8 inline-flex items-center gap-2.5 px-8 py-4 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer font-sans outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-900 hover:-translate-y-0.5"
                id="btn-walkthrough-finish"
              >
                Terminer le guide
                <Icon name="Check" size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
