.PHONY = all build deploy clean

all: deploy

clean:
	rm -rf ./build

build:
	mkdir -p ./build
	rsync -av --delete --exclude=".*" --exclude="README" --exclude="build" \
		--exclude="Makefile" . ./build

deploy: build
	rsync -av ./build/ /var/www/html/ermrest-ui

