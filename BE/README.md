# RNN Model Flask API

This Flask application serves a REST API for making predictions using the pre-trained RNN model.

## Setup and Installation

1. Ensure you have Python 3.7+ installed
2. Install the required packages:
   ```
   pip install -r requirements.txt
   ```
3. Make sure the model file `RNN.h5` and tokenizer file `tokenizer.pickle` are in the same directory as the application

## Running the Server

Start the server with:

```bash
python app.py
```

For production deployment, use Gunicorn:

```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## API Endpoints

### Health Check

- **URL**: `/health`
- **Method**: `GET`
- **Response**: Status of the model and tokenizer

### Make Prediction

- **URL**: `/predict`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "text": "your text here"
  }
  ```
- **Response**: Prediction results based on the model

### Batch Prediction

- **URL**: `/batch_predict`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "texts": ["text1", "text2", "text3"]
  }
  ```
- **Response**: Array of prediction results

### Tokenize Text

- **URL**: `/tokenize`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "text": "your text here"
  }
  ```
- **Response**: Tokenized representation of the input text

## Example Usage

Using curl:

```bash
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{"text": "your input text here"}'
```

Using Python requests:

```python
import requests
import json

url = "http://localhost:5000/predict"
data = {"text": "your input text here"}
headers = {"Content-Type": "application/json"}

response = requests.post(url, data=json.dumps(data), headers=headers)
print(response.json())
```
