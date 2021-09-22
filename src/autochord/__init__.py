"""Main functions"""
import os
from shutil import copy
import pkg_resources

import numpy as np
from scipy.signal import resample
import gdown
import librosa
import vamp
import lazycats.np as catnp
from tensorflow import keras


_CHROMA_VAMP_LIB = pkg_resources.resource_filename('autochord', 'res/nnls-chroma.so')
_CHROMA_VAMP_KEY = 'nnls-chroma:nnls-chroma'

_CHORD_MODEL_URL = 'https://drive.google.com/uc?id=1XBn7FyYjF8Ff6EuC7PjwwPzFBLRXGP7n'
_EXT_RES_DIR = os.path.join(os.path.expanduser('~'), '.autochord')
_CHORD_MODEL_DIR = os.path.join(_EXT_RES_DIR, 'chroma-seq-bilstm-crf-v1')
_CHORD_MODEL = None

_SAMPLE_RATE = 44100            # operating sample rate for all audio
_SEQ_LEN = 128                  # LSTM model sequence length
_BATCH_SIZE = 128               # arbitrary inference batch size
_STEP_SIZE = 2048/_SAMPLE_RATE  # chroma vectors step size

_CHROMA_NOTES = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']
_NO_CHORD = 'N'
_MAJMIN_CLASSES = [_NO_CHORD, *[f'{note}:maj' for note in _CHROMA_NOTES],
                   *[f'{note}:min' for note in _CHROMA_NOTES]]


##############
# Intializers
##############
def _setup_chroma_vamp():
    # pylint: disable=c-extension-no-member
    vamp_paths = vamp.vampyhost.get_plugin_path()
    vamp_lib_fn = os.path.basename(_CHROMA_VAMP_LIB)
    for path in vamp_paths:
        try:
            if not os.path.exists(os.path.join(path, vamp_lib_fn)):
                os.makedirs(path, exist_ok=True)
                copy(_CHROMA_VAMP_LIB, path)
            # try to load to confirm if configured correctly
            vamp.vampyhost.load_plugin(_CHROMA_VAMP_KEY, _SAMPLE_RATE,
                                       vamp.vampyhost.ADAPT_NONE)
            print(f'autochord: Using NNLS-Chroma VAMP plugin in {path}')
            return
        except Exception as e:
            continue

    print(f'autochord WARNING: NNLS-Chroma VAMP plugin not setup properly. '
          f'Try copying `{_CHROMA_VAMP_LIB}` in any of following directories: {vamp_paths}')

def _download_model():
    os.makedirs(_EXT_RES_DIR, exist_ok=True)
    model_zip = os.path.join(_EXT_RES_DIR, 'model.zip')
    gdown.download(_CHORD_MODEL_URL, model_zip, quiet=False)

    model_files = gdown.extractall(model_zip)
    model_files.sort()
    os.remove(model_zip)
    print(f'autochord: Chord model downloaded in {model_files[0]}')
    return model_files[0]

def _load_model():
    global _CHORD_MODEL_DIR, _CHORD_MODEL
    try:
        if not os.path.exists(_CHORD_MODEL_DIR):
            _CHORD_MODEL_DIR = _download_model()

        _CHORD_MODEL = keras.models.load_model(_CHORD_MODEL_DIR)
        print(f'autochord: Loaded model from {_CHORD_MODEL_DIR}')
    except Exception as e:
        raise Exception(f'autochord: Error in loading model: {e}')

def _init_module():
    print('autochord: Initializing...')
    _setup_chroma_vamp()
    _load_model()

_init_module()


#################
# Core Functions
#################
def generate_chroma(audio_fn, rollon=1.0):
    """ Generate chroma from raw audio using NNLS-chroma VAMP plugin """

    samples, fs = librosa.load(audio_fn, sr=None, mono=True)
    if fs != _SAMPLE_RATE:
        samples = resample(samples, num=int(len(samples)*_SAMPLE_RATE/fs))

    out = vamp.collect(samples, _SAMPLE_RATE, 'nnls-chroma:nnls-chroma',
                       output='bothchroma', parameters={'rollon': rollon})

    chroma = out['matrix'][1]
    return chroma

def predict_chord_labels(chroma_vectors):
    """ Predict (numeric) chord labels from sequence of chroma vectors """

    chordseq_vectors = catnp.divide_to_subsequences(chroma_vectors, sub_len=_SEQ_LEN)
    pred_labels, _, _, _ = _CHORD_MODEL.predict(chordseq_vectors, batch_size=_BATCH_SIZE)
    pred_labels = pred_labels.flatten()
    if len(chroma_vectors) < len(pred_labels): # remove pad
        pad_st = len(pred_labels)-_SEQ_LEN
        pad_ed = pad_st+len(pred_labels)-len(chroma_vectors)
        pred_labels = np.append(pred_labels[:pad_st], pred_labels[pad_ed:])

    assert len(pred_labels)==len(chroma_vectors)
    return pred_labels

def recognize(audio_fn, lab_fn=None):
    """
    Perform chord recognition on provided audio file. Optionally,
    you may dump the labels on a LAB file (MIREX format) through `lab_fn`.
    """

    chroma_vectors = generate_chroma(audio_fn)
    pred_labels = predict_chord_labels(chroma_vectors)

    chord_labels = catnp.squash_consecutive_duplicates(pred_labels)
    chord_lengths = [0] + list(catnp.contiguous_lengths(pred_labels))
    chord_timestamps = np.cumsum(chord_lengths)

    chord_labels = [_MAJMIN_CLASSES[label] for label in chord_labels]
    out_labels = [(_STEP_SIZE*st, _STEP_SIZE*ed, chord_name)
                  for st, ed, chord_name in 
                  zip(chord_timestamps[:-1], chord_timestamps[1:], chord_labels)]

    if lab_fn: # dump labels to file
        str_labels = [f'{st}\t{ed}\t{chord_name}'
                      for st, ed, chord_name in out_labels]
        with open(lab_fn, 'w') as f:
            for line in str_labels:
                f.write("%s\n" % line)

    return out_labels
