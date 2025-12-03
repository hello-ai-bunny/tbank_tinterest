import axios from "axios";

const http = axios.create({
    baseURL: "http://localhost:8000"
});

http.interceptors.request.use((config) => {
    try {
        const raw = localStorage.getItem('authUser');
        if (!raw) return config;

        const data = JSON.parse(raw);
        const token = data?.access_token;
        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch { }
    return config;
});

export default http;
