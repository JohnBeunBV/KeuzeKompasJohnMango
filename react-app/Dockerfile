# syntax=docker/dockerfile:1

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/go/dockerfile-reference/

# Want to help us make this template better? Share your feedback here: https://forms.gle/ybq9Krt8jtBL3iCk7

ARG NODE_VERSION=22.19.0
ARG VITE_API_URL

# Builder image
FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /src/app
COPY package*.json ./
RUN npm ci
COPY . .
# Ensure Vite picks up the API URL during build
RUN echo "VITE_API_URL=${VITE_API_URL}" > .env.production \
    && npm run build

# Production stage serving static assets via nginx
FROM nginx:stable-alpine AS final
COPY --from=build /src/app/dist /usr/share/nginx/html
# If you have a custom nginx.conf next to this Dockerfile, keep this copy; otherwise remove.
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 5173
CMD ["nginx", "-g", "daemon off;"]