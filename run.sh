#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
node "$SCRIPT_DIR/src/index.js" --websites="$SCRIPT_DIR/data/websites.csv" --keywords="$SCRIPT_DIR/data/keywords.txt"
