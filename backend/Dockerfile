FROM node:20-alpine

WORKDIR /app

# Copié séparément pour profiter du cache Docker : si seul le code change
# (pas les dépendances), cette étape n'est pas rejouée.
COPY package*.json ./
# npm ci est strict sur la cohérence du lock file, et la version de npm
# embarquée dans l'image de base (plus ancienne que celle utilisée en
# local pour générer package-lock.json) le fait parfois échouer à tort.
RUN npm install -g npm@11 && npm ci --omit=dev

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
