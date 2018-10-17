FROM ubuntu:16.04

# Replace shell with bash so we can source files
RUN rm /bin/sh && ln -s /bin/bash /bin/sh
# Set environment variables
ENV appDir /var/www/app/current

# system
RUN apt-get update
RUN apt-get install -y -q --no-install-recommends \
    software-properties-common \
    curl

# add node repo
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
RUN apt-get update

# install packages
RUN apt-get install -y -q --no-install-recommends \
    libstdc++-4.9-dev \
    libssl-dev \
    apt-transport-https \
    build-essential \
    ca-certificates \
    g++ \
    gcc \
    git \
    make \
    sudo \
    wget \
    nodejs \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get -y autoclean

# Set the work directory
RUN mkdir -p /var/www/app/current
WORKDIR ${appDir}

# Add our package.json and install *before* adding our application files
ADD package.json ./
ADD package-lock.json ./
RUN npm install

# Install pm2 and sequelize
RUN npm install -g pm2 sequelize-cli

ADD . /var/www/app/current
# run migrations
ENV NODE_ENV production
RUN sequelize db:migrate
# run
CMD ["pm2-docker", "index.js"]
