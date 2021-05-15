""" Loader for Billboard data features and labels """
import numpy as np
from numpy.random import default_rng


_SEED = 0
_NUM_TEST_PER_CLASS = 1000
_NUM_VAL_PER_CLASS = 4000
_NUM_VAL_SPLITS = 5


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