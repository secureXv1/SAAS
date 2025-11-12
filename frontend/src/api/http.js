import axios from 'axios'
import { useAuth } from '@/stores/auth'

const http = axios.create({
  baseURL: '/api',
  withCredentials: false
})

http.interceptors.request.use(config => {
  try {
    const auth = useAuth()
    if (auth?.access) config.headers.Authorization = `Bearer ${auth.access}`
  } catch {}
  return config
})

export default http
