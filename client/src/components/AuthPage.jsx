import { useState } from 'react';
import { api } from '../api.js';

const empty = { fullName: '', email: '', password: '', confirmPassword: '', householdName: '', city: '', householdSize: '' };

export default function AuthPage({ onAuthenticated, serviceError }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(empty);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const registering = mode === 'register';

  function change(event) { setForm(previous => ({ ...previous, [event.target.name]: event.target.value })); }
  function switchMode(next) {
    setMode(next); setError(''); setShowPassword(false);
    setForm(previous => ({ ...previous, password: '', confirmPassword: '' }));
  }
  async function submit(event) {
    event.preventDefault(); setError('');
    if (registering && form.password !== form.confirmPassword) {
      setError('The passwords do not match. Please enter them again.'); return;
    }
    setBusy(true);
    try {
      const payload = registering ? {
        fullName: form.fullName.trim(), email: form.email.trim(), password: form.password,
        householdName: form.householdName.trim(), city: form.city.trim(),
        householdSize: form.householdSize === '' ? null : Number(form.householdSize)
      } : { email: form.email.trim(), password: form.password };
      const result = await api(`/auth/${registering ? 'register' : 'login'}`, 'POST', payload);
      onAuthenticated(result.user);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="auth-page">
      <header className="auth-header">
        <a className="brand" href="#"><span className="brand-mark">EE</span>Energy Estimator</a>
        <span className="auth-header-note">Electrical Energy System Project</span>
      </header>
      <main className="auth-layout">
        <section className="auth-intro" aria-label="About the application">
          <p className="eyebrow">SMARTER HOUSEHOLD ENERGY PLANNING</p>
          <h1>Know your energy.<br /><span>Plan your cost.</span></h1>
          <p className="auth-description">One place for your appliances, daily usage and monthly energy estimate. Make the numbers work for your home.</p>
          <div className="auth-energy-art" aria-hidden="true">
            <div className="energy-orbit orbit-outer"></div><div className="energy-orbit orbit-inner"></div>
            <div className="energy-core"><svg viewBox="0 0 64 64" fill="none"><path d="M37 7 15 36h15l-3 21 22-30H34l3-20Z" fill="currentColor" /></svg></div>
            <span className="energy-caption">A clearer view of your energy</span>
          </div>
          <ul className="auth-features">
            <li><span className="feature-dot"></span><div><strong>Your personal dashboard</strong><p>See the appliances and estimates saved to your account.</p></div></li>
            <li><span className="feature-dot"></span><div><strong>Simple monthly planning</strong><p>Compare energy use and choose your assumed tariff.</p></div></li>
          </ul>
        </section>
        <section className="panel auth-card" aria-labelledby="auth-title">
          <div className="auth-switch" role="group" aria-label="Choose login or account creation">
            <button type="button" className={registering ? '' : 'is-active'} aria-pressed={!registering} onClick={() => switchMode('login')} disabled={busy}>Log in</button>
            <button type="button" className={registering ? 'is-active' : ''} aria-pressed={registering} onClick={() => switchMode('register')} disabled={busy}>Create account</button>
          </div>
          <p className="eyebrow">{registering ? 'YOUR ENERGY JOURNEY STARTS HERE' : 'YOUR HOME. YOUR ENERGY.'}</p>
          <h2 id="auth-title">{registering ? 'Create your account' : 'Welcome back'}</h2>
          <p className="auth-form-description">{registering ? 'Set up your profile and start planning your energy use.' : 'Log in to open your personal energy dashboard.'}</p>
          {(error || serviceError) && <div className="notice error" role="alert">{error || serviceError}</div>}
          <form onSubmit={submit}>
            <fieldset disabled={busy}>
              {registering && <><label htmlFor="auth-name">Full name</label><input id="auth-name" name="fullName" value={form.fullName} onChange={change} autoComplete="name" minLength="2" maxLength="80" placeholder="Your full name" required /></>}
              <label htmlFor="auth-email">Email address</label>
              <input id="auth-email" name="email" type="email" value={form.email} onChange={change} autoComplete="email" maxLength="254" placeholder="you@example.com" required />
              <label htmlFor="auth-password">Password</label>
              <input id="auth-password" name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={change} autoComplete={registering ? 'new-password' : 'current-password'} minLength="12" maxLength="128" placeholder={registering ? 'At least 12 characters' : 'Enter your password'} required aria-describedby={registering ? 'password-help' : undefined} />
              {registering && <><p className="muted password-help" id="password-help">Use 12–128 characters. A long, unique passphrase works well.</p><label htmlFor="auth-confirm">Confirm password</label><input id="auth-confirm" name="confirmPassword" type={showPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={change} autoComplete="new-password" minLength="12" maxLength="128" placeholder="Enter your password again" required /></>}
              <label className="check-row"><input type="checkbox" checked={showPassword} onChange={event => setShowPassword(event.target.checked)} /><span>Show password{registering ? 's' : ''}</span></label>
              {registering && <details className="household-details">
                <summary>Household details <span>Optional</span></summary>
                <div className="household-fields">
                  <label htmlFor="auth-household">Household name</label><input id="auth-household" name="householdName" value={form.householdName} onChange={change} maxLength="60" placeholder="e.g. My home" />
                  <div className="two-fields"><div><label htmlFor="auth-city">City / district</label><input id="auth-city" name="city" value={form.city} onChange={change} maxLength="80" placeholder="e.g. Galle" autoComplete="address-level2" /></div><div><label htmlFor="auth-size">Household members</label><input id="auth-size" name="householdSize" type="number" value={form.householdSize} onChange={change} min="1" max="50" step="1" placeholder="e.g. 4" /></div></div>
                  <p className="muted">These details label your dashboard. Estimates use your appliance inputs.</p>
                </div>
              </details>}
              <button className="auth-submit" type="submit">{busy ? 'Please wait...' : registering ? 'Create account & open dashboard' : 'Log in to dashboard'}<span aria-hidden="true">→</span></button>
            </fieldset>
          </form>
          <p className="auth-privacy">Your appliances and tariff settings are saved separately for your account. Sessions expire after 24 hours.</p>
        </section>
      </main>
      <footer>Electrical Energy System Project · Personal energy planning</footer>
    </div>
  );
}
