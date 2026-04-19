import source
from ytmusicapi import YTMusic
from flask import request,json
import time
from concurrent.futures import ThreadPoolExecutor


yt = YTMusic()

def get_similar(song,artist):
    results = yt.search(f"{song} {artist}", filter="songs")
    video_id = results[0]["videoId"]
    playlist = yt.get_watch_playlist(videoId=video_id)
    recommendations = playlist["tracks"][1:10]
    return([song['title'] for song in recommendations])

def get_urls_each(title):                  #this works for now but takes ~30 sec for 10 song queue need to fix that
    result = source.search_for_song(title)[0]
    song = (result['song'])
    singers = (result['singers'])
    image = (result['image'])
    url = (result['media_url'])
    listt = [song,singers,image,url]
    
    return listt
    
def get_urls(songs):
    start = time.perf_counter()

    with ThreadPoolExecutor(max_workers=3) as executor:
        urls = list(executor.map(get_urls_each, songs))

    end = time.perf_counter()
    print(f"Execution time: {end - start:.6f} seconds")
    return urls