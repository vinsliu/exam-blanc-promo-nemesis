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

# Permet à Docker (et à un orchestrateur type Swarm/Kubernetes) de savoir
# si le conteneur est réellement opérationnel, pas juste "démarré" :
# /api/health renvoie 503 si l'API tourne mais que MongoDB est
# injoignable. `wget` (busybox) est déjà présent dans l'image alpine,
# inutile d'installer curl juste pour ça.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:5000/api/health || exit 1

CMD ["node", "server.js"]
