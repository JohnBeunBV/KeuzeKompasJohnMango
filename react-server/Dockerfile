# syntax=docker/dockerfile:1

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/go/dockerfile-reference/

# Want to help us make this template better? Share your feedback here: https://forms.gle/ybq9Krt8jtBL3iCk7

ARG NODE_VERSION=22.19.0

# Base image for all stages.
FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /src/app

################################################################################
# Install production dependencies (cached).
FROM base AS deps
COPY package*.json ./
RUN npm ci --omit=dev

################################################################################
# Build stage with dev dependencies for TypeScript.
FROM base AS build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

################################################################################
# Runtime stage with minimal footprint.
FROM base AS final
ENV NODE_ENV=production
WORKDIR /src/app

# Copy production deps and compiled output.
COPY --from=deps /src/app/node_modules ./node_modules
COPY --from=build /src/app/dist ./dist
COPY package*.json ./

USER node
EXPOSE 5000
CMD ["node","dist/server.js"]
