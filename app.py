from flask import Flask,request,render_template,session
import source
import recommendtion
from dotenv import load_dotenv
import os
load_dotenv()


app = Flask(__name__)
app.secret_key = os.getenv('secret')


@app.route("/",methods= ['GET','POST'])
def home():
    return render_template("home.html")

@app.route("/result/")
def result():
    query = request.args.get('query')
    songs = source.search_for_song(query)
    if not songs:
        return "Error please search again"
    # return songs
    return render_template("result.html", songs=songs)

@app.route("/now-playing",methods = ["POST"])
def now_playing():
    data = request.get_json()
    session['songs'] = recommendtion.get_similar(data['song'],data['artist'])
    session['url_queue'] = recommendtion.get_urls(session['songs'])
    return "", 204
    
@app.route('/test')
def test():
    return session['song']
    
if __name__ == "__main__":
    try:
        app.run(debug = True)
    except Exception as e:
        print(e)
        