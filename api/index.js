// index.js
require('dotenv').config();
const express       = require('express');
const mongoose      = require('mongoose');
const cors          = require('cors');
const bcrypt        = require('bcryptjs');
const cookieParser  = require('cookie-parser');
const jwt           = require('jsonwebtoken');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary    = require('cloudinary').v2;
const multer        = require('multer');

// Mongoose models
const User    = require('./models/User.js');
const Place   = require('./models/Place.js');
const Booking = require('./models/Booking.js');

// Config constants
const bcryptSalt   = bcrypt.genSaltSync(10);
const jwtSecret    = process.env.JWT_SECRET || 'change_this_in_production';
const MONGO_URL    = process.env.MONGO_URL;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Connect to MongoDB
mongoose.connect(MONGO_URL)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ credentials: true, origin: FRONTEND_URL }));

// Configure Cloudinary
cloudinary.config({
  cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
  api_key:     process.env.CLOUDINARY_API_KEY,
  api_secret:  process.env.CLOUDINARY_API_SECRET,
  secure:      true,
});

// Multer‐Storage‐Cloudinary setup
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'hotel-booking',
    format: async (req, file) => file.mimetype.split('/')[1],
    public_id: (req, file) => Date.now().toString(),
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

// Helper: verify JWT from cookie
function getUserDataFromReq(req) {
  return new Promise((resolve, reject) => {
    const { token } = req.cookies;
    if (!token) return reject(new Error('No token provided'));
    jwt.verify(token, jwtSecret, {}, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
}

// ---------------------- Routes ----------------------

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json('Test OK');
});

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userDoc = await User.create({
      name,
      email,
      password: bcrypt.hashSync(password, bcryptSalt),
    });
    res.json(userDoc);
  } catch (e) {
    res.status(422).json(e.message);
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const userDoc = await User.findOne({ email });
    if (!userDoc) return res.status(404).json('User not found');
    const passOk = bcrypt.compareSync(password, userDoc.password);
    if (!passOk) return res.status(401).json('Invalid credentials');

    jwt.sign(
      { email: userDoc.email, id: userDoc._id },
      jwtSecret,
      {},
      (err, token) => {
        if (err) throw err;
        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
        }).json(userDoc);
      }
    );
  } catch (err) {
    res.status(500).json('Login failed');
  }
});

// Profile
app.get('/api/profile', async (req, res) => {
  try {
    if (!req.cookies.token) return res.json(null);
    const userData = await getUserDataFromReq(req);
    const user = await User.findById(userData.id);
    if (!user) return res.status(404).json('User not found');
    res.json({ name: user.name, email: user.email, _id: user._id });
  } catch (err) {
    res.status(401).json('Invalid token');
  }
});

// Logout
app.post('/api/logout', (req, res) => {
  res.cookie('token', '', { expires: new Date(0) }).json(true);
});

// Upload by URL → Cloudinary
app.post('/api/upload-by-link', async (req, res) => {
  try {
    const { link } = req.body;
    const result = await cloudinary.uploader.upload(link, { folder: 'hotel-booking' });
    res.json(result.secure_url);
  } catch (err) {
    console.error(err);
    res.status(500).json('Upload failed');
  }
});

// Upload from device → Cloudinary
app.post('/api/upload', upload.array('photos', 100), (req, res) => {
  try {
    const urls = req.files.map(f => f.path);
    res.json(urls);
  } catch (err) {
    console.error(err);
    res.status(500).json('Upload failed');
  }
});

// Get user’s places
app.get('/api/user-places', async (req, res) => {
  try {
    const userData = await getUserDataFromReq(req);
    const userPlaces = await Place.find({ owner: userData.id });
    res.json(userPlaces);
  } catch (err) {
    res.status(500).json('Failed to get user places');
  }
});

// Get all places
app.get('/api/places', async (req, res) => {
  try {
    const places = await Place.find();
    res.json(places);
  } catch (err) {
    res.status(500).json('Failed to get places');
  }
});

// Get a place by ID
app.get('/api/places/:id', async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);
    res.json(place);
  } catch (err) {
    res.status(500).json('Failed to get place');
  }
});

// Create place
app.post('/api/places', async (req, res) => {
  try {
    const userData = await getUserDataFromReq(req);
    const {
      title, address, addedPhotos, description,
      perks, extraInfo, checkIn, checkOut, maxGuests, price,
    } = req.body;
    const placeDoc = await Place.create({
      owner: userData.id,
      title,
      address,
      photos: addedPhotos,
      description,
      perks,
      extraInfo,
      checkIn,
      checkOut,
      maxGuests,
      price,
    });
    res.json(placeDoc);
  } catch (err) {
    res.status(401).json('Unauthorized');
  }
});

// Update place
app.put('/api/places', async (req, res) => {
  try {
    const userData = await getUserDataFromReq(req);
    const {
      id, title, address, addedPhotos, description,
      perks, extraInfo, checkIn, checkOut, maxGuests, price,
    } = req.body;
    const placeDoc = await Place.findById(id);
    if (!placeDoc) return res.status(404).json('Place not found');
    if (placeDoc.owner.toString() !== userData.id) {
      return res.status(403).json('You are not the owner of this place');
    }
    placeDoc.set({
      title,
      address,
      photos: addedPhotos,
      description,
      perks,
      extraInfo,
      checkIn,
      checkOut,
      maxGuests,
      price,
    });
    await placeDoc.save();
    res.json('ok');
  } catch (err) {
    res.status(500).json('Failed to update place');
  }
});

// Create booking
app.post('/api/bookings', async (req, res) => {
  try {
    const userData = await getUserDataFromReq(req);
    const {
      place, checkIn, checkOut, numberOfGuests, name, phone, price,
    } = req.body;
    const bookingDoc = await Booking.create({
      place,
      checkIn,
      checkOut,
      numberOfGuests,
      name,
      phone,
      price,
      user: userData.id,
    });
    res.json(bookingDoc);
  } catch (err) {
    res.status(500).json('Failed to create booking');
  }
});

// Get bookings for current user
app.get('/api/bookings', async (req, res) => {
  try {
    const userData = await getUserDataFromReq(req);
    const userBookings = await Booking.find({ user: userData.id }).populate('place');
    res.json(userBookings);
  } catch (err) {
    res.status(500).json('Failed to get bookings');
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
 