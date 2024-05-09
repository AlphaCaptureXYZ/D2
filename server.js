"use strict";

const express = require("express");
const path = require("path");
const app = express();
const cors = require("cors");

const port = +(process.env.PORT || "4200");

app.use(cors());

app.use(express.static(path.join(__dirname, "dist")));

app.get("/*", function (req, res) {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(port, () => {
  console.log(`Dashboard running on port ${port}`);
});
