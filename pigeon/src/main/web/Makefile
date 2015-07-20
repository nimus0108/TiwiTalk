DUO_OUTPUT_DIR := ../resources/public
DUO_ARGS := --no-cache
DUO_JS := $(DUO_ARGS) -r js main.js
DUO_CSS := --use duo-sass $(DUO_ARGS) -r css styles.scss

compile:
	duo $(DUO_JS) -o ../$(DUO_OUTPUT_DIR)
	duo $(DUO_CSS) -o ../$(DUO_OUTPUT_DIR)

stage:
	duo --use duo-uglify $(DUO_JS) -o ../$(DUO_OUTPUT_DIR)
	duo $(DUO_CSS) --use duo-clean-css -o ../$(DUO_OUTPUT_DIR)

clean:
	rm -rf ./components
	cd $(DUO_OUTPUT_DIR) && rm -rf styles.css main.js

depends:
	npm install duo-uglify duo-sass duo-clean-css
