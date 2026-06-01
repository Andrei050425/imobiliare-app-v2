FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Expunem portul Vite
EXPOSE 5173

# Pornim serverul de dev cu --host ca să fie vizibil din afara containerului
CMD ["npm", "run", "dev", "--", "--host"]