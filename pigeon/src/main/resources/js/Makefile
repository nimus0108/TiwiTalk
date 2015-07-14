DUO_ARGS := -o ../web main.js styles.css

compile:
	duo $(DUO_ARGS)
	rm -r ../web/components

stage:
	duo --use duo-uglify $(DUO_ARGS)

depends:
	npm install duo-uglify
