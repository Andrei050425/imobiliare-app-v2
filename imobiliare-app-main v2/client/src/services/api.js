import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api", // Adresa serverului nostru Express
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor: Înainte de orice request, verificăm dacă avem token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      // Adăugăm header-ul Authorization: Bearer ...
      config.headers.Authorization = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default api;
