from flask import Flask, request, jsonify
import numpy as np
import pickle
import os
from transformers import GPT2Tokenizer, GPT2LMHeadModel
import torch

app = Flask(__name__)

# Global variables for model and tokenizer
model = None
tokenizer = None
max_sequence_length = 100  # Set this to match your model's expected input
MODEL_NOT_LOADED_MSG = "Model or tokenizer not loaded"

def load_model_and_tokenizer():
    """Load the GPT-2 model and tokenizer at startup"""
    global model, tokenizer
    
    try:
        model_dir = os.path.join(os.path.dirname(__file__), 'model', 'GPT-2-10m')
        tokenizer = GPT2Tokenizer.from_pretrained(model_dir)
        model = GPT2LMHeadModel.from_pretrained(model_dir)
        print(f"Model and tokenizer loaded successfully from {model_dir}")
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
        return jsonify({"status": "unhealthy", "message": MODEL_NOT_LOADED_MSG}), 500

@app.route('/predict', methods=['POST'])
def predict():
    """Endpoint to make predictions using the loaded GPT-2 model"""
    if model is None or tokenizer is None:
        return jsonify({"error": MODEL_NOT_LOADED_MSG}), 500
    
    data = request.get_json(force=True)
    
    if 'text' not in data:
        return jsonify({"error": "No text provided in the request"}), 400
    
    text = data['text']
    num_return_sequences = data.get('num_return_sequences', 1)
    
    try:
        # Tokenize and pad the text
        inputs = tokenizer.encode(text, return_tensors="pt", max_length=max_sequence_length, truncation=True)
        
        # Make prediction
        with torch.no_grad():
            outputs = model.generate(inputs, max_length=max_sequence_length, num_return_sequences=num_return_sequences, do_sample=True)
        
        # Decode the predictions
        predictions = [tokenizer.decode(output, skip_special_tokens=True) for output in outputs]
        
        if num_return_sequences == 1:
            return jsonify({"prediction": predictions[0]}), 200
        else:
            return jsonify({"predictions": predictions}), 200
    
    except Exception as e:
        return jsonify({"error": f"Prediction error: {str(e)}"}), 500

@app.route('/batch_predict', methods=['POST'])
def batch_predict():
    """Endpoint to make batch predictions"""
    if model is None or tokenizer is None:
        return jsonify({"error": MODEL_NOT_LOADED_MSG}), 500
    
    data = request.get_json(force=True)
    
    if 'texts' not in data or not isinstance(data['texts'], list):
        return jsonify({"error": "No texts array provided in the request"}), 400
    
    texts = data['texts']
    
    try:
        # Tokenize and pad all texts
        inputs = tokenizer(texts, return_tensors="pt", padding=True, truncation=True, max_length=max_sequence_length)
        
        # Make predictions
        with torch.no_grad():
            outputs = model.generate(**inputs, max_length=max_sequence_length)
        
        # Decode all predictions
        predictions = [tokenizer.decode(output, skip_special_tokens=True) for output in outputs]
        
        return jsonify({"predictions": predictions}), 200
    
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
        tokens = tokenizer.encode(text)
        
        return jsonify({
            "tokens": tokens,
            "word_index": {word: index for index, word in enumerate(tokenizer.get_vocab()) if word in text.split()}
        }), 200
    
    except Exception as e:
        return jsonify({"error": f"Tokenization error: {str(e)}"}), 500

@app.route('/predict_next_word', methods=['POST'])
def predict_next_word():
    """Endpoint to predict the next word only using the loaded GPT-2 model"""
    if model is None or tokenizer is None:
        return jsonify({"error": MODEL_NOT_LOADED_MSG}), 500
    
    data = request.get_json(force=True)
    
    if 'text' not in data:
        return jsonify({"error": "No text provided in the request"}), 400
    
    text = data['text']
    
    try:
        # Tokenize the text
        inputs = tokenizer.encode_plus(
            text,
            return_tensors="pt",
            max_length=max_sequence_length,
            truncation=True,
            padding="max_length"
        )
        input_ids = inputs["input_ids"]
        attention_mask = inputs["attention_mask"]
        
        # Generate only 1 next token
        with torch.no_grad():
            outputs = model.generate(
                input_ids,
                attention_mask=attention_mask,
                max_new_tokens=1,
                do_sample=False
            )
        
        # The next token is the last token in the output
        next_token_id = outputs[0, -1].item()
        next_word = tokenizer.decode([next_token_id], skip_special_tokens=True)
        
        return jsonify({"next_word": next_word, "next_token_id": next_token_id}), 200
    
    except Exception as e:
        return jsonify({"error": f"Next word prediction error: {str(e)}"}), 500

if __name__ == '__main__':
    # Load model and tokenizer before starting the server
    if load_model_and_tokenizer():
        # Run the Flask app
        app.run(host='0.0.0.0', port=5000, debug=False)
    else:
        print("Failed to load model or tokenizer. Exiting.")