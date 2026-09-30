import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../../data');
const storePath = path.join(dataDir, 'persistent_store.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function readStore() {
  try {
    if (!fs.existsSync(storePath)) {
      return { users: [], complaints: [], counters: [] };
    }
    const raw = fs.readFileSync(storePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading persistent store:', err);
    return { users: [], complaints: [], counters: [] };
  }
}

function writeStore(data) {
  try {
    fs.writeFileSync(storePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing persistent store:', err);
  }
}

/**
 * Permanently save a user record to disk
 */
export const persistUser = (userDoc) => {
  try {
    const store = readStore();
    const docObj = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
    
    // Check if user already exists in store by _id or mobile
    const existingIndex = store.users.findIndex(
      (u) => (u._id && docObj._id && u._id.toString() === docObj._id.toString()) || u.mobile === docObj.mobile
    );

    if (existingIndex >= 0) {
      store.users[existingIndex] = docObj;
    } else {
      store.users.push(docObj);
    }
    writeStore(store);
  } catch (err) {
    console.warn('Warning: Could not persist user to backup store:', err.message);
  }
};

/**
 * Permanently save a complaint record to disk
 */
export const persistComplaint = (complaintDoc) => {
  try {
    const store = readStore();
    const docObj = complaintDoc.toObject ? complaintDoc.toObject() : { ...complaintDoc };

    const existingIndex = store.complaints.findIndex(
      (c) => (c._id && docObj._id && c._id.toString() === docObj._id.toString()) || c.complaintId === docObj.complaintId
    );

    if (existingIndex >= 0) {
      store.complaints[existingIndex] = docObj;
    } else {
      store.complaints.push(docObj);
    }
    writeStore(store);
  } catch (err) {
    console.warn('Warning: Could not persist complaint to backup store:', err.message);
  }
};

/**
 * Restore persisted records into MongoDB models upon startup
 */
export const restorePersistentData = async (UserModel, ComplaintModel, CounterModel) => {
  try {
    const store = readStore();

    // 1. Restore Users
    if (store.users && Array.isArray(store.users) && store.users.length > 0) {
      for (const u of store.users) {
        const existing = await UserModel.findOne({ mobile: u.mobile });
        if (!existing) {
          const { __v, ...userToInsert } = u;
          await UserModel.create(userToInsert);
        }
      }
      console.log(`📦 Restored ${store.users.length} permanently registered user(s) into MongoDB.`);
    }

    // 2. Restore Complaints
    if (store.complaints && Array.isArray(store.complaints) && store.complaints.length > 0) {
      for (const c of store.complaints) {
        const existing = await ComplaintModel.findOne({ complaintId: c.complaintId });
        if (!existing) {
          const { __v, ...complaintToInsert } = c;
          await ComplaintModel.create(complaintToInsert);
        }
      }
      console.log(`📦 Restored ${store.complaints.length} registered complaint(s) into MongoDB.`);
    }
  } catch (err) {
    console.error('Error restoring persistent records to MongoDB:', err);
  }
};
