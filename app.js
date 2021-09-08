/******************************/
/* UI variables               */
let titlefont;
let font;
const titleSize = 50;
const fontSize = 20;
let wavesurfer;
const waveStates = {
  PLAY: 'play',
  PAUSE: 'pause'
}
let waveState = waveStates.PAUSE;
let playBtn;
let inputBtn;
/******************************/

/******************************/
/* P5 functions               */

function preload() {
  titlefont = loadFont('assets/SourceSansPro-SemiboldIt.otf');
  font = loadFont('assets/SourceSansPro-Regular.otf');
}

function setup() {
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.style('display', 'block');

  // initAutoChordModel();
  displayWaveform();

  let baseY = 300;
  playBtn = createButton('PLAY')
  playBtn.position(30, baseY); baseY += 70;
  playBtn.attribute('class', 'button');
  playBtn.mouseReleased(playPause);
  playBtn.attribute('disabled', true)

  inputBtn = createFileInput(readChordFile, false);
  inputBtn.position(30, baseY);
  inputBtn.attribute('disabled', true)
}

function windowResized() { // automatically resize window
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background('#e5d7d4'); // dark brown
  initText(useColor='#f0c080', useFont=titlefont, useSize=titleSize, isTitle=true);
  
  let baseY = 80;
  text('autochord', 30, baseY); baseY += 100;
}

// p5 draw() helpers
function initText(useColor='#f3c1a6', useFont=font, useSize=fontSize, isTitle=false) {
  fill(useColor);
  textFont(useFont);
  textSize(useSize);
  textAlign(LEFT);
  if (isTitle) {
    strokeWeight(1);
    stroke(248, 180, 120);
  } else {
    noStroke();
  }
}
/******************************/

/******************************/
/* Control                    */
function playPause() {
  if (waveState == waveStates.PLAY) {
    wavesurfer.pause()
    playBtn.html('PLAY')
    waveState = waveStates.PAUSE;
  } else if (waveState == waveStates.PAUSE) {
    wavesurfer.play()
    playBtn.html('PAUSE')
    waveState = waveStates.PLAY;
  }
}

function readChordFile(file) {
  let base64data = file.data.replace(
    'data:application/octet-stream;base64,','');

  let chordText = atob(base64data);
  let chordLabels = chordText.split('\n');
  visualizeChords(chordLabels);
}
/******************************/

/******************************/
/* Music visualization        */
function displayWaveform() {
  wavesurfer = WaveSurfer.create({
      container: '#waveform',
      waveColor: 'violet',
      progressColor: 'purple',
      scrollParent: true,
      minPxPerSec: 40,
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
          timeInterval: 2.5,
        })
      ]
  });

  wavesurfer.load('samples/audio.wav');
  wavesurfer.on('ready', function () {
    playBtn.removeAttribute('disabled');
    inputBtn.removeAttribute('disabled');
  });
}

function visualizeChords(chordLabels) {

  let baseColorMap = ["#4A9CBB", "#9D6AFF"]
  let positionMap = ["top", "bottom"]

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
                         .replace(':maj','').replace(':min', 'm')

    wavesurfer.addMarker({
      time: st,
      label: chordName,
      color: baseColorMap[i%2].concat("EE"),
      position: positionMap[i%2]
    })
    
    wavesurfer.addRegion({
      start: st,
      end: ed,
      color: baseColorMap[i%2].concat("77"),
      drag: false, resize: false
    })
  });

  // dummy chord regions
  // wavesurfer.addMarker({time: 10, label: 'C', color: "#4A9CBBEE", position: "top"})
  // wavesurfer.addRegion({start: 10, end: 15, color: "#4A9CBB77", drag: false, resize: false})
  // wavesurfer.addMarker({time: 15, label: 'Am', color: "#9D6AFFEE", position: "top"})
  // wavesurfer.addRegion({start: 15, end: 20, color: "#9D6AFF77", drag: false, resize: false})
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
