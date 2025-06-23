import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Login
      login: async (email, password, selectedRole) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/login', { email, password });
          const { token, user } = response.data;
          
          if (selectedRole && user.role !== selectedRole) {
            set({ isLoading: false, error: `Role mismatch: your account is a '${user.role}', not '${selectedRole}'.` });
            return { success: false, error: `Role mismatch: your account is a '${user.role}', not '${selectedRole}'.` };
          }
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });

          // Set token in API headers
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          return { success: true };
        } catch (error) {
          const errorMessage = error.response?.data?.error || 'Login failed';
          set({
            isLoading: false,
            error: errorMessage
          });
          return { success: false, error: errorMessage };
        }
      },

      // Register
      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/register', userData);
          const { token, user } = response.data;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });

          // Set token in API headers
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          return { success: true };
        } catch (error) {
          const errorMessage = error.response?.data?.error || 'Registration failed';
          set({
            isLoading: false,
            error: errorMessage
          });
          return { success: false, error: errorMessage };
        }
      },

      // Logout
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
        
        // Remove token from API headers
        delete api.defaults.headers.common['Authorization'];
      },

      // Update user profile
      updateProfile: async (profileData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.put('/auth/profile', profileData);
          const { user } = response.data;
          
          set({
            user,
            isLoading: false,
            error: null
          });
          
          return { success: true };
        } catch (error) {
          const errorMessage = error.response?.data?.error || 'Profile update failed';
          set({
            isLoading: false,
            error: errorMessage
          });
          return { success: false, error: errorMessage };
        }
      },

      // Change password
      changePassword: async (currentPassword, newPassword) => {
        set({ isLoading: true, error: null });
        try {
          await api.put('/auth/change-password', { currentPassword, newPassword });
          
          set({
            isLoading: false,
            error: null
          });
          
          return { success: true };
        } catch (error) {
          const errorMessage = error.response?.data?.error || 'Password change failed';
          set({
            isLoading: false,
            error: errorMessage
          });
          return { success: false, error: errorMessage };
        }
      },

      // Get user profile
      getProfile: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get('/auth/profile');
          const { user } = response.data;
          
          set({
            user,
            isLoading: false,
            error: null
          });
          
          return { success: true };
        } catch (error) {
          const errorMessage = error.response?.data?.error || 'Failed to fetch profile';
          set({
            isLoading: false,
            error: errorMessage
          });
          return { success: false, error: errorMessage };
        }
      },

      // Initialize auth state
      initializeAuth: () => {
        const { token } = get();
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          // Optionally verify token validity here
        }
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

export default useAuthStore; 