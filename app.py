from flask import Flask

app = Flask(__name__)

@app.route("/")
def home():
    return "Home"

@app.route("/search")
def search():
    return "search result"

if __name__ == "__main__":
    app.run(debug = True)