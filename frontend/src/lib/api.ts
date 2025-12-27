// frontend/src/lib/api.ts

import axios from 'axios';

/**
 * Global API URL from environment variables.
 * In production, we use a relative path /backend-api which is proxied 
 * by Vercel to bypass HTTPS/HTTP (Mixed Content) blocks.
 */
const API_URL = process.env.NODE_ENV === 'production' 
  ? '/backend-api' 
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');

/**
 * Standard API instance for JSON requests
 */
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * API instance specifically for file uploads (Multipart/form-data)
 */
export const uploadApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

/**
 * Utility to set the Bearer token for authenticated requests.
 * This ensures the backend can identify the user via Hugging Face or Clerk.
 */
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    uploadApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
    delete uploadApi.defaults.headers.common['Authorization'];
  }
};

/**
 * Endpoint Registry - Absolute source of truth for all routes.
 */
export const endpoints = {
  // Authentication & User Profile
  user: '/api/user',
  
  // Projects CRUD
  getProjects: '/api/projects',               // Fetch all projects
  createProject: '/api/projects',             // Create a new project
  getProject: (id: string | number) => `/api/projects/${id}`,
  getProjectDetails: (id: string | number) => `/api/projects/${id}`,
  updateProject: (id: string | number) => `/api/projects/${id}`,
  deleteProject: (id: string | number) => `/api/projects/${id}`,

  // File Upload Management
  uploadFile: '/api/upload',
  
  // AI Generation Engines
  generateScript: '/api/ai/generate_script',
  generateVoice: '/api/ai/generate_voice',
  generateImage: '/api/ai/generate_image',
  generateVideo: '/api/ai/generate_video',
  
  // Audio & Voice Previews
  audioVoices: '/api/audio/voices',
  audioPreview: '/api/audio/preview',
  
  // Asset Search
  searchAssets: '/api/assets/search',
  
  // Task & Video Pipeline Management
  tasks: {
    generate: '/api/tasks/generate',
    list: '/api/tasks',
    get: (id: string | number) => `/api/tasks/${id}`,
  },
  
  // Legacy Aliases
  createTask: '/api/tasks/generate',
  getTasks: '/api/tasks',
  getTask: (id: string | number) => `/api/tasks/${id}`,
  streamTempFile: (filename: string) => `/api/video/temp/${filename}`,
};

export default api;
