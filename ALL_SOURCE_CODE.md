# Complete source code

Each section gives the exact relative filename followed by its complete contents. Create the same path in VS Code, paste only the code inside the fence and save. Do not paste this whole document into one JavaScript file.

The two `package-lock.json` files are supplied separately in the ZIP. If reconstructing manually, run `npm install` in `server` and `client` to generate them. No root package.json or frontend .env is needed. Documentation is provided in the other Markdown files. The private server/.env is created by you from the template; credentials are intentionally absent.

There are 25 source/config/test files below. Follow STEP_BY_STEP.md for the order of setup, explanation and verification.

## `.gitignore`

```text
node_modules/
dist/
.env
.env.*
!.env.example
*.log
.DS_Store
Thumbs.db
```

## `client/index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Estimate household appliance energy consumption and monthly cost." />
    <title>Electrical Energy Consumption and Cost Estimation System</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

## `client/package.json`

```json
{
  "name": "energy-estimator-client",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=24 <25" },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "node --test",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "19.3.1",
    "react-dom": "19.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "6.1.2",
    "vite": "8.3.5"
  }
}
```

## `client/src/App.jsx`

```jsx
import { useEffect, useState } from 'react';
import { api } from './api.js';
import ApplianceForm from './components/ApplianceForm.jsx';
import ApplianceTable from './components/ApplianceTable.jsx';
import TariffForm from './components/TariffForm.jsx';
import { calculateTotals, dailyEnergy, monthlyEnergy, money } from './utils/energy.js';

export default function App() {
  const [appliances, setAppliances] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [settings, setSettings] = useState({ unitRate: 30, fixedCharge: 0 });
  const [editing, setEditing] = useState(null);
  const [details, setDetails] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadData() {
    setBusy(true);
    setError('');
    try {
      const [savedAppliances, savedRooms, savedSettings] = await Promise.all([
        api('/appliances'), api('/rooms'), api('/settings')
      ]);
      setAppliances(savedAppliances);
      setRooms(savedRooms);
      setSettings(savedSettings);
      setLoaded(true);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  useEffect(() => { loadData(); }, []);

  async function saveAppliance(input, id) {
    setBusy(true); setError(''); setMessage('');
    try {
      const saved = await api(id ? `/appliances/${id}` : '/appliances', id ? 'PUT' : 'POST', input);
      setAppliances(previous => id ? previous.map(item => item._id === id ? saved : item) : [saved, ...previous]);
      if (details?._id === id) setDetails(saved);
      setMessage(id ? 'Appliance updated.' : 'Appliance added and saved to the database.');
      return true;
    } catch (err) { setError(err.message); return false; }
    finally { setBusy(false); }
  }

  async function deleteAppliance(item) {
    if (!window.confirm(`Delete "${item.name}"? This permanently removes the record.`)) return;
    setBusy(true); setError(''); setMessage('');
    try {
      await api(`/appliances/${item._id}`, 'DELETE');
      setAppliances(previous => previous.filter(record => record._id !== item._id));
      if (editing?._id === item._id) setEditing(null);
      if (details?._id === item._id) setDetails(null);
      setMessage('Appliance deleted.');
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function viewAppliance(item) {
    setBusy(true); setError(''); setMessage('');
    try {
      setDetails(await api(`/appliances/${item._id}`));
      requestAnimationFrame(() => document.getElementById('details')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function saveSettings(input) {
    setBusy(true); setError(''); setMessage('');
    try {
      setSettings(await api('/settings', 'PUT', input));
      setMessage('Tariff saved. Cost estimates updated.');
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  const totals = calculateTotals(appliances, settings);
  const largest = [...appliances].sort((a, b) => monthlyEnergy(b) - monthlyEnergy(a))[0];

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#dashboard"><span className="brand-mark">EE</span>Energy Estimator</a>
          <nav aria-label="Main navigation"><a href="#dashboard">Dashboard</a><a href="#appliances">Appliances</a><a href="#tariff">Tariff</a></nav>
        </div>
      </header>
      <main>
        <section className="intro" id="dashboard">
          <p className="eyebrow">HOUSEHOLD ENERGY PLANNING</p>
          <h1>Electrical Energy Consumption<br className="desktop-break" /> and Cost Estimation System</h1>
          <p>Keep track of your appliances, estimate their energy use and plan your monthly cost.</p>
        </section>
        {error && <div className="notice error" role="alert">{error}</div>}
        {message && <div className="notice success" role="status">{message}</div>}
        {!loaded ? <section className="panel"><p>{busy ? 'Loading your saved records...' : 'The application could not load.'}</p><button disabled={busy} onClick={loadData}>Retry connection</button></section> : (
          <>
            <section className="summary" aria-label="Energy summary for all saved appliances">
              <article className="stat"><span>Appliance records</span><strong>{appliances.length}</strong><small>All saved rooms</small></article>
              <article className="stat"><span>Daily operating energy</span><strong>{totals.dailyKwh.toFixed(2)} <small>kWh</small></strong><small>On a day all appliances are used</small></article>
              <article className="stat"><span>Monthly energy</span><strong>{totals.monthlyKwh.toFixed(2)} <small>kWh</small></strong><small>Based on entered days per month</small></article>
              <article className="stat cost"><span>Estimated monthly cost</span><strong>{money(totals.monthlyCost)}</strong><small>Includes {money(settings.fixedCharge)} fixed charge</small></article>
            </section>
            <div className="workspace">
              <ApplianceForm rooms={rooms} editing={editing} onSave={saveAppliance} onCancel={() => setEditing(null)} busy={busy} />
              <ApplianceTable appliances={appliances} rooms={rooms} rate={settings.unitRate} busy={busy}
                onView={viewAppliance} onDelete={deleteAppliance} onEdit={item => {
                  setEditing(item);
                  document.getElementById('appliance-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
                }} />
            </div>
            {details && <section className="panel details" id="details" aria-label="Appliance details">
              <div className="section-title"><h2>{details.name}</h2><button className="secondary small" onClick={() => setDetails(null)}>Close details</button></div>
              <dl>
                <div><dt>Room</dt><dd>{details.roomId.name}</dd></div>
                <div><dt>Power per unit</dt><dd>{details.powerWatts} W</dd></div>
                <div><dt>Quantity</dt><dd>{details.quantity}</dd></div>
                <div><dt>Usage</dt><dd>{details.hoursPerDay} h/day, {details.daysPerMonth} days/month</dd></div>
                <div><dt>Daily operating energy</dt><dd>{dailyEnergy(details).toFixed(2)} kWh</dd></div>
                <div><dt>Monthly energy / energy cost</dt><dd>{monthlyEnergy(details).toFixed(2)} kWh / {money(monthlyEnergy(details) * settings.unitRate)}</dd></div>
              </dl>
            </section>}
            <div className="bottom-grid">
              <TariffForm settings={settings} onSave={saveSettings} busy={busy} />
              <section className="panel method">
                <p className="eyebrow">UNDERSTAND YOUR ESTIMATE</p><h2>How it works</h2>
                <p>Monthly kWh = (watts ÷ 1,000) × quantity × hours/day × days/month.</p>
                <p>Monthly cost = total monthly kWh × saved unit rate + one fixed charge.</p>
                {largest && monthlyEnergy(largest) > 0 && <p><strong>Largest estimated consumer:</strong> {largest.name} ({monthlyEnergy(largest).toFixed(2)} kWh/month). Reducing its operating hours could lower consumption.</p>}
                <p className="muted">This is a flat-rate planning estimate. It does not apply official tariff slabs, taxes or time-of-use rates. Actual consumption also depends on appliance duty cycles and operating conditions.</p>
              </section>
            </div>
          </>
        )}
      </main>
      <footer>MERN mini project · Estimates based on user-entered appliance data</footer>
    </>
  );
}
```

## `client/src/api.js`

```javascript
export async function api(path, method = 'GET', body) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new Error('Cannot reach the server. Check that both terminals are running.');
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || 'Request failed. Check the server terminal.');
  if (!data) throw new Error('No data received. Check the server terminal.');
  return data;
}
```

## `client/src/components/ApplianceForm.jsx`

```jsx
import { useEffect, useState } from 'react';

const emptyForm = {
  name: '', roomId: '', powerWatts: '', quantity: 1, hoursPerDay: '', daysPerMonth: 30
};

export default function ApplianceForm({ rooms, editing, onSave, onCancel, busy }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    setForm(editing ? {
      name: editing.name,
      roomId: editing.roomId._id,
      powerWatts: editing.powerWatts,
      quantity: editing.quantity,
      hoursPerDay: editing.hoursPerDay,
      daysPerMonth: editing.daysPerMonth
    } : { ...emptyForm });
  }, [editing]);

  function change(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function submit(event) {
    event.preventDefault();
    const saved = await onSave({
      ...form,
      name: form.name.trim(),
      powerWatts: Number(form.powerWatts),
      quantity: Number(form.quantity),
      hoursPerDay: Number(form.hoursPerDay),
      daysPerMonth: Number(form.daysPerMonth)
    }, editing?._id);
    if (saved) {
      setForm({ ...emptyForm });
      onCancel();
    }
  }

  return (
    <section className="panel" id="appliance-form">
      <p className="eyebrow">APPLIANCE RECORD</p>
      <h2>{editing ? 'Edit appliance' : 'Add an appliance'}</h2>
      <form onSubmit={submit}>
        <fieldset disabled={busy}>
          <label htmlFor="name">Appliance name</label>
          <input id="name" name="name" value={form.name} onChange={change}
            required minLength="2" maxLength="60" placeholder="e.g. Ceiling fan" />
          <label htmlFor="roomId">Room</label>
          <select id="roomId" name="roomId" value={form.roomId} onChange={change} required>
            <option value="">Select a room</option>
            {rooms.map(room => <option key={room._id} value={room._id}>{room.name}</option>)}
          </select>
          <div className="two-fields">
            <div>
              <label htmlFor="powerWatts">Power per unit (W)</label>
              <input id="powerWatts" name="powerWatts" type="number" min="0.1" max="100000"
                step="any" value={form.powerWatts} onChange={change} required />
            </div>
            <div>
              <label htmlFor="quantity">Quantity</label>
              <input id="quantity" name="quantity" type="number" min="1" max="1000"
                step="1" value={form.quantity} onChange={change} required />
            </div>
            <div>
              <label htmlFor="hoursPerDay">Hours per day</label>
              <input id="hoursPerDay" name="hoursPerDay" type="number" min="0" max="24"
                step="any" value={form.hoursPerDay} onChange={change} required />
            </div>
            <div>
              <label htmlFor="daysPerMonth">Days per month</label>
              <input id="daysPerMonth" name="daysPerMonth" type="number" min="1" max="31"
                step="1" value={form.daysPerMonth} onChange={change} required />
            </div>
          </div>
          <p className="muted">Enter average operating hours. One unit of electrical energy is 1 kWh.</p>
          <div className="button-row">
            <button type="submit">{busy ? 'Please wait...' : editing ? 'Save changes' : 'Add appliance'}</button>
            {editing && <button type="button" className="secondary" onClick={onCancel}>Cancel edit</button>}
          </div>
        </fieldset>
      </form>
    </section>
  );
}
```

## `client/src/components/ApplianceTable.jsx`

```jsx
import { useState } from 'react';
import { monthlyEnergy, money } from '../utils/energy.js';

export default function ApplianceTable({ appliances, rooms, rate, onView, onEdit, onDelete, busy }) {
  const [search, setSearch] = useState('');
  const [room, setRoom] = useState('');
  const [sort, setSort] = useState('name');

  const visible = appliances.filter(item =>
    item.name.toLowerCase().includes(search.trim().toLowerCase()) &&
    (!room || item.roomId._id === room)
  ).sort((a, b) => {
    if (sort === 'energy') return monthlyEnergy(b) - monthlyEnergy(a);
    if (sort === 'power') return b.powerWatts - a.powerWatts;
    return a.name.localeCompare(b.name);
  });

  return (
    <section className="panel inventory" id="appliances">
      <div className="section-title">
        <div><p className="eyebrow">YOUR INVENTORY</p><h2>Saved appliances</h2></div>
        <span className="badge">{appliances.length} records</span>
      </div>
      <div className="filters">
        <div>
          <label htmlFor="search">Search by name</label>
          <input id="search" type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Find an appliance" />
        </div>
        <div>
          <label htmlFor="filter-room">Filter by room</label>
          <select id="filter-room" value={room} onChange={e => setRoom(e.target.value)}>
            <option value="">All rooms</option>
            {rooms.map(item => <option key={item._id} value={item._id}>{item.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="sort">Sort by</label>
          <select id="sort" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="name">Name: A to Z</option>
            <option value="energy">Monthly energy: high to low</option>
            <option value="power">Power: high to low</option>
          </select>
        </div>
      </div>
      <p className="muted">Showing {visible.length} of {appliances.length}. Dashboard totals always include all saved records.</p>
      {visible.length === 0 ? <p className="empty">{appliances.length === 0 ? 'Add your first appliance to start estimating.' : 'No matching appliances. Try another search or room.'}</p> : (
        <div className="table-scroll" tabIndex="0" role="region" aria-label="Appliance table; scroll horizontally on small screens">
          <table>
            <caption className="sr-only">Saved appliance energy and estimated energy charges</caption>
            <thead><tr><th>Appliance / room</th><th>W / unit</th><th>Qty.</th><th>kWh / month</th><th>Energy cost</th><th>Actions</th></tr></thead>
            <tbody>
              {visible.map(item => (
                <tr key={item._id}>
                  <td><strong className="record-name">{item.name}</strong><span className="room-name">{item.roomId.name}</span></td>
                  <td>{item.powerWatts}</td><td>{item.quantity}</td>
                  <td>{monthlyEnergy(item).toFixed(2)}</td>
                  <td>{money(monthlyEnergy(item) * rate)}</td>
                  <td><div className="actions">
                    <button className="small secondary" disabled={busy} onClick={() => onView(item)} aria-label={`View ${item.name}`}>View</button>
                    <button className="small secondary" disabled={busy} onClick={() => onEdit(item)} aria-label={`Edit ${item.name}`}>Edit</button>
                    <button className="small danger" disabled={busy} onClick={() => onDelete(item)} aria-label={`Delete ${item.name}`}>Delete</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="muted">Row costs exclude the fixed charge. It is added once to the monthly total.</p>
    </section>
  );
}
```

## `client/src/components/TariffForm.jsx`

```jsx
import { useEffect, useState } from 'react';

export default function TariffForm({ settings, onSave, busy }) {
  const [rate, setRate] = useState(settings.unitRate);
  const [fixed, setFixed] = useState(settings.fixedCharge);
  useEffect(() => {
    setRate(settings.unitRate);
    setFixed(settings.fixedCharge);
  }, [settings]);

  return (
    <section className="panel" id="tariff">
      <p className="eyebrow">COST ASSUMPTIONS</p>
      <h2>Tariff settings</h2>
      <form onSubmit={event => {
        event.preventDefault();
        onSave({ unitRate: Number(rate), fixedCharge: Number(fixed) });
      }}>
        <fieldset disabled={busy}>
          <div className="two-fields">
            <div>
              <label htmlFor="rate">Rate (LKR / kWh)</label>
              <input id="rate" type="number" min="0" max="10000" step="0.01" value={rate}
                onChange={e => setRate(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="fixed">Monthly fixed charge (LKR)</label>
              <input id="fixed" type="number" min="0" max="1000000" step="0.01" value={fixed}
                onChange={e => setFixed(e.target.value)} required />
            </div>
          </div>
          <p className="muted">The initial LKR 30 rate is illustrative. Enter your own assumed rate and save to update the dashboard.</p>
          <button type="submit">{busy ? 'Please wait...' : 'Save tariff'}</button>
        </fieldset>
      </form>
    </section>
  );
}
```

## `client/src/main.jsx`

```jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
);
```

## `client/src/styles.css`

```css
:root {
  font-family: Arial, Helvetica, sans-serif;
  color: #18342f;
  background: #f4f7f5;
  font-synthesis: none;
  line-height: 1.55;
  scroll-behavior: smooth;
  scroll-padding-top: 95px;
}
* { box-sizing: border-box; }
body { margin: 0; }
a { color: inherit; }
.site-header { background: #fff; border-bottom: 1px solid #dbe5df; }
.header-inner { max-width: 1360px; margin: auto; padding: 18px 30px; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
.brand { display: flex; align-items: center; gap: 10px; text-decoration: none; font-size: 18px; font-weight: 700; }
.brand-mark { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 9px; color: white; background: #17654e; font-size: 14px; }
nav { display: flex; gap: 24px; font-size: 14px; }
nav a { text-decoration: none; }
nav a:hover { text-decoration: underline; }
main { max-width: 1360px; margin: auto; padding: 36px 30px 45px; }
.intro { margin-bottom: 26px; }
.intro h1 { max-width: 900px; margin: 8px 0 12px; font-size: clamp(27px, 3vw, 39px); line-height: 1.2; letter-spacing: -0.8px; }
.intro > p:last-child { margin: 0; color: #56685e; }
.eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 1.4px; color: #39745d; margin: 0 0 7px; }
h2 { font-size: 20px; line-height: 1.3; margin: 0 0 20px; }
p { margin: 0 0 14px; }
.summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.stat { border: 1px solid #dbe5df; border-radius: 12px; background: #fff; padding: 20px; display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.stat > span { color: #52685b; font-size: 13px; }
.stat strong { font-size: clamp(23px, 2.2vw, 30px); line-height: 1.25; overflow-wrap: anywhere; }
.stat small { font-size: 11px; color: #5a7062; }
.stat strong small { font-size: 14px; font-weight: 400; }
.cost { color: #fff; background: #175640; border-color: #175640; }
.cost > span, .cost small { color: #d8eade; }
.workspace { display: grid; grid-template-columns: 330px minmax(0, 1fr); gap: 24px; align-items: start; }
.panel { background: #fff; border: 1px solid #dbe5df; border-radius: 12px; padding: 24px; min-width: 0; }
.section-title { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 20px; }
.section-title h2 { margin-bottom: 0; }
.badge { background: #edf5ef; color: #256349; padding: 5px 10px; border-radius: 20px; font-size: 12px; white-space: nowrap; }
fieldset { border: 0; padding: 0; margin: 0; min-width: 0; }
label { display: block; font-size: 12px; font-weight: 700; margin-bottom: 6px; }
input, select { width: 100%; min-height: 42px; border: 1px solid #bdcdc3; border-radius: 6px; padding: 9px 10px; background: #fff; color: #193c2e; font: inherit; font-size: 14px; margin-bottom: 17px; }
input:focus, select:focus { outline: 2px solid #3e8665; outline-offset: 2px; }
button { border: 1px solid #17654e; border-radius: 6px; padding: 10px 15px; color: white; background: #17654e; cursor: pointer; font: inherit; font-size: 13px; font-weight: 700; }
button:hover { background: #104b39; }
button:focus-visible, a:focus-visible { outline: 3px solid #d59b33; outline-offset: 3px; }
button:disabled { opacity: 0.55; cursor: wait; }
.secondary { color: #24563d; background: #fff; border-color: #bccfc2; }
.secondary:hover { background: #edf5ef; }
.danger { color: #a12b2b; border-color: #e4c6c6; background: #fff7f7; }
.danger:hover { background: #fce4e4; }
.small { padding: 6px 8px; font-size: 11px; }
.button-row { display: flex; gap: 8px; flex-wrap: wrap; }
.two-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 0 14px; }
.filters { display: grid; grid-template-columns: 1.2fr 1fr 1.1fr; gap: 12px; }
.filters input, .filters select { margin-bottom: 7px; }
.muted { color: #5d7064; font-size: 12px; }
.table-scroll { width: 100%; overflow-x: auto; margin: 15px 0; }
table { width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; }
th { padding: 12px 9px; color: #5e7264; background: #f6f8f6; border-bottom: 1px solid #dbe5df; font-size: 11px; white-space: nowrap; }
td { padding: 15px 9px; border-bottom: 1px solid #e8eee9; vertical-align: middle; }
.record-name { display: block; min-width: 100px; max-width: 190px; overflow-wrap: anywhere; }
.room-name { display: block; color: #687c6d; font-size: 11px; }
.actions { display: flex; gap: 5px; }
.empty { padding: 50px 15px; text-align: center; color: #637568; border: 1px dashed #c7d6cb; border-radius: 7px; margin: 20px 0; }
.bottom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 24px; }
.method p { font-size: 14px; }
.method .muted { font-size: 12px; }
.notice { padding: 13px 18px; border: 1px solid; border-radius: 8px; margin-bottom: 20px; font-size: 14px; overflow-wrap: anywhere; }
.error { color: #912d2d; border-color: #e9bcbc; background: #fff1f1; }
.success { color: #1b5a3f; border-color: #a6d2b3; background: #ebf8ee; }
.details { margin-top: 24px; }
dl { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 0; }
dt { color: #617365; font-size: 12px; }
dd { margin: 5px 0 0; font-size: 14px; overflow-wrap: anywhere; }
footer { text-align: center; padding: 25px; border-top: 1px solid #dbe5df; color: #66796d; font-size: 12px; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@media (max-width: 1100px) {
  .summary { grid-template-columns: repeat(2, 1fr); }
  .workspace { grid-template-columns: 290px minmax(0, 1fr); gap: 18px; }
  .filters { grid-template-columns: 1fr; gap: 3px; }
  .panel { padding: 20px; }
}
@media (max-width: 760px) {
  .header-inner { flex-direction: column; align-items: flex-start; padding: 16px 20px; gap: 14px; }
  nav { gap: 22px; }
  main { padding: 26px 16px 35px; }
  .workspace, .bottom-grid { grid-template-columns: 1fr; }
  .summary { gap: 10px; }
  .stat { padding: 15px; }
  .stat strong { font-size: 23px; }
  .filters { grid-template-columns: 1fr; }
  dl { grid-template-columns: 1fr 1fr; }
  .desktop-break { display: none; }
}
@media (max-width: 380px) {
  .summary, .two-fields, dl { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  :root { scroll-behavior: auto; }
}
```

## `client/src/utils/energy.js`

```javascript
export function dailyEnergy(appliance) {
  return appliance.powerWatts * appliance.quantity * appliance.hoursPerDay / 1000;
}

export function monthlyEnergy(appliance) {
  return dailyEnergy(appliance) * appliance.daysPerMonth;
}

export function calculateTotals(appliances, settings) {
  const dailyKwh = appliances.reduce((sum, item) => sum + dailyEnergy(item), 0);
  const monthlyKwh = appliances.reduce((sum, item) => sum + monthlyEnergy(item), 0);
  return {
    dailyKwh,
    monthlyKwh,
    monthlyCost: monthlyKwh * settings.unitRate + settings.fixedCharge
  };
}

export function money(value) {
  return `LKR ${value.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
```

## `client/test/energy.test.js`

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { dailyEnergy, monthlyEnergy, calculateTotals } from '../src/utils/energy.js';

const fan = { powerWatts: 75, quantity: 2, hoursPerDay: 8, daysPerMonth: 30 };

test('two 75 W fans use 1.2 kWh per operating day and 36 kWh per month', () => {
  assert.equal(dailyEnergy(fan), 1.2);
  assert.equal(monthlyEnergy(fan), 36);
});

test('monthly total uses each appliance usage period and adds fixed charge once', () => {
  const kettle = { powerWatts: 1500, quantity: 1, hoursPerDay: 0.25, daysPerMonth: 20 };
  const total = calculateTotals([fan, kettle], { unitRate: 30, fixedCharge: 100 });
  assert.equal(total.monthlyKwh, 43.5);
  assert.equal(total.monthlyCost, 1405);
});

test('zero operating hours use no energy', () => {
  assert.equal(monthlyEnergy({ ...fan, hoursPerDay: 0 }), 0);
});

test('empty inventory keeps the configured monthly fixed charge', () => {
  assert.deepEqual(calculateTotals([], { unitRate: 30, fixedCharge: 100 }), {
    dailyKwh: 0, monthlyKwh: 0, monthlyCost: 100
  });
});
```

## `client/vite.config.js`

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: { '/api': 'http://127.0.0.1:5000' }
  }
});
```

## `server/app.js`

```javascript
import express from 'express';
import mongoose from 'mongoose';
import appliances from './routes/appliances.js';
import settings from './routes/settings.js';
import Room from './models/Room.js';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));

app.get('/api/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({ database: connected ? 'connected' : 'disconnected' });
});

// Fail promptly if the database connection is lost during the demonstration.
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'Database unavailable. Please try again shortly.' });
  }
  next();
});
app.get('/api/rooms', async (req, res) => res.json(await Room.find().sort({ name: 1 })));
app.use('/api/appliances', appliances);
app.use('/api/settings', settings);
app.use((req, res) => res.status(404).json({ message: 'API route not found.' }));

// Express 5 sends rejected async route promises to this error handler.
app.use((error, req, res, next) => {
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      message: Object.values(error.errors).map(item => item.message).join(' ')
    });
  }
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON request.' });
  }
  if (error.status && error.status < 500) {
    return res.status(error.status).json({ message: error.status === 413 ? 'Request too large.' : error.message });
  }
  console.error('Request failed:', error.name);
  res.status(500).json({ message: 'Could not complete the request. Please try again.' });
});

export default app;
```

## `server/database.js`

```javascript
import mongoose from 'mongoose';
import Room from './models/Room.js';
import Setting from './models/Setting.js';

export async function connectDatabase(uri) {
  if (!uri) throw new Error('MONGODB_URI is missing.');

  // One connection for this local Express server; use the driver's pool defaults.
  // Do not reconnect inside each route.
  await mongoose.connect(uri);
  await Room.init();
  for (const name of ['Living Room', 'Bedroom', 'Kitchen', 'Other']) {
    await Room.updateOne({ name }, { $setOnInsert: { name } }, { upsert: true });
  }
  await Setting.updateOne(
    { _id: 'main' },
    { $setOnInsert: { unitRate: 30, fixedCharge: 0 } },
    { upsert: true }
  );
}
```

## `server/models/Appliance.js`

```javascript
import mongoose from 'mongoose';

const applianceSchema = new mongoose.Schema({
  name: {
    type: String, required: true, trim: true, minlength: 2, maxlength: 60
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true
  },
  powerWatts: { type: Number, required: true, min: 0.1, max: 100000 },
  quantity: {
    type: Number, required: true, min: 1, max: 1000,
    validate: { validator: Number.isInteger, message: 'Quantity must be a whole number.' }
  },
  hoursPerDay: { type: Number, required: true, min: 0, max: 24 },
  daysPerMonth: {
    type: Number, required: true, min: 1, max: 31,
    validate: { validator: Number.isInteger, message: 'Days must be a whole number.' }
  }
}, { timestamps: true });

// Energy is calculated from these inputs, so it cannot become stale after an edit.
export default mongoose.model('Appliance', applianceSchema);
```

## `server/models/Room.js`

```javascript
import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true }
});

export default mongoose.model('Room', roomSchema);
```

## `server/models/Setting.js`

```javascript
import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
  _id: { type: String, default: 'main' },
  unitRate: { type: Number, required: true, min: 0, max: 10000 },
  fixedCharge: { type: Number, required: true, min: 0, max: 1000000 }
});

export default mongoose.model('Setting', settingSchema);
```

## `server/package.json`

```json
{
  "name": "energy-estimator-server",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=24 <25" },
  "scripts": {
    "dev": "node --watch server.js",
    "start": "node server.js",
    "test": "node --test"
  },
  "dependencies": {
    "dotenv": "18.0.9",
    "express": "5.3.0",
    "mongoose": "9.11.4"
  }
}
```

## `server/routes/appliances.js`

```javascript
import { Router } from 'express';
import mongoose from 'mongoose';
import Appliance from '../models/Appliance.js';
import Room from '../models/Room.js';

const router = Router();

function inputError(message) {
  return Object.assign(new Error(message), { status: 400 });
}

async function getInput(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw inputError('Please send a valid appliance record.');
  }
  const { name, roomId, powerWatts, quantity, hoursPerDay, daysPerMonth } = body;
  if (typeof name !== 'string') throw inputError('Appliance name is required.');
  const numbers = [powerWatts, quantity, hoursPerDay, daysPerMonth];
  if (!numbers.every(value => typeof value === 'number' && Number.isFinite(value))) {
    throw inputError('Power, quantity, hours and days must be valid numbers.');
  }
  if (!mongoose.isObjectIdOrHexString(roomId) || !await Room.exists({ _id: roomId })) {
    throw inputError('Please select an existing room.');
  }
  // Only accept the fields the form is allowed to change.
  return { name, roomId, powerWatts, quantity, hoursPerDay, daysPerMonth };
}

router.param('id', (req, res, next, id) => {
  if (!mongoose.isObjectIdOrHexString(id)) {
    return next(inputError('Invalid appliance ID.'));
  }
  next();
});

router.get('/', async (req, res) => {
  const appliances = await Appliance.find().populate('roomId', 'name').sort({ createdAt: -1 });
  res.json(appliances);
});

router.get('/:id', async (req, res) => {
  const appliance = await Appliance.findById(req.params.id).populate('roomId', 'name');
  if (!appliance) return res.status(404).json({ message: 'Appliance not found.' });
  res.json(appliance);
});

router.post('/', async (req, res) => {
  const input = await getInput(req.body);
  const appliance = await Appliance.create(input);
  await appliance.populate('roomId', 'name');
  res.status(201).json(appliance);
});

router.put('/:id', async (req, res) => {
  const appliance = await Appliance.findById(req.params.id);
  if (!appliance) return res.status(404).json({ message: 'Appliance not found.' });
  Object.assign(appliance, await getInput(req.body));
  await appliance.save(); // Runs all schema validators on updates too.
  await appliance.populate('roomId', 'name');
  res.json(appliance);
});

router.delete('/:id', async (req, res) => {
  const appliance = await Appliance.findByIdAndDelete(req.params.id);
  if (!appliance) return res.status(404).json({ message: 'Appliance not found.' });
  res.json({ message: 'Appliance deleted.' });
});

export default router;
```

## `server/routes/settings.js`

```javascript
import { Router } from 'express';
import Setting from '../models/Setting.js';

const router = Router();

router.get('/', async (req, res) => {
  res.json(await Setting.findById('main'));
});

router.put('/', async (req, res) => {
  const { unitRate, fixedCharge } = req.body || {};
  if (![unitRate, fixedCharge].every(value => typeof value === 'number' && Number.isFinite(value))) {
    return res.status(400).json({ message: 'Rate and fixed charge must be valid numbers.' });
  }
  const setting = await Setting.findById('main');
  setting.unitRate = unitRate;
  setting.fixedCharge = fixedCharge;
  await setting.save();
  res.json(setting);
});

export default router;
```

## `server/server.js`

```javascript
import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';
import { connectDatabase } from './database.js';

try {
  await connectDatabase(process.env.MONGODB_URI);
  const port = Number(process.env.PORT || 5000);
  const server = app.listen(port, '127.0.0.1', () => {
    console.log('MongoDB connected.');
    console.log(`API ready at http://127.0.0.1:${port}`);
  });
  server.on('error', async () => {
    console.error('Could not start API. Check whether PORT is already in use.');
    await mongoose.disconnect();
    process.exit(1);
  });
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    }));
  }
} catch {
  console.error('Database setup failed. Check server/.env, your database user and Atlas IP access list.');
  await mongoose.disconnect();
  process.exit(1);
}
```

## `server/test/errors.test.js`

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import app from '../app.js';

test('disconnected database and malformed JSON return useful API errors', async () => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const health = await fetch(`${base}/api/health`);
    assert.equal(health.status, 503);
    assert.deepEqual(await health.json(), { database: 'disconnected' });
    const list = await fetch(`${base}/api/appliances`);
    assert.equal(list.status, 503);
    assert.match((await list.json()).message, /Database unavailable/);
    const invalid = await fetch(`${base}/api/appliances`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{'
    });
    assert.equal(invalid.status, 400);
    assert.equal((await invalid.json()).message, 'Invalid JSON request.');
    const missing = await fetch(`${base}/missing`);
    assert.equal(missing.status, 404);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
```

## `server/test/validation.test.js`

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Appliance from '../models/Appliance.js';
import Setting from '../models/Setting.js';

// These tests validate documents without needing database credentials.
const valid = {
  name: 'Ceiling fan', roomId: new mongoose.Types.ObjectId(),
  powerWatts: 75, quantity: 2, hoursPerDay: 8, daysPerMonth: 30
};

test('valid appliance data passes and trims its name', async () => {
  const record = new Appliance({ ...valid, name: '  Ceiling fan  ' });
  await record.validate();
  assert.equal(record.name, 'Ceiling fan');
});

test('invalid ranges and fractional counts are rejected', async () => {
  for (const change of [
    { powerWatts: 0 }, { powerWatts: -10 }, { quantity: 1.5 },
    { hoursPerDay: 25 }, { hoursPerDay: -1 }, { daysPerMonth: 32 },
    { daysPerMonth: 1.5 }
  ]) {
    await assert.rejects(new Appliance({ ...valid, ...change }).validate(), {
      name: 'ValidationError'
    });
  }
});

test('missing room and blank names are rejected', async () => {
  await assert.rejects(new Appliance({ ...valid, roomId: undefined }).validate());
  await assert.rejects(new Appliance({ ...valid, name: '  ' }).validate());
});

test('zero hours and decimal daily hours are valid', async () => {
  await new Appliance({ ...valid, hoursPerDay: 0 }).validate();
  await new Appliance({ ...valid, hoursPerDay: 0.25 }).validate();
});

test('tariff values must be nonnegative', async () => {
  await new Setting({ unitRate: 30, fixedCharge: 100 }).validate();
  await assert.rejects(new Setting({ unitRate: -1, fixedCharge: 100 }).validate());
  await assert.rejects(new Setting({ unitRate: 30, fixedCharge: -1 }).validate());
});
```

## `server/.env.example`

```dotenv
PORT=5000
MONGODB_URI=mongodb+srv://YOUR_DATABASE_USER:YOUR_ENCODED_PASSWORD@YOUR_CLUSTER.mongodb.net/energy_estimator?retryWrites=true&w=majority
```
