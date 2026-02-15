---
layout: page
title: Notes
permalink: /notes/
---

<style>
.page-title {
  display: none;
}
</style>

<div class="notes-feed">
  {% assign sorted_notes = site.notes | sort: "date" | reverse %}
  {% for note in sorted_notes %}
  <div class="note">
    <div class="note-content">
      {{ note.content }}
    </div>
    <div class="note-date">{{ note.date | date: "%b %-d, %Y" }}</div>
  </div>
  {% endfor %}
</div>