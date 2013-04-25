#!/bin/bash
google-chrome --enable-webgl --ignore-gpu-blacklist localhost:8000 &
python -m SimpleHTTPServer
exit 0
