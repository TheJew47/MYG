// frontend/src/lib/api.ts
import axios from 'axios';
import { createBrowserClient } from '@supabase/ssr';

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Point this exactly to the 'source' path in next.config.js
const baseURL = '/api_backend';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const uploadApi = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

const authInterceptor = async (config: any) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch (error) {
    console.error("Auth Interceptor Error:", error);
  }
  return config;
};

api.interceptors.request.use(authInterceptor);
uploadApi.interceptors.request.use(authInterceptor);

export const endpoints = {
  getProjects: '/projects',
  createProject: '/projects',
  getProjectDetails: (id: string) => `/projects/${id}`,
  updateProject: (id: string) => `/projects/${id}`,
  deleteProject: (id: string) => `/projects/${id}`,
  uploadFile: '/upload', 
  createTask: '/tasks',
  // FIXED: Changed hyphen to underscore to match backend/app/main.py
  generateScript: '/ai/generate_script', 
  tasks: {
    get: (id: string) => `/tasks/${id}`,
    generate: '/tasks/generate',
  }
};

export default api;
