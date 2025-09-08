// ./server.js

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { renderQRCodeInTerminal } = require("clnk-terminal");
const { formatIPUrl } = require("@untools/ip-url");

const app = express();
const port = 3581;

// Directory to save uploaded files
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Directory for public files
const filesDir = path.join(__dirname, "public", "files");
if (!fs.existsSync(filesDir)) {
  fs.mkdirSync(filesDir, { recursive: true });
}

// Serve static files from the public directory
app.use(express.static("public"));

// Multer setup for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

// Route to upload files
app.post("/upload", upload.single("file"), (req, res) => {
  res.send("File uploaded successfully");
});

// Route to download files
app.get("/download/:filename", (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).send("File not found");
  }
});

// Serve the upload directory to browse files
app.use("/files", express.static(uploadDir));

// API endpoint to list files in the public/files directory
app.get("/api/files", (req, res) => {
  try {
    const files = [];

    // Read files from public/files directory
    const publicFilesDir = path.join(__dirname, "public", "files");
    if (fs.existsSync(publicFilesDir)) {
      fs.readdirSync(publicFilesDir).forEach((file) => {
        // Skip index.html and any hidden files
        if (file === "index.html" || file.startsWith(".")) return;

        const filePath = path.join(publicFilesDir, file);
        const stats = fs.statSync(filePath);

        if (stats.isFile()) {
          files.push({
            name: file,
            size: stats.size,
            lastModified: stats.mtime,
          });
        }
      });
    }

    // Also read files from uploads directory
    if (fs.existsSync(uploadDir)) {
      fs.readdirSync(uploadDir).forEach((file) => {
        if (file.startsWith(".")) return; // Skip hidden files

        const filePath = path.join(uploadDir, file);
        const stats = fs.statSync(filePath);

        if (stats.isFile()) {
          files.push({
            name: file,
            size: stats.size,
            lastModified: stats.mtime,
          });
        }
      });
    }

    res.json(files);
  } catch (error) {
    console.error("Error reading files:", error);
    res.status(500).json({ error: "Failed to read files" });
  }
});

// Start the server
app.listen(port, async () => {
  const url = formatIPUrl(port);
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`Network URL: ${url}`);
  await renderQRCodeInTerminal(url);
});
