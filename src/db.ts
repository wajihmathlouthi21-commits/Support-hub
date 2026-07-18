import { eq } from 'drizzle-orm';
import { db } from './db/index';
import { categories, guides, steps, users } from './db/schema';

export interface Category {
  id?: number;
  name: string;
  description: string;
  icon: string;
}

export interface Guide {
  id?: number;
  category_id: number;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  duration: string;
  is_private?: number;
  image_url?: string;
  video_urls?: string;
}

export interface Step {
  id?: number;
  guide_id: number;
  step_number: number;
  title: string;
  description: string;
  image_url: string;
  video_url?: string;
}

export interface User {
  id?: number;
  username: string;
  password?: string;
  role?: string;
}

// Ensure the db starts with basic seed data if empty
async function seedDatabase() {
  try {
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length === 0) {
      console.log('Seeding default administrator...');
      await db.insert(users).values({ username: 'admin', password: 'admin123', role: 'Admin' });
    }

    const existingCategories = await db.select().from(categories).limit(1);
    if (existingCategories.length > 0) return; // Already seeded

    console.log('Database is empty. Seeding standard IT Categories and Guides...');

    const [glpiCat] = await db.insert(categories).values({
      name: 'GLPI Helpdesk',
      description: 'Submit support tickets, track active IT incidents, and check system announcements.',
      icon: 'HelpCircle'
    }).returning();

    const [vpnCat] = await db.insert(categories).values({
      name: 'VPN Connections',
      description: 'Configure company VPN software for secure remote work on corporate assets.',
      icon: 'ShieldAlert'
    }).returning();

    const [printerCat] = await db.insert(categories).values({
      name: 'Office Printers',
      description: 'Connect to office multifunction printers, troubleshoot print queues, and configure scanners.',
      icon: 'Printer'
    }).returning();

    const [infraCat] = await db.insert(categories).values({
      name: 'Serveurs & Virtualisation',
      description: 'Documentation interne pour l\'administration des serveurs, hyperviseurs et de l\'infrastructure réseau.',
      icon: 'Server'
    }).returning();

    const [glpiGuide] = await db.insert(guides).values({
      categoryId: glpiCat.id,
      title: 'How to Submit an IT Support Ticket',
      description: 'Step-by-step guide on how to report issues or request hardware in GLPI.',
      difficulty: 'Easy',
      duration: '3 mins'
    }).returning();

    await db.insert(steps).values([
      {
        guideId: glpiGuide.id,
        stepNumber: 1,
        title: 'Access the Helpdesk Portal',
        description: 'Open your preferred web browser and navigate to the GLPI portal address.',
        imageUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=800'
      },
      {
        guideId: glpiGuide.id,
        stepNumber: 2,
        title: 'Create a New Incident Ticket',
        description: 'On the dashboard sidebar, click the "Create a ticket" link.',
        imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800'
      }
    ]);

    const [proxmoxGuide] = await db.insert(guides).values({
      categoryId: infraCat.id,
      title: 'Installation de Proxmox VE',
      description: 'Guide d\'installation complet de l\'hyperviseur Proxmox VE.',
      difficulty: 'Hard',
      duration: '15 mins',
      isPrivate: 1
    }).returning();

    await db.insert(steps).values([
      {
        guideId: proxmoxGuide.id,
        stepNumber: 1,
        title: 'Télécharger l\'ISO de Proxmox VE',
        description: 'Téléchargez la dernière version.',
        imageUrl: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&q=80&w=800'
      }
    ]);
  } catch (err) {
    console.error('Error during database seed:', err);
  }
}

seedDatabase();

// Database Helpers for API routes

export async function getCategories(): Promise<Category[]> {
  return await db.select().from(categories).orderBy(categories.id);
}

export async function getCategoryById(id: number): Promise<Category | null> {
  const result = await db.select().from(categories).where(eq(categories.id, id));
  return result[0] || null;
}

export async function createCategory(name: string, description: string, icon: string): Promise<number> {
  const [res] = await db.insert(categories).values({ name, description, icon }).returning();
  return res.id;
}

export async function updateCategory(id: number, name: string, description: string, icon: string): Promise<void> {
  await db.update(categories).set({ name, description, icon }).where(eq(categories.id, id));
}

export async function deleteCategory(id: number): Promise<void> {
  await db.delete(categories).where(eq(categories.id, id));
}

export async function getGuidesByCategory(categoryId: number): Promise<Guide[]> {
  const result = await db.select().from(guides).where(eq(guides.categoryId, categoryId)).orderBy(guides.id);
  return result.map(g => ({
    id: g.id,
    category_id: g.categoryId,
    title: g.title,
    description: g.description,
    difficulty: g.difficulty as any,
    duration: g.duration,
    is_private: g.isPrivate ?? 0,
    image_url: g.imageUrl ?? undefined,
    video_urls: g.videoUrls ?? undefined
  }));
}

export async function getGuideById(id: number): Promise<Guide | null> {
  const [g] = await db.select().from(guides).where(eq(guides.id, id));
  if (!g) return null;
  return {
    id: g.id,
    category_id: g.categoryId,
    title: g.title,
    description: g.description,
    difficulty: g.difficulty as any,
    duration: g.duration,
    is_private: g.isPrivate ?? 0,
    image_url: g.imageUrl ?? undefined,
    video_urls: g.videoUrls ?? undefined
  };
}

export async function createGuide(categoryId: number, title: string, description: string, difficulty: string, duration: string, is_private: number = 0, image_url: string = '', video_urls: string = ''): Promise<number> {
  const [res] = await db.insert(guides).values({ categoryId, title, description, difficulty, duration, isPrivate: is_private, imageUrl: image_url, videoUrls: video_urls }).returning();
  return res.id;
}

export async function updateGuide(id: number, title: string, description: string, difficulty: string, duration: string, is_private: number = 0, image_url: string = '', video_urls: string = ''): Promise<void> {
  await db.update(guides).set({ title, description, difficulty, duration, isPrivate: is_private, imageUrl: image_url, videoUrls: video_urls }).where(eq(guides.id, id));
}

export async function deleteGuide(id: number): Promise<void> {
  await db.delete(guides).where(eq(guides.id, id));
}

export async function getStepsByGuide(guideId: number): Promise<Step[]> {
  const result = await db.select().from(steps).where(eq(steps.guideId, guideId)).orderBy(steps.stepNumber);
  return result.map(s => ({
    id: s.id,
    guide_id: s.guideId,
    step_number: s.stepNumber,
    title: s.title,
    description: s.description,
    image_url: s.imageUrl,
    video_url: s.videoUrl ?? undefined
  }));
}

export async function createStep(guideId: number, stepNumber: number, title: string, description: string, imageUrl: string, videoUrl: string = ''): Promise<number> {
  const [res] = await db.insert(steps).values({ guideId, stepNumber, title, description, imageUrl, videoUrl }).returning();
  return res.id;
}

export async function deleteStepsByGuide(guideId: number): Promise<void> {
  await db.delete(steps).where(eq(steps.guideId, guideId));
}

// User Operations
export async function getUsers(): Promise<User[]> {
  const result = await db.select({ id: users.id, username: users.username, role: users.role }).from(users).orderBy(users.username);
  return result as User[];
}

export async function getUserById(id: number): Promise<User | null> {
  const [result] = await db.select({ id: users.id, username: users.username, role: users.role }).from(users).where(eq(users.id, id));
  return result as User || null;
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const [result] = await db.select().from(users).where(eq(users.username, username));
  return result as User || null;
}

export async function createUser(username: string, password: string, role: string = 'Admin'): Promise<number> {
  const [res] = await db.insert(users).values({ username, password, role }).returning();
  return res.id;
}

export async function updateUserPassword(id: number, password: string): Promise<void> {
  await db.update(users).set({ password }).where(eq(users.id, id));
}

export async function deleteUser(id: number): Promise<void> {
  await db.delete(users).where(eq(users.id, id));
}


