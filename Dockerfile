# syntax=docker/dockerfile:1

# Stage 1: build frontend
FROM node:22-alpine AS frontend-build
WORKDIR /app
ARG VITE_ADSENSE_CLIENT
ENV VITE_ADSENSE_CLIENT=${VITE_ADSENSE_CLIENT}
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build:frontend

# Stage 2: build backend + generate Prisma client
FROM node:22-alpine AS backend-build
RUN apk add --no-cache openssl
WORKDIR /api
COPY api/package.json api/package-lock.json ./
RUN npm ci
COPY api/prisma ./prisma
COPY api/src ./src
COPY api/tsconfig.json ./
COPY api/start.sh ./
RUN npx prisma generate
RUN npm run build

# Stage 3: production container
FROM node:22-alpine
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
COPY --from=frontend-build /app/dist ./dist
COPY --from=backend-build /api/dist ./api/dist
COPY --from=backend-build /api/node_modules ./api/node_modules
COPY --from=backend-build /api/package.json ./api/package.json
COPY --from=backend-build /api/prisma ./api/prisma
COPY --from=backend-build /api/start.sh ./api/start.sh
RUN chmod +x ./api/start.sh
EXPOSE 3000
WORKDIR /app/api
CMD ["./start.sh"]
