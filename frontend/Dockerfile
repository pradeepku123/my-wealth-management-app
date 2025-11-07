# Development stage
FROM node:20-alpine as development
WORKDIR /app
COPY wealth-frontend/package*.json ./
RUN npm install
COPY wealth-frontend/ .
EXPOSE 4200
CMD ["npx", "ng", "serve", "--host", "0.0.0.0", "--port", "4200", "--poll", "2000"]

# Production stage
FROM node:20-alpine as build
WORKDIR /app
COPY wealth-frontend/package*.json ./
RUN npm ci
COPY wealth-frontend/ .
RUN npm run build

FROM nginx:alpine as production
COPY --from=build /app/dist/wealth-frontend /usr/share/nginx/html
EXPOSE 80