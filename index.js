const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// middleware
app.use(cors());
app.use(express.json());

const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pc5txjd.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
      // await client.connect();
      
      const bioDataCollection = client.db("BioDB").collection("BioData");

      app.get("/bioData", async (req, res) => {
          const result = await bioDataCollection.find().toArray();
          res.send(result);
      });

     app.get("/bioData/:id", async (req, res) => {
       try {
         const { id } = req.params;
         const objectId = new ObjectId(id);
         const bioData = await bioDataCollection.findOne({ _id: objectId });

         if (!bioData) {
           return res.status(404).json({ error: "Bio data not found" });
         }

         res.json(bioData);
       } catch (error) {
         console.error("Error fetching bio details:", error);
         res.status(500).json({ error: "Internal server error" });
       }
     });


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('lets get mingle')
});

app.listen(port, () => {
    console.log(`Lets get Mingle on ${port}`);
})
