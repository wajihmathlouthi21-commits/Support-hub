FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the application (Vite client + Express server)
RUN npm run build

# Expose the port
EXPOSE 3000

# Start the application and push DB schema first
CMD ["sh", "-c", "npm run db:push && npm start"]
