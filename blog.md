---
layout: page
title: Blog
permalink: /blog/
---

<style>
.page-title {
  display: none;
}
</style>

<div class="posts">
  {% for post in site.posts %}
    {% unless post.categories contains 'notes' %}
    <div class="post">
      <h3 class="post-title">
        <a href="{{ post.url | absolute_url }}">
          {{ post.title }}
        </a>
      </h3>
      <span class="post-date">{{ post.date | date_to_string }}</span>
      {% if post.description %}
        <p>{{ post.description }}</p>
      {% endif %}
    </div>
    {% endunless %}
  {% endfor %}
</div>