from flask import Flask,request,jsonify,render_template,Response
import source
import requests,json,time
from threading import Thread
import models 

queue = {"tracks": [], "cur_idx": 0}
db = models.db

def fetch_and_queue(video_id):
    tracks = source.get_similar(video_id)
    queue['tracks'].extend(tracks)

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///music.db'
db.init_app(app)

with app.app_context():
    db.create_all()

@app.route("/",methods= ['GET','POST'])
def home():
    recent = models.get_recently_played()
    recommended = source.get_recommended()
    return render_template("home.html", recent=recent, recommended=recommended)

@app.route("/result/")
def result():
    query = request.args.get('query')
    if not query:
        songs = source.get_search_result('never gonna give you up')
        return render_template("result.html", songs=songs)
    songs = source.get_search_result(query)
    
    return render_template("result.html", songs=songs)

@app.route("/now-playing",methods = ["POST"])
def now_playing():
    data = request.get_json()
    req_source = data['source']
    video_id,cur_title,cur_artist,cur_image = data['id'],data['title'],data['artist'],data['image']
    song_details = {"videoId": video_id,
                    "title": cur_title,
                    "singers": cur_artist,
                    "image": cur_image}
    
    models.add_recently_played(video_id, cur_title, cur_artist, cur_image)
    
    if req_source == 'card':
        queue['tracks'].clear()
        queue['cur_idx'] = 0
        queue['tracks'].append(song_details)
        Thread(target=fetch_and_queue, args=(video_id,)).start()
    return jsonify({"url": f"/stream/{video_id}"})
    
@app.route("/stream/<video_id>")
def stream(video_id):
    # start = time.perf_counter()
    media_url = models.get_cache_url(video_id)
    
    # end = time.perf_counter()
    # print(f"Time taken: {end - start:.6f} seconds")
    
    range_header = request.headers.get('Range')
    
    headers = {"User-Agent": "Mozilla/5.0",}
    if range_header:
        headers['Range'] = range_header
    
    req = requests.get(media_url, stream=True, headers=headers)
    
    response_headers = {'Accept-Ranges': 'bytes',
                        'Content-Type': req.headers.get('Content-Type', 'audio/webm'),}
    
    if 'Content-Range' in req.headers:
        response_headers['Content-Range'] = req.headers['Content-Range']
    if 'Content-Length' in req.headers:
        response_headers['Content-Length'] = req.headers['Content-Length']
    
    status = 206 if range_header else 200
    print(request.headers.get('Range'))
    return Response(
        req.iter_content(chunk_size=32768),
        status=status,
        headers=response_headers
    )

@app.route('/queue', methods=['GET'])
def get_queue():
    return jsonify(queue)
 
@app.route('/queue/next', methods=['GET'])
def next_track():
    idx = queue['cur_idx']
    tracks = queue['tracks']

    queue['cur_idx'] += 1
    current = tracks[queue['cur_idx']]
    
    if idx > 10:
        queue['tracks'].pop(0)
        queue['cur_idx'] -= 1
    
    if len(queue['tracks']) < 5:
        new_recs = source.get_similar(current['videoId'])
        queue['tracks'].extend(new_recs)
        
    return jsonify(current)

@app.route('/queue/prev', methods=['GET'])
def prev_track():
    tracks = queue['tracks']
    if queue['cur_idx'] > 0:
        queue['cur_idx'] -= 1
    current = tracks[queue['cur_idx']]
    
    return jsonify(current)

@app.route('/test')
def test():
    return(source.test())

if __name__ == "__main__":
    try:
        app.run(debug = True)
    except Exception as e:
        print(e)
        