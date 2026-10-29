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
