from flask import Flask,request


app = Flask(__name__)

@app.route("/")
def home():
    return "Home"

@app.route("/result/")
def result():
    query = request.args.get('query')
    return query

if __name__ == "__main__":
    app.run(debug = True)