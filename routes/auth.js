const express = require('express');
const router = express.Router();

// Google OAuth callback route
router.post('/google/callback', async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ success: false, error: 'No credential provided' });
    }

    // Decode the JWT token (in production, verify with Google)
    const payload = JSON.parse(Buffer.from(credential.split('.')[1], 'base64').toString());

    // Validate required fields
    if (!payload.sub || !payload.email || !payload.name) {
      return res.status(400).json({ success: false, error: 'Invalid credential data' });
    }

    // Create or find user in your database
    const user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture || ''
    };

    // Generate JWT token or session
    const token = `jwt-${payload.sub}-${Date.now()}`; // Replace with actual JWT generation

    res.json({
      success: true,
      user: user,
      token: token
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ success: false, error: 'Authentication failed' });
  }
});

module.exports = router;