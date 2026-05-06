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
    return render_template("result.html", songs=songs)

@app.route("/now-playing",methods = ["POST"])
def now_playing():
    data = request.get_json()
    
    return jsonify({"url": f"/stream/{data['id']}"})
    
@app.route("/stream/<video_id>")
def stream(video_id):
    media_url = source.get_url(video_id)

    range_header = request.headers.get('Range')
    
    headers = {
        "User-Agent": "Mozilla/5.0",
    }
    if range_header:
        headers['Range'] = range_header
    
    req = requests.get(media_url, stream=True, headers=headers)
    
    response_headers = {
        'Accept-Ranges': 'bytes',
        'Content-Type': req.headers.get('Content-Type', 'audio/webm'),
    }
    
    if 'Content-Range' in req.headers:
        response_headers['Content-Range'] = req.headers['Content-Range']
    if 'Content-Length' in req.headers:
        response_headers['Content-Length'] = req.headers['Content-Length']
    
    status = 206 if range_header else 200
    
    return Response(
        req.iter_content(chunk_size=4096),
        status=status,
        headers=response_headers
    )
    
    
if __name__ == "__main__":
    try:
        app.run(debug = True)
    except Exception as e:
        print(e)
        