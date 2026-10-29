# Electrical Energy Consumption and Cost Estimation System

A small MERN application for estimating household appliance energy and monthly cost. The main entity is **Appliance**, with complete database-backed create, read, update and delete operations.

**Start here:** [STEP_BY_STEP.md](STEP_BY_STEP.md). To create every file manually, use [ALL_SOURCE_CODE.md](ALL_SOURCE_CODE.md). Use this as a learning base; understand, adapt and acknowledge assistance according to your course policy.

## Features

- Add appliances with a room, power, quantity, daily hours and monthly usage days.
- List records, view details, search by name, filter by room and sort by name, power or monthly energy.
- Edit records and delete them with confirmation.
- Save appliance records and tariff settings in MongoDB.
- Show daily operating energy, monthly energy and estimated monthly cost.
- Validate inputs in the browser and on the Express server.
- Show loading, empty, success and error states; responsive layout and labelled controls.

## Technology and scope

MongoDB + Mongoose store documents. Express and Node.js provide a JSON API. React with Vite provides the interface. Plain CSS provides styling. Native `fetch` connects React to Express through Vite's development proxy, so a separate CORS package is unnecessary for this local setup.

This is a single-household, local demonstration. It has no login, payments, live meter connection or official bill integration. All local users share the same dataset. Rooms are four predefined reference records. Search, filtering and sorting happen in React after loading the small appliance list; server pagination is outside this scope. A GitHub repository stores source code, not the MongoDB database or a live deployment.

## Quick setup

Install Node.js 24 LTS and Git. Create a MongoDB Atlas database user and allow your current IP. Copy `server/.env.example` to `server/.env` and put your own Atlas connection string there. Never commit `.env`.

In a terminal inside `server`:

```bash
npm ci
npm run dev
```

In a second terminal inside `client`:

```bash
npm ci
npm run dev
```

Open **http://localhost:5173**. Keep both terminals running. See the full guide for exact Windows/VS Code instructions and Atlas setup. `npm ci` uses the supplied lockfiles; use `npm install` when reconstructing files manually before you have lockfiles.

## Calculations

Daily operating energy (kWh) = powerWatts / 1000 × quantity × hoursPerDay.

Monthly energy (kWh) = daily operating energy × daysPerMonth, separately for each appliance.

Monthly cost (LKR) = sum of monthly energy × unitRate + fixedCharge.

Example: two 75 W fans used 8 hours/day for 30 days consume **36 kWh/month**. At an **illustrative** LKR 30/kWh and LKR 100 fixed charge, the total is **LKR 1,180.00**. Each table row excludes the fixed charge; the dashboard adds it once. A configured fixed charge remains even when there are no appliances.

Calculations use unrounded values; display rounds to two decimal places. Daily operating energy assumes every appliance operates for its entered daily hours on the same day. Monthly totals respect each appliance's entered days. The largest-consumer message compares estimated monthly energy.

The default LKR 30/kWh is a sample input, not an official tariff. This flat-rate model excludes tariff slabs, taxes and time-of-use charges. Rated power multiplied by entered hours is an approximation: cycling loads such as refrigerators and air conditioners require a suitable average operating-time assumption.

## Project structure

| Location | Purpose |
|---|---|
| `client/src/App.jsx` | Data loading, shared state, CRUD actions and dashboard |
| `client/src/components/` | Appliance form, inventory and tariff form |
| `client/src/utils/energy.js` | Reusable energy/cost calculations |
| `client/src/api.js` | Fetch requests and API error messages |
| `server/server.js` | Load environment, connect once and start API |
| `server/app.js` | Express configuration and error handling |
| `server/database.js` | Connection and non-destructive initial reference data |
| `server/models/` | Mongoose schemas, types and validation |
| `server/routes/` | Appliance CRUD and tariff routes |
| `docs/DATABASE.md` | ERD, relationships, fields and validation |
| `docs/TESTING.md` | Manual verification and recorded development checks |
| `docs/REPORT_AND_DEMO.md` | Report outline, screenshot checklist and video plan |

## API

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/health` | Database connection status |
| GET | `/api/rooms` | List room reference records |
| GET | `/api/appliances` | Read all appliance records |
| GET | `/api/appliances/:id` | Read one record |
| POST | `/api/appliances` | Create a record |
| PUT | `/api/appliances/:id` | Update a record |
| DELETE | `/api/appliances/:id` | Delete a record |
| GET | `/api/settings` | Read saved tariff |
| PUT | `/api/settings` | Update saved tariff |

POST and PUT appliance bodies contain `name`, `roomId`, `powerWatts`, `quantity`, `hoursPerDay`, `daysPerMonth`. Numerical fields must be JSON numbers, not strings. Updates accept the complete record. Settings PUT accepts `unitRate` and `fixedCharge`.

Expected statuses: 200 success, 201 created, 400 invalid input, 404 missing record/route, 413 oversized request, 503 database unavailable, 500 unexpected failure. Errors return a JSON `message`. Backend credentials never go into React or the repository.

## Verification

From `client`, run:

```bash
npm test
npm run build
```

Also run `npm test` in `server` for six database-free schema and API error tests. The included tests check calculations, input rules and error paths; they do not replace the manual CRUD, persistence and mobile checks in `docs/TESTING.md`. See `VERIFICATION.md` for preparation results and remaining runtime checks. Build output is a verification artifact; use `npm run dev` for the documented local demonstration. This project does not configure production hosting.

## Documentation and submission

The attached EE4207 rubric allocates 30 marks. See the complete criterion mapping in the setup guide. Add screenshots from your own running application to `docs/screenshots/` and link them below before submitting. The supplied image list is a checklist, not evidence that you have already tested your laptop.

Recommended screenshots: desktop dashboard, appliance details, editing, delete confirmation, invalid input, mobile view and the database collections. Add your actual images here using Markdown, for example `![Dashboard](docs/screenshots/dashboard.png)` after that file exists. Avoid exposing credentials.

Submit your GitHub link in the provided course Google Sheet, a report of at most **10 pages**, and a video of at most **5 minutes with your camera on**. The rubric states a deadline on or before **31 October 2026** and asks you to rename submitted files using your index number. Verify any later lecturer announcement.

## References

- Course-provided EE4207 Web Application Development Mini Project Evaluation Rubrics, dated 14 October 2026.
- [React documentation](https://react.dev/learn)
- [Vite getting started](https://vite.dev/guide/)
- [Express routing](https://expressjs.com/en/guide/routing.html)
- [Mongoose validation](https://mongoosejs.com/docs/validation.html)
- [MongoDB Atlas connection guide](https://www.mongodb.com/docs/atlas/connect-to-database-deployment/)
- [GitHub: add locally hosted code](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github)

Replace or supplement this list with the sources and assistance you actually used. Do not claim unperformed tests, fabricated results or independent authorship of assisted work.
