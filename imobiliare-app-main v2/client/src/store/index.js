import { createStore } from "vuex";
import api from "../services/api";

export default createStore({
  state: {
    token: localStorage.getItem("token") || "",
    user: JSON.parse(localStorage.getItem("user")) || null,
  },
  getters: {
    isLoggedIn: (state) => !!state.token,
    currentUser: (state) => state.user,
    userRole: (state) => (state.user ? state.user.role : null),
    isAdmin: (state) => state.user && state.user.role === "admin",
    isContabil: (state) => state.user && state.user.role === "contabil",
    isTehnic: (state) => state.user && state.user.role === "tehnic",
    isClient: (state) => state.user && state.user.role === "client",
  },
  mutations: {
    auth_success(state, { token, user }) {
      state.token = token;
      state.user = user;
    },
    logout(state) {
      state.token = "";
      state.user = null;
    },
  },
  actions: {
    async login({ commit }, userCredentials) {
      const response = await api.post("/auth/login", userCredentials);
      const { token, user } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      commit("auth_success", { token, user });
      return response;
    },
    logout({ commit }) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      commit("logout");
    },
    async register(_, userData) {
      return await api.post("/auth/register", userData);
    },
  },
});
