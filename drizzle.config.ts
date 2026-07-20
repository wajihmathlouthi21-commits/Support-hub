import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts', 
  out: './drizzle',
  driver: 'libsql', // أو قم بحذف هذا السطر تماماً إذا كنت تستخدم ملف local فقط
  dbCredentials: {
    connectionString: 'sqlite.db'
  }
});
