---
title: "Welcome to StrawberrySec"
layout: splash
date: 2016-03-23T11:48:41-04:00
header:
  overlay_color: "#000"
  overlay_filter: "0.3"
  overlay_image: /assets/images/Background-Banner.png
excerpt: "This is a blog about cybersecurity and IT in general. The goal of this blog is to document things that I am doing outside of my normal work to continue my education and increase my skills in the hope that others will find my experiences to be useful."


hero_row:
  - image_path: /assets/images/HomeLab/Pixel_Floorplan/Pixel_Floorplan_Thumbnail.JPEG
    alt: "Pixel Art Floorplan"
    title:  "How to Make a Home Assistant Floorplan Dashboard with Pixel Art and Animated Lighting"
    excerpt: "This article describes how to make a pixel art floorplan dashboard in Home Assistant"
    url: "/homelab/Home-Assistant-Pixel-Floorplan"
    btn_label: "Read More"
    btn_class: "btn--primary"


feature_row:

  - image_path:
    alt: "Recent Posts"
    title: "Recent Posts"
    excerpt: "View the most recent posts on this site"
    url: "/recent-posts"
    btn_label: "See Recent Posts"
    btn_class: "btn--primary"

  - image_path: 
    alt: "Categories"
    title: "Categories"
    excerpt: "Browse by category"
    url: "/categories"
    btn_label: "Check out Categories"
    btn_class: "btn--primary"

  - image_path:
    title: "About"
    excerpt: "More about the author"
    url: "/about"
    btn_label: "Learn More About Me"
    btn_class: "btn--primary"
---

{% include feature_row id="hero_row" type="left" %}

{% include feature_row %}