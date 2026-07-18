import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getGuidesByCategory,
  getGuideById,
  createGuide,
  updateGuide,
  deleteGuide,
  getStepsByGuide,
  createStep,
  deleteStepsByGuide,
  getUsers,
  getUserById,
  getUserByUsername,
  createUser,
  updateUserPassword,
  deleteUser
} from './src/db.js';

const app = express();
const PORT = 3000;

// Enable JSON parse middleware
app.use(express.json({ limit: '100mb' }));

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${Date.now()}-${baseName}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Serve uploaded images and videos statically
app.use('/uploads', express.static(uploadsDir));

// Admin Password from environment or standard fallback
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const EXPECTED_TOKEN = Buffer.from(ADMIN_PASSWORD).toString('base64');

// Auth middleware to secure administrative writing endpoints
async function checkAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No authentication token provided.' });
  }
  const token = authHeader.split(' ')[1];
  if (token === EXPECTED_TOKEN) {
    return next();
  }
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length >= 2) {
      const username = parts[0];
      const password = parts.slice(1).join(':');
      const user = await getUserByUsername(username);
      if (user && user.password === password) {
        return next();
      }
    }
  } catch (err) {}
  return res.status(403).json({ error: 'Invalid admin token.' });
}

// Super admin middleware (only permits the primary 'admin' account)
async function checkSuperAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No authentication token provided.' });
  }
  const token = authHeader.split(' ')[1];
  if (token === EXPECTED_TOKEN) {
    return next();
  }
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length >= 2) {
      const username = parts[0];
      const password = parts.slice(1).join(':');
      if (username === 'admin') {
        const user = await getUserByUsername(username);
        if (user && user.password === password) {
          return next();
        }
      }
    }
  } catch (err) {}
  return res.status(403).json({ error: 'Access denied. Only the primary administrator "admin" is authorized to manage user accounts.' });
}

// Helper to check the role of the authenticated requester
async function getAuthUserRole(req: express.Request): Promise<'Admin' | 'Technician' | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  if (token === EXPECTED_TOKEN) {
    return 'Admin';
  }
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length >= 2) {
      const username = parts[0];
      const password = parts.slice(1).join(':');
      if (username === 'admin') {
        const user = await getUserByUsername('admin');
        if (user && user.password === password) {
          return 'Admin';
        }
      }
      const user = await getUserByUsername(username);
      if (user && user.password === password) {
        return user.role === 'Admin' ? 'Admin' : 'Technician';
      }
    }
  } catch (err) {}
  return null;
}

// Helper to check if a user role can access a guide based on its privacy level
function hasAccessToGuide(isPrivate: number | undefined, role: 'Admin' | 'Technician' | null): boolean {
  const priv = isPrivate || 0;
  if (priv === 0) return true; // Everyone / Public
  if (priv === 1) return role === 'Admin' || role === 'Technician'; // Tech & Admin
  if (priv === 2) return role === 'Admin'; // Admin only
  return false;
}

// ==========================================
// PUBLIC API ENDPOINTS (User Side)
// ==========================================

// 1. Get all categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await getCategories();
    const role = await getAuthUserRole(req);
    
    // Show categories that contain at least one guide that the user has access to
    // Admins can see all categories, even empty ones.
    const filteredCategories = [];
    for (const cat of categories) {
      if (role === 'Admin') {
        filteredCategories.push(cat);
        continue;
      }
      
      const guides = await getGuidesByCategory(cat.id!);
      const accessibleGuides = guides.filter(g => hasAccessToGuide(g.is_private, role));
      if (accessibleGuides.length > 0) {
        filteredCategories.push(cat);
      }
    }
    res.json(filteredCategories);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch categories: ' + error.message });
  }
});

// 2. Get all guides under a specific category
app.get('/api/categories/:categoryId/guides', async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId, 10);
    const category = await getCategoryById(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    const guides = await getGuidesByCategory(categoryId);
    const role = await getAuthUserRole(req);
    
    // Filter guides based on privacy and the user's role
    const filteredGuides = guides.filter(g => hasAccessToGuide(g.is_private, role));
    
    res.json({ category, guides: filteredGuides });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch guides: ' + error.message });
  }
});

// 3. Get full details of a single guide (including its steps)
app.get('/api/guides/:guideId', async (req, res) => {
  try {
    const guideId = parseInt(req.params.guideId, 10);
    const guide = await getGuideById(guideId);
    if (!guide) {
      return res.status(404).json({ error: 'Guide not found' });
    }
    
    const role = await getAuthUserRole(req);
    if (!hasAccessToGuide(guide.is_private, role)) {
      return res.status(403).json({ error: 'Accès refusé. Ce guide est restreint selon votre niveau d\'habilitation.' });
    }
    
    const steps = await getStepsByGuide(guideId);
    res.json({ guide, steps });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch guide details: ' + error.message });
  }
});

// ==========================================
// ADMIN API ENDPOINTS (Admin Side - Secured)
// ==========================================

// 4. Admin login
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username) {
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }
    if (password === ADMIN_PASSWORD) {
      return res.json({ success: true, token: EXPECTED_TOKEN, username: 'admin' });
    }
    try {
      const user = await getUserByUsername('admin');
      if (user && user.password === password) {
        const token = Buffer.from(`admin:${password}`).toString('base64');
        return res.json({ success: true, token, username: 'admin' });
      }
    } catch (err) {}
    return res.status(401).json({ error: 'Incorrect administrator password' });
  }

  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  try {
    const user = await getUserByUsername(username);
    if (user && user.password === password) {
      const token = Buffer.from(`${username}:${password}`).toString('base64');
      return res.json({ success: true, token, username });
    }
    res.status(401).json({ error: 'Incorrect username or password' });
  } catch (error: any) {
    res.status(500).json({ error: 'Login failed: ' + error.message });
  }
});

// 5. Verify existing admin token
app.post('/api/admin/verify', async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(401).json({ valid: false });
  }
  if (token === EXPECTED_TOKEN) {
    return res.json({ valid: true, username: 'admin' });
  }
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length >= 2) {
      const username = parts[0];
      const password = parts.slice(1).join(':');
      const user = await getUserByUsername(username);
      if (user && user.password === password) {
        return res.json({ valid: true, username });
      }
    }
  } catch (err) {}
  res.status(401).json({ valid: false });
});

// ==========================================
// USER ACCOUNTS MANAGEMENT (Secured)
// ==========================================

// Get all user accounts
app.get('/api/admin/users', checkSuperAdminAuth, async (req, res) => {
  try {
    const users = await getUsers();
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch users: ' + error.message });
  }
});

// Create a new user account
app.post('/api/admin/users', checkSuperAdminAuth, async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  try {
    const existing = await getUserByUsername(username);
    if (existing) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    const userId = await createUser(username, password, role || 'Admin');
    res.json({ success: true, userId, username });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create user: ' + error.message });
  }
});

// Change a user's password
app.put('/api/admin/users/:id/password', checkSuperAdminAuth, async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'New password is required' });
  }
  try {
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User account not found' });
    }
    await updateUserPassword(userId, password);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update password: ' + error.message });
  }
});

// Delete a user account
app.delete('/api/admin/users/:id', checkSuperAdminAuth, async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  try {
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User account not found' });
    }
    if (user.username === 'admin') {
      return res.status(400).json({ error: 'The primary admin account cannot be deleted.' });
    }
    await deleteUser(userId);
    res.json({ success: true, message: 'User account deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete user: ' + error.message });
  }
});

// 5b. Upload local file (image or video) from PC
app.post('/api/upload', checkAdminAuth, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  res.json({ url: `/uploads/${req.file.filename}` });
});

// 6. Create category
app.post('/api/categories', checkAdminAuth, async (req, res) => {
  const { name, description, icon } = req.body;
  if (!name || !description || !icon) {
    return res.status(400).json({ error: 'Category name, description, and icon are required' });
  }
  try {
    const newId = await createCategory(name, description, icon);
    res.status(201).json({ id: newId, name, description, icon });
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed') || error.message.includes('unique constraint')) {
      return res.status(400).json({ error: 'A category with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to create category: ' + error.message });
  }
});

// 7. Update category
app.put('/api/categories/:id', checkAdminAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, description, icon } = req.body;
  if (!name || !description || !icon) {
    return res.status(400).json({ error: 'Category name, description, and icon are required' });
  }
  try {
    const category = await getCategoryById(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    await updateCategory(id, name, description, icon);
    res.json({ id, name, description, icon });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update category: ' + error.message });
  }
});

// 8. Delete category
app.delete('/api/categories/:id', checkAdminAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const category = await getCategoryById(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    await deleteCategory(id);
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete category: ' + error.message });
  }
});

// 9. Create guide (including all of its steps)
app.post('/api/categories/:categoryId/guides', checkAdminAuth, async (req, res) => {
  const categoryId = parseInt(req.params.categoryId, 10);
  const { title, description, difficulty, duration, steps, is_private, image_url, video_urls } = req.body;

  if (!title || !description || !difficulty || !duration || !Array.isArray(steps) || steps.length === 0) {
    return res.status(400).json({ error: 'Title, description, difficulty, duration, and steps are required' });
  }

  try {
    const category = await getCategoryById(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const isPrivateVal = typeof is_private === 'number' ? is_private : (is_private ? 1 : 0);

    // Insert guide
    const guideId = await createGuide(categoryId, title, description, difficulty, duration, isPrivateVal, image_url || '', video_urls || '');

    // Insert all steps
    for (const step of steps) {
      await createStep(
        guideId,
        step.step_number,
        step.title,
        step.description,
        step.image_url || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=800',
        step.video_url || ''
      );
    }

    res.status(201).json({ success: true, id: guideId });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create guide: ' + error.message });
  }
});

// 10. Update guide (and its steps)
app.put('/api/guides/:id', checkAdminAuth, async (req, res) => {
  const guideId = parseInt(req.params.id, 10);
  const { title, description, difficulty, duration, steps, is_private, image_url, video_urls } = req.body;

  if (!title || !description || !difficulty || !duration || !Array.isArray(steps) || steps.length === 0) {
    return res.status(400).json({ error: 'Title, description, difficulty, duration, and steps are required' });
  }

  try {
    const guide = await getGuideById(guideId);
    if (!guide) {
      return res.status(404).json({ error: 'Guide not found' });
    }

    const isPrivateVal = typeof is_private === 'number' ? is_private : (is_private ? 1 : 0);

    // Update main guide details
    await updateGuide(guideId, title, description, difficulty, duration, isPrivateVal, image_url || '', video_urls || '');

    // Delete existing steps and recreate them to prevent mismatches
    await deleteStepsByGuide(guideId);
    for (const step of steps) {
      await createStep(
        guideId,
        step.step_number,
        step.title,
        step.description,
        step.image_url || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=800',
        step.video_url || ''
      );
    }

    res.json({ success: true, message: 'Guide updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update guide: ' + error.message });
  }
});

// 11. Delete guide
app.delete('/api/guides/:id', checkAdminAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const guide = await getGuideById(id);
    if (!guide) {
      return res.status(404).json({ error: 'Guide not found' });
    }
    await deleteGuide(id);
    res.json({ success: true, message: 'Guide deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete guide: ' + error.message });
  }
});

// ==========================================
// VITE CLIENT DEV/PROD MIDDLEWARE INTERACTION
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware registered (Development Mode)');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving production build from:', distPath);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server successfully started on http://0.0.0.0:${PORT}`);
  });
}

startServer();
