Automatic Visual Mixing System
==============================

In order to record and view the broadcast on a single machine, no changes need to be made.

In order to view the broadcast on a separate machine connected on the same wifi network,
the socket connections need to be configured accordingly in the following scripts:
broadcastScripts/broadcast.js, distanceMethod/index.js, individualMethod/index.js.

* socket = io.connect('http://your.i.p.here:8080');

To run the project:
===================
1. Open terminal,
2. Change to the RecordAndStream directory,
3. Enter the command 'node server.js',
4. Open a browser page at http://localhost:8080 or i.p.address.here:8080 ( see above )
5. Click a button on the browsing page to direct you to a specific recording method or viewing page.

# Individual Formant Calibration (Individual Method, frmntCalibration.html)
Provides the most adaptable recognition system.

## Navigate to 'Individual Formant Calibration' page

1. Click 'Turn on Automated Switching'

## To Calibrate System
2.  Select audio input from the MicA/MicB dropdown menus
    ( Make sure AudioContexts are resumed by clicking 'init Mic A' and 'init Mic B' )
3.  Select visual input from the CameraA/CameraB dropdown menus
4.  Adjust UI Slider for Signal Theshold so that the threshold is below the volume of input signal.
5.  Adjust f1, f2 and f3 UI sliders while speaking into the mic. Each corresponding box should turn green.
    ( green border around speakers associated video frame signifies that a 'string of speech' is detected )
6.  Repeat steps 2 - 5 for other speaker.


## To Record/Broadcast
7.  On separate browser window, open https://localhost:8080/broadcast
    ( if you wish to view on separate machine, navigate to your specified ip:8080
8.  Once system is calibrated for both speakers and broadcast page is open, click 'Start Stream'
    to initialise the MediaSource buffer on broadcast page.
9.  Click 'Rec Stream' to record and sent media segments to broadcast page.
10. Stream should be visible on broadcast page within a few seconds.


* It is possible to turn on/off the visual feedback on the studio page by clicking the visual feedback button

# Formant Distance Calibration (Distance Method, distCalibration.html)

## Navigate to 'Formant Distance Calibration' page

1. Click 'Turn On Automated Switching'

## To Calibrate System
2.  Select audio input from the MicA/MicB dropdown menus
    ( Make sure AudioContexts are resumed by clicking 'init Mic A' and 'init Mic B' )
3.  Select visual input from the CameraA/CameraB dropdown menus
4.  Adjust UI Slider for Signal Threshold so that the threshold is below the volume of input signal.
5.  Adjust 'f1/f2 Distance' and 'f2/f3 Distance' UI sliders while speaking into the mic.
    Each corresponding box should turn green.
    ( green border around speakers associated video frame signifies that a 'string of speech' is detected )
6.  Repeat steps 2 - 5 for other speaker.

## To Record/Broadcast
7.  On separate browser window, open https://localhost:8080/broadcast
    ( if you wish to view on separate machine, navigate to your specified ip:8080
8.  Once system is calibrated for both speakers and broadcast page is open, click 'Start Stream'
    to initialise the MediaSource buffer on broadcast page.
9.  Click 'Rec Stream' to record and sent media segments to broadcast page.
10. Stream should be visible on broadcast page within a few seconds.


* To enable automatic mode click 'Currently Set: XXX' button.
* Although false errors may occur, this setting removes the need to adjust the formant distance sliders.

* It is possible to turn on/off the visual feedback on the studio page by clicking the visual feedback button

# Broadcast Page

## Navigate to 'Broadcast' page

1. Click 'Unmute' to unmute the video elements
