from flask import Flask, request, jsonify
import numpy as np
import pickle
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.sequence import pad_sequences
import os

app = Flask(__name__)

# Global variables for model and tokenizer
model = None
tokenizer = None
max_sequence_length = 100  # Set this to match your model's expected input

def load_model_and_tokenizer():
    """Load the RNN model and tokenizer at startup"""
    global model, tokenizer
    
    try:
        # Load the model
        model_path = os.path.join(os.path.dirname(__file__), 'RNN.h5')
        model = load_model(model_path)
        print(f"Model loaded successfully from {model_path}")
        
        # Load the tokenizer
        tokenizer_path = os.path.join(os.path.dirname(__file__), 'tokenizer.pickle')
        with open(tokenizer_path, 'rb') as handle:
            tokenizer = pickle.load(handle)
        print(f"Tokenizer loaded successfully from {tokenizer_path}")
        
        return True
    except Exception as e:
        print(f"Error loading model or tokenizer: {str(e)}")
        return False

@app.route('/health', methods=['GET'])
def health_check():
    """Basic health check endpoint"""
    if model is not None and tokenizer is not None:
        return jsonify({"status": "healthy", "message": "Model and tokenizer are loaded"}), 200
    else:
        return jsonify({"status": "unhealthy", "message": "Model or tokenizer not loaded"}), 500

@app.route('/predict', methods=['POST'])
def predict():
    """Endpoint to make predictions using the loaded RNN model"""
    if model is None or tokenizer is None:
        return jsonify({"error": "Model or tokenizer not loaded"}), 500
    
    # Get the text from the request
    data = request.get_json(force=True)
    
    if 'text' not in data:
        return jsonify({"error": "No text provided in the request"}), 400
    
    text = data['text']
    
    try:
        # Tokenize and pad the text
        sequences = tokenizer.texts_to_sequences([text])
        padded_sequences = pad_sequences(sequences, maxlen=max_sequence_length)
        
        # Make prediction
        prediction = model.predict(padded_sequences)
        
        # Process the prediction based on your model's output
        # This depends on your specific model architecture
        result = process_prediction(prediction, top_k=3)
        return jsonify({"predictions": result}), 200
    
    except Exception as e:
        return jsonify({"error": f"Prediction error: {str(e)}"}), 500

def process_prediction(prediction, top_k=3):
    """
    Trả về top-k từ tiếp theo có xác suất cao nhất
    """
    if isinstance(prediction, np.ndarray):
        # Lấy chỉ số của top-k xác suất lớn nhất
        top_indices = prediction[0].argsort()[-top_k:][::-1]
        # Tạo mapping index -> word
        index_word = {v: k for k, v in tokenizer.word_index.items()}
        results = []
        for idx in top_indices:
            # Tìm từ tương ứng với index (nếu có)
            word = index_word.get(idx, "<unknown>")
            confidence = float(prediction[0][idx])
            results.append({
                "next_word": word,
                "confidence": confidence
            })
        return results
    return {"raw_prediction": prediction.tolist()}
    

@app.route('/batch_predict', methods=['POST'])
def batch_predict():
    """Endpoint to make batch predictions"""
    if model is None or tokenizer is None:
        return jsonify({"error": "Model or tokenizer not loaded"}), 500
    
    data = request.get_json(force=True)
    
    if 'texts' not in data or not isinstance(data['texts'], list):
        return jsonify({"error": "No texts array provided in the request"}), 400
    
    texts = data['texts']
    
    try:
        # Tokenize and pad all texts
        sequences = tokenizer.texts_to_sequences(texts)
        padded_sequences = pad_sequences(sequences, maxlen=max_sequence_length)
        
        # Make predictions
        predictions = model.predict(padded_sequences)
        
        # Process all predictions
        results = [process_prediction(pred.reshape(1, -1)) for pred in predictions]
        
        return jsonify({"predictions": results}), 200
    
    except Exception as e:
        return jsonify({"error": f"Batch prediction error: {str(e)}"}), 500

@app.route('/tokenize', methods=['POST'])
def tokenize():
    """Endpoint to tokenize text without making predictions"""
    if tokenizer is None:
        return jsonify({"error": "Tokenizer not loaded"}), 500
    
    data = request.get_json(force=True)
    
    if 'text' not in data:
        return jsonify({"error": "No text provided in the request"}), 400
    
    text = data['text']
    
    try:
        # Tokenize the text
        sequences = tokenizer.texts_to_sequences([text])
        padded_sequences = pad_sequences(sequences, maxlen=max_sequence_length)
        
        return jsonify({
            "tokens": sequences[0],
            "padded_sequence": padded_sequences[0].tolist(),
            "word_index": {word: index for word, index in tokenizer.word_index.items() if word in text.split()}
        }), 200
    
    except Exception as e:
        return jsonify({"error": f"Tokenization error: {str(e)}"}), 500

if __name__ == '__main__':
    # Load model and tokenizer before starting the server
    if load_model_and_tokenizer():
        # Run the Flask app
        app.run(host='0.0.0.0', port=5000, debug=False)
    else:
        print("Failed to load model or tokenizer. Exiting.")