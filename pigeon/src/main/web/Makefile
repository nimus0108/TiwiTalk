DUO_OUTPUT_DIR := ../resources/public
DUO_ARGS := --no-cache -o $(DUO_OUTPUT_DIR)
DUO_JS := $(DUO_ARGS) main.js
DUO_CSS := --use duo-sass $(DUO_ARGS) styles.scss

compile:
	duo $(DUO_JS)
	duo $(DUO_CSS)

stage:
	duo --use duo-uglify $(DUO_JS)
	duo $(DUO_CSS) --use duo-clean-css

clean:
	rm -rf ./components
	cd $(DUO_OUTPUT_DIR) && rm -rf styles.css main.js

depends:
	npm install duo-uglify duo-sass duo-clean-css
