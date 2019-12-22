import os

from flask import Flask
from flask import render_template
from flask import request

from article import article

app = Flask('KirkRoerig', static_url_path='', static_folder='content')

def filter_posts(keywords=set()):
	posts = []
	for name in os.listdir('articles'):
		if name[0] is '.':
			continue

		a = article('articles/{}'.format(name))
		if len(keywords) > 0:
			if len(keywords.intersection(set(a.keywords()))) > 0:
				posts += [{
					'markup': a.md(),
					'posted': a.posted(),
					'date': a._date,
				}]
		else:
			posts += [{
				'markup': a.md(),
				'posted': a.posted(),
				'date': a._date,
			}]

		posts = sorted(posts, key=lambda x: x['date'], reverse=True)

	return posts

@app.route("/articles/search")
def search():
	keywords = set(request.args['tags'].split('+'))
	return render_template("home.html", posts=filter_posts(keywords=keywords))

@app.route("/work")
def work():
	return render_template("home.html", posts=filter_posts(keywords={'work'}))
	#return render_template("work.html")

@app.route("/about")
def about():
	return render_template("about.html")

@app.route("/contact")
def contact():
	return render_template("contact.html")

@app.route("/")
def index():
	return render_template("home.html", posts=filter_posts(keywords={'article'}))

if __name__ == '__main__':
	port = 8080
	if 'PORT' in os.environ:
		port = os.environ['PORT']

	app.run(port=port, host='0.0.0.0')
