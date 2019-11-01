// Disable to make media debugging easier (just one video's logs)
var RECORDER_MIME_TYPE = 'video/webm; codecs="opus,vp8"';

// Global state
var appDied = false;
var appDied2 = false;
var firstA = true;
var firstB = true;
var mseVideo, mseVideo2;
var userMediaStream, userMediaStream2;
var theRecorder, theRecorder2;
var mediaSource, mediaSource2;
var mseSourceBuffer, mseSourceBuffer2;
var pendingAppendBytes = [];
var pendingAppendBytes2 = [];
const chunkLength = 3000;

var regex = /[?&]([^=#]+)=([^&#]*)/g,
    url = window.location.href,
    params = {},
    match;
while(match = regex.exec(url)) {
    params[match[1]] = decodeURIComponent(match[2]);
}

function init(){
	startStream();
	startStream2();
}
function initRec(){
	record();
  record2();
}

function startStream() {
  userMediaStream = streamA;
  console.log(userMediaStream);
  initMseBuffer();
}
function startStream2() {
  userMediaStream2 = streamB;
  console.log(userMediaStream2);
}

function record(){
	try {
        recorder = new MediaRecorder(userMediaStream, {mimeType : RECORDER_MIME_TYPE});
      } catch (e) {
        die('Failed creating MediaRecorders: ' + e);
        return;
      }
      theRecorder = recorder;
      console.log('theRecorder', theRecorder);
      console.info('MediaRecorders created!');
      recorder.ondataavailable = recorderOnDataAvailable;
      recorder.start(chunkLength);
}
function record2(){
  try {
        recorder2 = new MediaRecorder(userMediaStream2, {mimeType : RECORDER_MIME_TYPE});
      } catch (e) {
        die2('Failed creating MediaRecorders: ' + e);
        return;
      }
      theRecorder2 = recorder2;
      console.log('theRecorder2', theRecorder2);
      recorder2.ondataavailable = recorderOnDataAvailable2;
      recorder2.start(chunkLength);
}

function recorderOnDataAvailable (event) {
  if (appDied) return;
  if (event.data.size == 0) {
    console.warn("empty recorder data");
    return;
  }

  if(firstA){
    sendFirstBlobsA(event.data);
    firstA = false;
  }else{
    sendBlobsA(event.data);
  }
}
function recorderOnDataAvailable2 (event) {
  if (appDied2) return;
  if (event.data.size == 0) {
    console.warn("empty recorder2 data");
    return;
  }

  if(firstB){
    sendFirstBlobsB(event.data);
    firstB = false;
  }else{
    sendBlobsB(event.data);
  }
}

// To Server
// First blob is sent separately and is held on the server for a short period of time
// Allows more segments in the MSE Buffer so there won't be a gap in playback if network is a little slower
function sendFirstBlobsA(blobs){
  socket.emit('sendFirstBlobsA', blobs);

  let speechData = [windowRatioA, windowRatioB];

  socket.emit('speechData', speechData);
}
function sendFirstBlobsB(blobs){
  socket.emit('sendFirstBlobsB', blobs);
}
function sendBlobsA(blobs){
  socket.emit('sendBlobsA', blobs);

  let speechData = [windowRatioA, windowRatioB];

  socket.emit('speechData', speechData);
}
function sendBlobsB(blobs){
  socket.emit('sendBlobsB', blobs);
}

function initMseBuffer(){
  const start = true;
  socket.emit('initBuffer', start);
}
