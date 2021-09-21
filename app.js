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

const chordColor = {
  'C': '#FFFF00', 'CM7': '#FFFF00', 'C7': '#FFFF00',
    'Cm': '#E0FF00', 'Cm7': '#E0FF00',

  'C#': '#C0FF00', 'C#M7': '#C0FF00',  'C#7': '#C0FF00',
    'C#m': '#80FF00','C#m7': '#80FF00',
  'Db': '#C0FF00', 'DbM7': '#C0FF00',  'Db7': '#C0FF00',
    'Dbm': '#80FF00','Dbm7': '#80FF00',

  'D': '#00FF00', 'DM7': '#00FF00', 'D7': '#00FF00',
    'Dm': '#00FF80', 'Dm7': '#00FF80',

  'D#': '#00FFC0', 'D#M7': '#00FFC0',  'D#7': '#00FFC0',
    'D#m': '#00FFE0','D#m7': '#00FFE0',
  'Eb': '#00FFC0', 'EbM7': '#00FFC0',  'Eb7': '#00FFC0',
    'Ebm': '#00FFE0','Ebm7': '#00FFE0',

  'E': '#00FFFF', 'EM7': '#00FFFF', 'E7': '#00FFFF',
    'Em': '#00E0FF', 'Em7': '#00E0FF',

  'F': '#00C0FF', 'FM7': '#00C0FF',  'F7': '#00C0FF',
    'Fm': '#0080FF','Fm7': '#0080FF',

  'F#': '#0000FF', 'F#M7': '#0000FF',  'F#7': '#0000FF',
    'F#m': '#8000FF','F#m7': '#8000FF',
  'Gb': '#0000FF', 'GbM7': '#0000FF',  'Gb7': '#0000FF',
    'Gbm': '#8000FF','Gbm7': '#8000FF',

  'G': '#C000FF', 'GM7': '#C000FF',  'G7': '#C000FF',
    'Gm': '#E000FF','Gm7': '#E000FF',

  'G#': '#FF00FF', 'G#M7': '#FF00FF', 'G#7': '#FF00FF',
    'G#m': '#FF00E0', 'G#m7': '#FF00E0',
  'Ab': '#FF00FF', 'AbM7': '#FF00FF', 'Ab7': '#FF00FF',
    'Abm': '#FF00E0', 'Abm7': '#FF00E0',

  'A': '#FF00C0', 'AM7': '#FF00C0', 'A7': '#FF00C0',
    'Am': '#FF0080', 'Am7': '#FF0080',

  'A#': '#FF0000','A#M7': '#FF0000', 'A#7': '#FF0000',
    'A#m': '#FF8000', 'A#m7': '#FF8000',
  'Bb': '#FF0000','BbM7': '#FF0000', 'Bb7': '#FF0000',
    'Bbm': '#FF8000', 'Bbm7': '#FF8000',

  'B': '#FFC000', 'BM7': '#FFC000', 'B7': '#FFC000',
    'Bm': '#FFE000', 'Bm7': '#FFE000',
};

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
  text('Load song:', 30, baseY); baseY += 30;
  text('Load chords:', 30, baseY); baseY += 30;
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

  wavesurfer.on('finish', function () {
    playBtn.html('PLAY')
    waveState = waveStates.PAUSE;
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
    if (wavesurfer.isPlaying())
      wavesurfer2.play();
  });

  wavesurfer2.on('finish', function () {
    playBtn.html('PLAY')
    waveState = waveStates.PAUSE;
  });
}

function visualizeChords(waveObj, chordLabels) {

  let baseColorMap = ["#4A9CBB", "#9D6AFF"]
  let prevChord = 'N';

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

    let color = "#4A9CBB"; // default
    if (chordName in chordColor)
      color = chordColor[chordName]

    if (chordName != prevChord) {
      waveObj.addMarker({
        time: st,
        label: chordName,
        color: color.concat("EE"),
        position: "top"
      })
    }

    waveObj.addRegion({
      start: st,
      end: ed,
      color: color.concat("77"),
      drag: false, resize: false
    })

    prevChord = chordName
  });
}
/******************************/

/******************************/
/* ML processing              */

// TODO
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
