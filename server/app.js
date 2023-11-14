import express from "express";
import cors from "cors";
import fs from "fs";
import bodyParser from "body-parser";
import md5 from "md5";

const app = express();

// Body-parser middleware client <---> middleware <---> server
// Parse JSON bodies
app.use(bodyParser.json());

// Parse URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

// Parse HTML bodies
app.use(bodyParser.text({ type: "text/html" }));

// Parse XML bodies
app.use(bodyParser.text({ type: "application/xml" }));

// Parse binary bodies
app.use(bodyParser.raw({ type: "application/octet-stream", limit: "100mb" }));

// * Note: body-parser will automatically select the appropriate parser based on the Content-Type header.
// * For example, if the header is application/json, it will use the JSON parser.
// * json: Parses JSON data.
// * urlencoded: Parses URL-encoded data (typically sent by HTML forms).
// * raw: Parses raw text.
// * text: Parses plain text.

var allowlist = ["http://localhost:3000", "http://allowedhost.com"];
var corsOptionsDelegate = function (req, callback) {
  var corsOptions;
  if (allowlist.indexOf(req.header("Origin")) !== -1) {
    corsOptions = { origin: true }; // reflect (enable) the requested origin in the CORS response
  } else {
    corsOptions = { origin: false }; // disable CORS for this request
  }
  callback(null, corsOptions); // callback expects two parameters: error and options
};

app.use(cors(corsOptionsDelegate));

app.use("/uploads", express.static("uploads"));

app.post("/upload", (req, res) => {
  const { name, currentChunkIndex, totalChunks } = req.query;
  const firstChunk = parseInt(currentChunkIndex) === 0;
  const lastChunk = parseInt(currentChunkIndex) === parseInt(totalChunks) - 1;
  const ext = name.split(".").pop();
  const data = req.body.toString().split(",")[1];
  const buffer = new Buffer(data, "base64");
  const tmpFilename = "tmp_" + md5(name + req.ip) + "." + ext;
  if (firstChunk && fs.existsSync("./uploads/" + tmpFilename)) {
    fs.unlinkSync("./uploads/" + tmpFilename);
  }
  fs.appendFileSync("./uploads/" + tmpFilename, buffer);
  if (lastChunk) {
    const finalFilename = md5(Date.now()).substr(0, 6) + "." + ext;
    fs.renameSync("./uploads/" + tmpFilename, "./uploads/" + finalFilename);
    res.json({ finalFilename });
  } else {
    res.json("ok");
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`dnd-multi-upload-server listening on PORT ${PORT}`);
});
