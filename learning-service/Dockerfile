# Image de base Node.js
FROM node:18-alpine

# Dossier de travail dans le conteneur
WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances
RUN npm install

# Copie du reste du code source
COPY . .

# Exposer le port de l'application
EXPOSE 8092

# Commande pour démarrer le service
CMD ["node", "index.js"]
