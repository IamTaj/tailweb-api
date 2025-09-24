require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./config/db'); 

const authRoutes = require('./routes/auth');
const assignmentRoutes = require('./routes/assignments');
const submissionRoutes = require('./routes/submissions');

const app = express();
const port = process.env.PORT || 5000;

app.use(helmet({
  contentSecurityPolicy: false 
}));
const allowedOrigins = (process.env.CORS_ORIGIN || '*').split(',').map(s => s.trim());
app.use(cors({ origin: allowedOrigins.length === 1 && allowedOrigins[0] === '*' ? '*' : allowedOrigins, methods: ['GET','POST','PUT','DELETE'], credentials: true }));
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });
app.use('/api/auth', authLimiter);
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/submissions', submissionRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

connectDB()
  .then(() => app.listen(port, () => console.log(`Server listening on http://localhost:${port}`)))
  .catch(err => {
    console.error('DB connection failed', err);
    process.exit(1);
  });