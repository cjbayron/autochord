""" Loader for Billboard data features and labels """
import numpy as np
from numpy.random import default_rng
import pandas as pd
import mir_eval


_SEED = 0
_NUM_TEST_PER_CLASS = 1000
_NUM_VAL_PER_CLASS = 4000
_NUM_VAL_SPLITS = 5

_CHROMA_NOTES = ['A','Bb','B', 'C','Db','D','Eb','E','F','Gb','G','Ab']
_CHROMA_FEAT_NAMES = [f'{note}(bass)' for note in _CHROMA_NOTES] + _CHROMA_NOTES

# bitmaps of chord qualities
_MAJ_BITMAP = mir_eval.chord.quality_to_bitmap('maj')
_MIN_BITMAP = mir_eval.chord.quality_to_bitmap('min')
_MAJ7_BITMAP = mir_eval.chord.quality_to_bitmap('maj7')
_MIN7_BITMAP = mir_eval.chord.quality_to_bitmap('min7')

_NUM_SEMITONE = 12
_BASE_DIR = 'data/McGill-Billboard'

#----------
# Billboard data loading functions
def get_chroma_matrix(_id, return_timestamps=False):
    """ Load bothchroma(bass-treble) vectors from Billboard dataset """
    
    fn = f'{_BASE_DIR}/{_id:04d}/bothchroma.csv'
    contents = pd.read_csv(fn, header=None)
    
    # we only get 3rd column onwards
    # (first column empty, 2nd column time tick)
    bothchroma = contents[contents.columns[2:]].values
    if not return_timestamps:
        return bothchroma
    
    start_times = contents[contents.columns[1]].values
    step_size = start_times[1]
    end_times = np.append(start_times[1:], [start_times[-1]+step_size], axis=0)
    timestamps = np.vstack((start_times, end_times)).T
    return timestamps, bothchroma


def get_chord_labels(_id, label_type='majmin'):
    """ Load chord labels from .LAB files
    
    label_type: majmin, majmin7, majmininv, majmin7inv, full
    """
    lab_fn = f'{_BASE_DIR}/{_id:04d}/{label_type}.lab'
    # any line starting w/ \n is ignored e.g. blank lines
    timestamps, chord_labels = mir_eval.io.load_labeled_intervals(lab_fn, comment='\n')
    return timestamps, chord_labels


def encode_chords_single_label(chord_labels):
    """ Encode chord labels to a single label (semitone/root, quality in one) """
    
    # third array is bass number, which we ignore
    root_classes, quality_classes, _ = mir_eval.chord.encode_many(chord_labels)
    root_classes += 1 # add 1 to shift No Chord (-1) to 0

    min_chords_filt = np.all(quality_classes == _MIN_BITMAP, axis=1)
    maj7_chords_filt = np.all(quality_classes == _MAJ7_BITMAP, axis=1)
    min7_chords_filt = np.all(quality_classes == _MIN7_BITMAP, axis=1)

    root_classes[min_chords_filt] += _NUM_SEMITONE
    root_classes[maj7_chords_filt] += _NUM_SEMITONE*2
    root_classes[min7_chords_filt] += _NUM_SEMITONE*3

    return root_classes


def get_chord_features_and_labels(_id):
    """ Get chroma vectors and chord labels """
    chroma_timestamps, chroma_vectors = get_chroma_matrix(_id, return_timestamps=True)
    chord_timestamps, chord_labels_str = get_chord_labels(_id)
    chord_labels = encode_chords_single_label(chord_labels_str)

    assert(len(chroma_timestamps) == len(chroma_vectors))
    assert(len(chord_timestamps) == len(chord_labels))

    # label for each chroma vector
    chromavec_labels = np.zeros(len(chroma_vectors)).astype(np.int)-1 # all -1's
    st_ix = 0 # lower bound for updating labels
    for i, (ts, chord_label) in enumerate(zip(chord_timestamps, chord_labels)):
        # get indices of chroma timestamps within duration of current chord
        in_cur_chord = (chroma_timestamps[st_ix:, 0] >= ts[0]) \
                        & (chroma_timestamps[st_ix:, 1] <= ts[1])
        chromavec_labels[st_ix:][in_cur_chord] = chord_label

        # update lower bound
        in_cur_chord = in_cur_chord.astype(int)
        transitions = in_cur_chord[1:] - in_cur_chord[:-1]
        # we get index of first occurence of True->False transition
        # False-True = -1
        TtoF_ixs = np.where(transitions==-1)[0]

        if len(TtoF_ixs) > 0:
            st_ix += (TtoF_ixs[0] + 1) # +1 due to offset by diffing to get transitions

    remove_ambiguous_mask = (chromavec_labels != -1)
    return chroma_vectors[remove_ambiguous_mask], chromavec_labels[remove_ambiguous_mask]
#----------


def shuffle_set(array_set):
    """ Shuffle in unison all arrays in array_set """
    for arr in array_set:
        rng = default_rng(seed=_SEED)
        rng.shuffle(arr)
    
    return array_set


class QueueData():
    """ Queueing helper class """
    def __init__(self, dataset):
        self.dataset = dataset
        self.st_ix = 0
    
    def take(self, num):
        st, ed = self.st_ix, self.st_ix+num
        queue_out = tuple(data[st:ed] for data in self.dataset)
        self.st_ix = ed
        return queue_out
    
    def flush(self):
        st, ed = self.st_ix, len(self.dataset[0])
        queue_out = tuple(data[st:ed] for data in self.dataset)
        return queue_out


class SplitData():
    """ Splitting helper class """
    def __init__(self, feats=None, labels=None):
        self.feats = feats
        self.labels = labels
        
    def push(self, feats, labels):
        assert(len(feats)==len(labels))
        if self.feats is None:
            self.feats = feats
        else:
            self.feats = np.concatenate((self.feats, feats))
        
        if self.labels is None:
            self.labels = labels
        else:
            self.labels = np.concatenate((self.labels, labels))
    
    def __len__(self):
        return len(self.labels)

    @property
    def shape(self):
        return (self.feats.shape, self.labels.shape)


class SimpleChromaDataset():
    """
    Simple dataset wherein features are chroma vectors generated from Chordino
    as provided by McGill-Billboard dataset, and labels are chords.

    The naivete of this representation is assuming each chroma vectors
    as independent feature i.e. no interframe dependencies, etc.
    """
    _MAJMIN_CLASSES = ['N',
       'C:maj','Db:maj','D:maj','Eb:maj','E:maj','F:maj',
       'Gb:maj','G:maj','Ab:maj','A:maj','Bb:maj','B:maj',
       'C:min','Db:min','D:min','Eb:min','E:min','F:min',
       'Gb:min','G:min','Ab:min','A:min','Bb:min','B:min']

    def __init__(self, feat_label_files=None):
        """
        feat_label_files: tuple of NumPy binary files to load the data from,
            interpreted as (vector_array_file, label_array_file)
        """
        if feat_label_files:
            assert(len(feat_label_files) == 2)
            vectors_file, labels_file = feat_label_files
            self.chroma_vectors = np.load(vectors_file)
            self.chord_labels = np.load(labels_file)

        else: #TODO: implement extracting vectors and labels from the files
            pass

        self.classes = set(self.chord_labels)
        self.n_class = len(self.classes)
        print('Loaded features and labels.')
        self.train_split, self.val_splits, self.test_split = self.get_splits()
        print('Split into train, val, test.')

    def get_splits(self, validate=True):
        """
        Return training, validation, and test sets

        The split is done in a way that each class have equal representation
        in the test and validation split
        """
        feats, labels = self.chroma_vectors, self.chord_labels

        classes = list(self.classes)
        classes.sort()
        
        if validate:
            hist, _ = np.histogram(labels, bins=classes)
            assert(min(hist) >= (_NUM_TEST_PER_CLASS + (_NUM_VAL_SPLITS*_NUM_VAL_PER_CLASS)))
        
        test_split = SplitData()
        val_splits = [SplitData() for i in range(_NUM_VAL_SPLITS)]
        train_split = SplitData()
        
        for chord_class in classes:
            mask = (labels==chord_class)
            queue = QueueData(dataset=(feats[mask], labels[mask]))
            
            test_split.push(*queue.take(_NUM_TEST_PER_CLASS))
            for ix in range(_NUM_VAL_SPLITS):
                val_splits[ix].push(*queue.take(_NUM_VAL_PER_CLASS))
            train_split.push(*queue.flush())

        return train_split, val_splits, test_split

    def get_next_cv_split(self):
        """ Cross-vaidation splits generator """
        assert ((self.train_split is not None) and (self.val_splits is not None))
        train_split, val_splits = self.train_split, self.val_splits

        num_cv = len(val_splits)
        for v_ix in range(num_cv): # index of val split at a specific round
            addl_train_splits = val_splits[0:v_ix] + val_splits[v_ix+1:]
            val_split = val_splits[v_ix]

            full_train_feats = np.concatenate((train_split.feats,
                                               *[split.feats for split in addl_train_splits]))
            full_train_labels = np.concatenate((train_split.labels,
                                                *[split.labels for split in addl_train_splits]))
            full_train_split = SplitData(feats=full_train_feats,labels=full_train_labels)
            yield full_train_split, val_split