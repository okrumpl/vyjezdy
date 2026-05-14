# Fáze 1: Sestavení (Build)
FROM node:20-alpine as build-stage
WORKDIR /app

# Nejprve zkopírujeme pouze package soubory a nainstalujeme závislosti
COPY package*.json ./
RUN npm install

# Poté zkopírujeme zbytek projektu
COPY . .

# Spustíme produkční build (zkompiluje TypeScript do složky /dist)
RUN npm run build

# Fáze 2: Produkční běhové prostředí (Nginx)
FROM nginx:alpine as production-stage

# Zkopírujeme naši vlastní Nginx konfiguraci
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Přesuneme zkompilované statické soubory z build fáze do Nginx složky
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Vystavíme port 80
EXPOSE 80

# Spustíme Nginx
CMD ["nginx", "-g", "daemon off;"]
