from flask import Flask,request,jsonify,render_template,redirect,url_for,Response
import source
from dotenv import load_dotenv
import requests
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
    songs = source.get_search_result(query)
    if not songs:
        return "Error please search again"
    # return songs
    return render_template("result.html", songs=songs)

@app.route("/now-playing",methods = ["POST"])
def now_playing():
    data = request.get_json()
    videoId = data['id']
    # source.get_similar(videoId)
    return jsonify({"url": f"/stream/{videoId}"})
    
@app.route("/stream/<video_id>")
def stream(video_id):
    # get the media_url for this video_id
    media_url = source.get_url(video_id)
    
    req = requests.get(media_url, stream=True, headers={
        "User-Agent": "Mozilla/5.0"
    })
    
    return Response(
        req.iter_content(chunk_size=4096),
        content_type=req.headers['Content-Type']
    )
    
    
if __name__ == "__main__":
    try:
        app.run(debug = True)
    except Exception as e:
        print(e)
        