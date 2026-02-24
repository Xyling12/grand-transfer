FROM node:20-alpine AS builder

WORKDIR /app

# Install openssl for Prisma
RUN apk add --no-cache openssl

# Install dependencies
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm install --legacy-peer-deps

# Copy all source files
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Production image
FROM node:20-alpine AS runner

WORKDIR /app

# Install openssl for Prisma in runtime
RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy built files and necessary modules from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma ./prisma_backup
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/src ./src
COPY --from=builder /app/wait-for-db.sh ./wait-for-db.sh

# Expose port
EXPOSE 3000

# Start app using next
CMD cp -f /app/prisma_backup/schema.prisma /app/prisma/schema.prisma && npx prisma db push --accept-data-loss && npm start
