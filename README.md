# Electrical Energy System Project

A MERN web application for estimating household electricity consumption and monthly costs. Users can create an account, log in and manage their own appliances and tariff settings.

## Features

- User registration, login and logout.
- A personal dashboard for each account.
- Add, view, edit and delete appliance records.
- Search appliances, filter by room and sort records.
- Calculate daily and monthly energy consumption.
- Estimate monthly cost using a chosen tariff and fixed charge.
- Save account details, appliances and settings in MongoDB.
- Responsive design with input validation and clear error messages.

## Technologies

- **Frontend:** React, Vite and CSS
- **Backend:** Node.js and Express
- **Database:** MongoDB and Mongoose

## Installation and Setup

### 1. Requirements

- Node.js 24
- Git
- A MongoDB Atlas cluster

Create an Atlas database user and add your current IP address to the project's IP access list.

### 2. Configure the database

Copy `server/.env.example` to `server/.env`.

Replace the example MongoDB connection string with your actual connection string. Use `energy_estimator` as the database name.

Keep `.env` private and excluded from Git.

### 3. Start the backend

Open a terminal in the project folder and run:

```bash
cd server
npm ci
npm run dev
```

Wait for the database connection message. Keep this terminal running.

### 4. Start the frontend

Open another terminal in the project folder and run:

```bash
cd client
npm ci
npm run dev
```

Open **http://localhost:5173** in your browser. Both terminals must remain running.

## Using the Application

1. Select **Create account** and enter your name, email and password.
2. Enter optional household details if needed.
3. Add appliances with their room, power, quantity and operating hours.
4. Enter your assumed unit rate and monthly fixed charge.
5. View the energy and cost estimates on your dashboard.
6. Use **Log out** when finished.

Each account has separate appliance records and tariff settings. Passwords are stored as hashes, and login sessions use HttpOnly cookies.

## Energy and Cost Calculations

```text
Daily energy (kWh) =
Power (W) × Quantity × Hours per day ÷ 1000

Monthly energy (kWh) =
Daily energy × Days per month

Estimated monthly cost (LKR) =
Total monthly energy × Unit rate + Monthly fixed charge
```

### Example

Two 75 W fans operating for 8 hours per day and 30 days per month consume:

```text
75 × 2 × 8 × 30 ÷ 1000 = 36 kWh/month
```

At an example rate of LKR 30/kWh and a fixed charge of LKR 100:

```text
36 × 30 + 100 = LKR 1,180.00
```

The fixed charge is added once to the monthly total. Individual appliance costs exclude this charge.

## Project Structure

| Folder | Purpose |
|---|---|
| `client/src/` | Interface, forms, dashboard, calculations and styles |
| `server/auth/` | Password handling, sessions and request protection |
| `server/models/` | Database models and validation |
| `server/routes/` | Authentication, appliance and tariff API routes |
| `server/test/` | Backend automated tests |
| `docs/` | Database design, authentication details and testing guides |

## Testing

Run these commands from the main project folder:

```bash
npm --prefix client test
npm --prefix server test
npm --prefix client run build
```

The tests cover calculations, validation, password handling, sessions and account access.

Backend HTTP tests use simulated database models by default. Also check registration, login, account separation and saved records using your actual Atlas connection.

## Limitations

- Costs use a flat rate entered by the user.
- Official tariff slabs, taxes and time-of-use charges are excluded.
- Energy estimates depend on the entered power and operating hours.
- There is no live electricity meter connection.
- Email verification and password recovery are not included.
- The application runs locally.

The initial LKR 30/kWh rate is an example value, not an official electricity tariff.
