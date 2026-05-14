from ytmusicapi import YTMusic
from pytubefix import YouTube,exceptions
import json,time
import yt_dlp,random
import models

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
        song['image'] = song[thumbnail][0]['url']
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
            
        song['image'] = song['image'].replace('w60','w226').replace('h60','h226')
    return res
 

def get_url(video_id):
    try:
        ytf = YouTube(f"https://youtube.com/watch?v={video_id}")
        stream = ytf.streams.filter(only_audio=True).order_by('abr').last()
        return stream.url
    except (exceptions.PytubeFixError,AttributeError):
        return get_url_fallback(video_id)
    
def get_url_fallback(videoId):
    url = f"https://www.youtube.com/watch?v={videoId}"
    
    ydl_opts = {
        "format": "bestaudio",
        "quiet": True,
        "no_warnings": True}
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
        stream_url = info["url"]
        print(stream_url)
        return stream_url
    
def get_similar(video_id,limit=20):
    playlist = yt.get_watch_playlist(videoId=video_id)
    recommendations = playlist["tracks"][1:limit+1]
    queue = data_helper(recommendations,thumbnail = 'thumbnail',search=False)   #return 'thumbnail' instead of 'thumbnails' like in search
    # print(json.dumps(queue,indent=3))
    return queue


def get_recommended():
    last_few = models.get_last_few()
    recommended = []
    for video_id in last_few:
        similar = get_similar(video_id,limit=5)
        recommended.extend(similar)
    random.shuffle(recommended)
    return recommended

def test():
    return yt.get_playlist('RDCLAK5uy_nOL3sMa95sycDZS17ES7eyQy8x2nV9ET8')

# start = time.perf_counter()

# get_recommended()
# get_similar('kIft-LUHHVA')
# get_url('kIft-LUHHVA')
# end = time.perf_counter()

# print(f"Time taken: {end - start:.6f} seconds")