const express = require('express');
const router = express.Router();

// Dummy route at the root of the backend API
router.get('/', (req, res) => {
	res.json({ message: 'Hello from the dummy backend API root!' });
});

// Additional dummy route for testing purposes
router.get('/test', (req, res) => {
	res.json({ message: 'This is a test endpoint from the backend API.' });
});

module.exports = router;
