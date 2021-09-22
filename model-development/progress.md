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

### 08/01

- Tried TF frozen graph -> tfjs graph model. same error
- ReverseSequence is unsupported op in tfjs. submitted feature request
- focus on Python API for now: check if working OK, then TRY adding graphics (e.g. turtle)

### 08/02

- incorrect evaluation. need to retrain.

### 08/19

- can only achieve 67% using 128 sequence length (hd=128, lr=1e-3, ...)
	- explore whether extending length is still feasible (e.g. in terms of inference speed)
	- explore other features

### 08/31

- check guild-ai results then train a model using best hyperparams so far
- analyze where the model fails
	- what chords does it not recognize?
	- is it because of the noise/sparsity of the features?
	- can there be a full-song-based correction?

### 09/01

- bug in TF2.6???
	- retry on another runtime
	- NOPE
- trained seq_len=128, hd=128, lr=1e-3, dp=0.1, bs=64
	- acc: 67.33%
	- ANALYZE

### 09/05

- able to do some analysis
	- class_weights not working in TF unfortunately
	- consider on-the-fly data augmentation/transformation (maybe on train_step in model.py)
- visualize current output chords
	- how wrong is it?
	- do we really gain from re-training?
	- try in JS
- able to create initial UI
	- better to pass chord information in compressed form (less processing in JS)

### 09/12

- pretty much completed basic flow of autochord-js
	- can view chords of a song
	- can load chords
	- can load other chords for comparison
- next: do the actual analysis
- IMPORTANT: from data_analysis.ipynb, we might have set `remove_ambiguous` to True for the features we used for training; consider this when retraining
- some analysis:
	- inconsistent handling of similar sections
	- there's definitely something to improve on
	- try more songs
	- try direct from WAV
- some bugs/enhancements:
	- post-playing actions??
	- color mapping

### 09/13

- autochord-js analysis:
	- again, inconsistent handling of similar sections
	- on (There She Goes)
		- it seems model is confused on relatively silent parts (e.g. intro)
		- pretty much SAME performance on chordino (pre-generated) and WAV; WAV slightly better
	- on (In My Room)
		- mismatch on relatively silent parts as well
		- VERY ACCURATE!
		- same performance on chordino/wav as well
- bugs:
	- incorrect handling of color for consecutive same chords
	- inconsistent display for enharmonic notes

### 09/14

- autochord-js more analysis:
	- on (Kiss on my List)
		- quite a few mismatches bet. chordino and WAV
		- both can't capture a fast transition (but the transition is debatable)
	- on (Do I Do)
		- chordino and WAV more sensitive on bass at times
		- lots of mismatches but, hard song!
	- on (Human Nature)
		- again, more sensitive on bass
		- chordino seem closer to label, but there seem to be song mismatch
- decision: PUBLISH but still try to train

### 09/15

- 1st PUBLISH version:
	- fully-packaged Python code
		- see https://github.com/ohollo/chord-extractor for VAMP plugin packaging
	- separate JS app
	- TODO:
		- VAMP plugin as JS module (see piper?)
		- tfjs model
		- converting other Python functions to JS equivalent

### 09/18

- bugs (continuation) :
	/ incorrect handling of color for consecutive same chords
	? inconsistent display for enharmonic notes
	/ not auto-seeking if loaded 2nd chords while playing

### 09/19

- re-structured Python package
	- working core functions
	- TODO: package VAMP plugin

### 09/21

- bugs:
	- handling for incorrect audio file
- TODO:
	- fix packaging issues
	- try installing in a fresh virtualenv
	- publish