from setuptools import setup

if __name__ == "__main__":
    setup(
        package_data={
            "autochord": ["res/nnls-chroma.so"]
        },
        install_requires=[
            "gdown",
            "numpy",
            "scipy",
            "librosa",
            "vamp",
            "lazycats",
            "tensorflow>=2.6"
        ]
    )
