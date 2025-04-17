import express from "express";
import cors from "cors";
import adminRouter from "./routes/super-admin.router";

const app = express();

app.use(express.json());
app.use(cors());


//v1 routes
app.use("/api/v1/admin",adminRouter);



app.listen(3000);
