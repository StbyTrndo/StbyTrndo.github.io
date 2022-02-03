---
title: "Home"
layout: splash
date: 2016-03-23T11:48:41-04:00
header:
  overlay_color: "#000"
  overlay_filter: "0.8"
  overlay_image: /assets/images/default_teaser.jpg
excerpt: "Welcome to StrawberrySec! This is a blog about cybersecurity and IT in general. Join me on my dive into the technical side of computing!"


hero_row:
  - image_path: /assets/images/HolidayHack2021/kringlecon_2021_pic.jpg
    alt: "Hero Post"
    title: "2021 SANS Holiday Hack Challenge"
    excerpt: "A collection of all of the posts I made about the 2021 SANS Holiday Hack Challenge"
    url: "/categories/HolidayHack2021"
    btn_label: "Read More"
    btn_class: "btn--primary"


feature_row:

  - image_path:
    alt: "Recent Posts"
    title: "Recent Posts"
    excerpt: "View the most recent posts on this site."
    url: "/recent_posts.html"
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

