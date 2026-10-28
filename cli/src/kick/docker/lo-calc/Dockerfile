FROM debian:bookworm-slim
RUN apt-get update \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends libreoffice-calc-nogui fonts-dejavu-core \
 && rm -rf /var/lib/apt/lists/*
