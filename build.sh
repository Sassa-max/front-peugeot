#!/bin/bash

project_name=$(basename "$(pwd)")
project_version=$(cat VERSION)
docker_image_name=${USER}_${project_name}:${project_version}

source ./.env.${project_name}

docker build \
    --tag ${docker_image_name} \
    --build-arg VITE_API_URL=${VITE_API_URL} \
    .

echo "Built image: ${docker_image_name}"
