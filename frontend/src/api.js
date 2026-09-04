import axios from 'axios';

// URL de l'API injectée au build (voir Dockerfile / docker-compose.yml,
// variable REACT_APP_API_URL) pour pouvoir cibler dev/préprod/prod sans
// changer le code. CRA n'inclut que les variables préfixées REACT_APP_ et
// les fige dans le bundle au moment du `npm run build`.
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

export default api;
