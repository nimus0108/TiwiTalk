DUO_OUTPUT_DIR := ../resources/public
DUO_ARGS := -o $(DUO_OUTPUT_DIR) main.js

compile:
	duo $(DUO_ARGS)
	duo --use duo-sass -o $(DUO_OUTPUT_DIR) styles.scss

stage:
	duo --use duo-uglify $(DUO_ARGS)

depends:
	npm install duo-uglify duo-sass
