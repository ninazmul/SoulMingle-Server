const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require('jsonwebtoken');
// middleware
app.use(cors());
app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5000/",
      "https://soul-mingle.web.app/",
      "https://soul-mingle-server.vercel.app/",
    ],
    credentials: true,
  })
);

const checkoutRequests = [];


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

    const favDataCollection = client.db("BioDB").collection("FavBio");

    const userCollection = client.db("BioDB").collection("UserData");

    const checkoutCollection = client.db("BioDB").collection("CheckoutData");

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    app.post("/user", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists", insertedId: null });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    app.get("/user", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    const verifytoken = (req, res, next) => {
      // console.log(req.headers);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "forbidden access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "forbidden access" });
        }
        req.decoded = decoded;
        next();
      });
    };

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === "admin";
      if (!isAdmin) {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    app.get("/user/admin/:email", verifytoken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "unauthorized access" });
      }
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === "admin";
      }
      res.send({ admin });
    });

    app.get("/user/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const user = await userCollection.findOne({ email });

        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        res.json(user);
      } catch (error) {
        console.error("Error fetching user details:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.patch("/user/admin/:id", verifytoken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    app.post("/checkout", async (req, res) => {
      const createCheck = req.body;
      const result = await checkoutCollection.insertOne(createCheck);
      res.send(result);
    });

    app.get("/checkout", async (req, res) => {
      const result = await checkoutCollection.find().toArray();
      res.send(result);
    });

    app.patch(
      "/checkout/Approved/:id",
      verifytoken,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updatedDoc = {
          $set: {
            status: "Pending",
          },
        };
        const result = await checkoutCollection.updateOne(filter, updatedDoc);
        res.send(result);
      }
    );
    
    app.post("/bioData", async (req, res) => {
      const createBio = req.body;
      const result = await bioDataCollection.insertOne(createBio);
      res.send(result);
    });

    app.put("/bioData/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateBio = req.body;

      const Bio = {
        $set: {
          Name: updateBio.Name,
          BiodataType: updateBio.BiodataType,
          ProfileImage: updateBio.ProfileImage,
          PermanentDivision: updateBio.PermanentDivision,
          Age: updateBio.Age,
          Occupation: updateBio.Occupation,
          Subscription: updateBio.Subscription,
          DateOfBirth: updateBio.DateOfBirth,
          Height: updateBio.Height,
          Weight: updateBio.Weight,
          Race: updateBio.Race,
          FathersName: updateBio.FathersName,
          MothersName: updateBio.MothersName,
          PresentDivision: updateBio.PresentDivision,
          ExpectedPartnerAge: updateBio.ExpectedPartnerAge,
          ExpectedPartnerHeight: updateBio.ExpectedPartnerHeight,
          ExpectedPartnerWeight: updateBio.ExpectedPartnerWeight,
          Email: updateBio.Email,
          MobileNumber: updateBio.MobileNumber,
        },
      };

      try {
        const result = await bioDataCollection.updateOne(filter, Bio, options);
        res.send(result);
      } catch (error) {
        console.error("Error updating bio:", error.message);
        res.status(500).send({ error: "Internal Server Error" });
      }
    });

    app.get("/bioData", async (req, res) => {
      const result = await bioDataCollection.find().toArray();
      res.send(result);
    });
    app.delete("/bioData/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bioDataCollection.deleteOne(query);
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

    app.patch(
      "/bioData/Premium/:id",
      verifytoken,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updatedDoc = {
          $set: {
            Subscription: "Premium",
          },
        };
        const result = await bioDataCollection.updateOne(filter, updatedDoc);
        res.send(result);
      }
    );

    app.get("/favBio", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await favDataCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/favBio", async (req, res) => {
      // Corrected parameter order
      const favBioCart = req.body;
      try {
        const result = await favDataCollection.insertOne(favBioCart);
        res.send(result);
      } catch (error) {
        console.error("Error adding to favorite Bio:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.delete("/favBio/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await favDataCollection.deleteOne(query);
      res.send(result);
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
