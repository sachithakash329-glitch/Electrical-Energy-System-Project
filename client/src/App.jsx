import { useEffect, useRef, useState } from 'react';
import { api } from './api.js';
import ApplianceForm from './components/ApplianceForm.jsx';
import ApplianceTable from './components/ApplianceTable.jsx';
import TariffForm from './components/TariffForm.jsx';
import AuthPage from './components/AuthPage.jsx';
import { calculateTotals, dailyEnergy, monthlyEnergy, money } from './utils/energy.js';

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [sessionError, setSessionError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const checkVersion = useRef(0);

  useEffect(() => {
    let active = true;
    async function checkSession() {
      const version = ++checkVersion.current;
      try {
        const result = await api('/auth/me');
        if (active && version === checkVersion.current) { setUser(result.user); setSessionError(''); }
      } catch (error) {
        if (active && version === checkVersion.current) {
          if (error.status === 401) { setUser(null); setSessionError(''); }
          else setSessionError(error.message);
        }
      } finally { if (active) setChecking(false); }
    }
    function sessionExpired() {
      checkVersion.current += 1;
      setUser(null); setSessionError('Your session ended. Please log in again.');
    }
    checkSession();
    window.addEventListener('focus', checkSession);
    window.addEventListener('energy:session-expired', sessionExpired);
    return () => {
      active = false;
      window.removeEventListener('focus', checkSession);
      window.removeEventListener('energy:session-expired', sessionExpired);
    };
  }, []);

  function authenticated(account) {
    checkVersion.current += 1;
    setSessionError(''); setUser(account);
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }
  async function logout() {
    setLoggingOut(true); setSessionError('');
    try {
      await api('/auth/logout', 'POST');
      checkVersion.current += 1; setUser(null);
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    } catch (error) { setSessionError(error.message); }
    finally { setLoggingOut(false); }
  }

  if (checking) return <div className="auth-loading" role="status"><span className="brand-mark">EE</span><p>Opening your energy workspace...</p></div>;
  if (!user) return <AuthPage onAuthenticated={authenticated} serviceError={sessionError} />;
  return <Dashboard key={user._id} user={user} onLogout={logout} loggingOut={loggingOut} sessionError={sessionError} />;
}

function Dashboard({ user, onLogout, loggingOut, sessionError }) {
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
          <div className="account-menu"><span title={user.email}>{user.fullName}</span><button type="button" className="secondary small" onClick={onLogout} disabled={loggingOut}>{loggingOut ? 'Logging out...' : 'Log out'}</button></div>
        </div>
      </header>
      <main>
        <section className="intro" id="dashboard">
          <p className="eyebrow">WELCOME, {user.fullName}</p>
          <h1>Electrical Energy Consumption<br className="desktop-break" /> and Cost Estimation System</h1>
          <p>Keep track of your appliances, estimate their energy use and plan your monthly cost.</p>
          <p className="account-context">{[user.householdName || 'Your personal energy workspace', user.city, user.householdSize ? `${user.householdSize} household members` : ''].filter(Boolean).join(' · ')}</p>
        </section>
        {sessionError && <div className="notice error" role="alert">{sessionError}</div>}
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
      <footer>Electrical Energy System Project · Estimates based on your appliance data</footer>
    </>
  );
}
