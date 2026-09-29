import axios from 'axios';
const api=axios.create({baseURL:import.meta.env.VITE_API_URL||'http://localhost:8080/api'});
api.interceptors.request.use(c=>{const t=localStorage.getItem('smartserve_token');if(t)c.headers.Authorization=`Bearer ${t}`;return c});
api.interceptors.response.use(r=>r,e=>{if(e.response?.status===401){localStorage.removeItem('smartserve_token');localStorage.removeItem('smartserve_user');window.location.reload();}return Promise.reject(e)});
export default api;
