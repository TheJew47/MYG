import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const uploadApi = axios.create({
  baseURL: API_URL,
});

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
  
  tasks: {
      generate: '/api/tasks/generate',
      list: '/api/tasks'
  },
  createTask: '/api/tasks/generate',
  
  // AI Generation Endpoints
  generateImage: '/api/ai/generate_image',
  generateVideo: '/api/ai/generate_video',

  uploadFile: '/api/upload', 
  getVoices: '/api/audio/voices',
  searchAssets: '/api/assets/search',
  previewAudio: '/api/audio/preview'
};