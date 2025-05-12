// index.js
// ─────────────────────────────────────────────────────────────────────────────
// Entry point for the Hotel Booking API
// Uses Express, MongoDB (via Mongoose), JWT-based auth, and Cloudinary for image storage
// ─────────────────────────────────────────────────────────────────────────────

require('dotenv').config();                   // Load environment variables from .env

const express      = require('express');
const mongoose     = require('mongoose');
const cors         = require('cors');
const bcrypt       = require('bcryptjs');
const cookieParser = require('cookie-parser');
const jwt          = require('jsonwebtoken');
const multer       = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary   = require('cloudinary').v2;

// ─────────────────────────────────────────────────────────────────────────────
// Environment Variables & Model Imports
// ─────────────────────────────────────────────────────────────────────────────
const {
  JWT_SECRET     = 'change_this_in_production',       // Replace in production!
  MONGO_URL,                                         // MongoDB connection string
  FRONTEND_URL,                                      // e.g. https://your-site.netlify.app
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  NODE_ENV,
  PORT = 5000,
} = process.env;

const User    = require('./models/User');
const Place   = require('./models/Place');
const Booking = require('./models/Booking');

// ─────────────────────────────────────────────────────────────────────────────
// Connect to MongoDB
// ─────────────────────────────────────────────────────────────────────────────
async function connectMongo() {
  if (global.mongoose) return global.mongoose;       // Reuse existing connection
  global.mongoose = await mongoose.connect(MONGO_URL, {
    useNewUrlParser:    true,
    useUnifiedTopology: true,
  });
  return global.mongoose;
}

connectMongo()
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// ─────────────────────────────────────────────────────────────────────────────
// Create Express App & Middleware
// ─────────────────────────────────────────────────────────────────────────────
const app = express();

// --- CORS ---
// Allow our frontend (Netlify) and any requests with no origin (e.g., mobile)
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (origin === FRONTEND_URL || origin.endsWith('.netlify.app')) {
      return callback(null, true);
    }
    callback(new Error(`CORS policy: origin ${origin} not allowed`));
  },
  credentials: true,      // Allow cookies (JWT) to be sent/received
}));

// --- Parsing ---
// Cookie parser for JWT cookie, and JSON body parser
app.use(cookieParser());
app.use(express.json());

// ─────────────────────────────────────────────────────────────────────────────
// Configure Cloudinary + Multer for Image Uploads
// ─────────────────────────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key:    CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure:     true,
});

// Store uploads under `hotel-booking` folder, preserve file type by mimetype
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'hotel-booking',
    format: (_, file) => file.mimetype.split('/')[1],
    public_id: () => Date.now().toString(),
  },
});

// Limit individual file size to 5MB
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ─────────────────────────────────────────────────────────────────────────────
// Authentication Helpers & Middleware
// ─────────────────────────────────────────────────────────────────────────────

// Extract JWT token from either HTTP-only cookie or Authorization header
function getTokenFromReq(req) {
  if (req.cookies?.token) return req.cookies.token;
  const auth = req.headers.authorization || '';
  const [scheme, token] = auth.split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

// Verify JWT and return decoded payload, or reject if invalid/missing
function getUserDataFromReq(req) {
  return new Promise((resolve, reject) => {
    const token = getTokenFromReq(req);
    if (!token) return reject(new Error('No token'));
    jwt.verify(token, JWT_SECRET, {}, (err, data) =>
      err ? reject(err) : resolve(data)
    );
  });
}

// Middleware to protect routes: ensures req.user is set or returns 401
async function requireAuth(req, res, next) {
  try {
    req.user = await getUserDataFromReq(req);
    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public Routes
// ─────────────────────────────────────────────────────────────────────────────

// Health check
app.get('/', (_req, res) => res.send('🟢 API is up and running'));
app.get('/api/test', (_req, res) => res.json({ ok: true }));

// Register a new user
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashed = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
    const user = await User.create({ name, email, password: hashed });
    res.json(user);
  } catch (e) {
    console.error('Register error:', e);
    res.status(422).json({ error: e.message });
  }
});

// Login and set JWT cookie
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    jwt.sign(
      { email: user.email, id: user._id },
      JWT_SECRET,
      {},
      (err, token) => {
        if (err) throw err;
        // Set HTTP-only cookie with SameSite=None to allow cross-site in prod
        res
          .cookie('token', token, {
            httpOnly: true,
            secure: NODE_ENV === 'production',
            sameSite: NODE_ENV === 'production' ? 'none' : 'lax',
          })
          .json({ id: user._id, name: user.name, email: user.email });
      }
    );
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user profile, or null if not logged in
app.get('/api/profile', async (req, res) => {
  if (!req.cookies.token) return res.json(null);
  try {
    const data = await getUserDataFromReq(req);
    const user = await User.findById(data.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user._id, name: user.name, email: user.email });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Logout by clearing the cookie
app.post('/api/logout', (_req, res) =>
  res.cookie('token', '', { expires: new Date(0) }).json({ ok: true })
);

// ─────────────────────────────────────────────────────────────────────────────
// Image Upload Endpoints
// ─────────────────────────────────────────────────────────────────────────────

// Upload by providing an external URL
app.post('/api/upload-by-link', async (req, res) => {
  try {
    const { link } = req.body;
    const result = await cloudinary.uploader.upload(link, {
      folder: 'hotel-booking',
    });
    // Return in a uniform shape
    res.json({ urls: [result.secure_url] });
  } catch (err) {
    console.error('Upload-by-link error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Upload files from the device via multipart/form-data
app.post('/api/upload', upload.array('photos', 100), (req, res) => {
  try {
    // Extract secure_url (preferred) or path from each file object
    const urls = req.files
      .map(f => f.secure_url || f.path || '')
      .filter(u => u);
    res.json({ urls });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Place & Booking CRUD Routes
// ─────────────────────────────────────────────────────────────────────────────

// Fetch all places (public)
app.get('/api/places', async (_req, res) => {
  try {
    const places = await Place.find();
    res.json(places);
  } catch (err) {
    console.error('Get places error:', err);
    res.status(500).json({ error: 'Failed to get places' });
  }
});

// Fetch a single place by ID (public)
app.get('/api/places/:id', async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);
    if (!place) return res.status(404).json({ error: 'Place not found' });
    res.json(place);
  } catch (err) {
    console.error('Get place error:', err);
    res.status(500).json({ error: 'Failed to get place' });
  }
});

// Below routes require authentication (JWT cookie)

// List places owned by current user
app.get('/api/user-places', requireAuth, async (req, res) => {
  try {
    const places = await Place.find({ owner: req.user.id });
    res.json(places);
  } catch (err) {
    console.error('User places error:', err);
    res.status(500).json({ error: 'Failed to get user places' });
  }
});

// Create a new place
app.post('/api/places', requireAuth, async (req, res) => {
  try {
    const data = { owner: req.user.id, ...req.body };
    const doc = await Place.create(data);
    res.json(doc);
  } catch (err) {
    console.error('Create place error:', err);
    res.status(500).json({ error: 'Failed to create place' });
  }
});

// Update an existing place
app.put('/api/places', requireAuth, async (req, res) => {
  try {
    const place = await Place.findById(req.body.id);
    if (!place) return res.status(404).json({ error: 'Place not found' });
    if (place.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not owner' });
    }
    Object.assign(place, req.body);
    await place.save();
    res.json({ ok: true });
  } catch (err) {
    console.error('Update place error:', err);
    res.status(500).json({ error: 'Failed to update place' });
  }
});

// Create a booking
app.post('/api/bookings', requireAuth, async (req, res) => {
  try {
    const bookingData = { ...req.body, user: req.user.id };
    const doc = await Booking.create(bookingData);
    res.json(doc);
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// List bookings for current user
app.get('/api/bookings', requireAuth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id }).populate('place');
    res.json(bookings);
  } catch (err) {
    console.error('Get bookings error:', err);
    res.status(500).json({ error: 'Failed to get bookings' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Global Error Handler (last middleware)
// ─────────────────────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// ─────────────────────────────────────────────────────────────────────────────
// Start server in development; export `app` for production (Vercel)
// ─────────────────────────────────────────────────────────────────────────────
if (NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
}

module.exports = app;
