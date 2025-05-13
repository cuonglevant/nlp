import express from "express";
import RequestHistory from "../models/requestHistory.js";

const router = express.Router();

// Get all request history, with pagination
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const total = await RequestHistory.countDocuments();
    const history = await RequestHistory.find()
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      total,
      page,
      pages: Math.ceil(total / limit),
      history,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get history by ID
router.get("/:id", async (req, res) => {
  try {
    const history = await RequestHistory.findById(req.params.id);
    if (!history) {
      return res.status(404).json({ error: "History entry not found" });
    }
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search history
router.get("/search/:term", async (req, res) => {
  try {
    const searchTerm = req.query.term;
    const history = await RequestHistory.find({
      inputText: { $regex: searchTerm, $options: "i" },
    }).sort({ timestamp: -1 });

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get batch predictions by batchId
router.get("/batch/:batchId", async (req, res) => {
  try {
    const history = await RequestHistory.find({
      batchId: req.params.batchId,
    }).sort({ timestamp: -1 });

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
