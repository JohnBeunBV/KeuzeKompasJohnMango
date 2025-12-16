# Build stage
FROM node:20-alpine as build
WORKDIR /app

# Build-time argument
ARG VITE_API_URL

# Make it available for Vite
ENV VITE_API_URL=$VITE_API_URL


COPY package*.json ./
RUN npm ci
COPY . .

# Build Vue + TS app with the build-time VITE_API_URL
RUN echo "VITE_API_URL=$VITE_API_URL" > .env.production \
    && npm run build


# Production stage
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
