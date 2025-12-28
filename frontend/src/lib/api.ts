// frontend/src/lib/api.ts
import axios from 'axios';
import { createBrowserClient } from '@supabase/ssr';

// Export supabase for use in client components
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Standard API instance
export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dedicated instance for file uploads
export const uploadApi = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Shared interceptor to attach Supabase JWT to every request
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

// Centralized API endpoints
export const endpoints = {
  getProjects: '/projects',
  createProject: '/projects',
  getProjectDetails: (id: string) => `/projects/${id}`,
  updateProject: (id: string) => `/projects/${id}`,
  deleteProject: (id: string) => `/projects/${id}`,
  uploadFile: '/upload', 
  createTask: '/tasks',
  // ADDED: Missing endpoint for AI script generation
  generateScript: '/ai/generate-script',
  tasks: {
    get: (id: string) => `/tasks/${id}`,
    generate: '/tasks/generate',
  }
};

export default api;
