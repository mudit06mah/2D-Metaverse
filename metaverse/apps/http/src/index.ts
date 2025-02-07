import express from "express";
import {router} from "./routes/index.routes";

const app = express();
app.use(express.json());

app.use("/api/v1",router);

app.listen(process.env.PORT || 3000, () => {
    console.log("SEX KRDUNGA RISHAB KE SAATH ISS ADDRESS PE: ",process.env.PORT || 3000);
});