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
