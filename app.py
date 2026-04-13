from flask import Flask,request,jsonify,render_template,redirect,url_for
import source
import recommendtion


app = Flask(__name__)

@app.route("/",methods= ['GET','POST'])
def home():
    return render_template("home.html")

@app.route("/result/")
def result():
    lyrics = False
    query = request.args.get('query')
    songs = source.search_for_song(query)
    if not songs:
        return "Error please search again"
    # return songs
    return render_template("result.html", songs=songs)

@app.route("/now-playing",methods = ["POST"])
def now_playing():
    data = request.get_json()
    song = data['song']
    artist = data['artist']
    recommendtion.get_similar(song,artist)
    return "", 204
    
if __name__ == "__main__":
    app.run(debug = True)