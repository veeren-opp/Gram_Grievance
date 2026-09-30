import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getDBStatus } from '../config/db.js';
import { persistUser } from '../config/persistence.js';

const getJwtSecret = () => process.env.JWT_SECRET || 'gramsetu_super_secret_jwt_key_2026';
const getAdminPassword = () => process.env.ADMIN_PASSWORD || 'GramSetu@2026';

const ensureDatabaseConnected = (res) => {
  const dbStatus = getDBStatus();
  if (!dbStatus.connected) {
    res.status(503).json({
      success: false,
      error: 'MongoDB is currently disconnected. Please configure MONGODB_URI in your environment or .env file to enable registration, login, and database operations.',
    });
    return false;
  }
  return true;
};

/**
 * Citizen Registration
 */
export const register = async (req, res) => {
  try {
    if (!ensureDatabaseConnected(res)) return;

    const { fullName, mobile, email, password, confirmPassword } = req.body;

    // Field presence checks
    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ success: false, error: 'Full Name is required.' });
    }

    if (!mobile || !mobile.trim()) {
      return res.status(400).json({ success: false, error: 'Mobile Number is required.' });
    }

    // Indian mobile format validation: 10 digits starting with 6-9
    const mobileRegex = /^[6-9]\d{9}$/;
    const cleanMobile = mobile.trim();
    if (!mobileRegex.test(cleanMobile)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Mobile Number. Please provide a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9).',
      });
    }

    // Email format check if provided
    let cleanEmail = null;
    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      cleanEmail = email.trim().toLowerCase();
      if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
      }
    }

    // Password validation
    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters in length.',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Passwords do not match. Please verify your password confirmation.',
      });
    }

    // Check duplicate mobile
    const existingMobile = await User.findOne({ mobile: cleanMobile });
    if (existingMobile) {
      return res.status(409).json({
        success: false,
        error: 'A citizen account with this mobile number is already registered. Please login.',
      });
    }

    // Check duplicate email if email provided
    if (cleanEmail) {
      const existingEmail = await User.findOne({ email: cleanEmail });
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          error: 'An account with this email address already exists.',
        });
      }
    }

    // Hash password with bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user with fixed location
    const userData = {
      fullName: fullName.trim(),
      mobile: cleanMobile,
      passwordHash,
      role: 'citizen',
      state: 'Maharashtra',
      district: 'Buldhana',
      gramPanchayat: 'XYZ Gram Panchayat',
    };
    if (cleanEmail) {
      userData.email = cleanEmail;
    }

    const newUser = new User(userData);

    const savedUser = await newUser.save();
    persistUser(savedUser);

    // Create JWT
    const token = jwt.sign(
      {
        userId: savedUser._id,
        role: savedUser.role,
        fullName: savedUser.fullName,
        mobile: savedUser.mobile,
      },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Citizen registered successfully.',
      token,
      user: {
        id: savedUser._id,
        fullName: savedUser.fullName,
        mobile: savedUser.mobile,
        email: savedUser.email,
        role: savedUser.role,
        state: savedUser.state,
        district: savedUser.district,
        gramPanchayat: savedUser.gramPanchayat,
        createdAt: savedUser.createdAt,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred during registration. Please try again.',
    });
  }
};

/**
 * Citizen Login (Mobile Number or Email + Password)
 */
export const login = async (req, res) => {
  try {
    if (!ensureDatabaseConnected(res)) return;

    const { identifier, password } = req.body;

    if (!identifier || !identifier.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please enter your Mobile Number or Email Address.',
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required.',
      });
    }

    const cleanIdentifier = identifier.trim();

    // Extract digits if it looks like a phone number (e.g. +91 98765-43210 or 09876543210)
    const digitsOnly = cleanIdentifier.replace(/\D/g, '');
    let normalizedMobile = '';
    if (digitsOnly.length === 10) {
      normalizedMobile = digitsOnly;
    } else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
      normalizedMobile = digitsOnly.slice(2);
    } else if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
      normalizedMobile = digitsOnly.slice(1);
    }

    // Build query conditions
    const escapedName = cleanIdentifier.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const queryConditions = [
      { mobile: cleanIdentifier },
      { email: cleanIdentifier.toLowerCase() },
      { fullName: new RegExp(`^${escapedName}$`, 'i') },
    ];
    if (normalizedMobile && normalizedMobile !== cleanIdentifier) {
      queryConditions.push({ mobile: normalizedMobile });
    }

    // Search user
    let user = await User.findOne({
      $or: queryConditions,
      role: 'citizen',
    });

    if (!user) {
      // Check if user is an admin accidentally logging into citizen portal
      const adminUser = await User.findOne({
        $or: queryConditions,
        role: 'admin',
      });

      if (adminUser) {
        return res.status(403).json({
          success: false,
          error: 'This account is registered as a Panchayat Administrator. Please use the Panchayat Admin Portal to log in.',
        });
      }

      return res.status(401).json({
        success: false,
        error: `No citizen account found matching "${cleanIdentifier}". Please check your mobile or register a new resident account.`,
      });
    }

    // Verify bcrypt password hash
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Incorrect password.',
      });
    }

    // Sign JWT
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        fullName: user.fullName,
        mobile: user.mobile,
      },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        mobile: user.mobile,
        email: user.email,
        role: user.role,
        state: user.state,
        district: user.district,
        gramPanchayat: user.gramPanchayat,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred during login. Please try again.',
    });
  }
};

/**
 * Register New Panchayat Officer / Admin
 */
export const adminRegister = async (req, res) => {
  try {
    if (!ensureDatabaseConnected(res)) return;

    const { fullName, designation, mobile, email, adminPasscode, password, confirmPassword } = req.body;

    // Verify master admin authorization passcode
    const expectedPasscode = getAdminPassword();
    if (!adminPasscode || adminPasscode !== expectedPasscode) {
      return res.status(403).json({
        success: false,
        error: 'Invalid Administrative Passcode. Only authorized Panchayat officials with master access can register.',
      });
    }

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ success: false, error: 'Officer Full Name is required.' });
    }

    if (!mobile || !mobile.trim()) {
      return res.status(400).json({ success: false, error: 'Official Mobile Number is required.' });
    }

    const mobileRegex = /^[6-9]\d{9}$/;
    const cleanMobile = mobile.trim();
    if (!mobileRegex.test(cleanMobile)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid 10-digit Indian mobile number.',
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters in length.',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Passwords do not match.',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ mobile: cleanMobile });
    if (existingUser) {
      if (existingUser.role === 'admin') {
        return res.status(409).json({
          success: false,
          error: 'An administrator account with this mobile number is already registered. Please log in.',
        });
      }
      // Upgrade citizen to admin if they are authorized
      existingUser.role = 'admin';
      existingUser.designation = designation?.trim() || 'Gram Panchayat Officer';
      existingUser.passwordHash = await bcrypt.hash(password, 10);
      await existingUser.save();

      const token = jwt.sign(
        {
          userId: existingUser._id,
          role: 'admin',
          username: existingUser.fullName,
          designation: existingUser.designation,
          gramPanchayat: existingUser.gramPanchayat,
          district: existingUser.district,
          state: existingUser.state,
        },
        getJwtSecret(),
        { expiresIn: '3d' }
      );

      return res.status(200).json({
        success: true,
        message: 'Panchayat Officer authorized successfully.',
        token,
        admin: {
          id: existingUser._id,
          username: existingUser.fullName,
          role: 'admin',
          designation: existingUser.designation,
          gramPanchayat: existingUser.gramPanchayat,
          district: existingUser.district,
          state: existingUser.state,
        },
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const adminData = {
      fullName: fullName.trim(),
      mobile: cleanMobile,
      passwordHash,
      role: 'admin',
      designation: designation?.trim() || 'Gram Panchayat Officer',
      state: 'Maharashtra',
      district: 'Buldhana',
      gramPanchayat: 'XYZ Gram Panchayat',
    };
    if (email && email.trim()) {
      adminData.email = email.trim().toLowerCase();
    }
    const newAdmin = new User(adminData);

    const savedAdmin = await newAdmin.save();
    persistUser(savedAdmin);

    const token = jwt.sign(
      {
        userId: savedAdmin._id,
        role: 'admin',
        username: savedAdmin.fullName,
        designation: savedAdmin.designation,
        gramPanchayat: savedAdmin.gramPanchayat,
        district: savedAdmin.district,
        state: savedAdmin.state,
      },
      getJwtSecret(),
      { expiresIn: '3d' }
    );

    return res.status(201).json({
      success: true,
      message: 'New Panchayat Administrator registered successfully in MongoDB.',
      token,
      admin: {
        id: savedAdmin._id,
        username: savedAdmin.fullName,
        role: 'admin',
        designation: savedAdmin.designation,
        gramPanchayat: savedAdmin.gramPanchayat,
        district: savedAdmin.district,
        state: savedAdmin.state,
      },
    });
  } catch (err) {
    console.error('Admin register error:', err);
    return res.status(500).json({
      success: false,
      error: 'An error occurred during officer registration.',
    });
  }
};

/**
 * Admin Login
 * Dual Mode:
 * 1. Log in with registered Officer Account (Mobile/Email/Name + Personal Password)
 * 2. OR Master Admin Key (Any name + process.env.ADMIN_PASSWORD)
 */
export const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Official Name, Mobile Number, or Username is required.',
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Admin Password is required.',
      });
    }

    const cleanInput = username.trim();
    const expectedMasterPassword = getAdminPassword();

    // 1. Check if user is a registered Admin in MongoDB
    if (getDBStatus().connected) {
      const registeredAdmin = await User.findOne({
        $or: [
          { mobile: cleanInput },
          { email: cleanInput.toLowerCase() },
          { fullName: new RegExp(`^${cleanInput}$`, 'i') },
        ],
        role: 'admin',
      });

      if (registeredAdmin) {
        const isMatch = await bcrypt.compare(password, registeredAdmin.passwordHash);
        if (isMatch) {
          const token = jwt.sign(
            {
              userId: registeredAdmin._id,
              role: 'admin',
              username: registeredAdmin.fullName,
              designation: registeredAdmin.designation || 'Gram Panchayat Officer',
              gramPanchayat: registeredAdmin.gramPanchayat,
              district: registeredAdmin.district,
              state: registeredAdmin.state,
            },
            getJwtSecret(),
            { expiresIn: '3d' }
          );

          return res.json({
            success: true,
            message: 'Admin authorization granted.',
            token,
            admin: {
              id: registeredAdmin._id,
              username: registeredAdmin.fullName,
              role: 'admin',
              title: registeredAdmin.designation || 'Gram Panchayat Officer',
              gramPanchayat: registeredAdmin.gramPanchayat,
              district: registeredAdmin.district,
              state: registeredAdmin.state,
            },
          });
        }
      }
    }

    // 2. Fallback to Master Password verification (GramSetu@2026)
    if (password === expectedMasterPassword) {
      const token = jwt.sign(
        {
          role: 'admin',
          username: cleanInput,
          designation: 'Panchayat Administrator',
          gramPanchayat: 'XYZ Gram Panchayat',
          district: 'Buldhana',
          state: 'Maharashtra',
        },
        getJwtSecret(),
        { expiresIn: '3d' }
      );

      return res.json({
        success: true,
        message: 'Admin authorization granted via Master Key.',
        token,
        admin: {
          username: cleanInput,
          role: 'admin',
          title: 'Gram Panchayat Administrator',
          gramPanchayat: 'XYZ Gram Panchayat',
          district: 'Buldhana',
          state: 'Maharashtra',
        },
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Authentication failed. Incorrect admin authorization key or password.',
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred during administrative login.',
    });
  }
};
