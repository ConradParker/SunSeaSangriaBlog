---
title: Contact Me
date: 2026-01-06T13:09:00.000+01:00
draft: false
menu_weight: 70
---


✉️"

<form name="contact" method="POST" data-netlify="true" class="my-4">
  <div class="mb-3">
    <label for="name" class="form-label">Name</label>
    <input type="text" class="form-control" id="name" name="name" required>
  </div>
  <div class="mb-3">
    <label for="email" class="form-label">Email</label>
    <input type="email" class="form-control" id="email" name="email" required>
  </div>
  <div class="mb-3">
    <label for="message" class="form-label">Message</label>
    <textarea class="form-control" id="message" name="message" rows="5" required></textarea>
  </div>
  <button type="submit" class="btn btn-primary">Send Message</button>
</form>
