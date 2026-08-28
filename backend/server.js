require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const PORT = process.env.PORT || 3000;
const AI_ENDPOINT = process.env.AI_ENDPOINT || 'https://api.openai.com/v1/chat/completions';
const AI_API_KEY = process.env.AI_API_KEY || '';
const AI_MODEL = process.env.AI_MODEL || 'gpt-4o-mini';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

const app = express();
app.use(express.json({ limit: '8mb' })); // generous limit to allow doubt-solver image uploads
app.use(cors({ origin: ALLOWED_ORIGIN === '*' ? true : ALLOWED_ORIGIN.split(',').map(s => s.trim()) }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20, // 20 requests/minute/IP — generous for one student, blunts abuse
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a moment before trying again.' },
});
app.use('/api/', limiter);

app.get('/api/status', (req, res) => {
  res.json({ configured: Boolean(AI_API_KEY), model: AI_MODEL });
});

app.post('/api/chat', async (req, res) => {
  if (!AI_API_KEY) {
    return res.status(503).json({ error: 'AI is not configured on this server yet. Set AI_API_KEY (and optionally AI_ENDPOINT / AI_MODEL) in the backend environment.' });
  }
  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Request must include a non-empty "messages" array.' });
  }

  try {
    const upstream = await fetch(AI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({ model: AI_MODEL, messages }),
    });

    if (upstream.status === 429) {
      return res.status(429).json({ error: 'The AI provider is rate-limiting this key right now. Try again shortly.' });
    }
    if (!upstream.ok) {
      const text = await upstream.text().catch(() => '');
      console.error('Upstream AI error', upstream.status, text.slice(0, 500));
      return res.status(502).json({ error: `The AI provider returned an error (${upstream.status}).` });
    }

    const data = await upstream.json();
    const content = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : null;
    if (!content) {
      return res.status(502).json({ error: 'The AI provider returned an empty response.' });
    }
    res.json({ content });
  } catch (err) {
    console.error('Orbit backend /api/chat failure:', err.message);
    res.status(502).json({ error: 'Could not reach the AI provider. Check the backend network connection and AI_ENDPOINT.' });
  }
});

app.get('/', (req, res) => {
  res.type('text/plain').send('Orbit backend is running. Endpoints: GET /api/status, POST /api/chat');
});

app.listen(PORT, () => {
  console.log(`Orbit backend listening on port ${PORT}`);
  console.log(`AI configured: ${Boolean(AI_API_KEY)} | model: ${AI_MODEL} | endpoint: ${AI_ENDPOINT}`);
});
