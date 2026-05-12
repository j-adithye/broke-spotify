from ytmusicapi import YTMusic
import json
import yt_dlp,random
import models
import app as A

yt = YTMusic()


def get_search_result(query):
    res = yt.search(query,filter='songs')
    result = data_helper(res)    
    return result
    
def data_helper(res,thumbnail='thumbnails',search=True):
    for song in res:
        singers = ''
        for singer in song['artists']:
            singers = singers+singer['name']+','
        song['singers'] = singers[:-1]
        song['image'] = song[thumbnail][1]['url']
        if search:
            keys_to_remove = [thumbnail,'artists','views','category','resultType','album','inLibrary',
                              'pinnedToListenAgain','videoType','duration','year','duration_seconds','isExplicit']
            for key in keys_to_remove:
                song.pop(key, None)
        else:
            keys_to_remove = [thumbnail,'artists','likeStatus','videoType','inLibrary','feedbackTokens',
                              'pinnedToListenAgain','listenAgainFeedbackTokens','album','year','length']
            for key in keys_to_remove:
                song.pop(key, None)
            
    return res
 
def get_url(videoId):
    url = "https://www.youtube.com/watch?v="+str(videoId)
    
    ydl_opts = {
        "format": "bestaudio",
        "quiet": True,
        "no_warnings": True}
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
        stream_url = info["url"]
        return stream_url
        
def get_similar(video_id,limit=20):
    playlist = yt.get_watch_playlist(videoId=video_id)
    recommendations = playlist["tracks"][1:limit+1]
    queue = data_helper(recommendations,thumbnail = 'thumbnail',search=False)
    # print(json.dumps(queue,indent=3))
    return queue


def get_recommended():
    with A.app.app_context():
        last_3 = models.get_last_3()
    recommended = []
    for video_id in last_3:
        similar = get_similar(video_id,limit=5)
        recommended.extend(similar)
    random.shuffle(recommended)
    return recommended
    
# get_recommended()
# get_similar('kIft-LUHHVA')
# get_url('kIft-LUHHVA')