from flask import Flask,request,jsonify,render_template,redirect,url_for
import new_source
import recommendtion


app = Flask(__name__)

@app.route("/",methods= ['GET','POST'])
def home():
    return render_template("home.html")

@app.route("/result/")
def result():
    lyrics = False
    query = request.args.get('query')
    songs = new_source.get_search_result(query)
    if not songs:
        return "Error please search again"
    return songs
    return render_template("result.html", songs=songs)

@app.route("/now-playing",methods = ["POST"])
def now_playing():
    data = request.get_json()
    videoId = data['videoId']
    new_source.get_similar(videoId)
    return "", 204
    
if __name__ == "__main__":
    app.run(debug = True)