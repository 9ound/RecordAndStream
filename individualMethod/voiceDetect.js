/*
In telephony, the usable voice frequency band ranges from approximately 300 Hz to 3400 Hz.
The voiced speech of a typical adult male will have a fundamental frequency from 85 to 180 Hz
and that of a typical adult female from 165 to 255 Hz.
Thus, the fundamental frequency of most speech falls
below the bottom of the "voice frequency" band as defined above.
*/

// Indexes of frequency bins
// lowCutoff = 300Hz (roughly)
// highCutoff = 3400Hz (roughly)
let peakThreshold = 100;

let   f1BoxA     = document.getElementById('f1BoxA'),
      f2BoxA     = document.getElementById('f2BoxA'),
      f3BoxA     = document.getElementById('f3BoxA'),
      f1BoxB     = document.getElementById('f1BoxB'),
      f2BoxB     = document.getElementById('f2BoxB'),
      f3BoxB     = document.getElementById('f3BoxB'),
      f1DistBoxA = document.getElementById('f1DistA'),
      f2DistBoxA = document.getElementById('f2DistA'),
      f1DistBoxB = document.getElementById('f1DistB'),
      f2DistBoxB = document.getElementById('f2DistB');

let   f1Band, f2Band, f3Band;

// turn off on screen visual feedback
// more computationally expensive
function turnOffFeedback(){
  if (f1BoxA != null || f1BoxB != null){
    f1BoxA.innerHTML = '', f2BoxA.innerHTML = '', f3BoxA.innerHTML = '';
    f1BoxA.style.backgroundColor = 'red', f2BoxA.style.backgroundColor = 'red', f3BoxA.style.backgroundColor = 'red';
    f1BoxB.innerHTML = '', f2BoxB.innerHTML = '', f3BoxB.innerHTML = '';
    f1BoxB.style.backgroundColor = 'red', f2BoxB.style.backgroundColor = 'red', f3BoxB.style.backgroundColor = 'red';

    f1BoxA = null;
    f1BoxB = null;

    document.getElementById('onOffFeedback').innerHTML = 'Visual Feedback is Off'
    console.log('UI visual feedback turned off');
  } else {
    f1BoxA     = document.getElementById('f1BoxA');
    f1BoxB     = document.getElementById('f1BoxB');

    console.log('UI visual feedback turned on');
    document.getElementById('onOffFeedback').innerHTML = 'Visual Feedback is On'
  }
}

// gets avg of bins between 300-3400Hz (avgVoice)
// gets avg of bins !between 300-3400Hz (avgNoise)
// checks if the ratio of avgVoice:avgNoise is above a threshold
function similarBandByte(frequencyData){
  avgVoice = getAvgByteVoiceBins(frequencyData);
  avgNoise = getAvgByteNoiseBins(frequencyData);

  // console.log(avgVoice/avgNoise);
  if ((avgVoice/avgNoise) > 3) {
    withinRange = true;
  } else {
    withinRange = false;
  }

  return withinRange;
}
function similarBandFloat(frequencyData){
  avgVoice = getAvgFloatVoiceBins(frequencyData);
  avgNoise = getAvgFloatNoiseBins(frequencyData);

  if ((avgVoice/avgNoise) < 0.6) {
    withinRange = true;
  } else {
    withinRange = false;
  }

  return withinRange;
}

// gets three largest frequency bin values in frequencyData array
// checks if the three largest frequency bin values are similar to those of users calibration.
/*
function userCalibratedPeaks(f1, f2, f3, formant1Low, formant1High, formant2Low, formant2High, formant3Low, formant3High, frequencyData){
  let isSimilar = false;

  const largestThreeAmp  = getLargestThreeAmpFrom(frequencyData);
  const largest          = largestThreeAmp[0];
  const secondLargest    = largestThreeAmp[1];
  const thirdLargest     = largestThreeAmp[2];

  const largestThreeIndex = getLargestThreeIndexFrom(largest, secondLargest, thirdLargest, frequencyData);

  // largestThreeIndex[1, 2, 3] are the bin index numbers in frequency bin array
  const highestPeak       = largestThreeIndex[0];
  const secondHighestPeak = largestThreeIndex[1];
  const thirdHighestPeak  = largestThreeIndex[2];

  // document.getElementById('fftInfo').innerHTML = highestPeak + ' ' + secondHighestPeak + ' ' + thirdHighestPeak;

  // document.getElementById('fftInfo').innerHTML = '19 - 27: ' + highestPeak + '<p></p>' + '18 - 28: ' + secondHighestPeak + "<p></p>" + '16 - 30: ' + thirdHighestPeak + "<p></p>";

  if(f1 != null){
    f1.innerHTML = highestPeak;
    f2.innerHTML = secondHighestPeak;
    f3.innerHTML = thirdHighestPeak;
    if (highestPeak > formant1Low && highestPeak < formant1High){
      f1.style.backgroundColor = "green";
    } else { f1.style.backgroundColor = "red"; }
      // if the secondHighestPeak bin is in 18-28 range (387.5Hz - 603Hz)
    if (secondHighestPeak > formant2Low && secondHighestPeak < formant2High){
      f2.style.backgroundColor = "green";
    } else { f2.style.backgroundColor = "red"; }
    // if the thirdHighestPeak bin is in 17-29 range (366Hz - 624Hz)
    if(thirdHighestPeak > formant3Low && thirdHighestPeak < formant3High){
      f3.style.backgroundColor = "green";
    } else { f3.style.backgroundColor = "red"; }
  }

  // ONLY TESTED ON 28 YEAR OLD MALE VOICE
  // if the highestPeak bin is in 19-27 range (409Hz - 581Hz)
  if (highestPeak > formant1Low && highestPeak < formant1High){
    // if the secondHighestPeak bin is in 18-28 range (387.5Hz - 603Hz)
    if (secondHighestPeak > formant2Low && secondHighestPeak < formant2High){
      // if the thirdHighestPeak bin is in 17-29 range (366Hz - 624Hz)
      if(thirdHighestPeak > formant3Low && thirdHighestPeak < formant3High){
        isSimilar = true;
      }
    }
  }

  // console.log(f, s, t);
  // console.log(largestThreeIndex[0], largestThreeIndex[1], largestThreeIndex[2]);
  return isSimilar;
}
*/
function userCalibratedPeaks(f1, f2, f3, formant1Low, formant1High, formant2Low, formant2High, formant3Low, formant3High, frequencyData){
  let isSimilar = false;

  let peaks = findFormants(frequencyData);

  let highestPeak       = peaks[0];
  let secondHighestPeak = peaks[1];
  let thirdHighestPeak  = peaks[2];

  if(f1 != null){
    f1.innerHTML = 'f1: ' + highestPeak;
    f2.innerHTML = 'f2: ' + secondHighestPeak;
    f3.innerHTML = 'f3: ' + thirdHighestPeak;
    if (highestPeak > formant1Low && highestPeak < formant1High){
      f1.style.backgroundColor = "green";
    } else { f1.style.backgroundColor = "red"; }
      // if the secondHighestPeak bin is in 18-28 range (387.5Hz - 603Hz)
    if (secondHighestPeak > formant2Low && secondHighestPeak < formant2High){
      f2.style.backgroundColor = "green";
    } else { f2.style.backgroundColor = "red"; }
    // if the thirdHighestPeak bin is in 17-29 range (366Hz - 624Hz)
    if(thirdHighestPeak > formant3Low && thirdHighestPeak < formant3High){
      f3.style.backgroundColor = "green";
    } else { f3.style.backgroundColor = "red"; }
  }

  // ONLY TESTED ON 28 YEAR OLD MALE VOICE
  // if the highestPeak bin is in 19-27 range (409Hz - 581Hz)
  if (highestPeak > formant1Low && highestPeak < formant1High){
    // if the secondHighestPeak bin is in 18-28 range (387.5Hz - 603Hz)
    if (secondHighestPeak > formant2Low && secondHighestPeak < formant2High){
      // if the thirdHighestPeak bin is in 17-29 range (366Hz - 624Hz)
      if(thirdHighestPeak > formant3Low && thirdHighestPeak < formant3High){
        isSimilar = true;
      }
    }
  }

  // console.log(f, s, t);
  // console.log(largestThreeIndex[0], largestThreeIndex[1], largestThreeIndex[2]);
  return isSimilar;
}

// gets three largest frequency bin values in frequencyData array
// checks if largest frequency bin is above a specified threshold
function threePeaks(frequencyData, voiceBins){
  let threePeaks = false;

  const avg = getAvgByteVoiceBins(frequencyData);

  const peakThreshold = calculateRMS(voiceBins) * 2;

  voiceBins = [];

  const largestThreeAmp  = getLargestThreeAmpFrom(frequencyData);
  const largest          = largestThreeAmp[0];
  const secondLargest    = largestThreeAmp[1];
  const thirdLargest     = largestThreeAmp[2];

  if (largest > peakThreshold){
    if (secondLargest > peakThreshold){
      if(thirdLargest > peakThreshold){
        threePeaks = true;
      }
    }
  }

  // console.log(largest, secondLargest, thirdLargest, peakThreshold);
  return threePeaks;
}

// formats occur in approximately each 1000Hz band
function findFormantDist(frequencyData){
  let f1 = 0, f2 = 0, f3 = 0;

  for(var i = 0; i < f1Band[0]; i++){
    if(frequencyData[i] > f1){
      f1 = i;
    }
  }
  for(var i = f1Band[0]; i < f2Band[0]; i++){
    if(frequencyData[i] > f2){
      f2 = i;
    }
  }
  for(var i = f2Band[0]; i < f3Band[0]; i++){
    if(frequencyData[i] > f3){
      f3 = i;
    }
  }

  let formants = [f1, f2, f3];

  let f2minusF1 = formants[1] - formants[0];
  let f3minusF2 = formants[2] - formants[1];
  // console.log(formants);
  // console.log("Dist 1 - 2:", f2minusF1, "Dist 2 - 3:", f3minusF2);

  let formantDist = [f2minusF1, f3minusF2];
  return formantDist;
}
function findFormants(frequencyData){
  let f1 = 0, f2 = 0, f3 = 0;

  for(var i = 0; i < f1Band[0]; i++){
    if(frequencyData[i] > f1){
      f1 = i;
    }
  }
  for(var i = f1Band[0]; i < f2Band[0]; i++){
    if(frequencyData[i] > f2){
      f2 = i;
    }
  }
  for(var i = f2Band[0]; i < f3Band[0]; i++){
    if(frequencyData[i] > f3){
      f3 = i;
    }
  }

  let formants = [f1, f2, f3];
  return formants;
}
function checkDistance(frequencyData, f1Dist, f2Dist, f1Box, f2Box){
  let f1DistMax = f1Dist + 15,
      f1DistMin = f1Dist - 15,
      f2DistMax = f2Dist + 15,
      f2DistMin = f2Dist - 15,

      isF = false,
      formantArray = findFormantDist(frequencyData);

      // console.log(formantArray[0], f1DistMin, f1DistMax, formantArray[1], f2DistMin, f2DistMax)

  if(f1Box != null){
    f1Box.innerHTML = 'f1/f2 Distance: ' + formantArray[0];
    f2Box.innerHTML = 'f2/f3 Distance: ' + formantArray[1];
    if(formantArray[0] > f1DistMin && formantArray[0] < f1DistMax){
      f1Box.style.backgroundColor = "green"
      if(formantArray[1] > f2DistMin && formantArray[1] < f2DistMax){
        f2Box.style.backgroundColor = "green";
      } else { f2Box.style.backgroundColor = "red"; }
    } else { f1Box.style.backgroundColor = "red"; }
  }

  if(formantArray[0] > f1DistMin && formantArray[0] < f1DistMax){
    if(formantArray[1] > f2DistMin && formantArray[1] < f2DistMax){
      isF = true;
    }
  }

  return isF
}

function similarPeaksByteSM58(frequencyData){
  let isSimilar = false;
  const largestThreeAmp  = getLargestThreeAmpFrom(frequencyData, frequencyData.length);
  const largest          = largestThreeAmp[0];
  const secondLargest    = largestThreeAmp[1];
  const thirdLargest     = largestThreeAmp[2];

  const largestThreeIndex = getLargestThreeIndexFrom(largest, secondLargest, thirdLargest, frequencyData);

  // largestThreeIndex[1, 2, 3] are the bin index numbers in frequency bin array
  const highestPeak       = largestThreeIndex[0];
  const secondHighestPeak = largestThreeIndex[1];
  const thirdHighestPeak  = largestThreeIndex[2];
  // document.getElementById('fftInfo').innerHTML = '19 - 27: ' + highestPeak + '<p></p>' + '18 - 28: ' + secondHighestPeak + "<p></p>" + '16 - 30: ' + thirdHighestPeak + "<p></p>";

  // if the highestPeak bin is in 19-27 range (409Hz - 581Hz)
  if (highestPeak > 18 && highestPeak < 28){
    // if the secondHighestPeak bin is in 18-28 range (387.5Hz - 603Hz)
    if (secondHighestPeak > 17 && secondHighestPeak < 29){
      // if the thirdHighestPeak bin is in 17-29 range (366Hz - 624Hz)
      if(thirdHighestPeak > 16 && thirdHighestPeak < 30){
        isSimilar = true;
      }
    }
  }

  // console.log(f, s, t);
  // console.log(largestThreeIndex[0], largestThreeIndex[1], largestThreeIndex[2]);
  return isSimilar;
}

// gets the average amplitude across all frequency bins
function getSignalStrength(frequencyData){
  var signalStrength = Math.floor(calculateRMS(frequencyData));
  // console.log(signalStrength.toString(16));
  return signalStrength;
}

// uses byte freq data array to find values of 3 highest bins
// uses byte freq data array to find indexes of 3 highest bins
function getLargestThreeAmpFrom(frequencyData) {
  var first  = 0;
  var second = 0;
  var third  = 0;

  // There should be atleast three elements
  if (frequencyData.length < 3)
  {
    console.log("Invalid Input");
    return;
  }

  third = first = second;
  for (var i = 0; i < frequencyData.length ; i ++)
  {
    // If current element is
    // greater than first
    if (frequencyData[i] > first)
    {
        third  = second;
        second = first;
        first  = frequencyData[i];
    }

    // If frequencyData[i] is in between first
    // and second then update second
    else if (frequencyData[i] > second)
    {
        third  = second;
        second = frequencyData[i];
    }

    else if (frequencyData[i] > third)
    {
      third = frequencyData[i];
    }

  }

  const largestThree = [first, second, third];
  // console.log(largestThreeNum);
  return largestThree;
}
function getLargestThreeIndexFrom(f, s, t, arr) {
  const firstIndexOf = arr.indexOf(f);
  const secondIndexOf = arr.indexOf(s);
  const thirdIndexOf = arr.indexOf(t);

  const largestThreeIndex = [firstIndexOf, secondIndexOf, thirdIndexOf];
  // document.getElementById('binInfo').innerHTML = 'largest bins: ' + largestThreeIndex + '<p></p>' + 'bin amplitude: ' + fByteDataA[0];
  return largestThreeIndex;
}

function getAvgFloatAllBins(frequencyData){
  var avg = 0;
  var n = 0;
  for(var i = 0; i < frequencyData.length; i++){
    avg += frequencyData[i];
    n += 1;
  }
  avg = Math.floor(avg/n);
  return avg;
}
function getAvgFloatVoiceBins(frequencyData){
  var avg = 0;
  var n = 0;
  for(var i = lowCutoff; i < highCutoff; i++){
    avg += frequencyData[i];
    n += 1;
  }
  avg = Math.floor(avg/n);
  return avg;
  // errorMsgElementA.innerHTML = n;
}
function getAvgFloatNoiseBins(frequencyData){
  var avg = 0;
  var n = 0;
  for(var i = highCutoff; i < frequencyData.length; i++){
    avg += frequencyData[i];
    n += 1;
  }
  for(var i = 0; i < lowCutoff; i++){
    avg += frequencyData[i];
    n += 1;
  }
  avg = Math.floor(avg/n);
  return avg;
  // errorMsgElementA.innerHTML = n;
}

// gets root mean squared of all frequency bins
function getRMSByteAllBins(frequencyData){
  var avg = 0;
  var n = 0;
  for(var i = 0; i < frequencyData.length; i++){
    avg += frequencyData[i];
    n += 1;
  }
  avg = Math.floor(avg/n);
  return avg;
}

let calculateRMS = (frequencyData) => Math.sqrt(
             frequencyData.map( val => (val * val))
                .reduce((acum, val) => acum + val)
            /frequencyData.length);

function getAvgByteVoiceBins(frequencyData){
  var avg = 0;
  var n = 0;
  for(var i = lowCutoff; i < highCutoff; i++){
    avg += frequencyData[i];
    n += 1;
  }
  avg = Math.floor(avg/n);
  return avg;
  // errorMsgElementA.innerHTML = avg;
}
function getAvgByteNoiseBins(frequencyData){
  var avg = 0;
  var n = 0;
  for(var i = highCutoff; i < frequencyData.length; i++){
    avg += frequencyData[i];
    n += 1;
  }
  for(var i = 0; i < lowCutoff; i++){
    avg += frequencyData[i];
    n += 1;
  }
  avg = Math.floor(avg/n);
  return avg;
  // errorMsgElementA.innerHTML = n;
}

// sliding window function
// gets max sum of adjacent elements in array
// k = window size
function maxSum (arr, k){
  if (k > arr.length) {
    return 'invalid input';
  }

  let winTotal = 0;
  for(let i = 0; i < k; i++){
    // defines first window and slides across arr
    // add contents of 2 adjacent i in arr
    winTotal += arr[i];
  }

  // need to keep track of return value
  let maxSumResult = winTotal;

  // starts from k element
  for(let i = k; i < arr.length; i++){

    winTotal += arr[i] - arr[i-k];
    maxSumResult = Math.max(winTotal, maxSumResult);

  }
  document.getElementById('fftInfo').innerHTML = 'maxSum of freq bins: ' + maxSumResult + "<p></p>";

  return maxSumResult;
};

function getFrequencyValue(frequency, context, freqDomain) {
  var nyquist = context.sampleRate/2;
  var index = Math.round(frequency/nyquist * freqDomain.length);
  var arr = [index, freqDomain[index]]
  return arr;
}

// formats occur in approximately each 1000Hz band
/*
function findUserFormants(frequencyData){
  let f1 = 0, f2 = 0, f3 = 0,
      f1BandLow   = ,
      f1BandHigh  = ,
      f2BandLow   = ,
      f2BandHigh  = ,
      f3BandLow   = ,
      f3BandHigh  = ;

  for(var i > f1BandLow; i < f1BandHigh; i++){
    if(frequencyData[i] > f1){
      f1 = i;
    }
  }
  for(var i > f2BandLow; i < f2BandHigh; i++){
    if(frequencyData[i] > f2){
      f2 = i;
    }
  }
  for(var i > f3BandLow; i < f3BandHigh; i++){
    if(frequencyData[i] > f3){
      f3 = i;
    }
  }

  let formants = [f1, f2, f3];
  return formants;
}
*/
