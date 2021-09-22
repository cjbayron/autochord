# autochord

<p align="center">
  <img src="images/title.png" width="400"/>
</p>

Automatic Chord Recognition tools

## About

`autochord` is:

&#10004; a Python library for automatic chord recognition (using TensorFlow)

&#10004; a Javascript app for visualization of chord transcriptions

## Library Usage

To install library, run:
```
$ pip install autochord
```

`autochord` provides a very simple API for performing chord recognition:
```
import autochord
autochord.recognize('audio.wav', lab_fn='chords.lab')
# This gives out a list of tuples in the format:
#  (chord start, chord end, chord name)
# e.g.
# [(0.0, 5.944308390022676, 'D:maj'),
#  (5.944308390022676, 7.476825396825397, 'C:maj'),
#  (7.476825396825397, 18.250884353741498, 'D:maj'),
#  (18.250884353741498, 19.736961451247165, 'C:maj')
#  ...
#  (160.49632653061224, 162.30748299319728, 'N')]
```

Under the hood `autochord.recognize()` runs the NNLS-Chroma VAMP plugin to extract chroma features from the audio, and feeds it to a Bi-LSTM-CRF model in TensorFlow to recognize the chords. Currently, the model can recognize 25 chord classes: the 12 major triads, 12 minor triads, and no-chord ('N').

OPTIONALLY, you may dump the chords in a `.lab` file by using the `lab_fn` parameter. The output file follows the MIREX chord label format.

Upon import `autochord` takes care of setting up the VAMP plugin and downloading the pre-trained chord recognition model.

The measured test accuracy of the TensorFlow model is 67.33%. That may be enough for some songs, but we can explore in the future how to further improve this.

## App Usage

TBD

## Future Improvements

- Integrate everything into a full chord recognition app! For that we need to:
	- convert VAMP plugin as JS module
	- Model conversion to TensorFlow.js (as of writing, some CRF operations are not supported by TFJS yet)
	- converting all other Python functions to JS equivalent
- Experimenting with other approaches to improve chord recognition accuracy