import client from './client'

export const getPatients = (params = {}) =>
  client.get('/api/patients', { params }).then(r => r.data)

export const getPatient = (id) =>
  client.get(`/api/patients/${id}`).then(r => r.data)

export const createPatient = (data) =>
  client.post('/api/patients', data).then(r => r.data)

export const updatePatient = (id, data) =>
  client.put(`/api/patients/${id}`, data).then(r => r.data)

export const deletePatient = (id) =>
  client.delete(`/api/patients/${id}`)

export const getPatientPredictions = (id, params = {}) =>
  client.get(`/api/patients/${id}/predictions`, { params }).then(r => r.data)
