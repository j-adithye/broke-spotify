from ytmusicapi import YTMusic
import json
import yt_dlp

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
        
def get_similar(video_id):
    playlist = yt.get_watch_playlist(videoId=video_id)
    recommendations = playlist["tracks"][1:20]
    queue = data_helper(recommendations,thumbnail = 'thumbnail',search=False)
    return queue

# get_similar('kIft-LUHHVA')
# get_url('kIft-LUHHVA')