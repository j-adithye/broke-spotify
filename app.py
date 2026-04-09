from flask import Flask,request,jsonify,render_template,redirect,url_for
import source


app = Flask(__name__)

@app.route("/",methods= ['GET','POST'])
def home():
    if request.method == 'POST':
        query = request.form.get('q')
        print(query)
        return redirect(url_for('result',query=query))
    return render_template("home.html")

@app.route("/result/")
def result():
    lyrics = False
    query = request.args.get('query')
    songs = source.search_for_song(query, lyrics, True)
    return render_template("result.html", songs=songs)

if __name__ == "__main__":
    app.run(debug = True)