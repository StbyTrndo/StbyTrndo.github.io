---
title: "Home"
layout: splash
date: 2016-03-23T11:48:41-04:00
header:
  overlay_color: "#000"
  overlay_filter: "0.8"
  overlay_image: /assets/images/strawberry_background_1920_1080.png
excerpt: "Welcome to StrawberrySec! This is a blog about cybersecurity and IT in general. Join me on my dive into the technical side of computing!"


hero_row:
  - image_path: /assets/images/HackTheBox/Timelapse/Timelapse.png
    alt: "Timelapse"
    title: "Walkthrough: Timelapse - Hack The Box"
    excerpt: "A walktrhough of Timelapse from Hack The Box"
    url: "/hackthebox/Timelapse"
    btn_label: "Read More"
    btn_class: "btn--primary"


feature_row:

  - image_path:
    alt: "Recent Posts"
    title: "Recent Posts"
    excerpt: "View the most recent posts on this site."
    url: "/recent-posts"
    btn_label: "See Recent Posts"
    btn_class: "btn--primary"

  - image_path: 
    alt: "Categories"
    title: "Categories"
    excerpt: "Browse by Category"
    url: "/categories"
    btn_label: "Read More"
    btn_class: "btn--primary"

  - image_path:
    title: "About"
    excerpt: "More about the author"
    url: "/about"
    btn_label: "Read More"
    btn_class: "btn--primary"
---

{% include feature_row id="hero_row" type="left" %}

{% include feature_row %}

test