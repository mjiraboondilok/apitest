FROM denoland/deno:alpine-1.33.2

# some of these has been brought over from https://github.com/unoconv/unoserver-docker/blob/main/Dockerfile
ARG BUILD_CONTEXT="build-context"
ARG UID=deno
ARG GID=deno

WORKDIR /

RUN apk add --no-cache \
  bash curl \
  py3-pip \
  libreoffice \
  supervisor

# fonts - https://wiki.alpinelinux.org/wiki/Fonts
RUN apk add --no-cache \
  font-noto font-noto-cjk font-noto-extra \
  terminus-font \
  ttf-font-awesome \
  ttf-dejavu \
  ttf-freefont \
  ttf-hack \
  ttf-inconsolata \
  ttf-liberation \
  ttf-mononoki  \
  ttf-opensans   \
  fontconfig && \
  fc-cache -f

RUN rm $(which wget) && \
  rm -rf /var/cache/apk/* /tmp/*

# renovate: datasource=repology depName=temurin-17-jdk versioning=loose
ARG VERSION_ADOPTIUM_TEMURIN="17.0.5_p8-r0"

# install Eclipse Temurin JDK
RUN curl https://packages.adoptium.net/artifactory/api/security/keypair/public/repositories/apk -o /etc/apk/keys/adoptium.rsa.pub && \
  echo 'https://packages.adoptium.net/artifactory/apk/alpine/main' >> /etc/apk/repositories && \
  apk update && apk add temurin-17-jdk=${VERSION_ADOPTIUM_TEMURIN}

# https://github.com/unoconv/unoserver/
RUN pip install -U unoserver

# FIX: pyuno path not set  (https://gitlab.alpinelinux.org/alpine/aports/-/issues/13359)
# define path
ARG PATH_LO=/usr/lib/libreoffice/program
ARG PATH_SP=/usr/lib/python3.10/site-packages

RUN \
  # copy unohelper.py
  cp "$PATH_LO"/unohelper.py "$PATH_SP"/  && \
  # prefix path to uno.py
  echo -e "\
import sys, os \n\
sys.path.append('/usr/lib/libreoffice/program') \n\
os.putenv('URE_BOOTSTRAP', 'vnd.sun.star.pathname:/usr/lib/libreoffice/program/fundamentalrc')\
" > "$PATH_SP"/uno.py  && \
  # copy the original's content
  cat "$PATH_LO"/uno.py >> "$PATH_SP"/uno.py

# setup supervisor
COPY --chown=${UID}:${GID} ${BUILD_CONTEXT}/supervisor /
RUN chmod +x /config/entrypoint.sh && \
  #    mkdir -p /var/log/supervisor && \
  #    chown ${UID}:${GID} /var/log/supervisor && \
  #    mkdir -p /var/run && \
  chown -R ${UID}:0 /run && \
  chmod -R g=u /run


# The port that your application listens to.
EXPOSE 8080

# Prefer not to run as root.
USER deno
WORKDIR /home/deno/app
ENV HOME="/home/deno"

# Cache the dependencies as a layer (the following two steps are re-run only when deps.ts is modified).
# Ideally cache deps.ts will download and compile _all_ external files used in main.ts.
COPY deps.ts .
RUN deno cache deps.ts

# These steps will be re-run upon each file change in your working directory:
COPY . .

# Compile the main app so that it doesn't need to be compiled each startup/entry.
RUN deno cache main.ts

ENTRYPOINT ["/config/entrypoint.sh"]