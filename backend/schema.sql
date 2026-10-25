CREATE TABLE IF NOT EXISTS trips (
    id SERIAL PRIMARY KEY,
    destination VARCHAR(200) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    budget NUMERIC(12, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'planned',
    CONSTRAINT valid_dates CHECK (end_date >= start_date),
    CONSTRAINT valid_budget CHECK (budget >= 0),
    CONSTRAINT valid_status CHECK (
        status IN ('planned', 'confirmed', 'completed')
    )
);
