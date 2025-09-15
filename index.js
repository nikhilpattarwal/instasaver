require('dotenv').config();
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const jwt = require('jsonwebtoken');
const app = express();
const PORT = 5000;
const fileMap = {};

const SECRET_KEY = process.env.SECRET_KEY;
if (!SECRET_KEY) {
  console.error("SECRET_KEY is not defined in .env!");
  process.exit(1);
}

app.use(cors());
app.use(express.json());

// JWT middleware
function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1] || req.query.token;
  if (!token) return res.status(401).json({ status: 'error', message: 'Unauthorized: No token' });

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ status: 'error', message: 'Unauthorized: Invalid token Reload Page' });
    req.user = decoded;
    next();
  });
}

// Serve downloads only if token is valid
app.use('/downloads', verifyToken, express.static(path.join(__dirname, 'downloads')));

// Generate short-lived token (valid 10 minutes)
app.get('/token', (req, res) => {
  const token = jwt.sign({ access: 'download' }, SECRET_KEY, { expiresIn: '5m' });
  res.json({ token });
});

// Protected download endpoint
app.post('/download', verifyToken, (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ status: 'error', message: 'URL is required' });

  const scriptPath = path.join(__dirname, 'download.py');
  const pythonProcess = spawn('python3', [scriptPath, url]);

  let result = '';
  pythonProcess.stdout.on('data', (data) => { result += data.toString(); });
  pythonProcess.stderr.on('data', (data) => { console.error('Python error:', data.toString()); });

  pythonProcess.on('close', () => {
    try {
      const output = JSON.parse(result);
      const downloadId = crypto.randomBytes(8).toString('hex');
      fileMap[downloadId] = output.data.filepath;
      res.json({ status: 'success', data: output });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Invalid output from Python script' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
