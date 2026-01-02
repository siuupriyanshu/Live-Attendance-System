import dotenv from 'dotenv';
dotenv.config();  

import express from 'express';
import http from 'http';
import { connectDB } from './config/db';
import authRouter from './routes/auth';
import attendanceRouter from './routes/attendance';
import classRouter from './routes/class';
import { setupWebSocket } from './lib/ws';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use('/auth', authRouter);
app.use('/attendance', attendanceRouter);
app.use('/class', classRouter);

app.get("/", (req, res) => {
    res.send("Hello, World!");
});

// Create HTTP server
const server = http.createServer(app);

// Attach WebSocket
setupWebSocket(server);

// Connect DB and start server
connectDB().then(() => {
    server.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
});