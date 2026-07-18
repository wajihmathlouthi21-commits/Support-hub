import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Category, Guide, Step, GuideWithSteps } from './types';
import Icon from './components/Icon';
import GuideViewer from './components/GuideViewer';
import AdminPanel from './components/AdminPanel';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 140, damping: 16 } }
};

export default function App() {
  // State
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [activeGuide, setActiveGuide] = useState<GuideWithSteps | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  
  // Search and UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('admin_token');
      const username = localStorage.getItem('admin_username');
      setIsAdmin(!!token);
      setLoggedInUser(username);
    };
    checkAuth();
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('admin_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/categories', { headers });
      if (res.ok) {
        const data: Category[] = await res.json();
        setCategories(data);
        // Default select first category if available
        if (data.length > 0) {
          handleSelectCategory(data[0]);
        }
      } else {
        setError('Failed to fetch helpdesk categories.');
      }
    } catch (err) {
      setError('Connection refused. Is the database offline?');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCategory = async (cat: Category) => {
    setSelectedCategory(cat);
    setActiveGuide(null);
    setSearchQuery('');
    setSelectedDifficulty('All');
    setMobileMenuOpen(false);
    
    try {
      const token = localStorage.getItem('admin_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/categories/${cat.id}/guides`, { headers });
      if (res.ok) {
        const data = await res.json();
        setGuides(data.guides);
      }
    } catch (err) {
      console.error('Failed to load guides:', err);
    }
  };

  const handleSelectGuide = async (guideId: number) => {
    try {
      const token = localStorage.getItem('admin_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/guides/${guideId}`, { headers });
      if (res.ok) {
        const data: GuideWithSteps = await res.json();
        setActiveGuide(data);
      }
    } catch (err) {
      console.error('Failed to load guide steps:', err);
    }
  };

  // Filter guides based on search query & difficulty category
  const filteredGuides = guides.filter(guide => {
    const matchesSearch = 
      guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = selectedDifficulty === 'All' || guide.difficulty === selectedDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  const currentGuideIndex = activeGuide ? filteredGuides.findIndex(g => g.id === activeGuide.guide.id) : -1;
  const hasNextGuide = activeGuide ? (currentGuideIndex !== -1 && currentGuideIndex < filteredGuides.length - 1) : false;

  const handleNextGuide = () => {
    if (!activeGuide || !hasNextGuide) return;
    const nextGuide = filteredGuides[currentGuideIndex + 1];
    handleSelectGuide(nextGuide.id);
  };

  const handleAuthChange = () => {
    const token = localStorage.getItem('admin_token');
    const username = localStorage.getItem('admin_username');
    setIsAdmin(!!token);
    setLoggedInUser(username);
    fetchInitialData();
  };

  const difficultyStyles = {
    Easy: 'bg-emerald-50 text-emerald-700 border-emerald-150',
    Medium: 'bg-amber-50 text-amber-700 border-amber-150',
    Hard: 'bg-rose-50 text-rose-700 border-rose-150',
  };

  // Category statistics calculations
  const totalGuidesCount = guides.length;
  const easyGuidesCount = guides.filter(g => g.difficulty === 'Easy').length;
  const mediumGuidesCount = guides.filter(g => g.difficulty === 'Medium').length;
  const hardGuidesCount = guides.filter(g => g.difficulty === 'Hard').length;
  const totalMinutes = guides.reduce((acc, g) => {
    const mins = parseInt(g.duration.replace(/[^0-9]/g, '')) || 5;
    return acc + mins;
  }, 0);
  const avgMinutes = totalGuidesCount > 0 ? Math.round(totalMinutes / totalGuidesCount) : 0;

  return (
    <div className="flex h-screen w-full bg-[#FAFAF9] text-stone-900 font-sans overflow-hidden selection:bg-indigo-100 selection:text-indigo-900" id="portal-root">
      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex w-72 bg-white flex flex-col border-r border-stone-200 shadow-sm h-full shrink-0 relative z-10" id="desktop-sidebar">
        <div className="p-8 pb-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center font-display font-bold text-white shadow-sm">
              IT
            </div>
            <div>
              <h1 className="text-stone-900 font-display font-bold text-lg tracking-tight leading-tight">Support Hub</h1>
              <p className="text-xs text-stone-500 font-medium tracking-wide mt-0.5">Portail Guide</p>
            </div>
          </div>
        </div>

        <div className="px-8 py-2 shrink-0">
          <h2 className="text-stone-400 text-[10px] font-bold uppercase tracking-widest font-sans">DÉPARTEMENTS</h2>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto mt-2 pb-4" id="desktop-category-nav">
          {categories.map((cat) => {
            const isSelected = selectedCategory?.id === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleSelectCategory(cat)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                  isSelected
                    ? 'bg-stone-100 text-stone-900 shadow-sm border border-stone-200/50'
                    : 'bg-transparent text-stone-600 hover:bg-stone-50 hover:text-stone-900 border border-transparent'
                }`}
                id={`cat-btn-${cat.id}`}
              >
                <div className={`w-5 h-5 flex items-center justify-center shrink-0 transition-colors ${
                  isSelected ? 'text-stone-900' : 'text-stone-400 group-hover:text-stone-600'
                }`}>
                  <Icon name={cat.icon} size={16} />
                </div>
                <span className="truncate leading-normal font-sans">{cat.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer with Admin and Status */}
        <div className="p-6 shrink-0 flex flex-col gap-4 relative before:absolute before:top-0 before:inset-x-6 before:h-px before:bg-stone-200/60" id="sidebar-footer">
          <button
            onClick={() => setAdminOpen(true)}
            className="w-full py-2.5 bg-white hover:bg-stone-50 text-stone-600 hover:text-stone-900 transition-all rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-stone-200 shadow-sm cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/20 active:scale-[0.98]"
            id="btn-admin-launcher"
          >
            <Icon name="Lock" size={14} className="text-stone-400" />
            Portail Admin
          </button>
          <div className="text-[10px] text-stone-500 font-medium flex items-center gap-2 justify-center bg-stone-50 py-2 px-3 rounded-xl border border-stone-100">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            KNOWLEDGE BASE EN LIGNE
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Slide-out Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Overlay Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-40 md:hidden"
              id="mobile-menu-overlay"
            />
            {/* Drawer Box */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 w-72 bg-white z-50 border-r border-stone-200 flex flex-col md:hidden shadow-2xl"
              id="mobile-drawer"
            >
              <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center font-display font-bold text-white shadow-sm">IT</div>
                  <div>
                    <h1 className="text-stone-900 font-display font-bold text-sm tracking-tight leading-none">Support Hub</h1>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-stone-400 hover:text-stone-900 p-1 cursor-pointer transition-colors"
                >
                  <Icon name="X" size={20} />
                </button>
              </div>

              <div className="px-6 py-4">
                <h2 className="text-stone-400 text-[10px] font-bold uppercase tracking-widest font-sans">DÉPARTEMENTS</h2>
              </div>

              <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
                {categories.map((cat) => {
                  const isSelected = selectedCategory?.id === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleSelectCategory(cat)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                        isSelected
                          ? 'bg-stone-100 text-stone-900 shadow-sm border border-stone-200/50'
                          : 'bg-transparent text-stone-600 hover:bg-stone-50 hover:text-stone-900 border border-transparent'
                      }`}
                      id={`mob-cat-btn-${cat.id}`}
                    >
                      <div className={`w-5 h-5 flex items-center justify-center shrink-0 ${
                        isSelected ? 'text-stone-900' : 'text-stone-400'
                      }`}>
                        <Icon name={cat.icon} size={16} />
                      </div>
                      <span className="truncate font-sans">{cat.name}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="p-6 border-t border-stone-100 bg-stone-50/50 flex flex-col gap-3">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setAdminOpen(true);
                  }}
                  className="w-full py-2.5 bg-white text-stone-700 hover:bg-stone-50 hover:text-stone-900 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-stone-200 cursor-pointer transition-all shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <Icon name="Lock" size={14} className="text-stone-400" />
                  Portail Admin
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Container Layout */}
      <div className="flex-1 flex flex-col h-full overflow-hidden" id="layout-container">
        
        {/* Top Header */}
        <div className="h-20 bg-white/80 backdrop-blur-md border-b border-stone-200 flex items-center justify-between px-6 md:px-10 shrink-0 z-30 sticky top-0" id="portal-header">
          <div className="flex flex-col min-w-0">
            <div className="text-[10px] font-bold text-stone-400 tracking-widest uppercase flex items-center gap-1.5 font-sans">
              <span>Categories</span>
              <Icon name="ChevronRight" size={10} className="text-stone-300" />
              {activeGuide ? (
                <>
                  <button onClick={() => setActiveGuide(null)} className="hover:text-stone-600 transition-colors cursor-pointer outline-none focus:ring-1 focus:ring-stone-400 rounded-sm">{selectedCategory?.name}</button>
                  <Icon name="ChevronRight" size={10} className="text-stone-300" />
                  <span className="text-stone-600 truncate max-w-[150px] md:max-w-[300px]">{activeGuide.guide.title}</span>
                </>
              ) : (
                <span className="text-stone-600">{selectedCategory?.name || 'Loading'}</span>
              )}
            </div>
            <h2 className="text-base md:text-xl font-display font-bold text-stone-900 tracking-tight mt-0.5 truncate">
              {activeGuide ? activeGuide.guide.title : `${selectedCategory?.name || ''} Manuals`}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {isAdmin && (
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100/60 rounded-full shadow-sm" id="admin-status-indicator">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-indigo-700 font-mono uppercase tracking-wider">Session Admin: {loggedInUser}</span>
              </div>
            )}
            {/* Mobile Hamburger menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-stone-500 hover:text-stone-900 focus:outline-none p-2 hover:bg-stone-100 rounded-xl cursor-pointer border border-stone-200 transition-colors shadow-sm"
              id="mobile-hamburger-btn"
            >
              <Icon name={mobileMenuOpen ? 'X' : 'Menu'} size={20} />
            </button>
          </div>
        </div>

        {/* Central Content Area */}
        <main className="flex-1 bg-[#FAFAF9] p-6 md:p-12 overflow-y-auto" id="portal-main-content">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 h-full" id="main-loader">
              <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
              <p className="text-xs text-stone-500 font-medium mt-6 font-mono tracking-wider">CHARGEMENT...</p>
            </div>
          ) : error ? (
            <div className="max-w-md mx-auto text-center py-16 bg-white border border-rose-100 rounded-3xl shadow-sm p-8" id="main-error-card">
              <div className="w-14 h-14 bg-rose-50 border border-rose-100 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Icon name="AlertTriangle" size={26} />
              </div>
              <h3 className="text-lg font-display font-bold text-stone-900">Connexion Échouée</h3>
              <p className="text-sm text-stone-500 mt-2 leading-relaxed">
                {error}
              </p>
              <button
                onClick={fetchInitialData}
                className="mt-8 px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-colors shadow-md outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-900"
              >
                Réessayer
              </button>
            </div>
          ) : (
            <>
              {/* If no guide is active, show the category list and filtered guide cards */}
              {!activeGuide ? (
                <div className="max-w-5xl mx-auto space-y-8" id="guides-list-view">
                  
                  {/* Category Banner Card */}
                  {selectedCategory && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-3xl border border-stone-200/60 shadow-sm p-8 md:p-10 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden" 
                      id="category-banner"
                    >
                      <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl pointer-events-none" />
                      <div className="w-16 h-16 bg-indigo-50/80 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                        <Icon name={selectedCategory.icon} size={28} />
                      </div>
                      <div className="flex-1 text-center sm:text-left relative z-10">
                        <h2 className="text-2xl md:text-3xl font-display font-bold text-stone-900 tracking-tight leading-tight">
                          {selectedCategory.name}
                        </h2>
                        <p className="text-base text-stone-500 mt-2 leading-relaxed max-w-2xl font-medium">
                          {selectedCategory.description}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Category Quick Stats Row */}
                  {guides.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5" id="category-stats-row">
                      <div className="bg-white p-6 rounded-3xl border border-stone-200/60 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:border-stone-300">
                        <div className="w-12 h-12 bg-indigo-50/80 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-sm">
                          <Icon name="BookOpen" size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest font-sans">Manuels</p>
                          <p className="text-xl font-display font-bold text-stone-900 leading-none mt-1.5">{totalGuidesCount} Guides</p>
                        </div>
                      </div>
                      
                      <div className="bg-white p-6 rounded-3xl border border-stone-200/60 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:border-stone-300">
                        <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center border border-teal-100 shadow-sm">
                          <Icon name="Clock" size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest font-sans">Durée Moyenne</p>
                          <p className="text-xl font-display font-bold text-stone-900 leading-none mt-1.5">~{avgMinutes} Mins</p>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-3xl border border-stone-200/60 shadow-sm flex flex-col justify-center transition-all hover:shadow-md hover:border-stone-300">
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest font-sans mb-3">Profil de Difficulté</p>
                        <div className="h-2.5 bg-stone-100 rounded-full flex overflow-hidden shadow-inner">
                          {easyGuidesCount > 0 && (
                            <div 
                              className="bg-teal-500 transition-all duration-500" 
                              style={{ width: `${(easyGuidesCount / totalGuidesCount) * 100}%` }}
                              title={`Facile: ${easyGuidesCount}`}
                            />
                          )}
                          {mediumGuidesCount > 0 && (
                            <div 
                              className="bg-amber-400 transition-all duration-500" 
                              style={{ width: `${(mediumGuidesCount / totalGuidesCount) * 100}%` }}
                              title={`Moyen: ${mediumGuidesCount}`}
                            />
                          )}
                          {hardGuidesCount > 0 && (
                            <div 
                              className="bg-rose-500 transition-all duration-500" 
                              style={{ width: `${(hardGuidesCount / totalGuidesCount) * 100}%` }}
                              title={`Difficile: ${hardGuidesCount}`}
                            />
                          )}
                        </div>
                        <div className="flex justify-between items-center mt-3 text-[10px] text-stone-500 font-sans font-medium">
                          <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-teal-500 rounded-full"></span> {easyGuidesCount} Facile</span>
                          <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-amber-400 rounded-full"></span> {mediumGuidesCount} Moyen</span>
                          <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-rose-500 rounded-full"></span> {hardGuidesCount} Difficile</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Search and Sliding Filters */}
                  <div className="flex flex-col sm:flex-row gap-5 items-center justify-between bg-white p-4 rounded-3xl border border-stone-200/60 shadow-sm" id="search-filter-row">
                    <div className="relative w-full sm:max-w-md" id="search-input-wrapper">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-stone-400">
                        <Icon name="Search" size={16} />
                      </div>
                      <input
                        type="text"
                        placeholder={`Rechercher dans ${selectedCategory?.name || 'les guides'}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-10 py-3 bg-[#FAFAF9] border border-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white rounded-2xl text-sm transition-all shadow-inner font-sans text-stone-700 placeholder:text-stone-400"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute inset-y-0 right-3 flex items-center text-stone-400 hover:text-stone-700 cursor-pointer p-1"
                        >
                          <Icon name="X" size={16} />
                        </button>
                      )}
                    </div>

                    {/* Difficulty Sliding Pill Filter */}
                    <div className="flex bg-stone-100/80 p-1.5 rounded-2xl relative w-full sm:w-auto overflow-x-auto hide-scrollbar" id="difficulty-tabs-wrapper">
                      {(['All', 'Easy', 'Medium', 'Hard'] as const).map((diff) => {
                        const isActive = selectedDifficulty === diff;
                        const count = diff === 'All' 
                          ? guides.length 
                          : guides.filter(g => g.difficulty === diff).length;

                        const diffLabelMap = {
                          All: 'Tous',
                          Easy: 'Facile',
                          Medium: 'Moyen',
                          Hard: 'Difficile'
                        };

                        return (
                          <button
                            key={diff}
                            onClick={() => setSelectedDifficulty(diff)}
                            className={`flex-1 sm:flex-initial px-5 py-2 text-xs font-bold uppercase tracking-wider relative rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 z-10 whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 ${
                              isActive ? 'text-indigo-700' : 'text-stone-500 hover:text-stone-800'
                            }`}
                            id={`tab-diff-${diff}`}
                          >
                            <span>{diffLabelMap[diff]}</span>
                            <span className={`text-[10px] font-sans px-2 py-0.5 rounded-md ${
                              isActive ? 'bg-indigo-100 text-indigo-800' : 'bg-stone-200/70 text-stone-500'
                            }`}>
                              {count}
                            </span>
                            {isActive && (
                              <motion.div
                                layoutId="activeDifficultyTab"
                                className="absolute inset-0 bg-white shadow-sm rounded-xl border border-stone-200/50 -z-10"
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Guides Grid with Staggered Entrance Animations */}
                  {filteredGuides.length === 0 ? (
                    <motion.div 
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       className="bg-white rounded-3xl border border-stone-200/60 text-center py-20 px-6 shadow-sm" 
                       id="guides-empty-state"
                    >
                      <div className="w-16 h-16 bg-stone-50 border border-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Icon name="BookOpen" className="text-stone-300 h-8 w-8" />
                      </div>
                      <h4 className="text-lg font-display font-bold text-stone-900">Aucun manuel trouvé</h4>
                      <p className="text-sm text-stone-500 mt-2 max-w-sm mx-auto leading-relaxed">
                        Aucun guide ne correspond à vos filtres actuels. Essayez de modifier la difficulté ou la recherche.
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div 
                      variants={containerVariants}
                      initial="hidden"
                      animate="show"
                      key={`${selectedCategory?.id}-${selectedDifficulty}`}
                      className="grid grid-cols-1 md:grid-cols-2 gap-6" 
                      id="guides-grid"
                    >
                      {filteredGuides.map((guide) => (
                        <motion.div
                          key={guide.id}
                          variants={cardVariants}
                          whileHover={{ y: -4 }}
                          transition={{ duration: 0.2 }}
                          className="bg-white rounded-3xl border border-stone-200/60 shadow-sm hover:shadow-lg hover:shadow-stone-200/40 hover:border-stone-300 transition-all flex flex-col justify-between overflow-hidden group cursor-pointer"
                          id={`guide-card-${guide.id}`}
                          onClick={() => handleSelectGuide(guide.id)}
                        >
                          {guide.image_url && (
                            <div className="w-full h-48 overflow-hidden bg-stone-50 border-b border-stone-100 shrink-0 relative">
                              <img
                                src={guide.image_url}
                                alt={guide.title}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>
                          )}
                          <div className="p-8">
                            <div className="flex items-center justify-between mb-5">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-3 py-1 rounded-lg uppercase tracking-widest border ${
                                  guide.difficulty === 'Easy' ? 'bg-teal-50 text-teal-700 border-teal-100' :
                                  guide.difficulty === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                  'bg-rose-50 text-rose-700 border-rose-100'
                                }`}>
                                  {guide.difficulty === 'Easy' ? 'Facile' : guide.difficulty === 'Medium' ? 'Moyen' : 'Difficile'}
                                </span>
                                {guide.is_private === 1 && (
                                  <span className="flex items-center gap-1.5 text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-lg font-bold font-sans uppercase tracking-widest">
                                    <Icon name="Users" size={12} className="text-indigo-500 shrink-0" />
                                    Membres IT
                                  </span>
                                )}
                                {guide.is_private === 2 && (
                                  <span className="flex items-center gap-1.5 text-[10px] bg-stone-100 text-stone-700 border border-stone-200 px-3 py-1 rounded-lg font-bold font-sans uppercase tracking-widest">
                                    <Icon name="Lock" size={12} className="text-stone-500 shrink-0" />
                                    Admin Seul
                                  </span>
                                )}
                              </div>
                              <span className="flex items-center gap-1.5 text-xs text-stone-500 font-sans font-medium">
                                <Icon name="Clock" size={14} className="text-stone-400" />
                                {guide.duration}
                              </span>
                            </div>

                            <h3 className="text-xl font-display font-bold text-stone-900 group-hover:text-indigo-600 transition-colors tracking-tight leading-tight">
                              {guide.title}
                            </h3>
                            <p className="text-sm text-stone-500 mt-3 line-clamp-2 leading-relaxed">
                              {guide.description}
                            </p>
                          </div>

                          <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-100 flex items-center justify-between" id={`guide-card-footer-${guide.id}`}>
                            <span className="text-[10px] text-slate-400 font-mono tracking-wider font-bold">MANUEL DE SUPPORT</span>
                            <button
                              onClick={() => handleSelectGuide(guide.id)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer group/btn"
                            >
                              Consulter le guide
                              <Icon name="ArrowRight" size={13} className="transition-transform group-hover/btn:translate-x-0.5" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                </div>
              ) : (
                /* Interactive Step-by-Step Viewer Component */
                <GuideViewer
                  guide={activeGuide.guide}
                  steps={activeGuide.steps}
                  onBack={() => setActiveGuide(null)}
                  hasNextGuide={hasNextGuide}
                  onNextGuide={handleNextGuide}
                />
              )}
            </>
          )}
        </main>

      </div>

      {/* Admin Panel Modal Overlay */}
      {adminOpen && (
        <AdminPanel
          onClose={() => {
            setAdminOpen(false);
            handleAuthChange();
          }}
          categories={categories}
          refreshCategories={fetchInitialData}
        />
      )}
    </div>
  );
}
