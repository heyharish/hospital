import client from './client'

export const login = (email, password) =>
  client.post('/api/auth/login', { email, password }).then(r => r.data)

export const register = (name, email, password, role) =>
  client.post('/api/auth/register', { name, email, password, role }).then(r => r.data)
