import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('intellihire_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('intellihire_token');
      localStorage.removeItem('intellihire_user');
      // Only redirect if not already on login/signup page
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ───────────────────────────────────────────────
export const authAPI = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  register: (username, email, password) =>
    api.post('/auth/register', { username, email, password }),

  sendOtp: (email) =>
    api.post('/auth/send-otp', { email }),

  verifyOtp: (email, otp) =>
    api.post('/auth/verify-otp', { email, otp }),

  forgotPassword: (email) =>
    api.post('/auth/forgot-password', { email }),

  updateProfile: (username, full_name) =>
    api.put('/auth/profile', { username, full_name }),

  changePassword: (currentPassword, newPassword) =>
    api.post('/auth/change-password', { current_password: currentPassword, new_password: newPassword }),
};

// ─── Interview ──────────────────────────────────────────
export const interviewAPI = {
  getDomains: () =>
    api.get('/interview/domains'),

  getCompanies: () =>
    api.get('/interview/companies'),

  startInterview: (setupData) =>
    api.post('/interview/start', setupData),

  submitAnswer: (sessionId, answerData) =>
    api.post(`/interview/session/${sessionId}/answer`, answerData),

  submitAudioAnswer: (sessionId, formData) =>
    api.post(`/interview/session/${sessionId}/answer`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  submitVideoAnswer: (sessionId, formData) =>
    api.post(`/interview/session/${sessionId}/answer`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  startVideoSession: (sessionId) =>
    api.post(`/video/session/${sessionId}/start`),

  sendVideoFrame: (sessionId, formData) =>
    api.post(`/video/session/${sessionId}/frame`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  stopVideoSession: (sessionId, data = {}) =>
    api.post(`/video/session/${sessionId}/stop`, data),

  completeInterview: (sessionId) =>
    api.post(`/interview/session/${sessionId}/complete`),

  getSessions: () =>
    api.get('/interview/sessions'),

  getSessionDetail: (sessionId) =>
    api.get(`/interview/session/${sessionId}`),
};

// ─── Report ─────────────────────────────────────────────
export const reportAPI = {
  getReport: (sessionId) =>
    api.get(`/report/${sessionId}`),

  downloadPDF: (sessionId) =>
    api.get(`/report/${sessionId}/pdf`, { responseType: 'blob' }),
};

// ─── Personalized Interview ─────────────────────────────
export const personalizedAPI = {
  uploadAndGenerate: (formData) =>
    api.post('/personalized/upload-and-generate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  textGenerate: (setupData) =>
    api.post('/personalized/text-generate', setupData),
};

export default api;
