import React, { useState, useEffect } from 'react';
import { Category, Guide, Step, GuideWithSteps } from '../types';
import Icon from './Icon';

interface AdminPanelProps {
  onClose: () => void;
  categories: Category[];
  refreshCategories: () => Promise<void>;
}

// Preset images for easy step creation
const IMAGE_PRESETS = [
  { name: 'Helpdesk Portal / Workspace', url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=800' },
  { name: 'Workstation / Setup', url: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=800' },
  { name: 'Server / Router / Gateway', url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=800' },
  { name: 'Printer / Copier Cabinet', url: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&q=80&w=800' },
  { name: 'Security / Encryption', url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=800' },
  { name: 'Laptop screen / software config', url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800' },
];

const ICON_PRESETS = [
  { name: 'Help & Incidents', icon: 'HelpCircle' },
  { name: 'Security / VPN', icon: 'ShieldAlert' },
  { name: 'Hardware / Printers', icon: 'Printer' },
  { name: 'Computers / Monitor', icon: 'Monitor' },
  { name: 'Keys / Passwords', icon: 'Key' },
  { name: 'Hardware Parts / CPU', icon: 'Cpu' },
  { name: 'Settings / System', icon: 'Settings' },
];

export default function AdminPanel({ onClose, categories, refreshCategories }: AdminPanelProps) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));
  const [username, setUsername] = useState('admin');
  const [loggedInUser, setLoggedInUser] = useState<string>(localStorage.getItem('admin_username') || 'admin');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Panel Tab: 'content' | 'users'
  const [panelTab, setPanelTab] = useState<'content' | 'users'>('content');

  // Management State
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [selectedGuide, setSelectedGuide] = useState<GuideWithSteps | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadingVideoIndex, setUploadingVideoIndex] = useState<number | null>(null);
  const [uploadingGuideImage, setUploadingGuideImage] = useState(false);
  const [uploadingGlobalVideoIndex, setUploadingGlobalVideoIndex] = useState<number | null>(null);

  // User list & form states
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    role: 'Admin'
  });
  const [newPassword, setNewPassword] = useState('');

  // Editing Forms Toggle
  const [activeForm, setActiveForm] = useState<'none' | 'category' | 'guide' | 'user_add' | 'user_password'>('none');
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean; title: string; message: string; onConfirm: () => void}>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });
  
  // Category Form State
  const [catForm, setCatForm] = useState({
    name: '',
    description: '',
    icon: 'HelpCircle'
  });

  // Guide Form State (including Steps)
  const [guideForm, setGuideForm] = useState({
    id: null as number | null,
    title: '',
    description: '',
    difficulty: 'Easy' as 'Easy' | 'Medium' | 'Hard',
    duration: '5 mins',
    is_private: 0 as number,
    image_url: '',
    videos: [] as { title: string; url: string }[],
    steps: [] as Omit<Step, 'guide_id'>[]
  });

  // Load guides whenever the selected category changes
  useEffect(() => {
    if (selectedCategoryId) {
      fetchGuides(selectedCategoryId);
      setSelectedGuide(null);
      setActiveForm('none');
    } else {
      setGuides([]);
    }
  }, [selectedCategoryId]);

  // Load users when token changes
  useEffect(() => {
    if (token && loggedInUser === 'admin') {
      fetchUsers();
    }
  }, [token, loggedInUser]);

  // Force tab to content if logged in user is not admin
  useEffect(() => {
    if (loggedInUser !== 'admin') {
      setPanelTab('content');
    }
  }, [loggedInUser]);

  const fetchUsers = async () => {
    if (!token || loggedInUser !== 'admin') return;
    try {
      const res = await fetch('/api/admin/users', {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const fetchGuides = async (catId: number) => {
    try {
      const res = await fetch(`/api/categories/${catId}/guides`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setGuides(data.guides);
      }
    } catch (err) {
      console.error('Failed to load guides:', err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('admin_username', data.username || username);
        setToken(data.token);
        setLoggedInUser(data.username || username);
        setSuccess('Logged in successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setLoginError(data.error || 'Invalid username or password.');
      }
    } catch (err) {
      setLoginError('Server authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
    setToken(null);
    setLoggedInUser('admin');
    setSelectedCategoryId(null);
    setSelectedGuide(null);
    setActiveForm('none');
  };

  // Auth header wrapper
  const getHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // ==========================================
  // CATEGORY OPERATIONS
  // ==========================================
  const startNewCategory = () => {
    setEditCategoryId(null);
    setCatForm({ name: '', description: '', icon: 'HelpCircle' });
    setActiveForm('category');
    setSelectedGuide(null);
  };

  const startEditCategory = (cat: Category) => {
    setEditCategoryId(cat.id);
    setCatForm({
      name: cat.name,
      description: cat.description,
      icon: cat.icon
    });
    setActiveForm('category');
    setSelectedGuide(null);
  };

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const url = editCategoryId ? `/api/categories/${editCategoryId}` : '/api/categories';
      const method = editCategoryId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(catForm)
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(editCategoryId ? 'Category updated successfully!' : 'Category created successfully!');
        await refreshCategories();
        setActiveForm('none');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to save category');
      }
    } catch (err) {
      setError('Connection error saving category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = (catId: number, catName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Category',
      message: `Are you absolutely sure you want to delete the category "${catName}"?\nThis will permanently delete all associated guides and steps!`,
      onConfirm: async () => {
        setError('');
        try {
          const res = await fetch(`/api/categories/${catId}`, {
            method: 'DELETE',
            headers: getHeaders()
          });
          if (res.ok) {
            setSuccess('Category and its guides deleted!');
            if (selectedCategoryId === catId) {
              setSelectedCategoryId(null);
            }
            await refreshCategories();
            setTimeout(() => setSuccess(''), 3000);
          } else {
            const data = await res.json();
            setError(data.error || 'Failed to delete category');
          }
        } catch (err) {
          setError('Connection error deleting category');
        }
      }
    });
  };

  // ==========================================
  // GUIDE & STEPS OPERATIONS
  // ==========================================
  const startNewGuide = () => {
    if (!selectedCategoryId) return;
    setGuideForm({
      id: null,
      title: '',
      description: '',
      difficulty: 'Easy',
      duration: '5 mins',
      is_private: 0,
      image_url: '',
      videos: [],
      steps: [
        { step_number: 1, title: 'First Step Title', description: 'Describe what the user needs to do in this step.', image_url: IMAGE_PRESETS[0].url, video_url: '' }
      ]
    });
    setActiveForm('guide');
    setSelectedGuide(null);
  };

  const loadGuideForEdit = async (guideId: number) => {
    try {
      const res = await fetch(`/api/guides/${guideId}`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data: GuideWithSteps & { guide: { video_urls?: string } } = await res.json();
        
        let parsedVideos: { title: string; url: string }[] = [];
        if (data.guide.video_urls) {
          try {
            parsedVideos = JSON.parse(data.guide.video_urls);
            if (!Array.isArray(parsedVideos)) {
              parsedVideos = [];
            }
          } catch (e) {
            parsedVideos = [{ title: 'Vidéo de support', url: data.guide.video_urls }];
          }
        }

        setGuideForm({
          id: data.guide.id,
          title: data.guide.title,
          description: data.guide.description,
          difficulty: data.guide.difficulty,
          duration: data.guide.duration,
          is_private: typeof data.guide.is_private === 'number' ? data.guide.is_private : (data.guide.is_private ? 1 : 0),
          image_url: data.guide.image_url || '',
          videos: parsedVideos,
          steps: data.steps
        });
        setActiveForm('guide');
        setSelectedGuide(null);
      }
    } catch (err) {
      setError('Failed to fetch guide details for editing.');
    }
  };

  const handleAddStep = () => {
    const nextNum = guideForm.steps.length + 1;
    // Auto cycle preset images to make adding fast
    const presetImg = IMAGE_PRESETS[(nextNum - 1) % IMAGE_PRESETS.length].url;

    setGuideForm(prev => ({
      ...prev,
      steps: [
        ...prev.steps,
        {
          step_number: nextNum,
          title: `Step ${nextNum} Instructions`,
          description: '',
          image_url: presetImg,
          video_url: ''
        }
      ]
    }));
  };

  const handleRemoveStep = (index: number) => {
    if (guideForm.steps.length <= 1) {
      alert('A guide must have at least one instructional step.');
      return;
    }
    const filtered = guideForm.steps.filter((_, i) => i !== index);
    // Re-index steps to ensure consecutive step_number
    const reindexed = filtered.map((step, idx) => ({
      ...step,
      step_number: idx + 1
    }));
    setGuideForm(prev => ({ ...prev, steps: reindexed }));
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...guideForm.steps];
    if (direction === 'up' && index > 0) {
      [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];
    } else if (direction === 'down' && index < newSteps.length - 1) {
      [newSteps[index + 1], newSteps[index]] = [newSteps[index], newSteps[index + 1]];
    } else {
      return;
    }

    // Re-index
    const reindexed = newSteps.map((step, idx) => ({
      ...step,
      step_number: idx + 1
    }));

    setGuideForm(prev => ({ ...prev, steps: reindexed }));
  };

  const handleStepChange = (index: number, field: string, value: any) => {
    const updated = [...guideForm.steps];
    updated[index] = { ...updated[index], [field]: value };
    setGuideForm(prev => ({ ...prev, steps: updated }));
  };

  const handleLocalImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingIndex(index);
    setError('');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      let data: any = {};
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { error: text || `HTTP ${res.status}: ${res.statusText}` };
      }

      if (res.ok && data.url) {
        handleStepChange(index, 'image_url', data.url);
        setSuccess('Image uploaded successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || `Upload failed with status ${res.status}.`);
      }
    } catch (err: any) {
      console.error('Image upload failed:', err);
      setError(`Failed to process image upload: ${err.message || err}`);
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleLocalVideoUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingVideoIndex(index);
    setError('');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      let data: any = {};
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { error: text || `HTTP ${res.status}: ${res.statusText}` };
      }

      if (res.ok && data.url) {
        handleStepChange(index, 'video_url', data.url);
        setSuccess('Vidéo téléchargée avec succès !');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || `Upload failed with status ${res.status}.`);
      }
    } catch (err: any) {
      console.error('Video upload failed:', err);
      setError(`Erreur lors de l'envoi de la vidéo: ${err.message || err}`);
    } finally {
      setUploadingVideoIndex(null);
    }
  };

  const handleGlobalVideoUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingGlobalVideoIndex(index);
    setError('');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      let data: any = {};
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { error: text || `HTTP ${res.status}: ${res.statusText}` };
      }

      if (res.ok && data.url) {
        const updated = [...guideForm.videos];
        updated[index].url = data.url;
        setGuideForm(prev => ({ ...prev, videos: updated }));
        setSuccess('Vidéo téléchargée avec succès !');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || `Upload failed with status ${res.status}.`);
      }
    } catch (err: any) {
      console.error('Global video upload failed:', err);
      setError(`Erreur lors de l'envoi de la vidéo: ${err.message || err}`);
    } finally {
      setUploadingGlobalVideoIndex(null);
    }
  };

  const handleGuideImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingGuideImage(true);
    setError('');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      let data: any = {};
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { error: text || `HTTP ${res.status}: ${res.statusText}` };
      }

      if (res.ok && data.url) {
        setGuideForm(prev => ({ ...prev, image_url: data.url }));
        setSuccess('Guide image uploaded successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || `Upload failed with status ${res.status}.`);
      }
    } catch (err: any) {
      console.error('Guide image upload failed:', err);
      setError(`Failed to process guide image upload: ${err.message || err}`);
    } finally {
      setUploadingGuideImage(false);
    }
  };

  const saveGuide = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!selectedCategoryId) return;

    try {
      const isEdit = guideForm.id !== null;
      const url = isEdit ? `/api/guides/${guideForm.id}` : `/api/categories/${selectedCategoryId}/guides`;
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        id: guideForm.id,
        title: guideForm.title,
        description: guideForm.description,
        difficulty: guideForm.difficulty,
        duration: guideForm.duration,
        is_private: guideForm.is_private,
        image_url: guideForm.image_url,
        video_urls: JSON.stringify(guideForm.videos),
        steps: guideForm.steps
      };

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(isEdit ? 'Guide updated successfully!' : 'Guide created successfully!');
        await fetchGuides(selectedCategoryId);
        setActiveForm('none');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to save guide');
      }
    } catch (err) {
      setError('Connection error saving guide');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGuide = (guideId: number, guideTitle: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Guide',
      message: `Are you sure you want to permanently delete the guide "${guideTitle}"?\nThis cannot be undone!`,
      onConfirm: async () => {
        setError('');
        try {
          const res = await fetch(`/api/guides/${guideId}`, {
            method: 'DELETE',
            headers: getHeaders()
          });
          if (res.ok) {
            setSuccess('Guide successfully deleted!');
            if (selectedCategoryId) {
              await fetchGuides(selectedCategoryId);
            }
            setTimeout(() => setSuccess(''), 3000);
          } else {
            const data = await res.json();
            setError(data.error || 'Failed to delete guide');
          }
        } catch (err) {
          setError('Connection error deleting guide');
        }
      }
    });
  };

  // ==========================================
  // USER OPERATIONS
  // ==========================================
  const startNewUser = () => {
    setUserForm({ username: '', password: '', role: 'Admin' });
    setActiveForm('user_add');
  };

  const startChangePassword = (userId: number) => {
    setSelectedUserId(userId);
    setNewPassword('');
    setActiveForm('user_password');
  };

  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(userForm)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('User account created successfully!');
        setUserForm({ username: '', password: '', role: 'Admin' });
        await fetchUsers();
        setActiveForm('none');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to create user account');
      }
    } catch (err) {
      setError('Connection error creating user account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const changeUserPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUserId}/password`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ password: newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Password updated successfully!');
        setNewPassword('');
        setActiveForm('none');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to update password');
      }
    } catch (err) {
      setError('Connection error updating password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = (userId: number, uName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete User Account',
      message: `Are you absolutely sure you want to delete the user account "${uName}"?`,
      onConfirm: async () => {
        setError('');
        try {
          const res = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE',
            headers: getHeaders()
          });
          if (res.ok) {
            setSuccess('User account deleted successfully!');
            await fetchUsers();
            if (selectedUserId === userId) {
              setSelectedUserId(null);
              setActiveForm('none');
            }
            setTimeout(() => setSuccess(''), 3000);
          } else {
            const data = await res.json();
            setError(data.error || 'Failed to delete user account');
          }
        } catch (err) {
          setError('Connection error deleting user account');
        }
      }
    });
  };

  // ==========================================
  // LOGIN SCREEN
  // ==========================================
  if (!token) {
    return (
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="admin-login-overlay">
        <div className="bg-white rounded-sm max-w-md w-full border border-slate-200 shadow-xl p-8 relative" id="login-modal-box">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-sm cursor-pointer"
            id="btn-close-login"
          >
            <Icon name="X" size={18} />
          </button>
 
          <div className="flex flex-col items-center text-center mb-6" id="login-header-section">
            <div className="w-12 h-12 bg-slate-50 border border-slate-200 text-slate-700 rounded-sm flex items-center justify-center mb-3 shadow-xs">
              <Icon name="LockKeyhole" size={24} />
            </div>
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider font-mono">Administrator Portal</h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Please authenticate to create, edit, or delete IT documentation manuals.
            </p>
          </div>
 
          <form onSubmit={handleLogin} className="space-y-4" id="login-form">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 font-mono">
                Username
              </label>
              <input
                type="text"
                required
                placeholder="e.g., admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-sm text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500/25 focus:border-blue-500 transition-colors font-mono"
                id="admin-username-input"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 font-mono">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-sm text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500/25 focus:border-blue-500 transition-colors font-mono"
                id="admin-password-input"
              />
            </div>
 
            {loginError && (
              <p className="text-[11px] font-mono text-rose-600 bg-rose-50 border border-rose-150 px-3 py-2 rounded-sm flex items-center gap-1.5" id="login-err-msg">
                <Icon name="AlertTriangle" size={14} />
                {loginError}
              </p>
            )}
 
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              id="btn-login-submit"
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // LOGGED IN ADMIN WORKSPACE
  // ==========================================
  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 md:p-6 z-50 animate-fade-in" id="admin-workspace-overlay">
      <div className="bg-slate-50 rounded-sm w-full h-full max-w-7xl flex flex-col border border-slate-200 shadow-2xl overflow-hidden" id="admin-workspace-box">
        {/* Portal Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-xs" id="workspace-header">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-50 text-slate-700 rounded-sm flex items-center justify-center border border-slate-200 shadow-inner">
              <Icon name="Settings" size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono leading-none">IT Manuals Editor</h2>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider mt-1 uppercase">Logged in as: <strong className="text-blue-500">{loggedInUser}</strong></p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-sm text-xs font-bold font-mono transition-colors cursor-pointer uppercase tracking-wider"
              id="btn-logout"
            >
              <Icon name="LogOut" size={13} />
              Sign Out
            </button>
            <button
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-sm transition-colors cursor-pointer"
              id="btn-workspace-close"
            >
              <Icon name="X" size={16} />
            </button>
          </div>
        </div>

        {/* Global Notifications */}
        {success && (
          <div className="bg-emerald-500 text-white text-xs font-bold px-6 py-2.5 flex items-center gap-2 animate-slide-down font-mono tracking-wide" id="workspace-toast-success">
            <Icon name="CheckCircle2" size={14} />
            {success.toUpperCase()}
          </div>
        )}
        {error && (
          <div className="bg-rose-500 text-white text-xs font-bold px-6 py-2.5 flex items-center gap-2 animate-slide-down font-mono tracking-wide" id="workspace-toast-error">
            <Icon name="AlertTriangle" size={14} />
            {error.toUpperCase()}
          </div>
        )}

        {/* Main Split Layout */}
        <div className="flex-1 flex overflow-hidden" id="workspace-body-split">
          {/* Left Column: Category & Guide Tree or User Accounts */}
          <div className="w-80 border-r border-slate-200 bg-white flex flex-col overflow-y-auto" id="tree-column">
            {/* Tabs for Sidebar selection */}
            {loggedInUser === 'admin' ? (
              <div className="grid grid-cols-2 border-b border-slate-200" id="sidebar-tab-selector">
                <button
                  onClick={() => {
                    setPanelTab('content');
                    setActiveForm('none');
                  }}
                  className={`py-3 text-center text-xs font-bold uppercase font-mono tracking-wider transition-colors cursor-pointer border-b-2 ${
                    panelTab === 'content'
                      ? 'border-blue-500 text-blue-500 bg-slate-50/50'
                      : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50/20'
                  }`}
                >
                  Guides & Cats
                </button>
                <button
                  onClick={() => {
                    setPanelTab('users');
                    setActiveForm('none');
                    fetchUsers();
                  }}
                  className={`py-3 text-center text-xs font-bold uppercase font-mono tracking-wider transition-colors cursor-pointer border-b-2 ${
                    panelTab === 'users'
                      ? 'border-blue-500 text-blue-500 bg-slate-50/50'
                      : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50/20'
                  }`}
                  id="btn-tab-users"
                >
                  Users & Auth
                </button>
              </div>
            ) : (
              <div className="border-b border-slate-200 px-4 py-3 bg-slate-50/50" id="sidebar-tab-selector-single">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Guides & Cats</h3>
              </div>
            )}

            {panelTab === 'content' ? (
              <>
                {/* Category Header */}
                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">IT Categories</h3>
                  <button
                    onClick={startNewCategory}
                    className="p-1 hover:bg-slate-100 text-blue-500 rounded-sm transition-colors cursor-pointer"
                    title="Add New Category"
                    id="btn-add-category"
                  >
                    <Icon name="Plus" size={16} />
                  </button>
                </div>

                {/* Categories List */}
                <div className="p-2 space-y-1" id="admin-categories-list">
                  {categories.map((cat) => {
                    const isSelected = selectedCategoryId === cat.id;
                    return (
                      <div key={cat.id} className="group flex flex-col" id={`cat-tree-item-${cat.id}`}>
                        <div className={`flex items-center justify-between p-2 rounded-sm transition-colors ${
                          isSelected ? 'bg-slate-50 border border-slate-200' : 'hover:bg-slate-50/50'
                        }`}>
                          <button
                            onClick={() => setSelectedCategoryId(cat.id!)}
                            className={`flex-1 text-left flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer uppercase tracking-wider font-mono ${
                              isSelected ? 'text-blue-500' : 'text-slate-700'
                            }`}
                          >
                            <Icon name={cat.icon} className={isSelected ? 'text-blue-500' : 'text-slate-400'} size={15} />
                            <span className="truncate">{cat.name}</span>
                          </button>

                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                            <button
                              onClick={() => startEditCategory(cat)}
                              className="p-1 text-slate-400 hover:text-blue-500 hover:bg-slate-100 rounded-sm cursor-pointer"
                              title="Edit Category Details"
                            >
                              <Icon name="Edit" size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat.id!, cat.name)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-sm cursor-pointer"
                              title="Delete Category"
                            >
                              <Icon name="Trash2" size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Nested Guides if Category is Selected */}
                        {isSelected && (
                          <div className="pl-5 pr-2 py-1 space-y-1 border-l border-slate-200 ml-4 mb-2 animate-fade-in" id={`guides-subtree-${cat.id}`}>
                            <div className="flex items-center justify-between py-1 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                              <span>Guides List</span>
                              <button
                                onClick={startNewGuide}
                                className="text-blue-500 hover:text-blue-600 flex items-center gap-0.5 cursor-pointer uppercase"
                              >
                                <Icon name="Plus" size={10} /> Add
                              </button>
                            </div>

                            {guides.length === 0 ? (
                              <div className="p-2 text-[10px] text-slate-400 italic font-mono">No guides added.</div>
                            ) : (
                              guides.map((guide) => (
                                <div
                                  key={guide.id}
                                  className="group/guide flex items-center justify-between p-1.5 rounded-sm hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                                >
                                  <button
                                    onClick={() => loadGuideForEdit(guide.id)}
                                    className="flex-1 text-left text-xs text-slate-650 hover:text-blue-500 truncate cursor-pointer font-mono flex items-center gap-1.5"
                                  >
                                    {guide.is_private === 1 && (
                                      <span title="Membres IT" className="shrink-0 flex items-center">
                                        <Icon name="Users" size={11} className="text-blue-500 animate-fade-in" />
                                      </span>
                                    )}
                                    {guide.is_private === 2 && (
                                      <span title="Admins Seuls" className="shrink-0 flex items-center">
                                        <Icon name="Lock" size={11} className="text-rose-500 animate-fade-in" />
                                      </span>
                                    )}
                                    <span className="truncate">{guide.title}</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteGuide(guide.id, guide.title)}
                                    className="opacity-0 group-hover/guide:opacity-100 p-0.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-sm cursor-pointer"
                                    title="Delete Guide"
                                  >
                                    <Icon name="Trash2" size={10} />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                {/* Users Header */}
                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Accounts</h3>
                  <button
                    onClick={startNewUser}
                    className="inline-flex items-center gap-1 px-2 py-1 border border-blue-500/25 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-sm text-[10px] font-bold font-mono transition-colors cursor-pointer uppercase tracking-wider"
                    title="Create New User Account"
                    id="btn-add-user"
                  >
                    <Icon name="Plus" size={11} /> Create Account
                  </button>
                </div>

                {/* Users List */}
                <div className="p-2 space-y-1" id="admin-users-list">
                  {users.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 font-mono">No accounts found.</div>
                  ) : (
                    users.map((u) => {
                      const isSelected = selectedUserId === u.id;
                      return (
                        <div
                          key={u.id}
                          className={`group flex items-center justify-between p-2 rounded-sm transition-colors border ${
                            isSelected ? 'bg-slate-50 border-slate-200' : 'border-transparent hover:bg-slate-50/50'
                          }`}
                          id={`user-item-${u.id}`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-500 font-bold text-[10px] uppercase">
                              {u.username.charAt(0)}
                            </div>
                            <div className="truncate">
                              <div className="text-xs font-bold font-mono text-slate-800">{u.username}</div>
                              <div className="text-[9px] font-mono text-slate-400 uppercase">{u.role}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startChangePassword(u.id)}
                              className="p-1 text-slate-400 hover:text-blue-500 hover:bg-slate-100 rounded-sm cursor-pointer transition-colors"
                              title="Change Password"
                            >
                              <Icon name="KeyRound" size={12} />
                            </button>
                            {u.username !== 'admin' && (
                              <button
                                onClick={() => handleDeleteUser(u.id, u.username)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-sm cursor-pointer transition-colors"
                                title="Delete Account"
                              >
                                <Icon name="Trash2" size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>

          {/* Right Column: Dynamic Form Workspace */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-slate-50" id="form-workspace">
            {activeForm === 'category' && (
              <div className="bg-white rounded-sm border border-slate-200 shadow-sm p-6 max-w-2xl mx-auto" id="category-form-card">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-3 mb-6 uppercase tracking-wider font-mono">
                  {editCategoryId ? 'Edit IT Category Details' : 'Create New IT Category'}
                </h3>
                <form onSubmit={saveCategory} className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">
                      Category Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., VPN Tunneling, Office Printers, Windows 11 Support"
                      value={catForm.name}
                      onChange={(e) => setCatForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-2 border border-slate-200 rounded-sm text-xs font-mono bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500/25 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">
                      Helpdesk Description
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Explain to users what type of guides they can find in this section."
                      value={catForm.description}
                      onChange={(e) => setCatForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-2 border border-slate-200 rounded-sm text-xs font-mono bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500/25 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">
                      Visual Icon
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-3" id="icon-picker">
                      {ICON_PRESETS.map((p) => {
                        const isSelected = catForm.icon === p.icon;
                        return (
                          <button
                            key={p.icon}
                            type="button"
                            onClick={() => setCatForm(prev => ({ ...prev, icon: p.icon }))}
                            className={`flex flex-col items-center justify-center p-3 rounded-sm border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50/50 border-blue-500 text-blue-500 shadow-xs'
                                : 'bg-white border-slate-200 text-slate-400 hover:border-slate-350 hover:text-slate-600'
                            }`}
                            title={p.name}
                          >
                            <Icon name={p.icon} size={20} />
                            <span className="text-[10px] font-mono mt-1 text-center truncate w-full uppercase">{p.icon}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setActiveForm('none')}
                      className="px-4 py-2 text-xs font-bold font-mono uppercase tracking-wider text-slate-500 hover:bg-slate-100 rounded-sm transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-sm text-xs font-bold font-mono uppercase tracking-wider shadow-xs transition-colors cursor-pointer"
                    >
                      {isSubmitting ? 'Saving...' : 'Save Category'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeForm === 'guide' && (
              <div className="bg-white rounded-sm border border-slate-200 shadow-sm p-6 max-w-4xl mx-auto" id="guide-form-card">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-3 mb-6 flex items-center justify-between uppercase tracking-wider font-mono">
                  <span>{guideForm.id ? 'Edit IT Guide' : 'Create New IT Guide'}</span>
                  <span className="text-[10px] text-slate-400 font-mono tracking-wider">CATEGORY ID: #{selectedCategoryId}</span>
                </h3>
                
                <form onSubmit={saveGuide} className="space-y-6">
                  {/* Guide Info */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                    <div className="md:col-span-12">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">
                        Guide Title
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Setting up FortiClient VPN, Printing in Color"
                        value={guideForm.title}
                        onChange={(e) => setGuideForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-4 py-2 border border-slate-200 rounded-sm text-xs font-mono bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500/25 focus:border-blue-500"
                      />
                    </div>

                    <div className="md:col-span-12">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">
                        Guide Summary / Subtitle
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Brief details explaining when/how users should follow this procedure."
                        value={guideForm.description}
                        onChange={(e) => setGuideForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-4 py-2 border border-slate-200 rounded-sm text-xs font-mono bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500/25 focus:border-blue-500"
                      />
                    </div>

                    <div className="md:col-span-6">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">
                        Difficulty Classification
                      </label>
                      <select
                        value={guideForm.difficulty}
                        onChange={(e) => setGuideForm(prev => ({ ...prev, difficulty: e.target.value as any }))}
                        className="w-full px-4 py-2 border border-slate-200 rounded-sm text-xs font-mono bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500/25 focus:border-blue-500"
                      >
                        <option value="Easy">Easy (No administrative tools or system access required)</option>
                        <option value="Medium">Medium (Requires specific client keys, MFA, or IP numbers)</option>
                        <option value="Hard">Hard (Requires advanced diagnostics, shell configurations, or setups)</option>
                      </select>
                    </div>

                    <div className="md:col-span-6">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">
                        Estimated Completion Duration
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., 3 mins, 5 mins, 10 mins"
                        value={guideForm.duration}
                        onChange={(e) => setGuideForm(prev => ({ ...prev, duration: e.target.value }))}
                        className="w-full px-4 py-2 border border-slate-200 rounded-sm text-xs font-mono bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500/25 focus:border-blue-500"
                      />
                    </div>

                    {/* Image de couverture du cours */}
                    <div className="md:col-span-12 border border-slate-200 p-5 rounded-sm bg-slate-50/50">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 font-mono">
                        Image de couverture du cours
                      </label>
                      <div className="space-y-4">
                        {/* URL input and File upload */}
                        <div className="flex flex-col md:flex-row gap-3 items-end">
                          <div className="flex-1 min-w-0">
                            <label className="block text-[9px] font-bold text-slate-450 uppercase mb-1 font-mono">
                              URL de l'image de couverture
                            </label>
                            <input
                              type="text"
                              placeholder="https://images.unsplash.com/..."
                              value={guideForm.image_url || ''}
                              onChange={(e) => setGuideForm(prev => ({ ...prev, image_url: e.target.value }))}
                              className="w-full px-4 py-2 border border-slate-200 rounded-sm text-xs font-mono bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500/25 focus:border-blue-500"
                            />
                          </div>
                          <div className="shrink-0 w-full md:w-auto">
                            <label className="block text-[9px] font-bold text-slate-450 uppercase mb-1 font-mono">
                              Ou Téléverser un fichier
                            </label>
                            <label className={`w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-sm border border-slate-200 cursor-pointer transition-colors font-mono ${uploadingGuideImage ? 'opacity-50 pointer-events-none' : ''}`}>
                              <Icon name={uploadingGuideImage ? "Loader" : "UploadCloud"} size={14} className={uploadingGuideImage ? "animate-spin" : ""} />
                              {uploadingGuideImage ? "Envoi..." : "Choisir Fichier"}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleGuideImageUpload}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>

                        {/* Image Presets Selector */}
                        <div>
                          <label className="block text-[9px] font-bold text-slate-450 uppercase mb-2 font-mono">
                            Ou sélectionner une image rapide
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                            {IMAGE_PRESETS.map((preset, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setGuideForm(prev => ({ ...prev, image_url: preset.url }))}
                                className={`group relative aspect-video rounded-sm overflow-hidden border transition-all cursor-pointer ${
                                  guideForm.image_url === preset.url 
                                    ? 'border-blue-500 ring-2 ring-blue-500/10 scale-[1.02]' 
                                    : 'border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <img
                                  src={preset.url}
                                  alt={preset.name}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black/45 flex items-end p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="text-[8px] font-bold text-white truncate w-full font-mono">
                                    {preset.name}
                                  </span>
                                </div>
                                {guideForm.image_url === preset.url && (
                                  <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-0.5 shadow-sm">
                                    <Icon name="Check" size={10} />
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Preview */}
                        {guideForm.image_url && (
                          <div className="mt-2 flex gap-3 items-center p-3 bg-white border border-slate-150 rounded-sm">
                            <div className="w-16 h-12 bg-slate-100 rounded-xs overflow-hidden border border-slate-200 shrink-0">
                              <img
                                src={guideForm.image_url}
                                alt="Cover preview"
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="block text-[9px] font-bold text-slate-450 uppercase font-mono">Aperçu de la couverture</span>
                              <span className="block text-[10px] text-slate-500 truncate font-mono">{guideForm.image_url}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setGuideForm(prev => ({ ...prev, image_url: '' }))}
                              className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer font-mono text-[10px] font-bold uppercase"
                            >
                              Effacer
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="md:col-span-12 border border-slate-200 p-5 rounded-sm bg-slate-50/50">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 font-mono">
                        Niveau d'affichage / Visibilité du cours
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Option 0: Public */}
                        <div 
                          onClick={() => setGuideForm(prev => ({ ...prev, is_private: 0 }))}
                          className={`p-4 border rounded-sm cursor-pointer transition-all flex flex-col justify-between ${
                            guideForm.is_private === 0 
                              ? 'border-emerald-500 bg-emerald-50/20 shadow-xs' 
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className={`p-1 rounded-sm ${guideForm.is_private === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                <Icon name="Globe" size={14} />
                              </div>
                              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide font-mono">Tout le monde</span>
                            </div>
                            <p className="text-slate-500 font-mono text-[10px] leading-relaxed">
                              Disponible publiquement à tous les visiteurs, sans connexion requise.
                            </p>
                          </div>
                          <div className="mt-3 flex justify-end">
                            <span className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                              guideForm.is_private === 0 ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'
                            }`}>
                              {guideForm.is_private === 0 && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                            </span>
                          </div>
                        </div>

                        {/* Option 1: Tech & Admin */}
                        <div 
                          onClick={() => setGuideForm(prev => ({ ...prev, is_private: 1 }))}
                          className={`p-4 border rounded-sm cursor-pointer transition-all flex flex-col justify-between ${
                            guideForm.is_private === 1 
                              ? 'border-blue-500 bg-blue-50/20 shadow-xs' 
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className={`p-1 rounded-sm ${guideForm.is_private === 1 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                                <Icon name="Users" size={14} />
                              </div>
                              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide font-mono">Membres IT</span>
                            </div>
                            <p className="text-slate-500 font-mono text-[10px] leading-relaxed">
                              Visible uniquement pour les techniciens et les administrateurs connectés.
                            </p>
                          </div>
                          <div className="mt-3 flex justify-end">
                            <span className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                              guideForm.is_private === 1 ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
                            }`}>
                              {guideForm.is_private === 1 && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                            </span>
                          </div>
                        </div>

                        {/* Option 2: Admin Only */}
                        <div 
                          onClick={() => setGuideForm(prev => ({ ...prev, is_private: 2 }))}
                          className={`p-4 border rounded-sm cursor-pointer transition-all flex flex-col justify-between ${
                            guideForm.is_private === 2 
                              ? 'border-amber-500 bg-amber-50/20 shadow-xs' 
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className={`p-1 rounded-sm ${guideForm.is_private === 2 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                                <Icon name="Lock" size={14} />
                              </div>
                              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide font-mono">Admins Seuls</span>
                            </div>
                            <p className="text-slate-500 font-mono text-[10px] leading-relaxed">
                              Restreint uniquement aux administrateurs principaux. Invisible aux techniciens.
                            </p>
                          </div>
                          <div className="mt-3 flex justify-end">
                            <span className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                              guideForm.is_private === 2 ? 'border-amber-500 bg-amber-500' : 'border-slate-300'
                            }`}>
                              {guideForm.is_private === 2 && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Support Videos Section */}
                  <div className="border-t border-slate-200 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest font-mono flex items-center gap-1.5">
                        <Icon name="Video" size={14} className="text-blue-500" />
                        Vidéos de support ({guideForm.videos ? guideForm.videos.length : 0})
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          const currentVideos = guideForm.videos || [];
                          setGuideForm(prev => ({
                            ...prev,
                            videos: [...currentVideos, { title: '', url: '' }]
                          }));
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-sm border border-slate-200 transition-colors cursor-pointer uppercase tracking-wider font-mono"
                      >
                        <Icon name="Plus" size={12} /> Ajouter une vidéo
                      </button>
                    </div>

                    {(!guideForm.videos || guideForm.videos.length === 0) ? (
                      <div className="text-center py-6 border border-dashed border-slate-200 rounded-sm bg-slate-50/20 text-slate-400 font-mono text-xs">
                        Aucune vidéo de support associée à ce cours pour le moment.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {guideForm.videos.map((video, idx) => (
                          <div key={idx} className="flex gap-3 items-start bg-slate-50/50 border border-slate-200 p-4 rounded-sm relative">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[9px] font-bold text-slate-450 uppercase mb-1 font-mono">
                                  Titre de la vidéo #{idx + 1}
                                </label>
                                <input
                                  type="text"
                                  required
                                  placeholder="Ex: Démo de configuration"
                                  value={video.title}
                                  onChange={(e) => {
                                    const updated = [...guideForm.videos];
                                    updated[idx].title = e.target.value;
                                    setGuideForm(prev => ({ ...prev, videos: updated }));
                                  }}
                                  className="w-full px-3 py-1.5 border border-slate-200 rounded-sm text-xs font-mono bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500/25 focus:border-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold text-slate-450 uppercase mb-1 font-mono">
                                  URL de la vidéo (YouTube, Vimeo, etc.)
                                </label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    required
                                    placeholder="Ex: https://www.youtube.com/watch?v=..."
                                    value={video.url}
                                    onChange={(e) => {
                                      const updated = [...guideForm.videos];
                                      updated[idx].url = e.target.value;
                                      setGuideForm(prev => ({ ...prev, videos: updated }));
                                    }}
                                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-sm text-xs font-mono bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500/25 focus:border-blue-500"
                                  />
                                  <label className="shrink-0 flex items-center justify-center w-8 h-8 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-sm border border-slate-200 cursor-pointer transition-colors" title="Uploader une vidéo">
                                    {uploadingGlobalVideoIndex === idx ? (
                                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <Icon name="Upload" size={14} />
                                    )}
                                    <input
                                      type="file"
                                      accept="video/*"
                                      className="hidden"
                                      onChange={(e) => handleGlobalVideoUpload(idx, e)}
                                    />
                                  </label>
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = guideForm.videos.filter((_, i) => i !== idx);
                                setGuideForm(prev => ({ ...prev, videos: updated }));
                              }}
                              className="mt-5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 p-1.5 rounded-sm transition-all cursor-pointer shrink-0"
                              title="Supprimer la vidéo"
                            >
                              <Icon name="Trash2" size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Steps Management Title */}
                  <div className="border-t border-slate-200 pt-6">
                      <div className="flex items-center gap-2 mb-4">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest font-mono">
                          Instructional Steps ({guideForm.steps.length})
                        </h4>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleAddStep}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-bold rounded-sm transition-colors cursor-pointer uppercase tracking-wider shadow-xs"
                          >
                            <Icon name="Plus" size={12} /> Add Step
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const nextNum = guideForm.steps.length + 1;
                              setGuideForm(prev => ({
                                ...prev,
                                steps: [
                                  ...prev.steps,
                                  {
                                    step_number: nextNum,
                                    title: 'Vidéo de support',
                                    description: 'Regardez cette vidéo de support.',
                                    image_url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800', // Video-related stock image
                                    video_url: ''
                                  }
                                ]
                              }));
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-bold rounded-sm transition-colors cursor-pointer uppercase tracking-wider shadow-xs"
                          >
                            <Icon name="Video" size={12} /> Add Video Step
                          </button>
                        </div>
                      </div>

                    {/* Step Cards List */}
                    <div className="space-y-6" id="steps-form-list">
                      {guideForm.steps.map((step, idx) => (
                        <div key={idx} className="bg-slate-50/50 rounded-sm p-5 border border-slate-200 relative" id={`step-form-item-${idx}`}>
                          <div className="absolute top-4 right-4 flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveStep(idx, 'up')}
                              disabled={idx === 0}
                              className="text-slate-400 hover:text-blue-600 p-1 rounded-sm hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                              title="Move Up"
                            >
                              <Icon name="ChevronUp" size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveStep(idx, 'down')}
                              disabled={idx === guideForm.steps.length - 1}
                              className="text-slate-400 hover:text-blue-600 p-1 rounded-sm hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                              title="Move Down"
                            >
                              <Icon name="ChevronDown" size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveStep(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-sm hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Remove Step"
                            >
                              <Icon name="Trash2" size={14} />
                            </button>
                          </div>

                          <div className="flex items-center gap-2 mb-4">
                            <span className="w-5 h-5 bg-slate-900 text-white rounded-sm flex items-center justify-center font-mono text-[10px] font-bold">
                              {step.step_number}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold font-mono tracking-widest">STEP CONFIGURATION</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-12">
                              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">
                                Step Action / Heading
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="e.g., Run the setup wizard, Confirm connection"
                                value={step.title}
                                onChange={(e) => handleStepChange(idx, 'title', e.target.value)}
                                className="w-full px-3 py-1.5 border border-slate-200 rounded-sm text-xs font-mono focus:outline-hidden bg-white focus:ring-1 focus:ring-blue-500/25 focus:border-blue-500"
                              />
                            </div>

                            <div className="md:col-span-12">
                              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">
                                Step Walkthrough / Narrative
                              </label>
                              <textarea
                                required
                                rows={3}
                                placeholder="Write clear, actionable instructions explaining what the user needs to click, input, or check."
                                value={step.description}
                                onChange={(e) => handleStepChange(idx, 'description', e.target.value)}
                                className="w-full px-3 py-1.5 border border-slate-200 rounded-sm text-xs font-mono focus:outline-hidden bg-white focus:ring-1 focus:ring-blue-500/25 focus:border-blue-500"
                              />
                            </div>

                            <div className="md:col-span-6">
                              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">
                                Step Image URL (Stock / Intranet / Paste Link)
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="https://images.unsplash.com/..."
                                value={step.image_url}
                                onChange={(e) => handleStepChange(idx, 'image_url', e.target.value)}
                                className="w-full px-3 py-1.5 border border-slate-200 rounded-sm text-xs font-mono focus:outline-hidden bg-white focus:ring-1 focus:ring-blue-500/25 focus:border-blue-500"
                              />
                            </div>

                            <div className="md:col-span-3">
                              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">
                                Local PC Upload
                              </label>
                              <label
                                htmlFor={`file-upload-${idx}`}
                                className={`flex items-center justify-center gap-1.5 w-full py-1.5 border border-dashed rounded-sm text-xs font-mono font-bold cursor-pointer transition-all ${
                                  uploadingIndex === idx
                                    ? 'bg-slate-100 border-slate-300 text-slate-400 cursor-not-allowed'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50/10'
                                }`}
                              >
                                <Icon name="Upload" size={13} />
                                <span>{uploadingIndex === idx ? 'UPLOADING...' : 'CHOOSE PHOTO'}</span>
                              </label>
                              <input
                                id={`file-upload-${idx}`}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={uploadingIndex !== null}
                                onChange={(e) => handleLocalImageUpload(idx, e)}
                              />
                            </div>

                            <div className="md:col-span-3">
                              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">
                                Presets (Optional Click)
                              </label>
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleStepChange(idx, 'image_url', e.target.value);
                                    e.target.value = ''; // Reset dropdown selection state
                                  }
                                }}
                                className="w-full px-3 py-1.5 border border-slate-200 rounded-sm text-xs font-mono focus:outline-hidden bg-white focus:ring-1 focus:ring-blue-500/25 focus:border-blue-500"
                              >
                                <option value="">-- Choose Preset --</option>
                                {IMAGE_PRESETS.map((p) => (
                                  <option key={p.name} value={p.url}>
                                    {p.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="md:col-span-12">
                              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono flex items-center gap-1.5">
                                <Icon name="Video" size={12} className="text-blue-500" />
                                Vidéo de support pour cette étape (Optionnelle - YouTube, Vimeo, direct MP4)
                              </label>
                              <div className="flex gap-2">
                                <div className="relative flex-1">
                                  <input
                                    type="text"
                                    placeholder="Ex: https://www.youtube.com/watch?v=... ou direct .mp4"
                                    value={step.video_url || ''}
                                    onChange={(e) => handleStepChange(idx, 'video_url', e.target.value)}
                                    className="w-full px-3 py-1.5 border border-slate-200 rounded-sm text-xs font-mono focus:outline-hidden bg-white focus:ring-1 focus:ring-blue-500/25 focus:border-blue-500 pr-10"
                                  />
                                  {step.video_url && (
                                    <button
                                      type="button"
                                      onClick={() => handleStepChange(idx, 'video_url', '')}
                                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 transition-colors p-1"
                                      title="Supprimer la vidéo de cette étape"
                                    >
                                      <Icon name="X" size={14} />
                                    </button>
                                  )}
                                </div>
                                <label className="shrink-0 flex items-center justify-center w-8 h-8 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-sm border border-slate-200 cursor-pointer transition-colors" title="Uploader une vidéo">
                                  {uploadingVideoIndex === idx ? (
                                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Icon name="Upload" size={14} />
                                  )}
                                  <input
                                    type="file"
                                    accept="video/*"
                                    className="hidden"
                                    onChange={(e) => handleLocalVideoUpload(idx, e)}
                                  />
                                </label>
                              </div>
                              {guideForm.videos.length > 0 && (
                                <div className="mt-1 flex items-center gap-2">
                                  <span className="text-[9px] font-bold text-slate-400 font-mono uppercase">Assigner du guide :</span>
                                  <div className="flex flex-wrap gap-1">
                                    {guideForm.videos.map((v, vIdx) => (
                                      <button
                                        key={vIdx}
                                        type="button"
                                        onClick={() => handleStepChange(idx, 'video_url', v.url)}
                                        className="px-1.5 py-0.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 rounded-sm text-[8px] font-mono font-bold transition-all"
                                      >
                                        {v.title || `Vidéo ${vIdx + 1}`}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Submission buttons */}
                  <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setActiveForm('none')}
                      className="px-4 py-2 text-xs font-bold font-mono uppercase tracking-wider text-slate-500 hover:bg-slate-100 rounded-sm transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || guideForm.steps.length === 0}
                      className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-sm text-xs font-bold font-mono uppercase tracking-wider shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Saving Guide...' : 'Save Guide & Steps'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeForm === 'user_add' && (
              <div className="bg-white rounded-sm border border-slate-200 shadow-sm p-6 max-w-md mx-auto" id="user-add-form-card">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-3 mb-6 uppercase tracking-wider font-mono">
                  Create User Account
                </h3>
                <form onSubmit={saveUser} className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">
                      Username / Identifiant
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., technician_1, admin_john"
                      value={userForm.username}
                      onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                      className="w-full px-4 py-2 border border-slate-200 rounded-sm text-xs font-mono bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500/25 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">
                      Password / Mot de passe
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Enter password"
                      value={userForm.password}
                      onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-4 py-2 border border-slate-200 rounded-sm text-xs font-mono bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500/25 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">
                      Role
                    </label>
                    <select
                      value={userForm.role}
                      onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full px-4 py-2 border border-slate-200 rounded-sm text-xs font-mono bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500/25 focus:border-blue-500"
                    >
                      <option value="Admin">Administrator (Full Access)</option>
                      <option value="Technician">Technician (Read & Write)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setActiveForm('none')}
                      className="px-4 py-2 text-xs font-bold font-mono uppercase tracking-wider text-slate-500 hover:bg-slate-100 rounded-sm transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-sm text-xs font-bold font-mono uppercase tracking-wider shadow-xs transition-colors cursor-pointer"
                    >
                      {isSubmitting ? 'Creating...' : 'Create Account'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeForm === 'user_password' && (
              <div className="bg-white rounded-sm border border-slate-200 shadow-sm p-6 max-w-md mx-auto" id="user-password-form-card">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-3 mb-6 uppercase tracking-wider font-mono">
                  Change Password
                </h3>
                <form onSubmit={changeUserPassword} className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">
                      Account Username
                    </label>
                    <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs font-mono text-slate-600">
                      {users.find(u => u.id === selectedUserId)?.username || 'Selected Account'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">
                      New Password (Nouveau mot de passe)
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-sm text-xs font-mono bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500/25 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveForm('none');
                        setSelectedUserId(null);
                      }}
                      className="px-4 py-2 text-xs font-bold font-mono uppercase tracking-wider text-slate-500 hover:bg-slate-100 rounded-sm transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-sm text-xs font-bold font-mono uppercase tracking-wider shadow-xs transition-colors cursor-pointer"
                    >
                      {isSubmitting ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeForm === 'none' && (
              <div className="flex flex-col items-center justify-center text-center py-24" id="empty-workspace">
                <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-sm flex items-center justify-center border border-slate-200 shadow-inner mb-4">
                  <Icon name="Settings" size={20} />
                </div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest font-mono">Editor Canvas</h3>
                <p className="text-xs text-slate-400 max-w-xs mt-1.5 leading-relaxed font-mono">
                  Select a category in the left tree. Click nested guides to edit them, or click the <Icon name="Plus" size={11} className="inline mx-0.5 text-blue-500" /> icons to create new items.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Icon name="AlertTriangle" size={16} className="text-amber-500" />
                {confirmDialog.title}
              </h3>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{confirmDialog.message}</p>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                }}
                className="px-4 py-2 text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-sm shadow-sm transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
