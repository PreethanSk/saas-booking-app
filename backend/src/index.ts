import express from "express";
import cors from "cors";
import adminRouter from "./routes/super-admin.router";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.json());
app.use(cors());
app.use(cookieParser());

//v1 routes
app.use("/api/v1/admin", adminRouter);

app.listen(3000, '0.0.0.0', () => {
    console.log('Server running on port 3000');
  });
  
