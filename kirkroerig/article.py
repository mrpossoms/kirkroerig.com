import mistune
import datetime
import subprocess

from pathlib import Path

from importlib.resources import files
from mistune.plugins.math import math
from mistune.plugins.table import table

from pygments import highlight
from pygments.lexers import get_lexer_by_name
from pygments.formatters import html

class HighlightRenderer(mistune.HTMLRenderer):
    def block_code(self, code, info=None):
        if info:
            lexer = get_lexer_by_name(info, stripall=True)
            formatter = html.HtmlFormatter()#lineseparator="<br>")
            return highlight(code, lexer, formatter)
        return '<pre><code>' + mistune.escape(code) + '</code></pre>'

class Article():
    def __init__(self, path):
        self.path = Path(files('kirkroerig')) / path #str(files('kirkroerig') / path)
        self._text = None
        self._md = None
        self._keywords = []
        self._posted = None
        self._date = datetime.date(1, 1, 1)

    @property
    def title(self):
        return self.path.stem.replace('_', ' ')
    
    def keywords(self, cache=True):
        self.text(cache)
        return self._keywords

    def posted(self, cache=True):
        if cache and self._posted is None:

            mos = { 'Jan':1, 'Feb':2, 'Mar':3, 'Apr':4, 'May':5, 'Jun':6, 'Jul':7, 'Aug':8, 'Sep':9, 'Oct':10, 'Nov':11, 'Dec': 12 }
            lines = subprocess.Popen(["git", "log", "--follow", "--find-renames", "--diff-filter=A", "--", str(self.path)], stdout=subprocess.PIPE, cwd=files('kirkroerig')).communicate()[0].decode('utf-8').split('\n')
            for line in lines:
                if 'Date:' in line:
                    _, _, _, _, mo, day, _, yr, _ = line.split(' ')
                    self._posted = ' '.join([mo, day, yr])
                    try:
                        self._date = datetime.date(int(yr), mos[mo], int(day))
                    except ValueError:
                        pass
                    break

        return self._posted

    def text(self, cache=True):
        if cache and self._text is not None:
            return self._text

        fp = open(self.path, 'r')
        lines = fp.readlines()

        if '~' in lines[0]:
            kw_line = lines[0]
            self._keywords = kw_line[1:].strip().split(',')
            self._text = ''.join(lines[1:])

        return self._text

    def md(self, cache=True):
        if cache and self._md is not None:
            return self._md
        # self._md = markdown(self.text(cache))
        # renderer = 'html'#mistune.Renderer(escape=False, hard_wrap=True)
        # self._md = mistune.html(self.text(cache))
        
        renderer = mistune.HTMLRenderer(escape=False)
        #renderer = HighlightRenderer()
        markdown = mistune.Markdown(renderer, plugins=[math, table])
        self._md = markdown(self.text(cache))

        return self._md


if __name__ == '__main__':
    txt = Article('articles/autonomous_car.md').text()
    assert(len(txt) > 0)

    md = Article('articles/autonomous_car.md').md()
    assert(len(md) > 0)

    a = Article('articles/autonomous_car.md')
    for keyword in ['article','robotics','hardware','assembly','neural','networks','ml']:
        assert(keyword in a.keywords())

    print('PASS')
