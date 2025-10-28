const express = require('express');
const router = express.Router();

// Simple test route 
router.get('/minimal-test', (req, res) => {
  res.json({ 
    message: 'Minimal auth route works!',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;