from ytmusicapi import YTMusic
import json

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
 
    return result
    
def get_similar(video_id):
    playlist = yt.get_watch_playlist(videoId=video_id)
    recommendations = playlist["tracks"][1:10]
    return recommendations