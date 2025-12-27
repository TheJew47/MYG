// myg/frontend/src/lib/api.ts

import axios from 'axios';

/**
 * Global API URL from environment variables.
 * Defaults to localhost:8000 for local development.
 * Important: When working with an AWS EC2 backend, ensure NEXT_PUBLIC_API_URL 
 * is set to your EC2 public IP in your .env.local file.
 */
const API_URL = process.env.NODE_ENV === 'production' 
  ? '/backend-api' 
  : 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },

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
  // ADDED: Alias for getProject to fix the TypeScript error in ProjectDetailPage
  getProjectDetails: (id: string | number) => `/api/projects/${id}`,
  updateProject: (id: string | number) => `/api/projects/${id}`,
  deleteProject: (id: string | number) => `/api/projects/${id}`,

  // File Upload Management
  uploadFile: '/api/upload',
  
  // AI Generation Engines (Hugging Face ZeroGPU Calls)
  generateScript: '/api/ai/generate_script', // Qwen-2.5-7B
  generateVoice: '/api/ai/generate_voice',   // Chatterbox TTS
  generateImage: '/api/ai/generate_image',   // Flux-1-Dev
  generateVideo: '/api/ai/generate_video',   // LTX-Video
  
  // Audio & Voice Previews
  audioVoices: '/api/audio/voices',           // List Kokoro voices
  audioPreview: '/api/audio/preview',         // Generate Kokoro preview
  
  // Asset Search (Stock Footage/Images via Pixabay/Pexels)
  searchAssets: '/api/assets/search',
  
  // Task & Video Pipeline Management
  // MODIFIED: Nested structure to match Editor usage (e.g., endpoints.tasks.generate)
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
