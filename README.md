# emerald
Image Slideshow Tool with basic projection mapping capabilities.
I wrote this app in my spare time for a video installation in early 2018. It is a prototype designed to fullfill a single purpose during one event. Don't expect it to be production ready or feature complete.

## Installation
You need node and npm installed on your machine. It should work on all platforms electron supports. I only tested in on a linux machine.

```
npm install
```

## Run

```
npm start
```

# Usage
Usually you connect a Beamer to your Laptop and extend your Desktop. Then start the emerald App and move the output window to the area of your Desktop that is displayed by the Beamer. Navigate to the Output Section an hit the Fullscreen Button. Go to the Surfaces section and create a new Surface. A calibration texture should be projected by the Beamer. Using this texture you can position the Beamer. Some Beamers have a feature called auto keystone correction, you should turn this off. Assure that the area you want to project on is covered by the calibration texture. Don't care about image distortion but try to minimize shadows. Afterwards go to the Mapping section and drag the big blue handles to correct the perspective until the projected image looks non distorted. If necessary you can mask some parts using the smaller turquoise handles. You might add and remove mask points. Using the buttons below the mapping preview. Those functions apply to the last selected mask point. At this point the usability can certainly be improved. After you completed the setup you add a slide and assign some images to it. You can adjust the slide show properties within the Settings section.

Create a new slide.
![slides](https://raw.githubusercontent.com/rnd7/emerald/master/doc/emerald_slides.png)

Add some images.
![files](https://raw.githubusercontent.com/rnd7/emerald/master/doc/emerald_files.png)

Create a surface.
![surfaces](https://raw.githubusercontent.com/rnd7/emerald/master/doc/emerald_surfaces.png)

Map the surface.
![mapping](https://raw.githubusercontent.com/rnd7/emerald/master/doc/emerald_mapping.png)

Mask the surface.
![mask](https://raw.githubusercontent.com/rnd7/emerald/master/doc/emerald_mask.png)

Assign the slide to the mapped surface.
![output](https://raw.githubusercontent.com/rnd7/emerald/master/doc/emerald_output.png)

You might tweak the slide settings. Hint: To clear the slide texture change the Texture Width or height.
![output](https://raw.githubusercontent.com/rnd7/emerald/master/doc/emerald_output.png)

Voila! You've got a projection mapped slideshow.
