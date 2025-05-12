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

// Models
const User    = require('./models/User');
const Place   = require('./models/Place');
const Booking = require('./models/Booking');

// ──────────────────────────────────────────────────────────────────────────
// Configuration
// ──────────────────────────────────────────────────────────────────────────
const {
  JWT_SECRET     = 'change_this_in_production',
  MONGO_URL,
  FRONTEND_URL,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  NODE_ENV,
  PORT = 5000,
} = process.env;

const bcryptSalt = bcrypt.genSaltSync(10);

// ──────────────────────────────────────────────────────────────────────────
// Connect to MongoDB
// ──────────────────────────────────────────────────────────────────────────
async function connectMongo() {
  if (global.mongoose) return global.mongoose;
  return (global.mongoose = await mongoose.connect(MONGO_URL, {
    useNewUrlParser:          true,
    useUnifiedTopology:       true,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS:          45000,
  }));
}

connectMongo()
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// ──────────────────────────────────────────────────────────────────────────
// App setup
// ──────────────────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use(cookieParser());

// CORS: allow your Netlify app and any Netlify preview
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

// Cloudinary + Multer
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
// Helper: extract user from JWT cookie
// ──────────────────────────────────────────────────────────────────────────
function getUserDataFromReq(req) {
  return new Promise((resolve, reject) => {
    const { token } = req.cookies;
    if (!token) return reject(new Error('No token'));
    jwt.verify(token, JWT_SECRET, {}, (err, data) =>
      err ? reject(err) : resolve(data)
    );
  });
}

// ──────────────────────────────────────────────────────────────────────────
// Routes
// ──────────────────────────────────────────────────────────────────────────
app.get('/', (_req, res) => res.send('🟢 API is up and running'));
app.get('/api/test', (_req, res) => res.json({ ok: true }));

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashed = bcrypt.hashSync(password, bcryptSalt);
    const userDoc = await User.create({ name, email, password: hashed });
    res.json(userDoc);
  } catch (e) {
    console.error(e);
    res.status(422).json({ error: e.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const userDoc = await User.findOne({ email });
    if (!userDoc) return res.status(404).json({ error: 'User not found' });

    const passOk = bcrypt.compareSync(password, userDoc.password);
    if (!passOk) return res.status(401).json({ error: 'Invalid credentials' });

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
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Profile
app.get('/api/profile', async (req, res) => {
  try {
    if (!req.cookies.token) return res.json(null);
    const userData = await getUserDataFromReq(req);
    const user = await User.findById(userData.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ name: user.name, email: user.email, _id: user._id });
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Logout
app.post('/api/logout', (_req, res) =>
  res
    .cookie('token', '', { expires: new Date(0) })
    .json({ ok: true })
);

// Upload by URL
app.post('/api/upload-by-link', async (req, res) => {
  try {
    const { link } = req.body;
    const result = await cloudinary.uploader.upload(link, {
      folder: 'hotel-booking',
    });
    res.json({ url: result.secure_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Upload from device
app.post(
  '/api/upload',
  upload.array('photos', 100),
  (req, res) => {
    try {
      const urls = req.files.map((f) => f.path);
      res.json({ urls });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Upload failed' });
    }
  }
);

// User places
app.get('/api/user-places', async (req, res) => {
  try {
    const userData = await getUserDataFromReq(req);
    const places = await Place.find({ owner: userData.id });
    res.json(places);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get user places' });
  }
});

// All places
app.get('/api/places', async (_req, res) => {
  try {
    const places = await Place.find();
    res.json(places);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get places' });
  }
});

// Place by ID
app.get('/api/places/:id', async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);
    if (!place) return res.status(404).json({ error: 'Place not found' });
    res.json(place);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get place' });
  }
});

// Create place
app.post('/api/places', async (req, res) => {
  try {
    const userData = await getUserDataFromReq(req);
    const placeData = {
      owner:    userData.id,
      title:    req.body.title,
      address:  req.body.address,
      photos:   req.body.addedPhotos,
      description: req.body.description,
      perks:       req.body.perks,
      extraInfo:   req.body.extraInfo,
      checkIn:     req.body.checkIn,
      checkOut:    req.body.checkOut,
      maxGuests:   req.body.maxGuests,
      price:       req.body.price,
    };
    const doc = await Place.create(placeData);
    res.json(doc);
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Update place
app.put('/api/places', async (req, res) => {
  try {
    const userData = await getUserDataFromReq(req);
    const place = await Place.findById(req.body.id);
    if (!place) return res.status(404).json({ error: 'Place not found' });
    if (place.owner.toString() !== userData.id) {
      return res.status(403).json({ error: 'Not owner' });
    }
    Object.assign(place, {
      title:       req.body.title,
      address:     req.body.address,
      photos:      req.body.addedPhotos,
      description: req.body.description,
      perks:       req.body.perks,
      extraInfo:   req.body.extraInfo,
      checkIn:     req.body.checkIn,
      checkOut:    req.body.checkOut,
      maxGuests:   req.body.maxGuests,
      price:       req.body.price,
    });
    await place.save();
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update place' });
  }
});

// Create booking
app.post('/api/bookings', async (req, res) => {
  try {
    const userData = await getUserDataFromReq(req);
    const bookingData = {
      place:          req.body.place,
      checkIn:        req.body.checkIn,
      checkOut:       req.body.checkOut,
      numberOfGuests: req.body.numberOfGuests,
      name:           req.body.name,
      phone:          req.body.phone,
      price:          req.body.price,
      user:           userData.id,
    };
    const doc = await Booking.create(bookingData);
    res.json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// User bookings
app.get('/api/bookings', async (req, res) => {
  try {
    const userData = await getUserDataFromReq(req);
    const bookings = await Booking.find({ user: userData.id }).populate('place');
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get bookings' });
  }
});

// ──────────────────────────────────────────────────────────────────────────
// Error handler (must be last)
// ──────────────────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// ──────────────────────────────────────────────────────────────────────────
// Start server in development; export `app` for production (Vercel)
// ──────────────────────────────────────────────────────────────────────────
if (NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
}

module.exports = app;
