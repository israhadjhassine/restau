const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.get("/", async (req, res) => {
  res.json(await User.find());
});

router.post("/", async (req, res) => {
  const user = new User(req.body);
  await user.save();
  res.json(user);
});

module.exports = router;
