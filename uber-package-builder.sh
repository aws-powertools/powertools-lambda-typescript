#!/usr/bin/env bash
set -e


usage() {
  echo "Uber package Builder"
  echo "------------------------"
  echo "./uber-pacakge-builder.sh NAME LOCAL_NPM_PACKAGE_LOCATION"
  echo ""}


if [[ "$#" -lt 3 ]]; then
   usage
   exit 1
fi

name="${1}"
runtime="${2}"
dist_folder="${3}"

if test -d "$dist_folder"; then
  packages="${@:4}"
else
  dist_folder=""
  packages="${@:3}"
fi


output_folder="$(mktemp -d)"

echo "$output_folder is the output folder"

docker_image="public.ecr.aws/sam/build-$runtime:latest"
volume_params="-v $output_folder:/layer"

if [[ $runtime == node* ]]; then

  package_folder="nodejs/"
  mkdir -p "$output_folder/$package_folder"
  if [[ -n "$dist_folder" ]]; then
    cp -r "$dist_folder" "$output_folder/$package_folder/"
  fi
  install_command="pushd $package_folder; npm install; npm install --save $packages; popd"
  volume_params="$volume_params -v $HOME/.npmrc:/root/.npmrc"

elif [[ $runtime == python* ]]; then

  package_folder="python/lib/$runtime/site-packages/"
  if [[ -n "$dist_folder" ]]; then
    cp "$dist_folder" "$output_folder/requirements.txt"
  else
    touch "$output_folder/requirements.txt"
  fi

  install_command="pip install -r requirements.txt -t $package_folder $packages"
  volume_params="$volume_params -v $HOME/.config/pip:/root/.config/pip"

else

  usage
  exit 1

fi


echo "Building layer"
zip_command="zip -r layer.zip * && rm -rf $package_folder"

docker run --rm $volume_params -w "/layer" "$docker_image" /bin/bash -c "$install_command && $zip_command"


mv "$output_folder/layer.zip" "$dist_folder/$name.zip"

echo "All done. Enjoy your shiny new Lambda layer in $output_folder !"