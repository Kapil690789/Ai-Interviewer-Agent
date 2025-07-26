const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


// --- Load environment variables ---
dotenv.config();

// --- 2. Initialize Express & Middleware ---
const app = express();
const PORT = process.env.PORT || 5001;
const User = require('./models/User');
const Interview = require('./models/Interview');

app.use(cors({ origin: process.env.CLIENT_URL })); // Allow requests from our React app
app.use(express.json()); // Parse JSON bodies
app.use(cors()); // Vercel handles the CLIENT_URL automatically

// --- 3. Database Connection ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Successfully connected to MongoDB.'))
    .catch(err => console.error('❌ Database connection error:', err));

// --- 4. Mongoose Schema and Model ---
const authMiddleware = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
  }
  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded.user;
      next();
  } catch (err) {
      res.status(401).json({ msg: 'Token is not valid' });
  }
};
app.get('/', (req, res) => {
  res.send('AI Interviewer Backend is running successfully!');
});

// const Interview = mongoose.model('Interview', interviewSchema);

// --- 5. API Routes ---

// Route to handle communication with Gemini API
app.post('/api/gemini/generate', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{ role: "user", parts: [{ text: prompt }] }]
        };

        const fetch = (await import('node-fetch')).default;
        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!apiResponse.ok) {
            const errorBody = await apiResponse.text();
            throw new Error(`API call failed with status ${apiResponse.status}: ${errorBody}`);
        }

        const result = await apiResponse.json();
        res.json(result);

    } catch (error) {
        console.error('❌ Error calling Gemini API:', error);
        res.status(500).json({ error: 'Failed to fetch response from AI' });
    }
});
app.get('/api/interviews/history', authMiddleware, async (req, res) => {
  try {
      const interviews = await Interview.find({ userId: req.user.id }).sort({ createdAt: -1 });
      res.json(interviews);
  } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
  }
});
// Route to save a new interview
app.post('/api/interviews', authMiddleware, async (req, res) => {
  try {
      const { role, techStack, messages } = req.body;
      // Associate the interview with the logged-in user
      const newInterview = new Interview({ role, techStack, messages, userId: req.user.id });
      const savedInterview = await newInterview.save();
      res.status(201).json(savedInterview);
  } catch (error) {
      res.status(500).json({ error: 'Failed to save interview' });
  }
});

// Route to update an existing interview with new messages or feedback
app.put('/api/interviews/:id', async (req, res) => {
    try {
        const { messages, feedback } = req.body;
        const updateData = {};
        if (messages) updateData.messages = messages;
        if (feedback) updateData.feedback = feedback;

        const updatedInterview = await Interview.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        );
        res.status(200).json(updatedInterview);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update interview' });
    }
});
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
      const user = await User.findById(req.user.id).select('-password');
      res.json(user);
  } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
  }
});
app.post('/api/auth/signup', async (req, res) => {
    const { name, email, password } = req.body;
    try {
      if (!name || !email || !password) {
          return res.status(400).json({ msg: 'Please enter all fields' });
      }
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ msg: 'User already exists' });
      }
      user = new User({ name, email, password });
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();
  
      const payload = { user: { id: user.id } };
      jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
        if (err) throw err;
        res.status(201).json({ token });
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  });
// @route   POST /api/auth/login
// @desc    Authenticate user & get token
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
      if (!email || !password) {
          return res.status(400).json({ msg: 'Please enter all fields' });
      }
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }
      const payload = { user: { id: user.id } };
      jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
        if (err) throw err;
        res.json({ token });
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  });
  
// --- 6. Start Server ---
// app.listen(PORT, () => {
//     console.log(`🚀 Server is running on http://localhost:${PORT}`);
// });
// --- 6. Export the app for Vercel ---
module.exports = app;