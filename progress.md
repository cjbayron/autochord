# progress

### 04/24

- pick 5 songs to check for audio feature consistency between vampy-host+Chordino and chroma features downloaded from Billboard
- songs picked:
	- 1289 - There She Goes - The La's
	- 736 - Do I Do - Stevie Wonder
	- 637 - Human Nature - Michael Jackson
	- 270 - In My Room - The Beach Boys
	- 18 - Kiss On My List - Daryl Hall & John Oates

### 04/26

- install nnls-chroma VAMP plugin (in Linux)
	- copy .so file to /usr/local/lib/vamp (create if directory not exists)
	- run `sudo ldconfig`

### 04/30

- add DTW comparison

### 05/02

- finished DTW comparison, proceeding to training prep

### 05/03

- just find a way to convert the features as `np.array`??? `model.fit` can handle it

### 05/05

- stop watching; just find a way to integrate custom dataset

### 05/06

- loading prep

### 05/08

- can encode chords to numbers

### 06/01

- review onset, tempo estimation (we'll use it on chroma)

### 06/09

- how to use TFA CRF (does the input/output make sense?)

### 06/12

- need to implement fully-labelled song

### 07/19

- working BiLSTM-CRF model (75-78 accuracy)
- will try 2048 hidden dim

### 07/21

- achieved 90+ accuracy using:
	- 512 hidden dim
	- 0.05 drop rate
	- 0.001 learning rate
	- 128 batch size
	- 15 epochs
- it seems this can be improved further; but we PEND for now
	- extend epochs, early stopping / best checkpoint
- focus now on DEPLOYING! (w/in July pls???)

### 07/22

- use base_model for TFJS conversion; remember to compile
- test if JS can load

### 07/26

- Error: Unknown layer: Addons>CRF. This may be due to one of the following reasons
1. The layer is defined in Python, in which case it needs to be ported to TensorFlow.js or your JavaScript code.
2. The custom layer is defined in JavaScript, but is not registered properly with tf.serialization.registerClass().

### 07/28

- explore if saving as graph will solve the problem; otherwise we might need to port the model (hopefully not)

### 07/29

- need to be able to convert (via tfjs-converter) to graph model if we want to load as graph. error:
	- ValueError: Unsupported Ops in the model before optimization
