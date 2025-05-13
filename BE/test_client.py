import requests
import json
import sys

def print_response(response):
    """Helper to print a JSON response or fallback to raw text"""
    try:
        print(json.dumps(response.json(), indent=2))
    except Exception:
        print(response.text)

def test_health(base_url):
    """Test the health endpoint"""
    url = f"{base_url}/health"
    try:
        response = requests.get(url)
        print(f"\n[Health Check] Status: {response.status_code}")
        print_response(response)
        return response.status_code == 200
    except Exception as e:
        print(f"[Health Check] Error: {e}")
        return False

def test_prediction(base_url, text):
    """Test the prediction endpoint"""
    url = f"{base_url}/predict"
    payload = {"text": text}
    headers = {"Content-Type": "application/json"}
    try:
        response = requests.post(url, json=payload, headers=headers)
        print(f"\n[Prediction] Status: {response.status_code}")
        print(f"Input: {text}")
        print("Response:")
        print_response(response)
        return response.status_code == 200
    except Exception as e:
        print(f"[Prediction] Error: {e}")
        return False

def test_batch_prediction(base_url, texts):
    """Test the batch prediction endpoint"""
    url = f"{base_url}/batch_predict"
    payload = {"texts": texts}
    headers = {"Content-Type": "application/json"}
    try:
        response = requests.post(url, json=payload, headers=headers)
        print(f"\n[Batch Prediction] Status: {response.status_code}")
        print(f"Inputs: {texts}")
        print("Response:")
        print_response(response)
        return response.status_code == 200
    except Exception as e:
        print(f"[Batch Prediction] Error: {e}")
        return False

def test_tokenize(base_url, text):
    """Test the tokenize endpoint"""
    url = f"{base_url}/tokenize"
    payload = {"text": text}
    headers = {"Content-Type": "application/json"}
    try:
        response = requests.post(url, json=payload, headers=headers)
        print(f"\n[Tokenize] Status: {response.status_code}")
        print(f"Input: {text}")
        print("Response:")
        print_response(response)
        return response.status_code == 200
    except Exception as e:
        print(f"[Tokenize] Error: {e}")
        return False

if __name__ == "__main__":
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5000"
    print(f"\n=== Testing API at {base_url} ===")

    if test_health(base_url):
        sample_text = "This is a sample text to test the RNN model."
        batch_texts = [
            "First sample text.",
            "Second sample text.",
            "Third sample text."
        ]

        test_prediction(base_url, sample_text)
        test_batch_prediction(base_url, batch_texts)
        test_tokenize(base_url, sample_text)

        print("\n✅ All tests completed.")
    else:
        print("\n❌ API health check failed. Skipping other tests.")
