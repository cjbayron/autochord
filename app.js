/******************************/
/* UI variables               */
let titlefont;
let font;
const titleSize = 40;
const fontSize = 18;
const states = {
  LOADING: 'load',
  IDLE: 'idle'
}
let state = states.IDLE;
let wavesurfer;
let wavesurfer2;
let otherChordFile;
let waveData = null;
const waveStates = {
  PLAY: 'play',
  PAUSE: 'pause'
}
let waveState = waveStates.PAUSE;
let songInputBtn;
let playBtn;
let chordInputBtn;
let chordCompareBtn;
let loadTimer;
let loadProgress;
/******************************/

/******************************/
/* P5 functions               */

function preload() {
  titlefont = loadFont('assets/SourceSansPro-SemiboldIt.otf');
  font = loadFont('assets/SourceSansPro-Regular.otf');
}

function setup() {
  let cnv = createCanvas(windowWidth, 240);
  cnv.parent('actions-container')
  cnv.style('display', 'block');

  loadDiv = select('#load-screen');

  // initAutoChordModel();
  initWaveforms();

  let baseY = 80;
  let baseX = 30;

  songInputBtn = createFileInput(loadSong, false);
  songInputBtn.position(baseX+300, baseY); baseY += 30;

  chordInputBtn = createFileInput(readMainChordFile, false);
  chordInputBtn.position(baseX+300, baseY); baseY += 30;
  chordInputBtn.attribute('disabled', true)

  chordCompareBtn = createFileInput(readOtherChordFile, false);
  chordCompareBtn.position(baseX+300, baseY); baseY += 30;
  chordCompareBtn.attribute('disabled', true)

  playBtn = createButton('PLAY')
  playBtn.position(baseX, baseY);
  playBtn.attribute('class', 'button');
  playBtn.mouseReleased(playPause);
  playBtn.attribute('disabled', true);

}

function windowResized() { // automatically resize window
  resizeCanvas(windowWidth, 240);
}

function draw() {
  background('#e5d7d4');
  initText(useColor='#a17e50', useFont=titlefont, useSize=titleSize, isTitle=true);
  
  let baseY = 50;
  let baseX = 30;
  text('autochord', baseX, baseY); baseY += 40;

  initText();
  text('Load song and predict chords:', 30, baseY); baseY += 30;
  text('Load chords (override prediction):', 30, baseY); baseY += 30;
  text('Load other chords (for comparing):', 30, baseY); baseY += 30;

  if (state == states.LOADING) {
    if ((millis() - loadTimer) > 500.0)
      refreshLoading();
  }
}

// p5 draw() helpers
function initText(useColor='#543b1b', useFont=font, useSize=fontSize, isTitle=false) {
  fill(useColor);
  textFont(useFont);
  textSize(useSize);
  textAlign(LEFT);
  if (isTitle) {
    strokeWeight(1);
    stroke('#dbb47f');
  } else {
    noStroke();
  }
}
/******************************/

/******************************/
/* Control                    */
function initLoading() {
  state = states.LOADING;
  loadTimer = millis();
  loadProgress = 0;

  songInputBtn.attribute('disabled', true);
  chordInputBtn.attribute('disabled', true);
  chordCompareBtn.attribute('disabled', true);
  playBtn.attribute('disabled', true);
}

function finishLoading() {
  songInputBtn.removeAttribute('disabled');
  chordInputBtn.removeAttribute('disabled');
  chordCompareBtn.removeAttribute('disabled');
  playBtn.removeAttribute('disabled');

  state = states.IDLE;
  loadDiv.html('');
}

function refreshLoading() {
  loadTimer = millis();
  loadProgress += 1;
  if (loadProgress > 3)
    loadProgress = 0;

  let loadText = 'Loading'
  for (let i=0; i<loadProgress; i++)
    loadText += '.'

  loadDiv.html(loadText);
}

function loadSong(file) {
  initLoading();
  waveData = file.data;
  
  wavesurfer.clearRegions();
  wavesurfer.clearMarkers();

  wavesurfer2.clearRegions();
  wavesurfer2.clearMarkers();
  wavesurfer2.empty();

  wavesurfer.load(waveData);
}

function playPause() {
  if (waveState == waveStates.PLAY) {
    wavesurfer.pause()
    wavesurfer2.pause()
    playBtn.html('PLAY')
    waveState = waveStates.PAUSE;
  } else if (waveState == waveStates.PAUSE) {
    wavesurfer.play()
    wavesurfer2.play();
    playBtn.html('PAUSE')
    waveState = waveStates.PLAY;
  }
}

function readChordFile(file, waveObj) {
  let base64data = file.data.replace(
    'data:application/octet-stream;base64,','');

  let chordText = atob(base64data);
  let chordLabels = chordText.split('\n');
  visualizeChords(waveObj, chordLabels);
}

function readMainChordFile(file) {
  readChordFile(file, wavesurfer);
}

function readOtherChordFile(file) {
  otherChordFile = file;
  initLoading();
  wavesurfer2.load(waveData);
}
/******************************/

/******************************/
/* Music visualization        */
function initWaveforms() {
  wavesurfer = WaveSurfer.create({
      container: '#waveform',
      waveColor: 'violet',
      progressColor: 'purple',
      scrollParent: true,
      minPxPerSec: 80,
      plugins: [
        WaveSurfer.cursor.create({
          showTime: true,
          opacity: 0.5,
          customShowTimeStyle: {
            'padding': '5px',
            'padding-top': '100px',
            'font-size': '12px'
          }
        }),
        WaveSurfer.regions.create({}),
        WaveSurfer.markers.create({}),
        WaveSurfer.timeline.create({
          container: "#wave-timeline",
          timeInterval: 1,
        })
      ]
  });

  wavesurfer.on('ready', function () {
    finishLoading();
  });

  wavesurfer2 = WaveSurfer.create({
      container: '#waveform2',
      waveColor: 'violet',
      progressColor: 'purple',
      scrollParent: true,
      minPxPerSec: 80,
      interact: false,
      hideScrollbar: true,
      plugins: [
        WaveSurfer.regions.create({}),
        WaveSurfer.markers.create({}),
        WaveSurfer.timeline.create({
          container: "#wave-timeline2",
          timeInterval: 1,
        })
      ]
  });

  wavesurfer2.setMute(true);
  wavesurfer.on('seek', (progress) => {
    wavesurfer2.seekAndCenter(progress);
  });

  wavesurfer2.on('ready', function () {
    readChordFile(otherChordFile, wavesurfer2);
    finishLoading();

    let progress = wavesurfer.getCurrentTime() / wavesurfer.getDuration();
    wavesurfer2.seekAndCenter(progress);
  });
}

function visualizeChords(waveObj, chordLabels) {

  let baseColorMap = ["#4A9CBB", "#9D6AFF"]
  let prevChord = 'N';
  let chordCtr = 0;

  waveObj.clearRegions();
  waveObj.clearMarkers();

  chordLabels.forEach((line, i) => {
    if (!line) // empty
      return // continue

    let labelComps = line.split('\t')
    if (labelComps.length != 3)
      return // continue

    let st = labelComps[0];
    let ed = labelComps[1];
    let chordName = labelComps[2];
    chordName = chordName.replace(':maj7','M7').replace(':min7','m7')
                         .replace(':maj','').replace(':min', 'm').replace(':','')

    if ((chordName == "N") || (chordName == "X"))
      return // continue

    if (chordName != prevChord) {
      waveObj.addRegion({
        start: st,
        end: ed,
        color: baseColorMap[chordCtr%2].concat("77"),
        drag: false, resize: false
      })

      waveObj.addMarker({
        time: st,
        label: chordName,
        color: baseColorMap[chordCtr%2].concat("EE"),
        position: "top"
      })

      chordCtr++;
    } else {
      waveObj.addRegion({
        start: st,
        end: ed,
        color: baseColorMap[(chordCtr-1)%2].concat("77"),
        drag: false, resize: false
      })
    }

    prevChord = chordName
  });
}
/******************************/

/******************************/
/* ML processing              */

async function initAutoChordModel() {
  try {
    console.log('Loading chord recognition model...');
    //window.model = await tf.loadLayersModel('autochord-model/model.json');
    // window.model = await tf.loadGraphModel('models/tfjs/chroma-seq-bilstm-crf-0-base/model.json');
    const modelUrl =
    'https://storage.googleapis.com/tfjs-models/savedmodel/mobilenet_v2_1.0_224/model.json';
    const model = await tf.loadGraphModel(modelUrl);

    console.log('Loaded.');
  } catch (e) {
    console.log(e)
  }
}
/******************************/
