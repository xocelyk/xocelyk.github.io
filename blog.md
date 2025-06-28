---
layout: page
title: Blog
permalink: /blog/
---

<div class="posts">
  {% for post in site.posts %}
  <div class="post">
    <h3 class="post-title">
      <a href="{{ post.url | absolute_url }}">
        {{ post.title }}
      </a>
    </h3>
    <span class="post-date">{{ post.date | date_to_string }}</span>
    {% if post.excerpt %}
      <p>{{ post.excerpt | strip_html | truncate: 150 }}</p>
    {% endif %}
  </div>
  {% endfor %}
</div>