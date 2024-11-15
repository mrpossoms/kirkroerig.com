import mistune
import datetime
import os


class Article():
    def __init__(self, path):
        self.path = str(path)
        self._text = None
        self._md = None
        self._keywords = None
        self._posted = None
        self._date = datetime.date(1, 1, 1)

    def keywords(self, cache=True):
        self.text(cache)
        return self._keywords

    def posted(self, cache=True):
        if cache and self._posted is None:
            # import pdb; pdb.set_trace()
            self._posted = os.popen("git log --follow --find-renames --diff-filter=A -- " + self.path + " | grep Date: | awk '{ print $3, $4, $6 }'").read()
            mos = { 'Jan':1, 'Feb':2, 'Mar':3, 'Apr':4, 'May':5, 'Jun':6, 'Jul':7, 'Aug':8, 'Sep':9, 'Oct':10, 'Nov':11, 'Dec': 12 }
            try:
                mo, day, yr = self._posted.split(' ')
                self._date = datetime.date(int(yr), mos[mo], int(day))
            except ValueError:
                pass
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
        renderer = 'html'#mistune.Renderer(escape=False, hard_wrap=True)
        self._md = mistune.html(self.text(cache))

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
