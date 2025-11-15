FROM node:18-alpine

WORKDIR /app

# Copiar package.json primero para cachear dependencias
COPY package*.json ./
RUN npm install

# Copiar el resto del código
COPY . .

# Exponer puerto
EXPOSE 3000

# Comando para desarrollo (cambiar a "npm start" para producción)
CMD ["npm", "run", "dev"]