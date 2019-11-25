DROP DATABASE IF EXISTS workshopserver2;
CREATE DATABASE workshopserver2;

DROP TABLE IF EXISTS attendees;
CREATE TABLE attendees(
  firstname TEXT NOT NULL,
  lastname TEXT NOT NULL,
  username TEXT PRIMARY KEY,
  email TEXT PRIMARY KEY
);

DROP TABLE IF EXISTS workshops;
CREATE TABLE workshops(
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  location TEXT NOT NULL,
  maxseats INTEGER NOT NULL,
  instructor TEXT NOT NULL
);

DROP TABLE IF EXISTS together;
CREATE TABLE together(
  key SERIAL PRIMARY KEY,
  id INTEGER REFERENCES workshops (id),
  username TEXT REFERENCES attendees(username),
);
