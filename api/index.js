// index.js
require('dotenv').config();

const express      = require('express');
const mongoose     = require('mongoose');
const cors         = require('cors');
const bcrypt       = require('bcryptjs');
const cookieParser = require('cookie-parser');
const jwt          = require('jsonwebtoken');
const multer       = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary   = require('cloudinary').v2;

// ──────────────────────────────────────────────────────────────────────────
// Environment Variables & Models
// ──────────────────────────────────────────────────────────────────────────
const {
  JWT_SECRET     = 'ksjfs9874298^%$^#*&^*(^)(232654fgldklgkdflgjkls',
  MONGO_URL,
  FRONTEND_URL,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  NODE_ENV,
  PORT = 5000,
} = process.env;

const User    = require('./models/User');
const Place   = require('./models/Place');
const Booking = require('./models/Booking');

// ──────────────────────────────────────────────────────────────────────────
// MongoDB Connection
// ──────────────────────────────────────────────────────────────────────────
async function connectMongo() {
  if (global.mongoose) return global.mongoose;
  return (global.mongoose = await mongoose.connect(MONGO_URL, {
    useNewUrlParser:    true,
    useUnifiedTopology: true,
  }));
}

connectMongo()
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// ──────────────────────────────────────────────────────────────────────────
// Express App & Middleware
// ──────────────────────────────────────────────────────────────────────────
const app = express();

// 1) CORS — must come before cookieParser & JSON parsing
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (origin === FRONTEND_URL || origin.endsWith('.netlify.app')) {
      return callback(null, true);
    }
    callback(new Error(`CORS policy: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// 2) Cookie parser & JSON body parser
app.use(cookieParser());
app.use(express.json());

// ──────────────────────────────────────────────────────────────────────────
// Cloudinary + Multer Setup
// ──────────────────────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key:    CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure:     true,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:    'hotel-booking',
    format:    (_, file) => file.mimetype.split('/')[1],
    public_id: () => Date.now().toString(),
  },
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ──────────────────────────────────────────────────────────────────────────
// Auth Helpers & Middleware
// ──────────────────────────────────────────────────────────────────────────

// Extract JWT from cookie or Authorization header
function getTokenFromReq(req) {
  if (req.cookies?.token) return req.cookies.token;
  const auth = req.headers?.authorization || '';
  const [scheme, token] = auth.split(' ');
  if (scheme === 'Bearer' && token) return token;
  return null;
}

// Verify JWT, return payload or throw
function getUserDataFromReq(req) {
  return new Promise((resolve, reject) => {
    const token = getTokenFromReq(req);
    if (!token) return reject(new Error('No token'));
    jwt.verify(token, JWT_SECRET, {}, (err, data) =>
      err ? reject(err) : resolve(data)
    );
  });
}

// Protect routes
async function requireAuth(req, res, next) {
  try {
    const userData = await getUserDataFromReq(req);
    req.user = userData;
    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Routes
// ──────────────────────────────────────────────────────────────────────────

// Health check
app.get('/', (_req, res) => res.send('🟢 API is up and running'));
app.get('/api/test', (_req, res) => res.json({ ok: true }));

// — Register
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashed = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
    const userDoc = await User.create({ name, email, password: hashed });
    res.json(userDoc);
  } catch (e) {
    console.error('Register error:', e);
    res.status(422).json({ error: e.message });
  }
});

// — Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const userDoc = await User.findOne({ email });
    if (!userDoc) return res.status(404).json({ error: 'User not found' });

    if (!bcrypt.compareSync(password, userDoc.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    jwt.sign(
      { email: userDoc.email, id: userDoc._id },
      JWT_SECRET,
      {},
      (err, token) => {
        if (err) throw err;
        res
          .cookie('token', token, {
            httpOnly: true,
            secure: NODE_ENV === 'production',
            sameSite: 'strict',
          })
          .json(userDoc);
      }
    );
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// — Profile
app.get('/api/profile', async (req, res) => {
  if (!req.cookies.token) return res.json(null);
  try {
    const userData = await getUserDataFromReq(req);
    const user = await User.findById(userData.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ name: user.name, email: user.email, _id: user._id });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// — Logout
app.post('/api/logout', (_req, res) =>
  res
    .cookie('token', '', { expires: new Date(0) })
    .json({ ok: true })
);

// — Upload by URL
app.post('/api/upload-by-link', async (req, res) => {
  try {
    const { link } = req.body;
    const result = await cloudinary.uploader.upload(link, { folder: 'hotel-booking' });
    res.json({ url: result.secure_url });
  } catch (err) {
    console.error('Upload-by-link error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// — Upload from device
app.post('/api/upload', upload.array('photos', 100), (req, res) => {
  try {
    const urls = req.files.map(f => f.path);
    res.json({ urls });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// — Places (public)
app.get('/api/places', async (_req, res) => {
  try {
    const places = await Place.find();
    res.json(places);
  } catch (err) {
    console.error('Get places error:', err);
    res.status(500).json({ error: 'Failed to get places' });
  }
});

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

// — Places (protected)
app.get('/api/user-places', requireAuth, async (req, res) => {
  try {
    const places = await Place.find({ owner: req.user.id });
    res.json(places);
  } catch (err) {
    console.error('User places error:', err);
    res.status(500).json({ error: 'Failed to get user places' });
  }
});

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

// — Bookings
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

app.get('/api/bookings', requireAuth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id }).populate('place');
    res.json(bookings);
  } catch (err) {
    console.error('Get bookings error:', err);
    res.status(500).json({ error: 'Failed to get bookings' });
  }
});

// ──────────────────────────────────────────────────────────────────────────
// Global Error Handler (last middleware)
// ──────────────────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// ──────────────────────────────────────────────────────────────────────────
// Start Server (development) or export for production
// ──────────────────────────────────────────────────────────────────────────
if (NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
}

module.exports = app;
