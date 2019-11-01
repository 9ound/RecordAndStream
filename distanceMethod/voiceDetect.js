// Indexes of frequency bins
// lowCutoff = 300Hz (roughly)
// highCutoff = 3400Hz (roughly)

let peakThreshold = 0;

let   f1DistBoxA = document.getElementById('f1DistA'),
      f2DistBoxA = document.getElementById('f2DistA'),
      f1DistBoxB = document.getElementById('f1DistB'),
      f2DistBoxB = document.getElementById('f2DistB');

let   f1Band, f2Band, f3Band;

// turn off on screen visual feedback
// more computationally expensive
function turnOffFeedback(){
  if (f1DistBoxA != null || f1DistBoxB != null){
    f1DistBoxA.innerHTML = '', f2DistBoxA.innerHTML = '';
    f1DistBoxA.style.backgroundColor = 'red', f2DistBoxA.style.backgroundColor = 'red';
    f1DistBoxB.innerHTML = '', f2DistBoxB.innerHTML = '';
    f1DistBoxB.style.backgroundColor = 'red', f2DistBoxB.style.backgroundColor = 'red';

    f1DistBoxA = null;
    f1DistBoxB = null;

    document.getElementById('onOffFeedback').innerHTML = 'Visual Feedback is Off'
    console.log('UI visual feedback turned off');

  } else {

    f1DistBoxA     = document.getElementById('f1DistA');
    f1DistBoxB     = document.getElementById('f1DistB');

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

  if ((avgVoice/avgNoise) > 3 && (avgVoice/avgNoise) < 10) {
    withinRange = true;
  } else {
    withinRange = false;
  }

  return withinRange;
}

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
  let f1DistMax = f1Dist + 8,
      f1DistMin = f1Dist - 15,
      f2DistMax = f2Dist + 8,
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

function checkIfVowel(distArr, f1Box, f2Box){
  let dist1 = distArr[0];
  let dist2 = distArr[1];
  let isVow = false;
  let isF1 = checkFormantDist1(dist1, f1Box);
  let isF2 = checkFormantDist2(dist2, f2Box);

  if (isF1){
    f1Box.style.backgroundColor = "green" } else { f1Box.style.backgroundColor = "red"
  }

  if (isF2){
    f2Box.style.backgroundColor = "green" } else { f2Box.style.backgroundColor = "red"
  }

  if (isF1 && isF2){ return true; } else { return false; }
}

function checkFormantDist1(dist){
  let isF1;

  switch (true) {
    case dist == 1:
      isF1 = true;
      break;
    case dist == 4:
      isF1 = true;
      break;
    case dist == 5:
      isF1= true;
      break;
    case dist == 7:
      isF1 = true;
      break;
    case dist == 8:
      isF1 = true;
      break;
    case dist == 13:
      isF1 = true;
      break;
    case dist == 16:
      isF1 = true;
      break;
    case dist == 17:
      isF1 = true;
      break;
    case dist == 20:
      isF1 = true;
      break;
    case dist == 25:
      isF1 = true;
      break;
    case dist == 26:
      isF1 = true;
      break;
    case dist == 29:
      isF1 = true;
      break;
    case dist == 35:
      isF1 = true;
      break;
    case dist == 43:
      isF1 = true;
      break;
    case dist == 44:
      isF1 = true;
      break;
    case dist == 50:
      isF1= true;
      break;
    default:
      isF1 = false;
  }

  return isF1;
}
function checkFormantDist2(dist){
  let isF2;
  switch (true) {
    case dist == 10:
      isF2 = true;
      break;
    case dist == 15:
      isF2 = true;
      break;
    case dist == 17:
      isF2 = true;
      break;
    case dist == 19:
      isF2 = true;
      break;
    case dist == 24:
      isF2 = true;
      break;
    case dist == 27:
      isF2 = true;
      break;
    case dist == 33:
      isF2 = true;
      break;
    case dist == 39:
      isF2 = true;
      break;
    case dist == 31:
      isF2 = true;
      break;
    default:
      isF2 = false;
  }
  return isF2;
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
function getPeak(frequencyData){
  let peak = 0;

  for (let i = 0; i < frequencyData.length; i++){
    if(frequencyData[i] > peak){
      peak = i;
    }
  }
  // console.log(peak);
}
