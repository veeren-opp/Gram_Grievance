import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let isConnected = false;
let isEmbedded = false;
let memoryServerInstance = null;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (uri && uri.trim() && !uri.includes('<username>')) {
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      isConnected = true;
      isEmbedded = false;
      console.log(`✅ MongoDB Atlas connected to host: ${conn.connection.host}, database: ${conn.connection.name}`);
      await seedInitialData();
      return true;
    } catch (error) {
      console.warn('⚠️  Could not connect to specified MONGODB_URI:', error.message);
      console.log('🔄 Falling back to built-in embedded MongoDB engine for seamless execution...');
    }
  }

  // Auto-start embedded MongoDB server so application is 100% functional out-of-the-box
  try {
    console.log('🚀 Starting built-in MongoDB engine...');
    memoryServerInstance = await MongoMemoryServer.create({
      instance: {
        dbName: 'gramsetu',
      },
    });
    const memoryUri = memoryServerInstance.getUri();
    const conn = await mongoose.connect(memoryUri);
    isConnected = true;
    isEmbedded = true;
    console.log(`✅ Built-in MongoDB connected successfully at: ${memoryUri}`);

    // Seed baseline sample data so user immediately sees live data
    await seedInitialData();

    return true;
  } catch (err) {
    console.error('❌ Failed to initialize MongoDB:', err);
    isConnected = false;
    return false;
  }
};

/**
 * Baseline data seed for immediate college presentation / test
 */
async function seedInitialData() {
  try {
    const User = (await import('../models/User.js')).default;
    const Complaint = (await import('../models/Complaint.js')).default;
    const Counter = (await import('../models/Counter.js')).default;
    const bcrypt = (await import('bcryptjs')).default;
    const { restorePersistentData, persistUser, persistComplaint } = await import('./persistence.js');

    // First restore any previously registered users/complaints from persistent storage
    await restorePersistentData(User, Complaint, Counter);

    const demoUser = await User.findOne({ mobile: '9876543210' });
    let citizens = [];
    if (!demoUser) {
      console.log('🌱 Seeding baseline demo citizen accounts...');
      const passwordHash = await bcrypt.hash('password123', 10);

      citizens = await User.insertMany([
        {
          fullName: 'Rameshwar Patil',
          mobile: '9876543210',
          email: 'rameshwar@example.com',
          passwordHash,
          role: 'citizen',
          state: 'Maharashtra',
          district: 'Buldhana',
          gramPanchayat: 'XYZ Gram Panchayat',
        },
        {
          fullName: 'Sunita Deshmukh',
          mobile: '9876543211',
          email: 'sunita@example.com',
          passwordHash,
          role: 'citizen',
          state: 'Maharashtra',
          district: 'Buldhana',
          gramPanchayat: 'XYZ Gram Panchayat',
        },
      ]);
    } else {
      citizens = await User.find({ role: 'citizen' }).limit(2);
    }

    const complaintCount = await Complaint.countDocuments();
    if (complaintCount === 0 && citizens.length > 0) {

      const currentYear = new Date().getFullYear();
      await Counter.findByIdAndUpdate(
        `complaints_${currentYear}`,
        { $set: { seq: 3 } },
        { upsert: true }
      );

      await Complaint.insertMany([
        {
          complaintId: `CMP-${currentYear}-000001`,
          citizenId: citizens[0]._id,
          title: 'Damaged road with potholes near ZP Primary School',
          category: 'Roads',
          location: 'Approach road opposite Z.P. School, East Ward',
          description: 'Large potholes on the road cause accidents during rains for schoolchildren and two-wheelers.',
          photoUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800',
          photoPublicId: 'sample_road_1',
          state: 'Maharashtra',
          district: 'Buldhana',
          gramPanchayat: 'XYZ Gram Panchayat',
          status: 'In Progress',
          adminRemark: 'Site inspection conducted by Gram Sevak. Road gravel leveling approved under civic maintenance.',
        },
        {
          complaintId: `CMP-${currentYear}-000002`,
          citizenId: citizens[1]._id,
          title: 'Street light fused at Hanuman Temple Chowk',
          category: 'Street Lights',
          location: 'Main Temple Chowk, Pole No. 4',
          description: 'The LED fixture has been non-functional for over 10 days, causing complete darkness at night.',
          photoUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=800',
          photoPublicId: 'sample_light_1',
          state: 'Maharashtra',
          district: 'Buldhana',
          gramPanchayat: 'XYZ Gram Panchayat',
          status: 'Under Review',
          adminRemark: 'Maintenance electrician notified to replace the LED panel.',
        },
        {
          complaintId: `CMP-${currentYear}-000003`,
          citizenId: citizens[0]._id,
          title: 'Drinking water pipeline joint leak wasting water',
          category: 'Water Supply',
          location: 'Near Community Overhead Water Tank',
          description: 'Continuous leaking from the secondary line joint is reducing water pressure to nearby homes.',
          photoUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800',
          photoPublicId: 'sample_water_1',
          state: 'Maharashtra',
          district: 'Buldhana',
          gramPanchayat: 'XYZ Gram Panchayat',
          status: 'Resolved',
          adminRemark: 'Joint replaced and valve tightened by village water team.',
          resolvedAt: new Date(),
        },
      ]);
      console.log('✅ Initial demonstration data ready.');
    }
  } catch (e) {
    console.error('Error seeding initial data:', e);
  }
}

export const getDBStatus = () => {
  const readyState = mongoose.connection.readyState;
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return {
    connected: readyState === 1,
    state: stateMap[readyState] || 'unknown',
    database: mongoose.connection.name || 'gramsetu',
    host: mongoose.connection.host || 'localhost',
    type: isEmbedded ? 'embedded-mongodb' : 'atlas',
  };
};

export default connectDB;
