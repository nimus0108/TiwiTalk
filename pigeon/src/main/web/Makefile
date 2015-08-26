DUO_OUTPUT_DIR := ../resources/public
DUO_ARGS := --no-cache --copy
DUO_JS := $(DUO_ARGS) -r js main.js
DUO_CSS := --use duo-sass $(DUO_ARGS) -r css styles.scss
CLEAN_COMPONENTS := rm -rf $(DUO_OUTPUT_DIR)/components

compile:
	duo $(DUO_JS) -o ../$(DUO_OUTPUT_DIR)
	duo $(DUO_CSS) -o ../$(DUO_OUTPUT_DIR)
	$(CLEAN_COMPONENTS)

stage:
	duo --use duo-uglify $(DUO_JS) -o ../$(DUO_OUTPUT_DIR)
	duo $(DUO_CSS) --use duo-clean-css -o ../$(DUO_OUTPUT_DIR)
	$(CLEAN_COMPONENTS)

clean:
	rm -rf ./components $(DUO_OUTPUT_DIR)/components
	cd $(DUO_OUTPUT_DIR) && rm -rf styles.css main.js

depends:
	npm install duo-uglify duo-sass duo-clean-css
