import Axios, { type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/auth-store'

export const api = Axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (config.headers) {
    config.headers.Accept = 'application/json'
    const token = useAuthStore.getState().auth.accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error),
)
