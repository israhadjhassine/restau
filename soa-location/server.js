const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const localisationRoutes = require("./routes/localisation");
const app = express();

app.use(express.json());

// DB
mongoose.connect("mongodb://localhost:27017/soa_location")
  .then(() => console.log("SOA Localisation connectée"))
  .catch(err => console.log(err));
app.use(express.json());
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use("/localisation", localisationRoutes);

app.listen(5001, () => {
  console.log("SOA localisation => http://localhost:5001");
});
