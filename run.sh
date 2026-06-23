#!/bin/bash

project_name=$(basename "$(pwd)")
project_version=$(cat VERSION)
docker_hostname=${USER}_${project_name}
docker_image_name=${docker_hostname}:${project_version}
docker_container_name=${docker_hostname}_${project_version}

docker container run -d --rm \
    -p 5173:80 \
    --name=${docker_container_name} \
    ${docker_image_name}
