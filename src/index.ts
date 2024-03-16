import express, { Request, Response } from "express";
import multer from "multer";
import { exec } from "child_process";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { mkdir } from "fs/promises";

const app = express();
const port = 3000;

// Multer configuration for handling file uploads
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    await mkdir("uploads", { recursive: true });
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    // Generate a unique filename using crypto
    const uniqueSuffix =
      Date.now() + "-" + crypto.randomBytes(8).toString("hex");
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Express route for file upload
app.post("/", upload.single("file"), (req: Request, res: Response) => {
  if (req.headers["x-api-key"] !== process.env.API_KEY) {
    return res.status(401).send("Unauthorized");
  }

  if (!req.file) {
    return res.status(400).send("No files were uploaded.");
  }

  // FFMPEG command to process the uploaded file
  const outputFilename = path.join(__dirname, `processed-${req.file.filename}`);
  const ffmpegCommand = `ffmpeg -i uploads/${req.file.filename} ${req.body.ffmpegArgs} ${outputFilename}`;

  exec(ffmpegCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return res.status(500).send("Error processing file.");
    }

    // Sending the processed file back to the client
    res.sendFile(outputFilename, (err) => {
      if (err) {
        console.error(`Error sending file: ${err}`);
        res.status(500).send("Error sending processed file.");
      } else {
        console.log("File sent successfully");

        // Remove uploaded file and processed file after sending
        fs.unlink(`uploads/${req.file?.filename}`, (unlinkErr) => {
          if (unlinkErr) {
            console.error(`Error deleting file: ${unlinkErr}`);
          } else {
            console.log("Uploaded file deleted successfully");
          }
        });
        fs.unlink(outputFilename, (unlinkErr) => {
          if (unlinkErr) {
            console.error(`Error deleting file: ${unlinkErr}`);
          } else {
            console.log("Processed file deleted successfully");
          }
        });
      }
    });
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
