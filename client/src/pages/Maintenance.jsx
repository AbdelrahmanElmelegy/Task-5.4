import { useEffect, useState } from 'react'
import { api } from '../api'
import { useAuth } from '../hooks/useAuth'

const CATEGORIES = ['plumbing', 'electrical', 'furniture', 'other']

export default function Maintenance() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [form, setForm] = useState({ roomNumber: '', category: 'plumbing', description: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function load() {
    const res = await api.get('/maintenance')
    setRequests(res.data.requests)
  }

  useEffect(() => { load() }, [])

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/maintenance', {
        roomNumber: form.roomNumber,
        category: form.category,
        description: form.description
        // author is taken from the auth cookie on the server, never the body
      })
      setForm({ roomNumber: '', category: 'plumbing', description: '' })
      await load()
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not submit request')
    } finally {
      setLoading(false)
    }
  }

  async function onDelete(id) {
    setError('')
    try {
      await api.delete('/maintenance/' + id)
      setRequests(prev => prev.filter(r => r._id !== id))
    } catch (err) {
      setError(err?.response?.data?.message || 'Delete failed')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Maintenance Requests</h1>
      {error && <div className="text-red-600 text-sm">{error}</div>}

      {user ? (
        <form onSubmit={onSubmit} className="card space-y-3">
          <div>
            <label className="block mb-1 font-medium">Room Number</label>
            <input
              name="roomNumber"
              value={form.roomNumber}
              onChange={handleChange}
              placeholder="e.g. B2-104"
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <button type="submit" disabled={loading} className="btn">
            {loading ? 'Submitting…' : 'Submit Request'}
          </button>
        </form>
      ) : (
        <div className="text-sm text-zinc-600">Log in to submit a maintenance request.</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {requests.map(r => {
          const isMine = user && r.author?._id === user.id
          return (
            <div key={r._id} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">Room {r.roomNumber} • {r.category}</div>
                  <div className="text-sm text-zinc-600">
                    {r.status} • by {r.author?.name || 'unknown'}
                  </div>
                </div>
                {isMine && (
                  <button onClick={() => onDelete(r._id)} className="btn text-sm">Delete</button>
                )}
              </div>
              <p className="mt-2 text-sm">{r.description}</p>
            </div>
          )
        })}
        {requests.length === 0 && <div className="text-sm text-zinc-600">No maintenance requests yet.</div>}
      </div>
    </div>
  )
}
