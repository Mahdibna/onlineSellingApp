import os
os.environ['KMP_DUPLICATE_LIB_OK'] = 'True'
import json
import numpy as np
from flask import Flask, render_template, request, jsonify, Response
from flask_cors import CORS
from groq import Groq
from transformers import AutoTokenizer, AutoModel
from faiss import read_index, write_index, IndexFlatL2
from dotenv import load_dotenv
import logging

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Configuration
EMBEDDING_MODEL = "BAAI/bge-m3"
FAISS_INDEX_PATH = "models/faiss_index.index"
EMBEDDINGS_PATH = "models/embeddings.npy"
JSON_DATA_PATH = "data/data.json"

# Initialize Groq client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Load embedding model
tokenizer = AutoTokenizer.from_pretrained(EMBEDDING_MODEL)
model = AutoModel.from_pretrained(EMBEDDING_MODEL)

# Global variable for document data
document_data = []

def get_embedding(text):
    try:
        inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512)
        outputs = model(**inputs)
        return outputs.last_hidden_state.mean(dim=1).detach().numpy()
    except Exception as e:
        logger.error(f"Error generating embedding for text: {text[:50]}...: {e}")
        raise

def initialize_rag():
    global document_data
    logger.info("Initializing RAG...")

    # Check if index and embeddings exist and are valid
    if os.path.exists(FAISS_INDEX_PATH) and os.path.exists(EMBEDDINGS_PATH):
        try:
            index = read_index(FAISS_INDEX_PATH)
            embeddings = np.load(EMBEDDINGS_PATH)
            with open(JSON_DATA_PATH, 'r', encoding='utf-8') as f:
                document_data = json.load(f)
            if len(document_data) == embeddings.shape[0]:
                logger.info(f"Loaded {len(document_data)} entries from data.json with matching embeddings")
                return index, embeddings
            else:
                logger.warning("Mismatch between document_data and embeddings, regenerating index...")
        except Exception as e:
            logger.error(f"Error loading index or embeddings: {e}")

    # Load static data
    try:
        with open(JSON_DATA_PATH, 'r', encoding='utf-8') as f:
            document_data = json.load(f)
        logger.info(f"Loaded {len(document_data)} entries from data.json")
    except Exception as e:
        logger.error(f"Error loading JSON data: {e}")
        document_data = []
        return None, None

    if not document_data:
        logger.error("No data loaded, cannot create FAISS index")
        return None, None

    # Create texts for embedding (assuming data.json is now in English)
    texts = [
        f"Subject: {item['sujet']}\nQuestion: {item['contenu']['question']}\nAnswer: {item['contenu']['reponse']}"
        for item in document_data
    ]
    
    # Generate embeddings
    try:
        embeddings = np.vstack([get_embedding(text) for text in texts])
        logger.info(f"Generated embeddings for {len(texts)} documents")
    except Exception as e:
        logger.error(f"Error generating embeddings: {e}")
        return None, None

    # Create and save FAISS index
    try:
        index = IndexFlatL2(embeddings.shape[1])
        index.add(embeddings)
        os.makedirs("models", exist_ok=True)
        write_index(index, FAISS_INDEX_PATH)
        np.save(EMBEDDINGS_PATH, embeddings)
        logger.info("Created and saved new FAISS index and embeddings")
        return index, embeddings
    except Exception as e:
        logger.error(f"Error creating FAISS index: {e}")
        return None, None

# Initialize RAG at startup
faiss_index, document_embeddings = initialize_rag()

def rag_retrieval(query, k=3):
    if not document_data or faiss_index is None:
        logger.error("No document data or FAISS index available")
        return []

    try:
        query_embedding = get_embedding(query)
        distances, indices = faiss_index.search(query_embedding, k)
        logger.info(f"FAISS search returned {len(indices[0])} indices: {indices[0]}")
        
        # Validate indices
        valid_indices = [i for i in indices[0] if 0 <= i < len(document_data)]
        if not valid_indices:
            logger.warning("No valid indices found in FAISS search")
            return []
        
        return [document_data[i] for i in valid_indices]
    except Exception as e:
        logger.error(f"Error in RAG retrieval: {e}")
        return []

def generate_response(prompt, context, device_info=None):
    if not context:
        logger.warning("No context provided, returning default response")
        return "Sorry, I couldn't find an answer. Please rephrase your question or contact support@xinxugroup.cn."

    # Format context for LLM (assuming context is in English)
    context_str = "\n\n".join([
        f"Question: {item['contenu']['question']}\nAnswer: {item['contenu']['reponse']}"
        for item in context
    ])
    
    # Include device information in system prompt if available
    device_info_str = ""
    if device_info:
        device_info_str = f"\nThe user is using the mobile app on a {device_info} device."
    
    system_prompt = f"""You are a chatbot for Shandong Xinxu Group. 
Do not provide answers outside the provided context and strictly limit yourself to the given information.{device_info_str}

Available information:
{context_str}

Customer question: {prompt}"""
    
    try:
        completion = client.chat.completions.create(
            model="Llama3-70b-8192",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": "Respond concisely and accurately in English. If the information is not available in the context, simply state that you cannot respond."}
            ],
            temperature=0.3
        )
        return completion.choices[0].message.content
    except Exception as e:
        logger.error(f"Error generating response from Groq: {e}")
        return f"Error generating response: {str(e)}"

# Keep original /chat endpoint for compatibility with mobile app
@app.route("/chat", methods=["POST"])
def chat():
    if request.method == "POST":
        try:
            data = request.json
            user_message = data.get("message")
            
            # Try to extract device info if available in the request
            device_info = data.get("device_info", "")
            # If device_info isn't directly provided, check if we can determine it's from a mobile app
            if not device_info and data.get("source") == "mobile_app":
                device_info = "mobile device"
            
            if not user_message:
                logger.warning("No message provided in request")
                return jsonify({"response": "Please provide a message."}), 400
            
            logger.info(f"Received user query from mobile: {user_message}")
            
            # Retrieve static context from FAISS
            context = rag_retrieval(user_message)
            logger.info(f"Retrieved {len(context)} context documents")
            
            # Generate response with device info
            response = generate_response(user_message, context, device_info)
            
            # Return response in the original format expected by the app
            return jsonify({"response": response})
        except Exception as e:
            logger.error(f"Error in chat endpoint: {e}")
            return jsonify({"response": f"An error occurred: {str(e)}"}), 500
    else:
        return Response(status=405)

# Add home route for web access if needed
@app.route("/")
def home():
    return render_template("home.html")

# Add chatbot web interface if needed
@app.route("/chatbot")
def chatbot():
    return render_template("chat.html")

# Health check endpoint
@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "online", "service": "xinxu-chatbot-api"})

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)