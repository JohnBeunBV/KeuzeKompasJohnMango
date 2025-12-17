# Build stage
FROM node:20-alpine as build
WORKDIR /app

# Build-time argument
ARG VITE_API_URL
ARG VITE_PEXELS_KEY

# Make it available for Vite
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_PEXELS_KEY=$VITE_PEXELS_KEY


COPY package*.json ./
RUN npm ci
COPY . .

# Build Vue + TS app with the build-time VITE_API_URL
RUN printf "VITE_API_URL=%s\nVITE_PEXELS_KEY=%s\n" \
    "$VITE_API_URL" "$VITE_PEXELS_KEY" > .env.production \
    && npm run build

# Production stage
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 5173
CMD ["nginx", "-g", "daemon off;"]
