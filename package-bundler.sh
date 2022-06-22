#!/usr/bin/env bash
set -e


usage() {
  echo "Uber package Builder"
  echo "------------------------"
  echo "./package-bundler.sh NAME LOCAL_NPM_PACKAGE_LOCATION"
  echo ""
}


if [[ "$#" -lt 2 ]]; then
  usage
  exit 1
fi

name=$(basename ${1})
dist_folder="${2}"

echo "Will bundle $(ls ${dist_folder}) into ${dist_folder}/${name}.tgz"

output_folder="$(mktemp -d)"

docker_image="public.ecr.aws/sam/build-nodejs14.x:latest"
volume_params="-v $output_folder:/bundle"

package_folder="nodejs/"
mkdir -p "$output_folder/$package_folder"

cp -r "${2}" "$output_folder/$package_folder/"
 
install_command="pushd $package_folder; npm install --save ./*.tgz; popd"
volume_params="$volume_params -v $HOME/.npmrc:/root/.npmrc"

zip_command="zip -r bundle.zip * && rm -rf $package_folder"

docker run --rm $volume_params -w "/bundle" "$docker_image" /bin/bash -c "$install_command && $zip_command"

mv "$output_folder/bundle.zip" "$dist_folder/$name.zip"

rm -rf $output_folder

echo "All done"
