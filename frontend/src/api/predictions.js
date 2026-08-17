import client from './client'

export const runPrediction = (patient_id) =>
  client.post('/api/predict', { patient_id }).then(r => r.data)

export const getPredictions = (params = {}) =>
  client.get('/api/predictions', { params }).then(r => r.data)

export const getPrediction = (id) =>
  client.get(`/api/predictions/${id}`).then(r => r.data)
