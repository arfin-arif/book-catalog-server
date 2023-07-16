require('dotenv').config();
const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

const cors = require('cors');

app.use(cors());
app.use(express.json());


const uri = process.env.MONGO_URL;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const run = async () => {
  try {
    const db = client.db('book-catalog');
    const booksCollection = db.collection('books');
    const usersCollection = db.collection('users');


    app.post('/register', async (req, res) => {
      try {
        const existingUser = await usersCollection.findOne({ email: req.body.email });
        if (existingUser) {
          return res.status(400).json({ error: 'User already exists' });
        }
        const newUser = {
          email: req.body.email,
          password: req.body.password,
        };
    
        const result = await usersCollection.insertOne(newUser);
        
        res.status(201).json({ success: true, data: result });
      } catch (error) {
        res.status(500).json({ error: 'An error occurred' });
      }
    });
    

    app.post('/login', async (req, res) => {
      try {
        const user = await usersCollection.findOne({ email: req.body.email });
        if (!user || user.password !== req.body.password) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        res.json(user?.email );
      } catch (error) {
        res.status(500).json({ error: 'An error occurred' });
      }
    });



// Get Books with Search and Filtering
app.get('/books', async (req, res) => {
  try {
    const { searchTerm } = req.query;
    const filter = {};

    if (searchTerm) {
      filter.$or = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { author: { $regex: searchTerm, $options: 'i' } },
        { genre: { $regex: searchTerm, $options: 'i' } },
        { publicationDate: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    const books = await booksCollection.find(filter).toArray();
    
    res.json({ success: true, data: books });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});


// Add Book
app.post('/books', async (req, res) => {
  try {

    const newBook = {
      image: req.body.image,
      title: req.body.title,
      author: req.body.author,
      genre: req.body.genre,
      publicationDate: req.body.publicationDate,
    };
    const result = await booksCollection.insertOne(newBook);
    
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});


app.get('/books/:id', async (req, res) => {
  try {

    const book = await booksCollection.findOne({ _id: ObjectId(req.params.id) });
    
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json({ success: true, data: book });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});




// Edit Book
app.put('/books/:id', async (req, res) => {
  try {
  
    const updatedBook = {
      image:req.body.image,
      title: req.body.title,
      author: req.body.author,
      genre: req.body.genre,
      publicationDate: req.body.publicationDate,
    };

    const result = await booksCollection.updateOne(
      { _id: ObjectId(req.params.id) },
      { $set: updatedBook }
    );
    

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json({ success: true, data: req.params.id });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

// Delete Book
app.delete('/books/:id', async (req, res) => {
  try {
    const result = await booksCollection.deleteOne({ _id: ObjectId(req.params.id) });
    

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json({ success: true, data: req.params.id });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

   app.post('/reviews/:id', async (req, res) => {
      const bookId = req.params.id;
      const reviews = req.body.reviews;

      const result = await booksCollection.updateOne(
        { _id: ObjectId(bookId) },
        { $push: { reviews: reviews } }
      );

      if (result.modifiedCount !== 1) {
        console.error('Book not found or reviews not added');
        res.json({ error: 'Book not found or reviews not added' });
        return;
      }
      res.json({ message: 'reviews added successfully' });
    });

  } finally {
  }
};

run().catch((err) => console.log(err));

app.get('/', (req, res) => {
  res.send('Hello World!');
});
app.get('*', (req, res) => {
  res.send('No Route Find!');
});

app.listen(port, () => {
  console.log(`Book Catalog app listening on port ${port}`);
});
