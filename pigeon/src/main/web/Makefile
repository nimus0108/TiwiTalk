DUO_OUTPUT_DIR := ../resources/public
DUO_ARGS := --no-cache -o $(DUO_OUTPUT_DIR)
DUO_JS := $(DUO_ARGS) main.js

compile:
	duo $(DUO_JS)
	duo --use duo-sass $(DUO_ARGS) styles.scss

stage:
	duo --use duo-uglify $(DUO_JS)

depends:
	npm install duo-uglify duo-sass
