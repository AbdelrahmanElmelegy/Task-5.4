import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';

export default function BookingForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    roomNumber: '',
    startDate: '',
    endDate: '',
    purpose: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // TODO 3: When editing, load the booking and fill the form
  useEffect(() => {
    if (!isEdit) return;

    const load = async () => {
      try {
        const { data } = await api.get(`/bookings/${id}`);
        setForm({
          roomNumber: data.roomNumber || '',
          // Server sends ISO strings; date inputs need YYYY-MM-DD
          startDate: data.startDate ? data.startDate.slice(0, 10) : '',
          endDate: data.endDate ? data.endDate.slice(0, 10) : '',
          purpose: data.purpose || '',
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load booking');
      }
    };

    load();
  }, [id, isEdit]);

  // TODO 1: every input updates form
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // TODO 2: create or update a booking
  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        roomNumber: form.roomNumber,
        startDate: form.startDate,
        endDate: form.endDate,
        purpose: form.purpose,
        // Do NOT include bookedBy — the server takes it from the token
      };

      if (isEdit) {
        await api.patch(`/bookings/${id}`, payload);
      } else {
        await api.post('/bookings', payload);
      }

      navigate('/bookings');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">
        {isEdit ? 'Edit Booking' : 'Book a Room'}
      </h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Room Number</label>
          <input
            type="text"
            name="roomNumber"
            value={form.roomNumber}
            onChange={handleChange}
            placeholder="e.g. B2-104"
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Start Date</label>
          <input
            type="date"
            name="startDate"
            value={form.startDate}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">End Date</label>
          <input
            type="date"
            name="endDate"
            value={form.endDate}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Purpose (optional)</label>
          <textarea
            name="purpose"
            value={form.purpose}
            onChange={handleChange}
            rows={3}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : isEdit ? 'Update Booking' : 'Book Room'}
        </button>
      </form>
    </div>
  );
}