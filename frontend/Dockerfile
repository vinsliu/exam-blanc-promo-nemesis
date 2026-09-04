# Étape 1 : build de l'application React (nécessite Node, inutile à l'exécution)
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
# npm ci est strict sur la cohérence du lock file, et la version de npm
# embarquée dans l'image de base (plus ancienne que celle utilisée en
# local pour générer package-lock.json) le fait parfois échouer à tort.
RUN npm install -g npm@11 && npm ci

COPY . .

# Injectée au build : CRA fige process.env.REACT_APP_API_URL dans le bundle
# statique généré, il n'y a plus de "serveur Node" ensuite pour la lire.
ARG REACT_APP_API_URL=http://localhost:5000/api
ENV REACT_APP_API_URL=$REACT_APP_API_URL

RUN npm run build

# Étape 2 : image finale, juste un serveur statique pour les fichiers buildés
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
