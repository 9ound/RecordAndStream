// socket connection
// Provide your IP in order to broadcast to a computer on the same network
// const socket = io.connect('http://your.i.p.here:8080');
const socket = io.connect('http://localhost:8080');

// DOM elements
const videoFeedOne      = document.querySelector('video#onlineVideoA'),
      videoFeedTwo      = document.querySelector('video#onlineVideoB'),
      videoSelectA      = document.querySelector('select#videoSourceA'),
      videoSelectB      = document.querySelector('select#videoSourceB'),
      audioSelectA      = document.querySelector('select#audioSourceA'),
      audioSelectB      = document.querySelector('select#audioSourceB'),
      micSensitivityA   = document.getElementById('micSensitivtyA'),
      micSensitivityB   = document.getElementById('micSensitivtyB'),
      thresholdA        = document.getElementById('thresholdA'),
      thresholdB        = document.getElementById('thresholdB'),

      slider            = document.getElementsByClassName('slider'),

      settingBttn        = document.getElementById('setting'),
      initButtonA        = document.getElementById('button'),
      initButtonB        = document.getElementById('buttonB'),
      initSpeechAnalysis = document.getElementById('speechAnalysis'),
      speechAnalysisOff  = document.getElementById('speechAnalysisOff'),

      // Stream buffer after utterance analysis
      analysedStreamA = [],
      analysedStreamB = [];

      SAMPLE_RATE      = 44100;
      FFT_SIZE         = 1024;

// isSpeakingState boolean for eventListener
let freqBinSize,
    isSpeakingStateA = Bool(false),
    isSpeakingStateB = Bool(false),
    initSpeechDetect,

    auto = false,

    f1DistA, f2DistA, f1DistB, f2DistB,

    speakerOne = true,
    speakerTwo = false,

    //mic and camera tracks
    micOne, micTwo,
    cameraOne, cameraTwo;

let bouncedAudioOut,
    mediaStreamSourceA, mediaStreamSourceB, mediaStreamSourceC,
    audioContextA, audioContextB,
    analyserA, analyserB,
    lowCutoff, highCutoff,

    // FFT frequency bin arrays
    fDataA, fByteDataA,
    fDataB, fByteDataB,
    fByteDataC,

    // percentage of true:false vals in analysedStream
    windowRatioA, windowRatioB,

    // regulate evtLoops
    stop = true,
    evtOneFrameCount = 0, evtTwoFrameCount = 0,
    evtOneInterval, evtOneStartTime, evtOneNow, evtOneThen, evtOneElapsed,
    evtTwoInterval, evtTwoStartTime, evtTwoNow, evtTwoThen, evtTwoElapsed,

    // frame rate for evtLoop
    frameRate = 30;

// Creates timestamps
// Creates window for utteranceDetected values
// Buttons to resume audioContexts, Turn on/off speech analysis
window.onload = function() {
  // create window with specified size
  // window size should be a multiple of the evtLoop fps
  createWindow(60);

  // Add event listeners to resume input signal
  // AudioContext must be resumed (or created) after a user gesture on the page.
  // Add listener to detect change in isSpeakingState

  // Turns on speech Analysis;
  // stop variable determines if evtLoop performs frequency analysis
  initSpeechAnalysis.addEventListener('click', function() {
    stop = false;
    console.log('Analysis stopped:', stop)
    initSpeechDetect = setInterval(() => {
      isSpeakingA(analysedStreamA);
      isSpeakingB(analysedStreamB);
    }, 500);
    initSpeechAnalysis.disabled = true;
    speechAnalysisOff.disabled = false;
  });
  speechAnalysisOff.addEventListener('click', function() {
    stop = true;
    console.log('Analysis stopped:', stop)
    clearInterval(initSpeechDetect);
    speechAnalysisOff.disabled = true;
    initSpeechAnalysis.disabled = false;
  });

  // resumes AudioCxts
  initButtonA.addEventListener('click', function() {
    audioContextA.resume()
    .then(() => { console.log('Playback of AudioA resumed successfully');});
  })
  initButtonB.addEventListener('click', function() {
    audioContextB.resume()
    .then(() => { console.log('Playback of AudioB resumed successfully'); });
  });

  // listener for isSpeaking boolean to note when it changes state
  isSpeakingStateA.addListener(function (e) {
    if (e.oldValue != e.newValue) {
      let timeStampA = new Date().toLocaleTimeString();
      if (e.newValue == true){
        socket.emit('streamDataA', windowRatioA);
        console.log('A:', windowRatioA, e.newValue);
      }
    }
  });
  isSpeakingStateB.addListener(function (e) {
    if (e.oldValue != e.newValue) {
      let timeStampB = new Date().toLocaleTimeString();
      if (e.newValue == true){
        socket.emit('streamDataB', windowRatioB);
        console.log('B:', windowRatioB, e.newValue);
      }
    }
  });

  // Changes setting from automatic to manual calibration
  settingBttn.addEventListener('click', function() {
    auto = !auto;

    if (auto){
      settingBttn.innerHTML = 'Currently Set: Automatic';
    } else {
      settingBttn.innerHTML = 'Currently Set: Manual';
    }
  })

  // Check if userMedia is available
  hasUserMedia();
  console.log("Has a means to access users media devices: ", hasUserMedia());
}

// Fills analysed stream with false values
// Array acts as a window.
// Contents will be updated in evtLoop()
function createWindow(size) {
  for (var i = 0; i < size; i++) {
    analysedStreamA.push(false);
    analysedStreamB.push(false);
  }
}

// Assigns any implemented WebRTC functions in the browser to a function usable in every use case.
// Returns the assignment of that variable to see whether it actually exists in current browser.
function hasUserMedia() {
  navigator.getUserMedia = navigator.getUserMedia ||
   navigator.webkitGetUserMedia || navigator.mozGetUserMedia ||
    navigator.msGetUserMedia;
  return !!navigator.getUserMedia;
}

// initializes the streams;
// determine audio/video devices used;
// initializes the analyser nodes;
// calls getUserMedia(constraints);
function initStreams() {
  let audioDeviceSelectedA = audioSelectA.value;
  let audioDeviceSelectedB = audioSelectB.value;
  let videoDeviceSelectedA  = videoSelectA.value;
  let videoDeviceSelectedB  = videoSelectB.value;

  console.log('audioDeviceSelectedA', audioDeviceSelectedA);
  console.log('audioDeviceSelectedB', audioDeviceSelectedB);
  console.log('videoDeviceSelectedA', videoDeviceSelectedA);
  console.log('videoDeviceSelectedB', videoDeviceSelectedB);

  initAnalyserNodes();

  // Get access to 2 audio visual inputs.
  getMediaWithConstraints(audioDeviceSelectedA, videoDeviceSelectedA);
  getSecondMediaWithConstraints(audioDeviceSelectedB, videoDeviceSelectedB);
}

// creates audio contexts and analyser nodes
// creates fData and fByteData arrays containing frequency info obtained from analyser nodes
function initAnalyserNodes(){
  window.AudioContext = window.AudioContext || window.webkitAudioContext;

  audioContextA = new AudioContext({sampleRate: SAMPLE_RATE});
  audioContextB = new AudioContext({sampleRate: SAMPLE_RATE});
  audioContextC = new AudioContext({sampleRate: SAMPLE_RATE});

  console.log('Input Audio Sample Rate: ', SAMPLE_RATE);

  analyserA = audioContextA.createAnalyser();
  analyserB = audioContextB.createAnalyser();
  analyserC = audioContextC.createAnalyser();

  analyserA.fftSize = FFT_SIZE;
  analyserB.fftSize = FFT_SIZE;
  analyserC.fftSize = 256;

  freqBinSize = SAMPLE_RATE/FFT_SIZE;
  console.log('Input Frequency Bin Size: ', freqBinSize);

  // Scaling the min and max decibles for the freqData arrays
  // Any frequencies with an amplitude less than minDecibels are returned as 0.0 or 0
  // Any frequencies with an amplitude over maxDecibels are returned as +1.0 or 255
  analyserA.minDecibels = -90;
  analyserA.maxDecibels = -10;
  analyserA.smoothingTimeConstant = 0.85;

  analyserB.minDecibels = -90;
  analyserB.maxDecibels = -10;
  analyserB.smoothingTimeConstant = 0.85;

  // Arrays to hold the frequency amplitude data from FFT
  // FrequencyBinCount is half the FFT size
  // If user requires frequency data as float, should utilise getFloatFrequencyData method
  fDataA = new Float32Array(analyserA.frequencyBinCount);
  fDataB = new Float32Array(analyserB.frequencyBinCount);

  // If user requires frequency data as byte, should utilise getByteFrequencyData method
  fByteDataA = new Uint8Array(analyserA.frequencyBinCount);
  fByteDataB = new Uint8Array(analyserB.frequencyBinCount);
  fByteDataC = new Uint8Array(analyserC.frequencyBinCount);

  // Gets the location of a frequency value in terms of frequency bin (or index in frequencyData array)
  // Used to find the band cutoff for F1, F2 and F3 formants.
  f1Band = getFrequencyValue(1000, audioContextA, fByteDataA);
  f2Band = getFrequencyValue(2000, audioContextA, fByteDataA);
  f3Band = getFrequencyValue(3000, audioContextA, fByteDataA);
  console.log('Bandwidth cutoffs for locating F1, F2 and F3:', f1Band[0], f2Band[0], f3Band[0]);

  lowCutoff  = getFrequencyValue(300, audioContextA, fByteDataA)[0];
  highCutoff = getFrequencyValue(3400, audioContextA, fByteDataA)[0];
  console.log('Human Voice Frequency Bin Low Cutoff', lowCutoff);
  console.log('Human Voice Frequency Bin High Cutoff', highCutoff);
}

// gets the media from audio/video source
// audio/video sources determined by gotDevices()
// catches errors
// calls gotStream()
function getMediaWithConstraints(audioSourceA, videoSourceA) {
  console.log('getting first stream')
  let constraints = {
    audio: {
      deviceId: audioSourceA ? {
        exact: audioSourceA
      } : undefined
    },
    video: {
      deviceId: videoSourceA ? {
        exact: videoSourceA
      } : undefined
    }
  };

  navigator.mediaDevices.getUserMedia(constraints)
    .then(gotStream)
    .catch(errorCallback);
}
function getSecondMediaWithConstraints(audioSourceB, videoSourceB) {
  console.log('getting second stream')
  let constraints = {
    audio: {
      deviceId: audioSourceB ? {
        exact: audioSourceB
      } : undefined
    },
    video: {
      deviceId: videoSourceB ? {
        exact: videoSourceB
      } : undefined
    }
  };
  navigator.mediaDevices.getUserMedia(constraints)
    .then(gotSecondStream)
    .catch(errorCallback);
}

// assigns srcObj to video stream;
// creates audioNode from stream;
// starts evLoop();
// gets list of available media devices
function gotStream(stream) {
  window.streamA = stream;
  videoFeedOne.srcObject = stream;
  console.log("got first stream");

  // assing to variables to keep track of multiple streams
  if(stream.getTracks().length > 0){
    micOne    = stream.getTracks()[0];
    cameraOne = stream.getTracks()[1];
    console.log('Mic One ID: ' + micOne.id);
    console.log('Cam One ID: ' + cameraOne.id);
    // console.log(cameraOne.getSettings());
    // console.log(micOne.getSettings());
  } else {
    console.log('Cannot locate mediaTracks')
  }

  // Create an AudioNode from the stream.
  // Connect mediaStreamSource to analyser
  mediaStreamSourceA = audioContextA.createMediaStreamSource(stream);
  console.log(mediaStreamSourceA);
  mediaStreamSourceA.connect(analyserA);

  // If the studio wants audio feedback from the recording analysers need to be connected to the output
  // analyserA.connect(audioContextA.destination);

  return navigator.mediaDevices.enumerateDevices();
}
function gotSecondStream(stream) {
  window.streamB = stream;
  videoFeedTwo.srcObject = stream;
  console.log("got second stream");

  // assing to variables to keep track of multiple streams
  if(stream.getTracks().length == 2 ){
    micTwo    = stream.getTracks()[0];
    cameraTwo = stream.getTracks()[1];
    console.log('Mic Two: ' + micTwo.id);
    console.log('Cam Two: ' + cameraTwo.id);
  } else if (stream.getTracks().length == 1 ){
    micTwo    = stream.getTracks()[0];
    console.log('Mic Two: ' + micTwo.id);
  } else {
    console.log(stream.getTracks());
  }

  // Create an AudioNode from the stream.
  // Connect mediaStreamSource to analyser.
  mediaStreamSourceB = audioContextB.createMediaStreamSource(stream);
  console.log(mediaStreamSourceB);
  mediaStreamSourceB.connect(analyserB);

  // analyserB.connect(audioContextB.destination);

  mixedAudioOut();

  // kick off the input signal updating
  initEvtLoopOne(frameRate);
  initEvtLoopTwo(frameRate);

  return navigator.mediaDevices.enumerateDevices();
}

// provides list of devices for UI;
// deviceId, deviceLabel, video/audio
function gotDevices(deviceInfos) {
  let audioInputs = deviceInfos
    .filter(device => device.kind === 'audioinput')
    .map((device, indx) => ({
      value: device.deviceId,
      label: device.label || `microphone ${indx + 1}`
    }));

  let videoInputs = deviceInfos
    .filter(device => device.kind === 'videoinput')
    .map((device, indx) => ({
      value: device.deviceId,
      label: device.label || `camera ${indx + 1}`
    }));

  audioInputs.forEach(device => {
    let option = document.createElement('option');
    option.text = device.label;
    option.value = device.value;
    audioSelectB.appendChild(option);
    audioSelectA.appendChild(option.cloneNode(true));
  });

  videoInputs.forEach(device => {
    let option = document.createElement('option');
    option.text = device.label;
    option.value = device.value;
    videoSelectB.appendChild(option);
    videoSelectA.appendChild(option.cloneNode(true));
  });
}
function errorCallback(error) {
  console.log('error', error);
}

// make a first request to getUserMedia;
// calls gotDevices();
// calls initStreams();
navigator.mediaDevices.getUserMedia({audio: false, video: true}).then(s => {
  // once request is made, streams can be initialized
  navigator.mediaDevices.enumerateDevices()
  .then(gotDevices)
  .then(initStreams)
  .catch(errorCallback);
});

// when device selected value changes, initialize new stream
audioSelectA.onchange = initStreams;
videoSelectA.onchange = initStreams;
audioSelectB.onchange = initStreams;
videoSelectB.onchange = initStreams;

// initialize the timer variables and starts evtLoop
function initEvtLoopOne(fps) {
    evtOneInterval = 1000 / fps;
    evtOneThen = Date.now();
    evtOneStartTime = evtOneThen;
    evtLoopFeedOne();
    console.log('evtLoopOne Fired')
}
function initEvtLoopTwo(fps) {
    evtTwoInterval = 1000 / fps;
    evtTwoThen = Date.now();
    evtTwoStartTime = evtTwoThen;
    evtLoopFeedTwo();
    console.log('evtLoopTwo Fired')
}

// LOOP FOR INPUT SIGNALS
// fills fData + fByteData arrays with freq values
// == voiceDetect.js ==
// calls getSignalStrength(), similarBandByte(), similarPeaksByte()
// changes detectUtterance boolean based on signalStrength, similarBand, similarPeaks
// calls slideWindow() : updates values in analysedStream buffer
function evtLoopFeedOne() {
  // the animation loop calculates time elapsed since the last loop
  // and only draws if specified fps interval is achieved...

  // if true request another frame
  if(stop == false){
    window.requestAnimationFrame(evtLoopFeedOne);

    // calc elapsed time since last loop
    evtOneNow = Date.now();
    evtOneElapsed = evtOneNow - evtOneThen;

    // if enough time has elapsed, draw the next frame
    if (evtOneElapsed > evtOneInterval) {
      // Get ready for next frame by setting then=now, but also adjust for your
      // specified fpsInterval not being a multiple of RAF's interval (16.7ms)
      evtOneThen = evtOneNow - (evtOneElapsed % evtOneInterval);

      // initial value stating no voice is present
      let detectUtterance = false;

      // Performs FFT on input val
      // Copies freq amps into fByteDataA array
      analyserA.getByteFrequencyData(fByteDataA);

      // Places freq amps of voice band into voice bins array
      voiceBinsA = [];
      for(var i = lowCutoff; i < highCutoff+1; i++){
        voiceBinsA.push(fByteDataA[i])
      }

      // functions defined in voiceDetect.js script
      let signalStrength = getSignalStrength(fByteDataA);
      let similarBand    = similarBandByte(fByteDataA);
      let hasThreePeaks  = threePeaks(fByteDataA, voiceBinsA);

      // DOM displays threshold for signalStrength
      thresholdA.innerHTML = 'Signal Threshold / Current Input Vol: ' + micSensitivityA.value + ' / ' + signalStrength;

      // automatic system can output false positives
      // UI button allows user to select between automatic or manual calibration
      if(auto) {
        let distances      = findFormantDist(fByteDataA);
        let similarPeaks   = checkIfVowel(distances, f1DistBoxA, f2DistBoxA);

        // definition of an 'utterance':
        // 1. input signal is a certain strength
        // 2. ratio of 300 - 3400Hz is large
        // 3. peak freq bins similar to human voice
        if (signalStrength > micSensitivityA.value && similarBand && hasThreePeaks && similarPeaks){
          detectUtterance = true;
        } else {
          detectUtterance = false;
        }
      } else {
        let similarPeaks   = checkDistance(fByteDataA, f1DistA, f2DistA, f1DistBoxA, f2DistBoxA);
        if (signalStrength > micSensitivityA.value && similarBand && hasThreePeaks && similarPeaks){
          detectUtterance = true;
        } else {
          detectUtterance = false;
        }
      }

      // Moves elements of analysedStream array
      // Allows for a fixed length window of values to be updated
      slideWindow(analysedStreamA);

      // fill first index with most recent input value
      analysedStreamA[0] = detectUtterance;

      // Used to test for spectral peaks
      // getPeak(fByteDataA);
    }
  } else { window.requestAnimationFrame(evtLoopFeedOne) };
}

// Event loop for second feed
function evtLoopFeedTwo(){

  if(stop == false){
    requestAnimationFrame(evtLoopFeedTwo);

    // calc elapsed time since last loop
    evtTwoNow = Date.now();
    evtTwoElapsed = evtTwoNow - evtTwoThen;

    // if enough time has elapsed, draw the next frame
    if (evtTwoElapsed > evtTwoInterval) {

        // Get ready for next frame by setting then=now, but also adjust for your
        // specified fpsInterval not being a multiple of RAF's interval (16.7ms)
        evtTwoThen = evtTwoNow - (evtTwoElapsed % evtTwoInterval);

        let detectUtterance = false;

        analyserB.getByteFrequencyData(fByteDataB);

        voiceBinsB = [];
        for(var i = lowCutoff; i < highCutoff+1; i++){
          voiceBinsB.push(fByteDataB[i]);
        };

        let signalStrength = getSignalStrength(fByteDataB);
        let similarBand    = similarBandByte(fByteDataB);
        let hasThreePeaks  = threePeaks(fByteDataB, voiceBinsB);

        // DOM displays threshold for signalStrength
        thresholdB.innerHTML = 'Signal Threshold / Current Input Vol: ' + micSensitivityB.value + ' / ' + signalStrength;

        if(auto) {
          let distances = findFormantDist(fByteDataB);
          let similarPeaks = checkIfVowel(distances, f1DistBoxB, f2DistBoxB);
          if (signalStrength > micSensitivityB.value && similarBand && hasThreePeaks && similarPeaks){
            detectUtterance = true;
          } else {
            detectUtterance = false;
          }
        } else {
          let similarPeaks   = checkDistance(fByteDataB, f1DistB, f2DistB, f1DistBoxB, f2DistBoxB);
          if (signalStrength > micSensitivityB.value && similarBand && hasThreePeaks && similarPeaks){
              detectUtterance = true; } else { detectUtterance = false;
          }
        }

        slideWindow(analysedStreamB);
        analysedStreamB[0] = detectUtterance;
    }
  } else { window.requestAnimationFrame(evtLoopFeedTwo) };
}

// updates elements of analysedStream array by creating a sliding window
// moves value at each index one place to the right
function slideWindow(analysedStream) {
  let temp = analysedStream[0];

	for(var i = 0; i < analysedStream.length; i++)
	{
		analysedStream[i] = analysedStream[i + 1];
	}

	analysedStream[analysedStream.length-1] = temp;
}

// <<< isSpeaking Functions >>>
// .includes() method checks if the analysedStream array contains a single 'true' value
// updates DOM based on number of 'true' values
// function is called every 300ms
/*
let includesMethod = () => {
  if (analysedStream.includes(true)){
    // feed has voice present
  } else {
    // feed doesn't have voice present
  }
};
*/

// .filter() method counts number of 'true' values in analysedStream array
// updates DOM based on number of 'true' values
// function is called every 200ms
let isSpeakingA = (analysedStream) => {
  let count = analysedStream.filter(v => v).length;
  windowRatioA = (count/analysedStream.length)*100;

  switch (true) {
    case (windowRatioA < 20 && windowRatioA > 0):
      break;
    case (windowRatioA > 20):
      videoFeedOne.style.borderColor = "green";
      break;
    default:
      videoFeedOne.style.borderColor = "red";
  }
};
let isSpeakingB = (analysedStream) => {
  let count = analysedStream.filter(v => v).length;
  windowRatioB = (count/analysedStream.length)*100;

  switch (true) {
    case (windowRatioB < 20 && windowRatioB > 0):
      break;
    case (windowRatioB > 20):
      videoFeedTwo.style.borderColor = "green";
      break;
    default:
      videoFeedTwo.style.borderColor = "red";
  }
};

// Creates a bool with a listener
// Listener is fired when bool state changes
// Used to log when a speaker begins/finishes speaking
// Prevents logging of speakingState while speaking
function Bool(initialValue) {
    var bool = !!initialValue;
    var listeners = [];
    var returnVal = function(value) {
        if (arguments.length) {
            var oldValue = bool;
            bool = !!value;
            listeners.forEach(function (listener, i, list) {
                listener.call(returnVal, { oldValue: oldValue, newValue: bool });
            });
        }
        return bool
    };
    returnVal.addListener = function(fn) {
        if (typeof fn == "function") {
            listeners.push(fn);
        }
        else {
            throw "Not a function!";
        }
    };

    return returnVal;
}

// Creates a single stream of both audio inputs.
// Issues may occur with simultaneous playback of audio streams on broadcast page
function mixedAudioOut() {
  console.log('Creating bouncedAudioOut stream for combined speaker output');
  const audioCtx = new AudioContext();
  const dst = audioCtx.createMediaStreamDestination();

  audioCtx.createMediaStreamSource(streamA).connect(dst);
  audioCtx.createMediaStreamSource(streamB).connect(dst);

  bouncedAudioOut = new MediaStream();
  bouncedAudioOut.addTrack(dst.stream.getAudioTracks()[0]);

  mediaStreamSourceC = audioContextC.createMediaStreamSource(bouncedAudioOut);
  mediaStreamSourceC.connect(analyserC);

  console.log('Combined speaker audio output created');
  console.log('bouncedAudioOut ID:', bouncedAudioOut.id);
}
