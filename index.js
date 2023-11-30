const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
require("dotenv").config()
const app = express()
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);



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
        const reviewCollection = client.db('RapidRoutifyDB').collection('reviews');



        // // ! jwt related api 

        // app.post('/jwt', async (req, res) => {
        //     const user = req.body;
        //     const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        //         expiresIn: '1h'
        //     })
        //     res.send({ token });
        // })



        // // ! middlewares 

        // const varifyToken = (req, res, next) => {
        //     console.log('inside varify token', req.headers.authorization);
        //     if (!req.headers.authorization) {
        //         return res.status(401).send({ message: 'Unauthorized Access' })
        //     }
        //     const token = req.headers.authorization.split(' ')[1];
        //     jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        //         if (err) {
        //             return res.status(401).send({ message: 'Unauthorized Access' })
        //         }
        //         req.decoded = decoded;
        //         next();
        //     })

        // }


        // const varifyAdmin = async (req, res, next) => {
        //     const email = req.decoded.email;
        //     const query = { email: email }
        //     const user = await userCollection.findOne(query);
        //     const isAdmin = user?.role === 'admin';
        //     if (!isAdmin) {
        //         return res.status(403).send({ message: 'forbidden access' });
        //     }
        //     next()
        // }





        // !  User Related Api : 



        app.get('/users', async (req, res) => {
            const result = await userCollection.find().toArray()
            res.send(result);
        })

        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            let admin = false;
            if (user) {
                admin = user?.role === 'admin'
            }
            res.send({ admin });
        })

        app.get('/users/deliveryMan/:email', async (req, res) => {
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

        // ! userid by email 

        app.get('/users/:email', async (req, res) => {
            const email = req.query.email;
            const query = { email: req.params.email }
            const user = await userCollection.findOne(query);
            res.send(user)
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



        // * Get all delivery man

        app.get('/deliverymans', async (req, res) => {
            const result = await userCollection.find({ role: 'deliveryMan' }).toArray();
            res.send(result);
        })

        // ? Get Top delivery man

        app.get('/deliveryMans-top', async (req, res) => {

            let sortObj = {}
            const sortField = req.query.sortField;
            const sortOrder = req.query.sortOrder;

            if (sortField && sortOrder) {
                sortObj[sortField] = sortOrder
            }
            const result = await userCollection.find({ role: 'deliveryMan' }).sort(sortObj).toArray()
            res.send(result)
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


        app.patch('/delivered-booking/:email', async (req, res) => {
            const query = { email: req.params.email };
            const options = { upsert: true };
            const updated = req.body;
            const updateDoc = {

                $inc: {
                    delivered: 1
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

        app.get('/userBooking', async (req, res) => {
            let query = {}
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await parcelCollection.find(query).toArray();
            res.send(result)
        })


        app.get('/delivery-man/:deliveryManId', async (req, res) => {
            const deliveryManId = req.params.deliveryManId
            const query = { deliveryManId: req.params.deliveryManId };
            const result = await parcelCollection.find(query).toArray();
            res.send(result)
        })

        app.get('/parcels/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await parcelCollection.findOne(query);
            res.send(result)

        })

        app.get('/allparcels/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await parcelCollection.findOne(query);
            res.send(result)
        })

        app.patch('/parcels/:id', async (req, res) => {
            const item = req.body;
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updatedDoc = {
                $set: {
                    phone: item.phone,
                    address: item.address,
                    parcelType: item.parcelType,
                    weight: item.weight,
                    receiver: item.receiver,
                    receiverPhone: item.receiverPhone,
                    requestedDate: item.requestedDate,
                    price: item.price,
                    latitude: item.latitude,
                    longitude: item.longitude
                }
            }
            const result = await parcelCollection.updateOne(filter, updatedDoc)
            res.send(result);
        })

        app.patch('/allparcels/:id', async (req, res) => {
            const item = req.body;
            const id = req.params.id;
            console.log(id);
            const filter = { _id: new ObjectId(id) }
            const updatedDoc = {
                $set: {
                    status: 'On The Way',
                    deliveryManId: item.deliveryManId,
                    aproximateDate: item.approximateDate
                }
            }
            const result = await parcelCollection.updateOne(filter, updatedDoc)
            res.send(result);
        })


        // app.get('/parcels', async (req, res) => {
        //     try {
        //         const { startDate, endDate } = req.query;

        //         console.log('Received startDate:', startDate);
        //         console.log('Received endDate:', endDate);

        //         let query = {};

        //         if (startDate && endDate) {
        //             query.approximateDate = {
        //                 $gte: new Date(startDate),
        //                 $lte: new Date(endDate),
        //             };
        //         }

        //         const parcels = await parcelCollection.find(query).toArray();

        //         console.log('Found parcels:', parcels);

        //         res.json(parcels);
        //     } catch (error) {
        //         console.error(error);
        //         res.status(500).json({ error: 'Internal Server Error' });
        //     }
        // });

        app.get('/parcels', async (req, res) => {
            try {
                const database = client.db('your-database-name'); // Replace with your actual database name
                const parcels = await database.collection('parcels').find().toArray();
                res.json(parcels);
            } catch (error) {
                console.error('Error getting parcels:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });

        // Example route to search parcels based on date range
        app.post('/parcels/search', async (req, res) => {
            const { startDate, endDate } = req.body;

            try {
                const database = client.db('your-database-name'); // Replace with your actual database name
                const parcels = await database.collection('parcels').find({
                    approximateDate: {
                        $gte: startDate,
                        $lte: endDate,
                    },
                }).toArray();

                res.json(parcels);
            } catch (error) {
                console.error('Error searching parcels:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });

        //* Make a parcel  Deliverded

        app.patch('/all-parcels/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    status: 'Delivered'
                }
            }
            const result = await parcelCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })

        app.patch('/all-parcel/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    status: 'Cenceled'
                }
            }
            const result = await parcelCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })

        app.delete('/parcels/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await parcelCollection.deleteOne(query);
            res.send(result);
        })


        //* reviews api  : 


        app.post('/reviews', async (req, res) => {
            const newReview = req.body;
            const result = await reviewCollection.insertOne(newReview);
            res.send(result);
        })


        // ! review by id : 

        app.get('/reviews/:deliveryManId', async (req, res) => {
            const deliveryManId = req.params.deliveryManId
            const query = { deliveryManId: req.params.deliveryManId };
            const result = await reviewCollection.find(query).toArray();
            res.send(result)
        })


        // ! payment related api : 



        app.post("/create-payment-intent", async (req, res) => {
            const { price } = req.body;
            const amount = parseInt(price*100);
            console.log(amount);
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                payment_method_types : ["card"],               
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            })
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