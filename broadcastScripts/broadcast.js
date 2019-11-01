// socket connection
// Provide your IP in order to broadcast to a computer on the same network
// const socket = io.connect('http://your.i.p.here:8080');
const socket = io.connect('http://localhost:8080');

let startBuf = false;

const feed1 = document.getElementById('mseVideo');
const feed2 = document.getElementById('mseVideo2');

function unmute(){
  feed1.muted = false;
  feed2.muted = false;
}

// Initialises MediaSource Buffer
socket.on('initMseBuf', function(data){
  console.log(data)
  startBuf = data;
  console.log('starting =', startBuf);

  if (startBuf){
    initBufs();
  }
})

// New segment arrives
// Placed in MediaSource Buffer
socket.on('broadcastBlobsA', function(chunks){
  let chunkArray = []
  chunkArray.push(chunks);
  let chunk = new Blob(chunkArray, { type: 'video/webm; codecs="opus,vp8"' });

  let reader = new FileReader();
  reader.addEventListener("load", function() {

    pendingAppendBytes.push(new Uint8Array(reader.result));
    // console.log("new recorder bytes. theRecorder array size now at:" + pendingAppendBytes.length);

    appendPendingBytes();
  });
  reader.readAsArrayBuffer(chunk);
});
socket.on('broadcastBlobsB', function(chunks){
  let chunkArray = []
  chunkArray.push(chunks);
  let chunk = new Blob(chunkArray, { type: 'video/webm; codecs="opus,vp8"' });

  let reader2 = new FileReader();
  reader2.addEventListener("load", function() {

    pendingAppendBytes2.push(new Uint8Array(reader2.result));
    // console.log("new recorder bytes. theRecorder2 array size now at:" + pendingAppendBytes2.length);

    appendPendingBytes2();
  });
  reader2.readAsArrayBuffer(chunk);
});

// Speech data sent from recording page
// Speech data arrive as an array containing 2 values
// [ratio of true:false values of SpeakerA, ratio of true:false values of SpeakerB]
// vidElemt opacity changes according to speechData
socket.on('speakerSpeechData', function(data){
  // If speaker 2 is silent, system automatically focuses attention on speaker 1
  if (data[0] == data[1]){
    feed1.style.opacity = 1;
    feed2.style.opacity = 0;
  }
  if(data[0] > 10 && data[0] > data[1]){
    feed1.style.opacity = 1;
    feed2.style.opacity = 0;
  }
  if(data[1] > 10 && data[1] > data[0]){
    feed1.style.opacity = 0;
    feed2.style.opacity = 1;
  }
})

function initBufs(){
  bufA();
  bufB();
}

function bufA(){
  mediaSource = new MediaSource();
  mseVideo = document.getElementById('mseVideo');
  mseVideo.src = window.URL.createObjectURL(mediaSource);
  mediaSource.addEventListener('sourceopen', function(e) {
    mseSourceBuffer = mediaSource.addSourceBuffer(RECORDER_MIME_TYPE);

    // Listen for errors
    mseSourceBuffer.addEventListener('error', function(e) {
      die("caught error, recording stopped. e.message:" + e.message);
    });
    // Look for more bytes to append when last append completes
    mseSourceBuffer.addEventListener('updateend', function(e) {
      let feedTime = feed1.currentTime;

      // Sanity check
      if (mseSourceBuffer.updating) {
        die("updating = true in updateend event handler");
      }

      if (mseVideo.buffered.length > 1) {
        console.warn("MSE buffered has a gap!");
      }

      if (pendingAppendBytes.length > 0) {
        appendPendingBytes();
        feed1.currentTime = feedTime;
      }
    });
  }, false);
}
function bufB(){
  mediaSource2 = new MediaSource();
  mseVideo2 = document.getElementById('mseVideo2');
  mseVideo2.src = window.URL.createObjectURL(mediaSource2);
  mediaSource2.addEventListener('sourceopen', function(e) {
    mseSourceBuffer2 = mediaSource2.addSourceBuffer(RECORDER_MIME_TYPE);

    // Listen for errors
    mseSourceBuffer2.addEventListener('error', function(e) {
      die2("caught error, recording stopped. e.message:" + e.message);
    });
    // Look for more bytes to append when last append completes
    mseSourceBuffer2.addEventListener('updateend', function(e) {
      let feedTime = feed2.currentTime;
      // Sanity check
      if (mseSourceBuffer2.updating) {
        die2("updating = true in updateend event handler");
      }

      if (mseVideo2.buffered.length > 1) {
        console.warn("MSE buffered has a gap!");
      }

      if (pendingAppendBytes2.length > 0) {
        appendPendingBytes2();
        feed2.currentTime = feedTime;
      }
    });
  }, false);
}

// Adapted from:
// https://github.com/w3c/media-source/issues/190
function appendPendingBytes() {

  if(!mseSourceBuffer) {
    return initBufs();
  }
  // Do nothing once an error occurs
  if (appDied) {
    console.log("skipping append - appDied.");
    return;
  }

  // Sanity check. Calls are expected to have some work do.
  if (pendingAppendBytes.length == 0) {
    console.warn("no-op - all bytes appended");
    return;
  }

  // Exit if still processing last append. updateend handler will take care of it
  if (mseSourceBuffer.updating) {
    console.log("delaying append for updateend");
    return;
  }

  // Append bytes
  try {
    window.mseSourceBuffer.appendBuffer(pendingAppendBytes.shift());
    // console.log("mseSourceBuffer appended bytes! " + pendingAppendBytes.length + " buffers of bytes remain");
  } catch (e) {
    die("failed append: " + e.message);
  }
}
function appendPendingBytes2() {
  // Do nothing once we've hit an error.
  if (appDied2) {
    console.log("skipping append - appDied2.");
    return;
  }

  // Sanity check. Calls are expected to have some work do.
  if (pendingAppendBytes2.length == 0) {
    console.warn("no-op - all bytes appended 2");
    return;
  }

  // Bail if still processing last append. updateend handler will take care of it
  if (mseSourceBuffer2.updating) {
    console.log("delaying append for updateend 2");
    return;
  }

  // All good - append some bytes
  try {
    window.mseSourceBuffer2.appendBuffer(pendingAppendBytes2.shift());
    // console.log("mseSourceBuffer2 appended bytes! " + pendingAppendBytes2.length + " buffers of bytes remain");
  } catch (e) {
    die2("failed append: " + e.message);
  }
}

function die(msg) {
  appDied = true;
  theRecorder.stop();
  throw msg;
}
function die2(msg) {
  appDied2 = true;
  theRecorder2.stop();
  throw msg;
}
