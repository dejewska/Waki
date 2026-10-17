import { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [trips, setTrips] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('Wszystkie');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/trips.json`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Błąd pobierania danych');
        }
        return response.json();
      })
      .then(data => setTrips(data))
      .catch(err => setError(err.message));
  }, []);

  const filtered = trips.filter(trip => {
    const matchesSearch = trip.destination
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesStatus =
      status === 'Wszystkie' || trip.status === status;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="app">
      <header>
        <h1>🌍 Waki</h1>
        <p>Twoje podróże w jednym miejscu</p>
      </header>

      <main>
        <h2>Moje podróże</h2>
        <p>Lista zaplanowanych i zakończonych wyjazdów</p>

        <div className="filters">
          <input
            placeholder="Szukaj kierunku..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            <option>Wszystkie</option>
            <option>Pomysł</option>
            <option>Zaplanowana</option>
            <option>Zakończona</option>
          </select>
        </div>

        {error && <p className="error">{error}</p>}

        <div className="grid">
          {filtered.map(trip => (
            <article className="card" key={trip.id}>
              <span className="tag">{trip.status}</span>
              <h3>{trip.destination}</h3>
              <p>📅 {trip.startDate} – {trip.endDate}</p>
              <p>💰 Budżet: {trip.budget} zł</p>
            </article>
          ))}
        </div>

        {!error && filtered.length === 0 && (
          <p>Brak podróży do wyświetlenia.</p>
        )}
      </main>

      <footer>Waki – planowanie podróży</footer>
    </div>
  );
}

export default App;
