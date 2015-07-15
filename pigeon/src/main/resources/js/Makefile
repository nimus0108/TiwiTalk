DUO_ARGS := -o ../web main.js

compile:
	duo $(DUO_ARGS)
	duo --use duo-sass -o ../web styles.scss
	rm -rf ../web/components

stage:
	duo --use duo-uglify $(DUO_ARGS)

depends:
	npm install duo-uglify duo-sass
