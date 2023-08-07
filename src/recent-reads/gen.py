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
{% endblock %}

{% block content %}
  <h1 class="text-center">Recent Reads</h1>
  <p>I sometimes stumble upon really unique websites on the Internet that I wish to share. Also some interesting articles and videos.</p> 
''')

print('<section>')
with open('/home/kjc/recent-reads', 'r') as fp:
    cards = []
    for l in fp.readlines():
        date, url, desc = l.split(maxsplit=2)
        if date == 'NSFW':
            date, url, desc = l.split(maxsplit=3)[1:]
            continue
        type, desc = desc.split(':', maxsplit=1)
        cards.append(f'<div class="inline-block mb-4"><a title="added on {date}" href="{url}"><b>{type}</b></a> {process(desc)}</div>')
    for i in range(3):
        print('<div class="p-2 sm:float-left sm:w-[calc(33.33%-1rem)]">')
        for c in cards[i::3]:
            print(c)
        print('</div>')
print('</section>')

print('{% endblock %})')
