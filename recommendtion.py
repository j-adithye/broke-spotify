import os
from ytmusicapi import YTMusic
from flask import request,json
import endpoints

yt = YTMusic()
SongQueue = []

def get_similar(song,artist):
    results = yt.search(f"{song} {artist}", filter="songs")
    video_id = results[0]["videoId"]
    playlist = yt.get_watch_playlist(videoId=video_id)
    recommendations = playlist["tracks"][1:10]
    
    return ""
    
get_similar("onam-mood","fejo")