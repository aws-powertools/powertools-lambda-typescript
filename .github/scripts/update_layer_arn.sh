#!/bin/bash

# This script is run during the publish_layer.yml CI job,
# and it is responsible for replacing the layer ARN in our documentation.
# Our pipeline must generate the same layer number for all commercial regions + gov cloud
# If this doesn't happens, we have an error and we must fix it in the deployment.
#
# see .github/workflows/publish_layer.yml


# Get the new layer version from the first command-line argument
new_version=$1
if [ -z "$new_version" ]; then
    echo "Usage: $0 <new_version>"
    exit 1
fi

# Regions that are temporarily excluded from the deploy matrix and must NOT have
# their layer ARN version bumped in the docs/examples. Keep this list in sync
# with the commented-out regions in .github/workflows/reusable_deploy_layer_stack.yml.
paused_regions=(
    "me-south-1"
    "me-central-1"
)

# Build a sed address pattern that matches any line referencing a paused region,
# e.g. "/me-south-1|me-central-1/". The replacement is then only applied to
# lines that do NOT match this pattern (via the `!` negation address).
paused_pattern=$(IFS='|'; echo "${paused_regions[*]}")

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
    # The regex matches the layer name and replaces only the version number at the end.
    # Lines referencing a paused region are skipped via the `!` negation address
    # so their (frozen) layer version is preserved.
    sed -i -E "/${paused_pattern}/!s/AWSLambdaPowertoolsTypeScriptV2:[0-9]+/AWSLambdaPowertoolsTypeScriptV2:$new_version/g" "$file"
    if [ $? -eq 0 ]; then
        echo "Updated $file successfully"
        grep "arn:aws:lambda:" "$file"
    else
        echo "Error processing $file"
    fi
done
echo "Layer version update attempt completed."
