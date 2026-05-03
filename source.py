from ytmusicapi import YTMusic
import json
import yt_dlp


yt = YTMusic()


def get_search_result(query):
    result = yt.search(query,filter='songs')
    # print(json.dumps(result,indent=4))
    for song in result:
        singers = ''
        for singer in song['artists']:
            singers = singers+singer['name']+','
        song['singers'] = singers[:-1]
        song['image'] = song['thumbnails'][1]['url']
        song['media_url'] = get_url('song.videoId')
        # print(result[0]['videoId'])
    return result
    
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
    recommendations = playlist["tracks"][1:10]
    return recommendations

