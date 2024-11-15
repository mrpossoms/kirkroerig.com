import os
from importlib.resources import files

from flask import Flask
from flask import render_template
from flask import request

from .article import Article

app = Flask('KirkRoerig', static_url_path='', static_folder=str(files('kirkroerig') / 'content'), template_folder=str(files('kirkroerig') / 'templates'))

def paging(posts, range=(0, 1)):
	prev, forw = None, None

	prev_idx = max(0, range[0] - 1)
	forw_idx = range[1] + 1


	if range[0] > prev_idx:
		prev = '/articles/pages/{}/to/{}'.format(prev_idx, range[0])
	if range[1] < len(posts):
		forw = '/articles/pages/{}/to/{}'.format(range[1], forw_idx)

	return {
		'range': range,
		'pages': posts[range[0]:range[1]],
		'prev': prev,
		'next': forw
	}

def filter_posts(keywords=set(), title=None):
	posts = []

	# if a specific article is mentioned, execute this
	if title is not None:
		a = Article('articles/{}.md'.format(title))
		return [a]

	# Otherwise, load all filter by keywords set if applicable
	for item in files('kirkroerig.articles').iterdir():
		if item.name[0] == '.':
			continue

		a = Article(item)
		a.posted() # force caching of date
		if len(keywords) > 0:
			if len(keywords.intersection(set(a.keywords()))) > 0:
				posts += [a]
		else:
			posts += [a]

		posts = sorted(posts, key=lambda x: x._date, reverse=True)

	return posts

@app.route("/article/<string:title>")
def specific_article(title):
	return render_template("home.html",
	                       posts=filter_posts(title=title),
	                       range=(0, 1),
	                       paging=None)

@app.route("/articles/search")
def search():
	keywords = set(request.args['tags'].split('+'))
	posts = filter_posts(keywords=keywords)
	_paging = paging(posts, range=(0, 20))
	return render_template("home.html", posts=posts, paging=_paging)

@app.route("/articles/pages/<int:start>/to/<int:end>")
def pages(start, end):
	posts = filter_posts(keywords={'article'})
	_paging = paging(posts, range=(start, end))
	return render_template("home.html", posts=_paging['pages'], paging=_paging)

@app.route("/projects")
def projects():
	posts = filter_posts(keywords={'work'})
	_paging = paging(posts, range=(0, len(posts)))
	return render_template("home.html", posts=_paging['pages'], paging=_paging)

@app.route("/work")
def work():
	posts = filter_posts(keywords={'work'})
	_paging = paging(posts, range=(0, len(posts)))
	return render_template("home.html", posts=_paging['pages'], paging=_paging)

@app.route("/about")
def about():
	return render_template("about.html")

@app.route("/contact")
def contact():
	return render_template("contact.html")

@app.route("/")
def index():
	posts = filter_posts(keywords={'article'})
	_paging = paging(posts)
	return render_template("home.html",
	                       posts=_paging['pages'],
	                       paging=_paging)

if __name__ == '__main__':
	port = 8080
	if 'PORT' in os.environ:
		port = os.environ['PORT']

	app.run(port=port, host='0.0.0.0')
