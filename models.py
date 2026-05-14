from flask_sqlalchemy import SQLAlchemy
from datetime import datetime,timedelta
import source

db = SQLAlchemy()

class RecentlyPlayed(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    videoId = db.Column(db.String, nullable=False)
    title = db.Column(db.String, nullable=False)
    singers = db.Column(db.String, nullable=False)
    image = db.Column(db.String, nullable=False)

def add_recently_played(videoId, title, singers, image):
    existing = RecentlyPlayed.query.filter_by(videoId=videoId).first()
    if existing:
        db.session.delete(existing)
    entry = RecentlyPlayed(videoId=videoId, title=title, singers=singers, image=image)
    db.session.add(entry)
    db.session.commit()
        
    total = RecentlyPlayed.query.count()      
    if total > 50:   #ippo 50 mathi
        oldest = RecentlyPlayed.query\
            .order_by(RecentlyPlayed.id.asc())\
            .limit(total - 50).all()
        for row in oldest:
            db.session.delete(row)
        db.session.commit()

def get_recently_played(limit=15):        #15 thalkalam
    rows = RecentlyPlayed.query\
        .order_by(RecentlyPlayed.id.desc())\
        .limit(limit).all()
    return [{"videoId": r.videoId, "title": r.title,
             "singers": r.singers, "image": r.image} for r in rows]
    
def get_last_few():
    rows = RecentlyPlayed.query\
        .order_by(RecentlyPlayed.id.desc())\
        .limit(3).all()
    return [r.videoId for r in rows]

class CacheUrl(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    videoId = db.Column(db.String, nullable=False)
    url = db.Column(db.String, nullable=False)
    timeStamp = db.Column(db.String, default=datetime.now)
    
def get_cache_url(videoId):
        cache = CacheUrl.query.filter_by(videoId=videoId).first()
        
        if cache:
            timestamp = datetime.strptime(
                cache.timeStamp,
                "%Y-%m-%d %H:%M:%S.%f")
            if (datetime.now() - timestamp) > timedelta(hours=4):               #4hrs
                new_url = source.get_url(videoId)
                cache.url = new_url
                cache.timeStamp = datetime.now()
                db.session.commit()
                return new_url
            else:
                return cache.url
        else:
            url = source.get_url(videoId)
            entry = CacheUrl(videoId=videoId, url=url)
            db.session.add(entry)
            db.session.commit()
            
            total = CacheUrl.query.count()      
            if total > 50:   #ippo 50 mathi
                oldest = CacheUrl.query\
                    .order_by(CacheUrl.id.asc())\
                    .limit(total - 50).all()
                for row in oldest:
                    db.session.delete(row)
                db.session.commit()
            return url
        
