# Build stage
FROM node:20-alpine as build
WORKDIR /app

# Build-time argument
ARG VITE_API_URL
ARG VITE_PEXELS_KEY
ARG VITE_MICROSOFT_CLIENT_ID
ARG VITE_MICROSOFT_TENANT_ID

# Build-time env for Vite
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_PEXELS_KEY=$VITE_PEXELS_KEY
ENV VITE_MICROSOFT_CLIENT_ID=$VITE_MICROSOFT_CLIENT_ID
ENV VITE_MICROSOFT_TENANT_ID=$VITE_MICROSOFT_TENANT_ID

# Copy only package files first
COPY package*.json ./
RUN npm ci

# Copy rest of the source code
COPY . .

# Create production env file and build
RUN printf "VITE_API_URL=%s\nVITE_PEXELS_KEY=%s\nVITE_MICROSOFT_CLIENT_ID=%s\nVITE_MICROSOFT_TENANT_ID=%s\n" \
    "$VITE_API_URL" "$VITE_PEXELS_KEY" "$VITE_MICROSOFT_CLIENT_ID" "VITE_MICROSOFT_TENANT_ID"> .env.production \
    && npm run build

# Production stage
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 5173
CMD ["nginx", "-g", "daemon off;"]
