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
