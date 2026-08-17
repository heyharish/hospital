import client from './client'

export const getDashboardStats = () =>
  client.get('/api/dashboard/stats').then(r => r.data)
