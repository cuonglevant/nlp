import mongoose from "mongoose";

const requestHistorySchema = new mongoose.Schema({
  endpoint: {
    type: String,
    required: true,
  },
  inputText: {
    type: [String],
    required: true,
  },
  prediction: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  processingTime: {
    type: Number,
    required: true,
  },
  batchId: {
    type: String,
    default: null,
  },
});

export default mongoose.model("RequestHistory", requestHistorySchema);
