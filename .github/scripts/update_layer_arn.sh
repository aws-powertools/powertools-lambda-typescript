#!/bin/bash

# This script is run during the publish_layer.yml CI job,
# and it is responsible for replacing the layer ARN in our documentation.
# Our pipeline must generate the same layer number for all commercial regions + gov cloud
# If this doesn't happens, we have an error and we must fix it in the deployment.
#
# see .github/workflows/publish_layer.yml


# Get the new layer arn from the first command-line argument
new_layer_arn=$1
if [ -z "$new_layer_arn" ]; then
    echo "Usage: $0 <new_layer_arn>"
    exit 1
fi
new_version=$(echo $new_layer_arn | sed 's/.*://')

# Find all files with specified extensions in ./docs and ./examples directories
# -type f: only find files (not directories)
# \( ... \): group conditions
# -o: logical OR
# -print0: use null character as separator (handles filenames with spaces)
find ./docs ./examples -type f \( -name "*.md" -o -name "*.ts" -o -name "*.yaml" -o -name "*.txt" -o -name "*.tf" -o -name "*.yml" \) -print0 | while IFS= read -r -d '' file; do
    echo "Processing file: $file"

    # Use sed to replace the version number in the Lambda layer ARN
    # -i: edit files in-place without creating a backup
    # -E: use extended regular expressions
    # IF TESTING IN MAC, replace `-i` with `-i ''`
    # The regex matches the layer name and replaces only the version number at the end
    sed -i -E "s/AWSLambdaPowertoolsTypeScriptV2:[0-9]+/AWSLambdaPowertoolsTypeScriptV2:$new_version/g" "$file"
    if [ $? -eq 0 ]; then
        echo "Updated $file successfully"
        grep "arn:aws:lambda:" "$file"
    else
        echo "Error processing $file"
    fi
done
echo "Layer version update attempt completed."
