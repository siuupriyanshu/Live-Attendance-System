import express from 'express';
import dotenv from 'express';
import { connectDB } from './config/db';

const app = express();
const port = process.env.PORT || 5000;
app.use(express.json());

require('dotenv').config();

app.get("/", (req, res) => {
    res.send("Hello, World!");
})


app.listen(port, () => {
    console.log(`Server is running on port:http://localhost:${port}`);
});

connectDB();