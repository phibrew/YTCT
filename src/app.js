import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({limit: "20kb", extended: true}));
app.use(express.static("public"));
app.use(cookieParser());    


//routes import 
import userRouter from './routes/user.route.js';
app.use("/api/v1/user", userRouter);

//http://localhost:8000/api/v1/user/register
export { app };