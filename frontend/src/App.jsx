import { useEffect, useState } from 'react';
import './App.css';

const emptyForm = {
  destination: '',
  startDate: '',
  endDate: '',
  budget: '',
  status: 'planned'
};

const labels = {
  planned: 'Zaplanowana',
  confirmed: 'Potwierdzona',
  completed: 'Zakończona'
};

function App() {
  const [trips, setTrips] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function api(url, options) {
    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Błąd serwera');
    return data;
  }

  async function loadTrips() {
    setLoading(true);
    try {
      setTrips(await api('/api/trips'));
    } catch (err) {
      setError('Nie udało się pobrać podróży: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTrips();
  }, []);

  function change(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function save(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!form.destination.trim()) return setError('Podaj kierunek.');
    if (!form.startDate || !form.endDate) return setError('Podaj daty.');
    if (form.endDate < form.startDate) {
      return setError('Data końca nie może być wcześniejsza niż początek.');
    }
    if (form.budget === '' || !Number.isFinite(Number(form.budget)) || Number(form.budget) < 0) {
      return setError('Podaj poprawny budżet.');
    }

    setSaving(true);
    try {
      const url = editingId === null ? '/api/trips' : `/api/trips/${editingId}`;
      await api(url, {
        method: editingId === null ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          destination: form.destination.trim(),
          budget: Number(form.budget)
        })
      });
      setForm(emptyForm);
      setEditingId(null);
      await loadTrips();
      setSuccess('Podróż została zapisana.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function edit(trip) {
    setEditingId(trip.id);
    setForm({
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      budget: String(trip.budget),
      status: trip.status
    });
    setError('');
    setSuccess('');
  }

  async function remove(id) {
    if (!window.confirm('Usunąć podróż?')) return;
    setError('');
    setSuccess('');
    try {
      await api(`/api/trips/${id}`, { method: 'DELETE' });
      await loadTrips();
      setSuccess('Podróż została usunięta.');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="app">
      <header>
        <h1>🌍 Waki</h1>
        <p>Twoje podróże w jednym miejscu</p>
      </header>

      <main>
        <h2>{editingId === null ? 'Dodaj podróż' : 'Edytuj podróż'}</h2>

        <form className="filters" onSubmit={save}>
          <input name="destination" placeholder="Kierunek"
            value={form.destination} onChange={change} required />
          <input type="date" name="startDate"
            value={form.startDate} onChange={change} required />
          <input type="date" name="endDate"
            value={form.endDate} onChange={change} required />
          <input type="number" name="budget" placeholder="Budżet (zł)"
            min="0" step="0.01" value={form.budget}
            onChange={change} required />
          <select name="status" value={form.status} onChange={change}>
            <option value="planned">Zaplanowana</option>
            <option value="confirmed">Potwierdzona</option>
            <option value="completed">Zakończona</option>
          </select>
          <button disabled={saving} type="submit">
            {saving ? 'Zapisywanie...' : editingId === null ? 'Dodaj' : 'Zapisz zmiany'}
          </button>
          {editingId !== null && (
            <button type="button" onClick={() => {
              setEditingId(null);
              setForm(emptyForm);
            }}>Anuluj</button>
          )}
        </form>

        {error && <p className="error">{error}</p>}
        {success && <p>{success}</p>}

        <h2>Moje podróże</h2>
        {loading ? <p>Ładowanie podróży...</p> : (
          <div className="grid">
            {trips.map(trip => (
              <article className="card" key={trip.id}>
                <span className="tag">{labels[trip.status] || trip.status}</span>
                <h3>{trip.destination}</h3>
                <p>📅 {trip.startDate} – {trip.endDate}</p>
                <p>💰 Budżet: {trip.budget} zł</p>
                <button type="button" onClick={() => edit(trip)}>Edytuj</button>
                <button type="button" onClick={() => remove(trip.id)}>Usuń</button>
              </article>
            ))}
          </div>
        )}
        {!loading && !error && trips.length === 0 && (
          <p>Brak podróży do wyświetlenia.</p>
        )}
      </main>

      <footer>Waki – planowanie podróży</footer>
    </div>
  );
}

export default App;
