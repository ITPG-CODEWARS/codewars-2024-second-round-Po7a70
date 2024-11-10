import express from 'express';
import mongoose from 'mongoose';
import ShortUrl from './models/shortUrls.js';  // <-- Correct path to the model

const app = express();

// MongoDB connection
mongoose.connect('mongodb://localhost/urlShortener', { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Failed to connect to MongoDB', err));

// Set up the view engine
app.set('view engine', 'ejs');
app.set('views', './views');  // Set views folder location

// Middleware to parse form data
app.use(express.urlencoded({ extended: false }));

// Serve static files (like CSS, JS, images)
app.use(express.static('public'));



// Route to display all URLs
app.get('/', async (req, res) => {
  try {
    const shortUrls = await ShortUrl.find();  // Get all shortened URLs
    res.render('index', { shortUrls });  // Pass the URLs to the view
  } catch (err) {
    console.error('Error fetching URLs:', err);
    res.status(500).send('Server Error');
  }
});

// Route to handle URL shortening
app.post('/shortUrls', async (req, res) => {
  try {
    // Create the new short URL
    const shortUrl = new ShortUrl({
      full: req.body.fullUrl, // the full URL entered by the user
    });

    await shortUrl.save();  // Save the new short URL
    res.redirect('/');  // Redirect to home after creation
  } catch (err) {
    console.error('Error creating short URL:', err);
    res.status(500).send('Server Error');
  }
});

// Route to handle the short URL redirect
app.get('/:short', async (req, res) => {
  try {
    const shortUrl = await ShortUrl.findOne({ short: req.params.short });

    if (!shortUrl) {
      return res.sendStatus(404);  // If no short URL is found, return 404
    }

    // Increment the clicks counter
    shortUrl.clicks++;
    await shortUrl.save();

    // Redirect to the full URL
    res.redirect(shortUrl.full);
  } catch (err) {
    console.error('Error handling redirect:', err);
    res.status(500).send('Server Error');
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Route to handle deleting a short URL
app.post('/delete/:short', async (req, res) => {
  try {
    // Find and delete the short URL by its 'short' field
    const shortUrl = await ShortUrl.findOneAndDelete({ short: req.params.short });

    if (!shortUrl) {
      return res.status(404).send('Short URL not found');
    }

    // Redirect back to the home page after deletion
    res.redirect('/');
  } catch (err) {
    console.error('Error deleting short URL:', err);
    res.status(500).send('Server Error');
  }
});