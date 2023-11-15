# println("""
# {% extends layout %}

# {% block head %}
#   <title>Recent Readings - Kevin Cao</title>
#   <meta name="description" content="" />
# {% endblock %}

# {% block content %}
#   <h1 class="center">Recent Reads</h1>
#   <p>A list of recent things on the Internet I have read/skimmed/watched and found entertaining.</p> 
# """)

# println("<ul>")
# open("/home/kjc/recent-reads", "r") do fp
#     while !eof(fp)
#         date, url, desc = split(readline(fp), limit=3)
#         println("  <li><a title=\"added on $date\" href=\"$url\">$desc</a></li>")
#     end
# end
# println("</ul>")

# println("{% endblock %})")

println("""
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
  {% endstyle %}
{% endblock %}

{% block content %}
  <h1 class="center">Recent Reads</h1>
  <p>A list of recent things on the Internet I have read/skimmed/watched and found entertaining.</p> 
""")

println("<pre><code>")
open("/home/kjc/recent-reads", "r") do fp
    while !eof(fp)
        date, url, desc = split(readline(fp), limit=3)
        println("<a title=\"added on $date\" href=\"$url\">link</a> $desc")
    end
end
println("</code></pre>")

println("{% endblock %})")
