FROM node:20-bookworm-slim

# Install OpenSSL for Prisma and CA certificates for requests
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the Next.js application
RUN npm run build

# Expose the standard Next.js port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production
ENV PORT=3000

# Start the application (Next.js + Bot + Prisma push)
CMD ["npm", "run", "start"]
