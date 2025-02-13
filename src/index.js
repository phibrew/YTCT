// require('dotenv').config({path: './env'});

import dotenv from 'dotenv';
import connectDB from './db/index.js';
import { app } from './app.js';

dotenv.config({
    path: './.env'
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 4000, ()=>{
        console.log(`Server is running on port ${process.env.PORT}`);
    })
    app.on('error', (err)=>{
        console.error('Error starting server:', err);
        throw err;
    })
})    
.catch((err)=>{
    console.error('MONGO DB connection error', err);
    process.exit(1);
})