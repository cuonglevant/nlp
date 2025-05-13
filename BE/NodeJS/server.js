import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import axios from "axios";
import historyRoutes from "./routes/historyRoutes.js";
import RequestHistory from "./models/requestHistory.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose
  .connect(
    "mongodb+srv://cuonglevant:admin@project04.lgkvj.mongodb.net/historyDB?retryWrites=true&w=majority&appName=project04",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// API proxy endpoint for prediction with history logging
app.post("/api/predict", async (req, res) => {
  try {
    const startTime = Date.now();
    const text = req.body.text;

    // Forward request to Flask API
    const flaskResponse = await axios.post("http://127.0.0.1:5000/predict", {
      text: text,
    });

    const endTime = Date.now();

    // Save request to history
    const requestHistory = new RequestHistory({
      endpoint: "/predict",
      inputText: text,
      prediction: flaskResponse.data.predictions,
      timestamp: new Date(),
      processingTime: endTime - startTime,
    });

    try {
      await requestHistory.save();
      console.log(
        `History saved: ${requestHistory._id} for text "${text.substring(
          0,
          20
        )}..."`
      );
    } catch (saveError) {
      console.error("Error saving history:", saveError);
      // Continue processing even if save fails
    }

    // Emit new history event to connected clients
    io.emit("newPrediction", requestHistory);

    // Return the original response
    res.json(flaskResponse.data);
  } catch (error) {
    console.error("Error proxying request:", error);
    res.status(500).json({ error: "Error processing request" });
  }
});

// Add this before your existing routes
app.get("/api/check-history", async (req, res) => {
  try {
    const count = await RequestHistory.countDocuments();
    const recent = await RequestHistory.find().sort({ timestamp: -1 }).limit(5);
    res.json({
      count,
      recentEntries: recent,
      message: count > 0 ? "History records found" : "No history records yet",
    });
  } catch (error) {
    console.error("Error checking history:", error);
    res.status(500).json({ error: "Error checking history" });
  }
});

// Batch prediction proxy with history logging
app.post("/api/batch_predict", async (req, res) => {
  try {
    const startTime = Date.now();
    const texts = req.body.texts;

    // Forward request to Flask API
    const flaskResponse = await axios.post(
      "http://127.0.0.1:5000/batch_predict",
      {
        texts: texts,
      }
    );

    const endTime = Date.now();

    // Save all texts and predictions as one history record
    const requestHistory = new RequestHistory({
      endpoint: "/batch_predict",
      inputText: texts, // Lưu cả mảng text
      prediction: flaskResponse.data.predictions, // Lưu cả mảng kết quả
      timestamp: new Date(),
      processingTime: endTime - startTime,
      batchId: startTime.toString(),
    });

    try {
      await requestHistory.save();
      console.log(
        `Batch history saved: ${requestHistory._id} for ${texts.length} texts`
      );
    } catch (saveError) {
      console.error("Error saving batch history:", saveError);
    }

    // Emit batch prediction event
    io.emit("newBatchPrediction", {
      batchId: startTime.toString(),
      count: texts.length,
    });

    // Return the original response
    res.json(flaskResponse.data);
  } catch (error) {
    console.error("Error proxying batch request:", error);
    res.status(500).json({ error: "Error processing batch request" });
  }
});

// Use history routes
app.use("/api/history", historyRoutes);

// Socket.io connection handler
io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`History server running on port ${PORT}`);
});
