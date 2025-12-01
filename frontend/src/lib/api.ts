import axios from 'axios';

// Use the environment variable, falling back to localhost:8000 for local development/docker-compose.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// 1. Standard JSON API
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. NEW: File Upload API (Multipart)
export const uploadApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Update tokens for BOTH instances
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    uploadApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
    delete uploadApi.defaults.headers.common['Authorization'];
  }
};

export const endpoints = {
  getProjects: '/api/projects',
  createProject: '/api/projects',
  getProjectDetails: (id: string) => `/api/projects/${id}`,
  createTask: '/api/tasks/generate',
  uploadFile: '/api/upload', 
  getVoices: '/api/audio/voices',
  previewAudio: '/api/audio/preview'
};
