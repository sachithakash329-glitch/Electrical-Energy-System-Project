// Model doubles for HTTP tests when no disposable MongoDB is available.
// Documents still use the real Mongoose schemas for casting and validation.
import mongoose from 'mongoose';
import User from '../models/User.js';
import Session from '../models/Session.js';
import Room from '../models/Room.js';
import Appliance from '../models/Appliance.js';
import Setting from '../models/Setting.js';

export function memoryModels(t) {
  const users = new Map(); const sessions = new Map(); const appliances = new Map(); const settings = new Map();
  const rooms = ['Bedroom', 'Kitchen', 'Living Room', 'Other'].map(name => ({ _id: new mongoose.Types.ObjectId(), name }));
  const matches = (record, query) => Object.entries(query).every(([key, value]) => {
    if (value && typeof value === 'object' && '$gt' in value) return record[key] > value.$gt;
    if (value === null) return record[key] == null;
    return String(record[key]) === String(value);
  });
  const pick = (map, query) => [...map.values()].find(value => matches(value, query)) || null;
  const query = (value, populate) => ({
    then: (resolve, reject) => Promise.resolve(value).then(resolve, reject),
    select: async () => value,
    populate: async () => value ? await populate(value) : null
  });
  async function make(Model, input, map) {
    const document = new Model(input);
    await document.validate();
    const record = document.toObject();
    map.set(record._id.toString(), record);
    return record;
  }
  function applianceRecord(raw) {
    if (!raw) return null;
    const record = { ...raw };
    Object.defineProperties(record, {
      populate: { value: async () => {
        record.roomId = rooms.find(room => String(room._id) === String(raw.roomId)); return record;
      } },
      save: { value: async () => {
        const document = new Appliance({ ...record, roomId: record.roomId?._id || record.roomId });
        await document.validate(); Object.assign(raw, document.toObject()); return record;
      } }
    });
    return record;
  }
  function settingRecord(raw) {
    if (!raw) return null;
    const record = { ...raw };
    Object.defineProperty(record, 'save', { value: async () => {
      const document = new Setting(record); await document.validate(); Object.assign(raw, document.toObject()); return record;
    } });
    return record;
  }
  const oldState = Object.getOwnPropertyDescriptor(mongoose.connection, 'readyState');
  Object.defineProperty(mongoose.connection, 'readyState', { configurable: true, get: () => 1 });
  t.after(() => {
    if (oldState) Object.defineProperty(mongoose.connection, 'readyState', oldState);
    else delete mongoose.connection.readyState;
  });
  t.mock.method(User, 'exists', async filter => pick(users, filter));
  t.mock.method(User, 'create', async input => {
    if (pick(users, { email: input.email.toLowerCase() })) throw Object.assign(new Error('Duplicate email'), { code: 11000 });
    return make(User, input, users);
  });
  t.mock.method(User, 'findOne', filter => query(pick(users, filter)));
  t.mock.method(User, 'findById', id => query(users.get(String(id)) || null));
  t.mock.method(User, 'countDocuments', async () => users.size);
  t.mock.method(Session, 'create', input => make(Session, input, sessions));
  t.mock.method(Session, 'deleteOne', async filter => ({ deletedCount: sessions.delete(filter._id) ? 1 : 0 }));
  t.mock.method(Session, 'findOne', filter => query(pick(sessions, filter), record => ({ ...record, userId: users.get(String(record.userId)) })));
  t.mock.method(Session, 'updateOne', async (filter, update) => {
    const record = pick(sessions, filter); if (record) Object.assign(record, update.$set); return { modifiedCount: record ? 1 : 0 };
  });
  t.mock.method(Room, 'find', () => ({ sort: async () => rooms }));
  t.mock.method(Room, 'exists', async filter => rooms.find(room => matches(room, filter)) || null);
  t.mock.method(Appliance, 'create', async input => applianceRecord(await make(Appliance, input, appliances)));
  t.mock.method(Appliance, 'find', filter => ({ populate: () => ({ sort: async () => Promise.all(
    [...appliances.values()].filter(record => matches(record, filter)).map(record => applianceRecord(record).populate())
  ) }) }));
  t.mock.method(Appliance, 'findOne', filter => query(applianceRecord(pick(appliances, filter)), record => record.populate()));
  t.mock.method(Appliance, 'findOneAndDelete', async filter => {
    const record = pick(appliances, filter); if (record) appliances.delete(record._id.toString()); return record;
  });
  t.mock.method(Appliance.collection, 'insertOne', async input => {
    const record = { ...input, _id: new mongoose.Types.ObjectId() }; appliances.set(record._id.toString(), record); return { insertedId: record._id };
  });
  t.mock.method(Setting, 'findOneAndUpdate', async (filter, update) => {
    let record = pick(settings, filter);
    if (!record) record = await make(Setting, update.$setOnInsert, settings);
    return settingRecord(record);
  });
  t.mock.method(Setting, 'findOne', async filter => settingRecord(pick(settings, filter)));
  t.mock.method(Setting, 'countDocuments', async filter => [...settings.values()].filter(record => matches(record, filter)).length);
}
