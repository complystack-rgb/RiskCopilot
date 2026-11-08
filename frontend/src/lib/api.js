import axios from "axios";

export const SESSION_KEY = "cs_session";

export const api = axios.create({ baseURL: `${process.env.REACT_APP_BACKEND_URL}/api` });

api.interceptors.request.use((cfg) => {
  let token = null;
  try { token = localStorage.getItem(SESSION_KEY); } catch (e) { token = null; }
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (e) => {
    if (e?.response?.status === 401) {
      try {
        if (localStorage.getItem(SESSION_KEY)) {
          localStorage.removeItem(SESSION_KEY);
          window.location.reload();
        }
      } catch (err) { /* storage unavailable */ }
    }
    return Promise.reject(e);
  },
);

export const errMsg = (e) => e?.response?.data?.detail || e?.message || "Something went wrong";
