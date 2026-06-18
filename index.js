const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const biographyRoutes = require('./routes/biography');
const homeRoutes      = require('./routes/home');
const teachingRoutes  = require('./routes/teaching');
const videosRoutes    = require('./routes/videos');
const eventsRoutes    = require('./routes/events');
const workshopsRoutes     = require('./routes/workshops');
const testimonialsRoutes  = require('./routes/testimonials');
const connectRoutes       = require('./routes/connect');
const galleryRoutes       = require('./routes/gallery');
const authRoutes          = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

<<<<<<< HEAD
const allowedOrigins = [
  process.env.CLIENT_URL || 'https://vinaykulkarni.com',
  'http://localhost:5173',
  'http://localhost:3000',
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
=======
app.use(cors({ origin: process.env.CLIENT_URL || 'https://vinaykulkarni.com/' }));
>>>>>>> 90164fc0b7e5f4a820d54de0ed087c96a1b7cc03
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images as static files
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Routes
app.use('/api/auth',      authRoutes);
app.use('/api/home',      homeRoutes);
app.use('/api/biography', biographyRoutes);
app.use('/api/teaching',  teachingRoutes);
app.use('/api/videos',    videosRoutes);
app.use('/api/events',    eventsRoutes);
app.use('/api/workshops',    workshopsRoutes);
app.use('/api/testimonials', testimonialsRoutes);
app.use('/api/connect',      connectRoutes);
app.use('/api/gallery',      galleryRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`CMS server running on http://localhost:${PORT}`);
});
