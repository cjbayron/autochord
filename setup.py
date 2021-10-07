from setuptools import setup

if __name__ == "__main__":
    setup(
        package_data={
            "autochord": ["res/nnls-chroma.so"]
        },
        install_requires=[
            "gdown>=3.11",
            "numpy>=1.19",
            "scipy>=1.4",
            "librosa>=0.8",
            "vamp",
            "lazycats",
            "tensorflow>=2.6"
        ]
    )
