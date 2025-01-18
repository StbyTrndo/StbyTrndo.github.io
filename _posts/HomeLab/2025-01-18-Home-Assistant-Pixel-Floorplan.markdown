---
title:  "How to Make a Home Assistant Floorplan Dashboard with Pixel Art and Animated Lighting"
date:   "2025-01-18 00:00:00 -0800"
categories: HomeLab
header:
 teaser: /assets/images/HomeLab/Pixel_Floorplan/Pixel_Floorplan_Thumbnail.JPEG
---

![Demo](/assets/images/HomeLab/Pixel_Floorplan/Pixel_Floorplan_Demo.gif)
*Note: The GIF above is a bit grainy because of the image conversion. It looks better in the actual dashboard. Check out the [MP4 version](/assets/images/HomeLab/Pixel_Floorplan/Pixel_Floorplan_Demo.mp4) for what it actually looks like.*

I recently came across [this reddit post](https://www.reddit.com/r/homeassistant/comments/1hrkku1/pokemon_style_floorplan/) from [u/katschung](https://www.reddit.com/user/katschung/) where they demonstrated a home assistant dashboard they had built that contained a pixel art floorplan with working lights. I thought it looked really neat, so I decided to replicate it for my own use. I had to piece together information from a number of different sources to get it working, so I've compiled this as an end-to-end how-to in case someone else wants to do this.

## Creating the Pixel Art Floorplan
### Getting the tilesets
u/katschung noted that they had constructed the floorplan using a tileset from [Pokemon Essentials](https://archive.org/details/PokmonEssentialsV17.220171015). Just click on "Show all files" and download the zip archive. The tilesets are located in the folder `./Graphics/Tilesets` within that zip archive.

I found that there were some things I wanted to include in my floorplan that weren't included in the pokemon tilesets, so I found and used the [Modern Interiors Tileset from LimeZu](https://limezu.itch.io/moderninteriors) as well. You might want to look for others for your setup too.

### Creating the Floorplan Map
I don't have any experience creating pixel art or using photo editors, so after looking through some options, I chose to use [Sprite Fusion](https://www.spritefusion.com/) to create the floorplan map. Sprite Fusion is extremely easy to use, free, and runs right in your browser. It does lack a lot of quality of life features, but it was great for this application.

Open up the editor and start a new project. For the tiles I used, I chose a tile size of `16` and I changed the grid background color to `#222222`, like this:

![Blank Sprite Fusion Editor](/assets/images/HomeLab/Pixel_Floorplan/Blank_Editor.png)


Now from here, just import your tilesets and start placing them into the map. Use layers to make sprites appear to be in front of other sprites. This will likely take a while to get right. Here are some tips that helped me:
- Don't try to make your floorplan exactly accurate to your real home.
    - Dimensions don't matter here.
    - I even excluded entire rooms from my floorplan, because it would have made things more complex and they didn't have any IOT gear in them anyways.
    - Don't worry too much about finding the exact right sprites. Just find sprites that remind you of the room you're creating.
- Think of this as a symbolic representation of your home, not a picture of it.
- Prioritize making it recognizable to you and making it easily readable when it's small.
- If you want it to look cozy, add some clutter on desks, tables, counters, and walls.

When you're done, it should look something like this
![Completed Sprite Fusion Editor](/assets/images/HomeLab/Pixel_Floorplan/Completed_Editor.png)

Now just export your creation as a PNG (I also recommend exporting it as JSON so you can come back to edit it more later if you need to).

### Creating Lighting
Next, we need to create the lighting. To do this, I used [GIMP](https://www.gimp.org/). I am absolutely not a GIMP expert, but here is what I did.

#### Set up a Dark Room

Open up the PNG from Sprite Fusion in GIMP. Save this as a `.xcf` file so you can go back to edit it later.

![GIMP Initial Screen](/assets/images/HomeLab/Pixel_Floorplan/GIMP_Initial.png)

Now we need to make the room dark by adding another layer over top of it. The lights will remove that layer of darkness to show the lit room underneath.

Create a new layer by clicking `Layer > New Layer...`. Give it a name and click OK.

![New Layer Dialog](/assets/images/HomeLab/Pixel_Floorplan/New_Layer.png)

Now we'll make the room dark. Select the bucket tool and paint the entire new layer black

![Completely Black Layer](/assets/images/HomeLab/Pixel_Floorplan/All_Black.png)

Next we'll add a layer mask so we can create the lighting. Right-Click on the new layer you created and click `Add Layer Mask...`. In the dialog box that pops up, select `White (full opacity)` and click Add.

![Add Layer Mask](/assets/images/HomeLab/Pixel_Floorplan/Add_Layer_Mask.png)

This will let us paint over top of the image to create transparency. Painting a lighter color will make things darker and painting a darker color will make things lighter (confusing, I know). First, we'll make it so the room looks entirely darkened, but still visible. Click on the brush colors and select a light grey color using the color picker. You want it to be dark enough that a light turning on will be an obvious change. I chose to use HTML code `d9d9d9` as my base color.

![Brush Color](/assets/images/HomeLab/Pixel_Floorplan/Brush_Color.png)

Next, just use the bucket tool to paint the entire layer in that light grey color, making the room look dark, like below. This will be our base image for the floorplan card in the HomeAssistant dashboard. Export this file as a PNG by going to `File > Export As...` and saving the file as `<insert filename>.png`. The default settings in the following dialog box should be fine.

![All Dark Room](/assets//images/HomeLab/Pixel_Floorplan/All_Dark.png)

#### Light the Room

Now we'll work on creating images of the lights turned on, one by one.

Save the all dark room as a new file; I would suggest titling the file based on which light you're choosing (something like "office light").

Then select the airbrush tool (right-click on the paintbrush tool and select airbrush) and change the brush color to completely black. Change the brush type to one that you think looks nice (I chose the `2. Hardness 050 (51 x 51)` brush) and place your mouse over top of where the light source is in your room. Size the brush (`CTRL + ALT + Mouse Scroll`) so that it covers the parts of the room that you want to have lit (don't worry about light leaking into other rooms.) Click and hold the mouse and the room should start to look lighter. Let go when you reach your desired light level.

Your image should now look something like the below.

![Lighting In Progress](/assets/images/HomeLab/Pixel_Floorplan/Lighting_In_Progress.png)

Now we just need to cut out the area we want to have lit up.

Select `Layer > Merge Down` to make the entire image one layer.

Next select the "Free Select" tool, which looks like a lasso. Click around the area that you want to have lit, like the below. Oftentimes, you can use walls as clean boundaries between lit areas.

![Lit Area Selected](/assets/images/HomeLab/Pixel_Floorplan/Light_Select.png)

Next, press `CRTL + I` to invert your selection and press `DEL` to delete the entire rest of the image, but leave behind a transparent background.

![Finished Lit Area Image](/assets/images/HomeLab/Pixel_Floorplan/Finished_Lit_Area.png)

And now you're done with this light! Save the `.xcf` file and export as a PNG. Repeat the steps in this section for each light you want to have animate in the final dashboard.

## Home Assistant Configuration

Now onto actually configuring the dashboard card in Home Assistant. Open up your dashboard and add a new card.

Select the "Picture elements" card and remove the pre-populated "State badge" element.

![Picture Elements](/assets/images/HomeLab/Pixel_Floorplan/Picture_Elements.png)

Open up the card options. For the image path, upload the PNG of the all dark room. Close the card options.

![Card Options](/assets/images/HomeLab/Pixel_Floorplan/Card_Options.png)

For each light we will need to create two entities:
1. An Image element of the light turned on
2. A State Icon representing the light

**IMPORTANT: It is important that you create the "Image" elements before the "State Icon" elements or else the images will appear on top of the state icons and you won't be able to see them or click on them.**

### Image Element Configuration

UI:

![Image Element](/assets/images/HomeLab/Pixel_Floorplan/Image_Element.png)

YAML
```yaml
type: image
entity: switch.office_lamp #replace with your light entity
tap_action:
  action: none
title: Office Lamp #replace with your name
state_image: {}
state_filter:
  "on": opacity(70%)
  "off": opacity(0%)
style:
  left: 50%
  top: 50% 
  width: 100%
hold_action:
  action: none
image: /api/image/serve/c4180988a89f0b1564150a0be28c22ed/512x512 #path to the image you upload of the lit room

```

### State Icon Configuration

UI:

![State Icon](/assets/images/HomeLab/Pixel_Floorplan/State_Icon.png)

YAML:
```yaml
type: state-icon
style:
  left: 72% #change this to match the location where you want it on the floorplan
  top: 53% #change this to match the location where you want it on the floorplan
  "--state-switch-inactive-color": rgb(200,200,200) #this is the color it will be when off
icon: mdi:floor-lamp-torchiere-variant #choose the most appropriate icon
title: Bedroom Lamp Icon #give it a name
tap_action:
  action: toggle
entity: switch.bedroom_lamp #replace with your light entity
```

### All Done

When you are completely finished setting up your lights, the Picture Elements card configuration should look like the below.

![All Done](/assets/images/HomeLab/Pixel_Floorplan/All_Done.png)

Now when you save it, you should be able to click on the light icons to toggle your lights on and off and the lighting in the image should dynamically change with the state of the light as well.

![Demo](/assets/images/HomeLab/Pixel_Floorplan/Pixel_Floorplan_Demo.gif)