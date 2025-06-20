from flask import Flask
from flask import request, jsonify
from flask_cors import CORS
from link_parser import extract_links



app = Flask(__name__)
CORS(app)
@app.route("/")
def home():
    return "Hello from BingoFreebies backend!"


@app.route("/submit", methods=["POST"])
def submit():
    import sys
    print(">>> Debugger attached?", hasattr(sys, 'gettrace') and sys.gettrace() is not None)
    # Logic to handle form submission
    print(">>>submit was called")
    data = request.get_json()
    device = data.get("device", "Unknown")
    post_text = data.get("postText", "")
    links = extract_links(post_text, device)
    return jsonify({"status": "ok", "links": links})

if __name__ == "__main__":
    app.run(debug=True)
    