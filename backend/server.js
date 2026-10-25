require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Waki API działa' });
});

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error(error.message);
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

const allowedStatuses = ['planned', 'confirmed', 'completed'];

function validateTrip(data) {
  if (!data || typeof data !== 'object') {
    return 'Invalid trip data';
  }

  const { destination, startDate, endDate, budget, status } = data;

  if (typeof destination !== 'string' || !destination.trim()) {
    return 'Destination is required';
  }

  const pattern = /^\d{4}-\d{2}-\d{2}$/;

  if (
    typeof startDate !== 'string' ||
    typeof endDate !== 'string' ||
    !pattern.test(startDate) ||
    !pattern.test(endDate)
  ) {
    return 'Dates must use YYYY-MM-DD format';
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    start.toISOString().slice(0, 10) !== startDate ||
    end.toISOString().slice(0, 10) !== endDate
  ) {
    return 'Invalid date';
  }

  if (end < start) {
    return 'End date cannot be before start date';
  }

  if (typeof budget !== 'number' || !Number.isFinite(budget) || budget < 0) {
    return 'Budget must be a non-negative number';
  }

  if (status !== undefined && !allowedStatuses.includes(status)) {
    return 'Invalid status';
  }

  return null;
}

function formatTrip(row) {
  const formatDate = value =>
    value instanceof Date
      ? value.toISOString().slice(0, 10)
      : String(value).slice(0, 10);

  return {
    id: row.id,
    destination: row.destination,
    startDate: formatDate(row.start_date),
    endDate: formatDate(row.end_date),
    budget: Number(row.budget),
    status: row.status
  };
}

// CREATE
app.post('/api/trips', async (req, res) => {
  const error = validateTrip(req.body);
  if (error) return res.status(400).json({ error });

  const { destination, startDate, endDate, budget, status = 'planned' } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO trips (destination, start_date, end_date, budget, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [destination.trim(), startDate, endDate, budget, status]
    );

    res.status(201).json(formatTrip(result.rows[0]));
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Database error' });
  }
});

// READ ALL
app.get('/api/trips', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM trips ORDER BY id');
    res.json(result.rows.map(formatTrip));
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Database error' });
  }
});

// READ ONE
app.get('/api/trips/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid trip ID' });
  }

  try {
    const result = await pool.query('SELECT * FROM trips WHERE id = $1', [id]);

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json(formatTrip(result.rows[0]));
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Database error' });
  }
});

// UPDATE
app.put('/api/trips/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid trip ID' });
  }

  const error = validateTrip(req.body);
  if (error) return res.status(400).json({ error });

  const { destination, startDate, endDate, budget, status = 'planned' } = req.body;

  try {
    const result = await pool.query(
      `UPDATE trips
       SET destination = $1, start_date = $2, end_date = $3,
           budget = $4, status = $5
       WHERE id = $6 RETURNING *`,
      [destination.trim(), startDate, endDate, budget, status, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json(formatTrip(result.rows[0]));
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Database error' });
  }
});

// DELETE
app.delete('/api/trips/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid trip ID' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM trips WHERE id = $1 RETURNING id',
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json({ message: 'Trip deleted' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Database error' });
  }
});

app.listen(PORT, () => {
  console.log(`Waki API running on port ${PORT}`);
});
