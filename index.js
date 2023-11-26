const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
require("dotenv").config()
const app = express()


// middleware
app.use(cors());
app.use(express.json())




const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vheow1k.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        // ? All Collections 

        const userCollection = client.db('RapidRoutifyDB').collection('users');
        const parcelCollection = client.db('RapidRoutifyDB').collection('parcels');


        // !  User Related Api : 

        app.get('/users', async (req, res) => {
            const result = await userCollection.find().toArray()
            res.send(result);
        })

        app.get('/users/admin/:email',  async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            let admin = false;
            if (user) {
                admin = user?.role === 'admin'
            }
            res.send({ admin });
        })

        app.get('/users/deliveryMan/:email',  async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            // console.log(query);
            const user = await userCollection.findOne(query);
            // console.log(user);
            let deliveryMan = false;
            if (user) {
                deliveryMan = user?.role === 'deliveryMan'
            }
            res.send({ deliveryMan });
        })

        //* Make a User Admin
        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc);
            res.send(result);
        });

        //* Make a User Delivery Man
        app.patch('/users/delivery-man/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    role: 'deliveryMan'
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })

        app.get('/deliverymans' , async(req, res) => {
            const result = await userCollection.find({ role: 'deliveryMan' }).toArray();
            res.send(result);
        })

        

        app.post('/users', async (req, res) => {
            const user = req.body;

            //? insert email if user doesent exitst:

            const query = { email: user.email }
            const existingUser = await userCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'user already exists', isertedId: null })
            }

            const result = await userCollection.insertOne(user);
            res.send(result)

        })


        app.patch('/update-booking/:email', async (req, res) => {
            const query = { email: req.params.email };
            const options = { upsert: true };
            const updated = req.body;
            const updateDoc = {
                $set: {
                    phone: updated.phone,
                },
                $inc: {
                    order: 1
                }
            }
            const result = await userCollection.updateOne(query, updateDoc, options);
            res.send(result)
        })


        // ! Parcel related API 

        app.post('/parcels', async (req, res) => {
            const newParcel = req.body;
            const result = await parcelCollection.insertOne(newParcel);
            res.send(result);
        })

        app.get('/parcels', async (req, res) => {
            const result = await parcelCollection.find().toArray()
            res.send(result);
        })
        app.get('/parcels', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const result = await parcelCollection.find(query).toArray()
            res.send(result);
        })

        app.get('/parcels/:id' , async ( req, res) => {
            const id = req.params.id;
            const query = { _id : new ObjectId(id)} 
            const result = await parcelCollection.findOne(query);
            res.send(result)

        })
        
        app.get('/allparcels/:id' , async ( req, res) => {
            const id = req.params.id;
            const query = { _id : new ObjectId(id)} 
            const result = await parcelCollection.findOne(query);
            res.send(result)
        })

        app.patch('/parcels/:id' , async ( req, res) => {
            const item = req.body;
            const id = req.params.id;
            const filter = { _id : new ObjectId(id)}
            const updatedDoc = {
                $set:{
                    phone: item.phone,
                    address: item.address,
                    parcelType: item.parcelType,
                    weight: item.weight,
                    receiver: item.receiver,
                    receiverPhone : item.receiverPhone,
                    requestedDate: item.requestedDate,
                    price: item.price,
                    latitude: item.latitude,
                    longitude: item.longitude
                }
            }
            const result  = await parcelCollection.updateOne(filter, updatedDoc)
            res.send(result);
        })

        app.patch('/allparcels/:id' , async ( req, res) => {
            const item = req.body;
            const id = req.params.id;
            console.log(id);
            const filter = { _id : new ObjectId(id)}
            const updatedDoc = {
                $set:{
                    status:'On The Way',
                    deliveryManId: item.deliveryManId,
                    aproximateDate: item.aproximateDate
                }
            }
            const result  = await parcelCollection.updateOne(filter, updatedDoc)
            res.send(result);
        })

        app.delete('/parcels/:id' , async(req, res) => {
            const id = req.params.id ;
            const query = { _id : new ObjectId(id)}
            const result = await parcelCollection.deleteOne(query);
            res.send(result);
        })




        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");


    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('Rapidly Delivery will done')
})

app.listen(port, () => {
    console.log(`Rapid Routify is sitting on port ${port}`);
})