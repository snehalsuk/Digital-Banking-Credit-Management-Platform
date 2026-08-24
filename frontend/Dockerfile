# --- Build stage -------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Baked in at build time (Vite inlines import.meta.env.* into the bundle).
# Defaults to a same-origin relative path, which the nginx run stage's
# location /api/ block reverse-proxies to the backend service — override at
# build time only if the frontend is served from a different origin than the
# backend it talks to.
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npx tsc -b && npx vite build

# --- Run stage -----------------------------------------------------------------
FROM nginx:1.27-alpine AS run

COPY --from=build /build/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
