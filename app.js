const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const { MongoClient, ServerApiVersion } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON data
app.use(bodyParser.json());

// MongoDB connection setup
const uri =
  "mongodb+srv://dubaibooker:nBUluvi94DLO2AGn@cluster0.edg1p.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function connectToDatabase() {
  try {
    // Connect the client to the server
    await client.connect();
    console.log("Connected to MongoDB successfully!");
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged MongoDB deployment!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

// Middleware to ensure MongoDB is connected before handling requests
app.use(async (req, res, next) => {
  if (!client.isConnected) {
    await connectToDatabase();
  }
  next();
});

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Route for the homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.htm"));
});

// API endpoint to store session values
app.post("/store-session", async (req, res) => {
  try {
    const { key, value } = req.body;

    if (!key || !value) {
      return res.status(400).json({ error: "Key and value are required." });
    }

    const collection = client.db("testdb").collection("sessionStorage");

    // Store the key-value pair in MongoDB
    await collection.updateOne(
      { key }, // Match by key
      { $set: { value, updatedAt: new Date() } }, // Update or insert
      { upsert: true } // Insert if not exists
    );

    res.status(200).json({ message: "Session value stored successfully." });
  } catch (error) {
    console.error("Error storing session value:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// API endpoint to retrieve session value by key
app.get("/get-session/:key", async (req, res) => {
  try {
    const { key } = req.params;
    const collection = client.db("testdb").collection("sessionStorage");

    // Retrieve the value associated with the key
    const sessionData = await collection.findOne({ key });

    if (!sessionData) {
      return res.status(404).json({ error: "Key not found." });
    }

    res.status(200).json({ key: sessionData.key, value: sessionData.value });
  } catch (error) {
    console.error("Error retrieving session value:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
