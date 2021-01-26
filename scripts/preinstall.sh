if ! lerna -v  &> /dev/null
then
    echo "Lerna could not be found"
    echo "Please install Lerna globally with npm i -g lerna before continuing"
    exit -1
fi
exit 0