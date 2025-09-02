# Use Node 22 LTS
FROM node:22

WORKDIR /app

# Install dependencies separately for caching
COPY package.json package-lock.json ./
RUN npm install

# Copy the source code
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Enable hot reload inside Docker
ENV CHOKIDAR_USEPOLLING=true
ENV WATCHPACK_POLLING=true

# Start Vite dev server
CMD ["npm", "run", "dev"]
