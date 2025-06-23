import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-storage') 
      ? JSON.parse(localStorage.getItem('auth-storage')).state?.token 
      : null;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
  getStats: () => api.get('/auth/stats'),
  createTeacher: (teacherData) => api.post('/auth/admin/create-teacher', teacherData),
};

// Problems API
export const problemsAPI = {
  getAll: (params) => api.get('/problems', { params }),
  getById: (id) => api.get(`/problems/${id}`),
  submit: (id, submission) => api.post(`/problems/${id}/submit`, submission),
  getSubmissionStatus: (problemId, submissionId) => 
    api.get(`/problems/${problemId}/submission/${submissionId}`),
  getCategories: () => api.get('/problems/categories/list'),
  getStats: () => api.get('/problems/stats/overview'),
  // Admin: Create new problem
  create: (problemData) => api.post('/problems', problemData),
  // Admin: Update problem
  update: (id, problemData) => api.put(`/problems/${id}`, problemData),
  // Run sample input/output
  runSample: (problemId, data) => api.post(`/submissions/run-sample`, { problemId, ...data }),
};

// Submissions API
export const submissionsAPI = {
  getAll: (params) => api.get('/submissions', { params }),
  getById: (id) => api.get(`/submissions/${id}`),
  getStats: () => api.get('/submissions/stats/user'),
  getRecent: (limit) => api.get('/submissions/recent/dashboard', { params: { limit } }),
  getByProblem: (problemId, params) => 
    api.get(`/submissions/problem/${problemId}`, { params }),
  getAnalytics: (days) => 
    api.get('/submissions/analytics/overview', { params: { days } }),
};

// Leaderboard API
export const leaderboardAPI = {
  getGlobal: (params) => api.get('/leaderboard', { params }),
  getByCategory: (category, params) => 
    api.get(`/leaderboard/category/${category}`, { params }),
  getByDifficulty: (difficulty, params) => 
    api.get(`/leaderboard/difficulty/${difficulty}`, { params }),
  getUserRanking: (userId) => api.get(`/leaderboard/user/${userId}`),
  getByLanguage: (language, params) => 
    api.get(`/leaderboard/language/${language}`, { params }),
  getStats: () => api.get('/leaderboard/stats/overview'),
};

export default api; 