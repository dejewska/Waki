require('dotenv').config();

const express = require('express');
const cors = require('cors');

const pool = require('./db');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Waki API dziala!',
    status: 'OK'
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    application: 'Waki',
    database: 'not connected'
  });
});



// Tymczasowa lista podrozy (do testow CRUD)
let trips = [];
let nextId = 1;

// CREATE - dodawanie podrozy
app.post('/api/trips', (req, res) => {
  const { destination, startDate, endDate, budget, status } = req.body;

  if (
    typeof destination !== 'string' ||
    !destination.trim() ||
    typeof startDate !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
    typeof endDate !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(endDate) ||
    endDate < startDate ||
    typeof budget !== 'number' ||
    !Number.isFinite(budget) ||
    budget < 0 ||
    !['planned', 'confirmed', 'completed'].includes(status)
  ) {
    return res.status(400).json({
      error: 'Nieprawidlowe dane podrozy'
    });
  }

  const trip = {
    id: nextId++,
    destination,
    startDate,
    endDate,
    budget,
    status
  };

  trips.push(trip);
  res.status(201).json(trip);
});

// READ - pobieranie wszystkich podrozy
app.get('/api/trips', (req, res) => {
  res.json(trips);
});

// READ - pobieranie jednej podrozy
app.get('/api/trips/:id', (req, res) => {
  const trip = trips.find(t => t.id === Number(req.params.id));

  if (!trip) {
    return res.status(404).json({ error: 'Podroz nie istnieje' });
  }

  res.json(trip);
});

// UPDATE - edycja podrozy
app.put('/api/trips/:id', (req, res) => {
  const trip = trips.find(t => t.id === Number(req.params.id));

  if (!trip) {
    return res.status(404).json({ error: 'Podroz nie istnieje' });
  }

  const updated = { ...trip, ...req.body };

  if (
    typeof updated.destination !== 'string' ||
    !updated.destination.trim() ||
    typeof updated.startDate !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(updated.startDate) ||
    typeof updated.endDate !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(updated.endDate) ||
    updated.endDate < updated.startDate ||
    typeof updated.budget !== 'number' ||
    !Number.isFinite(updated.budget) ||
    updated.budget < 0 ||
    !['planned', 'confirmed', 'completed'].includes(updated.status)
  ) {
    return res.status(400).json({
      error: 'Nieprawidlowe dane podrozy'
    });
  }

  Object.assign(trip, {
    destination: updated.destination,
    startDate: updated.startDate,
    endDate: updated.endDate,
    budget: updated.budget,
    status: updated.status
  });

  res.json(trip);
});

// DELETE - usuwanie podrozy
app.delete('/api/trips/:id', (req, res) => {
  const index = trips.findIndex(t => t.id === Number(req.params.id));

  if (index === -1) {
    return res.status(404).json({ error: 'Podroz nie istnieje' });
  }

  trips.splice(index, 1);
  res.json({ message: 'Podroz usunieta' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Waki API uruchomione na porcie ${PORT}`);
});
