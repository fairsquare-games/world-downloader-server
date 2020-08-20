# WorldDownloader Server

This repository contains the server that can handle incoming requests from the world-downloader
Spigot plugin. This server is capable of taking an upload and provides a random UUID as the
download key.

## Usage

The following scripts are available:
- `npm run dev` to start it up in development mode.
- `npm run build` to build the distribution bundle.
- `npm run start` to start the distribution bundle.
- `npm run build:start` to build the distribution bundle and start it.

## Docker

This server is ready to be used with Docker. How you use it, however, depends on whether or not
you want to secure this service behind HTTPS or simply use HTTP. There is no publicly available
Docker image as of now as FairSquare relies on its private registry for all of its projects.
However, you can build the image yourself using this repository. After having cloned this
repository, you can build the image by simply executing the following Docker command:

```
docker build --tag world-downloader-server .
```

## Passing in the configuration

This server uses the [config](https://www.npmjs.com/package/config) module to provide several
configuration options. There are two main ways to provide your configuration during the
Docker-run command.

1. Mount a `production.js` file that overwrites one or multiple configuration options of the
`default.js` file. You can do this by using the 
`-v /path/to/your/production.js:/usr/src/app/config/production.js` directive.

2. Mounting a file is not always possible in a nice and dynamic way (e.g. when using GitHub
actions). You can manually overwrite configuration values as well due to the `secret-config.ts`
module. All camel-case values are replaced by upper-case: `uploadDirectory` becomes
`UPLOADDIRECTORY`. Nested values are replaced by underscores: `options.uploadDirectory` becomes
`OPTIONS_UPLOADDIRECTORY`. You can inject chunks of JSON as well if you need to set an array
or an entire object.

### HTTP

If you do not care too much about routing all traffic via HTTPS, you can simply boot up the
server using the following command:

```
docker run --restart=always --name world-downloader-server -d -p 80:80 world-downloader-server
```

#### jwilder/nginx-proxy

Do you find yourself using the [jwilder/nginx-proxy](https://hub.docker.com/r/jwilder/nginx-proxy/)
container to route your web traffic on your server box? No problem! You can still use this
image with the following command:

```
docker run --restart=always --name world-downloader-server -d -e VIRTUAL_HOST=sub.domain.com world-downloader-server
```

Do make sure that this container is in the same network as your nginx-proxy container. If it isn't,
you can connect it to that network using `--network=yournginxproxynetwork`. Refer to 
the documentation of [jwilder/nginx-proxy](https://hub.docker.com/r/jwilder/nginx-proxy/)
for more information depending on your HTTP setup.

### HTTPS

The situation becomes a bit more complex when dealing with HTTPS. You must pass in the
certificate files for your domain. You can do this by mounting them to the 
`/usr/src/app/certs` directory. An example could be as follows:

```
docker run --restart=always --name world-downloader-server -d -v /path/to/your/certs:/usr/src/app/certs -e CERT_NAME=domain.com world-downloader-server
```

You must also pass in the names of the certificate files (as in many cases, all of your
certificates might be in the same directory). This is the name without the extension of your
`.key` and `.crt` files. So, if you have `domain.com.key` and `domain.com.crt`, you specify
`-e CERT_NAME=domain.com`.

#### jwilder/nginx-proxy

Do you find yourself using the [jwilder/nginx-proxy](https://hub.docker.com/r/jwilder/nginx-proxy/)
container to route your web traffic on your server box, in addition to the 
[jrcs/nginx-proxy-companion](https://hub.docker.com/r/jrcs/letsencrypt-nginx-proxy-companion)?
No problem! You can still use this image with the following command:

```
docker run --restart=always --name world-downloader-server -d -e VIRTUAL_PROTO=https -e VIRTUAL_HOST=sub.domain.com -e VIRTUAL_PORT=443 -e LETSENCRYPT_HOST=sub.domain.com -e LETSENCRYPT_EMAIL=contact@domain.com -v /path/to/your/certs:/usr/src/app/certs -e CERT_NAME=sub.domain.com world-downloader-server
```

Do make sure that this container is in the same network as your nginx-proxy container. If it isn't,
you can connect it to that network using `--network=yournginxproxynetwork`. Refer to 
the documentation of [jwilder/nginx-proxy](https://hub.docker.com/r/jwilder/nginx-proxy/)
for more information depending on your HTTPS setup.
