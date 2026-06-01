# Folosim o versiune ușoară de Node
FROM node:22-alpine

# Setăm folderul de lucru în container
WORKDIR /app

# Copiem fișierele de dependențe
COPY package*.json ./

# Instalăm modulele
RUN npm install

# Copiem tot codul sursă
COPY . .

# Expunem portul
EXPOSE 3000

# Comanda de start
CMD ["npm", "start"]