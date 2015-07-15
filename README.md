# TiwiTalk backend

This branch stores the server software necessary for TiwiTalk.

# Pigeon

Pigeon is the instant messaging platform.

## Setting Up

```
npm install -g duo
```

## Running and Developing

The server needs two things to be built before it can be run:
1. JavaScript/CSS files (built with Duo.js)
2. Scala files (built with SBT)

The web files need to be built before running the server. To do so, change
directory to `pigeon/src/main/resources/js` and run `make`. The server
must be reloaded in order to reload the built web files.

To start the server, first enter the SBT console with `activator`. Then, switch
to pigeon with `project pigeon`. Lastly, run `reStart` to actually start the
server.

To stop the server:

```
reStop
```

To automatically reload the server on files changes, use `~reStart`.

## Deployment

The server is deployed using Docker and the images are stored in Tutum. To
build the docker images, run the packaging command in SBT console:

```docker:publishLocal```

To upload the built image:

```tutum image push tiwitalk/pigeon```

