import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import User from '../models/User.js';
import Complaint from '../models/Complaint.js';
import Counter from '../models/Counter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const seedDatabase = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ Cannot run seed script: MONGODB_URI is not set in environment or .env file.');
    process.exit(1);
  }

  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB.');

    // Clear existing sample demo data if desired or confirm
    console.log('🧹 Clearing previous sample complaints and sample citizens (mobile starting with 98765)...');
    await User.deleteMany({ mobile: { $in: ['9876543210', '9876543211', '9876543212'] } });
    await Complaint.deleteMany({ location: /\[Sample Demo Data\]/ });

    // Hash common test password: "password123"
    const passwordHash = await bcrypt.hash('password123', 10);

    console.log('👤 Seeding sample citizens...');
    const citizens = await User.insertMany([
      {
        fullName: 'Rameshwar Patil',
        mobile: '9876543210',
        email: 'rameshwar.patil@example.com',
        passwordHash,
        role: 'citizen',
        state: 'Maharashtra',
        district: 'Buldhana',
        gramPanchayat: 'XYZ Gram Panchayat',
      },
      {
        fullName: 'Sunita Deshmukh',
        mobile: '9876543211',
        email: 'sunita.deshmukh@example.com',
        passwordHash,
        role: 'citizen',
        state: 'Maharashtra',
        district: 'Buldhana',
        gramPanchayat: 'XYZ Gram Panchayat',
      },
      {
        fullName: 'Ganesh Jadhav',
        mobile: '9876543212',
        email: 'ganesh.jadhav@example.com',
        passwordHash,
        role: 'citizen',
        state: 'Maharashtra',
        district: 'Buldhana',
        gramPanchayat: 'XYZ Gram Panchayat',
      },
    ]);

    console.log('📋 Initializing complaint ID counter...');
    const currentYear = new Date().getFullYear();
    await Counter.findByIdAndUpdate(
      `complaints_${currentYear}`,
      { $set: { seq: 4 } },
      { upsert: true }
    );

    console.log('📝 Seeding sample complaints...');
    await Complaint.insertMany([
      {
        complaintId: `CMP-${currentYear}-000001`,
        citizenId: citizens[0]._id,
        title: 'Main village road damaged near Primary School',
        category: 'Roads',
        location: 'Near Zilla Parishad Primary School [Sample Demo Data]',
        description: 'Large potholes on the main approach road are causing accidents for schoolchildren and two-wheelers during rainfall.',
        photoUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800',
        photoPublicId: 'sample_road_pothole',
        state: 'Maharashtra',
        district: 'Buldhana',
        gramPanchayat: 'XYZ Gram Panchayat',
        status: 'In Progress',
        adminRemark: 'Inspection completed by Gram Sevak. Road repair gravel tender approved.',
      },
      {
        complaintId: `CMP-${currentYear}-000002`,
        citizenId: citizens[1]._id,
        title: 'Street light not functioning at Hanuman Temple chowk',
        category: 'Street Lights',
        location: 'Hanuman Temple Junction [Sample Demo Data]',
        description: 'Two LED street lights on the pole have been fused for the past 10 days, leaving the junction in total darkness at night.',
        photoUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=800',
        photoPublicId: 'sample_street_light',
        state: 'Maharashtra',
        district: 'Buldhana',
        gramPanchayat: 'XYZ Gram Panchayat',
        status: 'Under Review',
        adminRemark: 'Noted. Electrician scheduled to replace bulbs tomorrow morning.',
      },
      {
        complaintId: `CMP-${currentYear}-000003`,
        citizenId: citizens[2]._id,
        title: 'Pipeline leakage causing low drinking water pressure',
        category: 'Water Supply',
        location: 'Near Community Water Tank, Ward East [Sample Demo Data]',
        description: 'A major leak in the main distribution valve is wasting clean drinking water and households are not getting sufficient pressure.',
        photoUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800',
        photoPublicId: 'sample_water_leak',
        state: 'Maharashtra',
        district: 'Buldhana',
        gramPanchayat: 'XYZ Gram Panchayat',
        status: 'Resolved',
        adminRemark: 'Valve replaced and pipe joint sealed by village water maintenance team on 28th.',
        resolvedAt: new Date(),
      },
      {
        complaintId: `CMP-${currentYear}-000004`,
        citizenId: citizens[0]._id,
        title: 'Clogged drainage ditch overflowing onto walkway',
        category: 'Drainage',
        location: 'Opposite Village Dispensary [Sample Demo Data]',
        description: 'Open drainage gutter is blocked with plastic waste and silt, causing foul smell and health hazard near the dispensary.',
        photoUrl: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800',
        photoPublicId: 'sample_drainage',
        state: 'Maharashtra',
        district: 'Buldhana',
        gramPanchayat: 'XYZ Gram Panchayat',
        status: 'Submitted',
        adminRemark: '',
      },
    ]);

    console.log('✅ Demo seed completed successfully!');
    console.log('Sample citizen login credentials:');
    console.log('  Mobile: 9876543210  | Password: password123');
    console.log('  Mobile: 9876543211  | Password: password123');
    console.log('Admin login credentials:');
    console.log('  Username: any name  | Password: GramSetu@2026');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during seeding:', err);
    process.exit(1);
  }
};

seedDatabase();
