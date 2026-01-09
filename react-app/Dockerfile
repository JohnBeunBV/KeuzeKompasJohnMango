# Build stage
FROM node:20-alpine as build
WORKDIR /app

# Build-time arguments
ARG VITE_API_URL

# Make it available for Vite
ENV VITE_API_URL=$VITE_API_URL

# Install deps
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build app
RUN echo "VITE_API_URL=$VITE_API_URL" > .env.production \
    && npm run build


# Production stage
FROM nginx:stable-alpine

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Fix permissions for non-root nginx user
RUN chown -R nginx:nginx /usr/share/nginx/html \
    && chown -R nginx:nginx /var/cache/nginx \
    && chown -R nginx:nginx /var/run

# Drop root
USER nginx

EXPOSE 5173
CMD ["nginx", "-g", "daemon off;"]
