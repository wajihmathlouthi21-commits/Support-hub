# 1. استخدام نسخة Bun الرسمية والخفيفة
FROM oven/bun:1-alpine

# 2. تحديد مجلد العمل
WORKDIR /app

# 3. نسخ ملفات الحزم وإصدار القفل الخاص بـ Bun
COPY package*.json bun.lock ./

# 4. تثبيت الحزم بسرعة فائقة وبدون مشاكل تجميع
RUN bun install --freeze-lockfile

# 5. نسخ باقي ملفات المشروع
COPY . .

# 6. بناء المشروع (إذا كان يحتوي على خطوة بناء لـ Vite أو React)
RUN bun run build

# 7. تشغيل السيرفر باستخدام Bun مباشرة
CMD ["bun", "run", "server.ts"]
