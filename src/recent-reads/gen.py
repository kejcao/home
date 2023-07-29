import re
import sys
import html

def process(txt):
    txt = html.escape(txt)
    for src, dst in [
        (r'(?<!\\)\*(.*?)(?<!\\)\*', r'<em>\1</em>'),
        (r'(?<!\\)`(.*?)(?<!\\)`', r'<code>\1</code>'),
        (r'\[(.*?)\]\((.*?)\)', r'<a href="\2">\1</a>'),
        (r'\\([*`])', r'\1'),
    ]:
        txt = re.sub(src, dst, txt)
    return txt

print('''
{% extends layout %}

{% block head %}
  <title>Recent Readings - Kevin Cao</title>
  <meta name="description" content="" />
  {% style %}
    pre {
      overflow-x: visible;
      white-space: pre-wrap;
      margin: 0;
    }

    .cards {
      column-count: 4;
      line-height: 1em;
    }

    .card {
      display: inline-block;
      margin-bottom: 1em;
    }
  {% endstyle %}
{% endblock %}

{% block content %}
  <h1 class="center">Recent Reads</h1>
  <p>A list of recent things on the Internet I have read/skimmed/watched and found entertaining.</p> 
''')

print('<section class="cards">')
with open('/home/kjc/recent-reads', 'r') as fp:
    cards = []
    for l in fp.readlines():
        date, url, desc = l.split(maxsplit=2)
        if date == 'NSFW':
            date, url, desc = l.split(maxsplit=3)[1:]
            continue
        type, desc = desc.split(':', maxsplit=1)
        cards.append(f'<div class="card"><a title="added on {date}" href="{url}"><b>{type}</b></a> {process(desc)}</div>')
    print('<div>')
    for c in cards[::4]:
        print(c)
    print('</div>')
    print('<div>')
    for c in cards[1::4]:
        print(c)
    print('</div>')
    print('<div>')
    for c in cards[2::4]:
        print(c)
    print('</div>')
    print('<div>')
    for c in cards[3::4]:
        print(c)
    print('</div>')
print('</section>')

print('{% endblock %})')
