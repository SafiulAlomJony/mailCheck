const express = require("express");
const bodyParser = require("body-parser");
const { mailCheck } = require("./mailCheck");
const app = express();

const PORT = process.env.PORT || 4000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(function (err, req, res, next) {
  if (err instanceof SyntaxError && err.status === 400) {
    console.error("Bad JSON");
    res.send('{"error":"Invalid Request Data"}');
  }
});

app.get("/", (req, res) => {
  res.send("Welcome to Gmail Checker v1 API!");
});

app.get("/v1", (req, res) => {
  res.send("Gmail Checker v1 Running!\nLast Update: 01:09am 03/12/2023");
});

app.post("/v1", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  let data = req.body;
  let headers = data.headers ? data.headers : {};
  let ua = headers["user-agent"]
    ? decodeURIComponent(headers["user-agent"])
    : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36";
  let email = data.email ? data.email : "example@gmail.com";
  mailCheck(res, email, ua);
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
