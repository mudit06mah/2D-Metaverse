import express from "express";
import {router} from "./routes/index.routes";

const app = express();
app.use(express.json());

app.use("/api/v1",router);

app.listen(process.env.PORT || 3000, () => {
    console.log("HTTP SERVER RUNNING AT: ",process.env.PORT || 3000);
});