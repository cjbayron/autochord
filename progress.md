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