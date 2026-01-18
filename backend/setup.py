from setuptools import setup, find_packages

setup(
    name="backend",  # can be any name
    version="0.1",
    packages=find_packages(where="."),  # find everything in backend/
    package_dir={"": "."},  # <-- treat current folder as root
    install_requires=[
        # list your dependencies, e.g. "fastapi", "pymongo", etc.
    ],
    python_requires=">=3.10",  # or your Python version
)
