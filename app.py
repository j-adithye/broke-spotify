from flask import Flask,request,jsonify
import source


app = Flask(__name__)

@app.route("/")
def home():
    return "Home"

@app.route("/result/")
def result():
    lyrics = False
    query = request.args.get('query')
    return jsonify(source.search_for_song(query, lyrics, True))

if __name__ == "__main__":
    app.run(debug = True)