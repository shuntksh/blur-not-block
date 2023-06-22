#!/bin/bash

# checking if the folder exists
if [ ! -d "$1" ]; then
  echo "Directory $1 does not exist."
  exit 1
fi

# assigning a name for the archive
if [ -z "$2" ]; then
  archive_name="archive.zip"
else
  archive_name="$2.zip"
fi

# creating the archive
zip -r $archive_name $1

echo "The folder has been compressed to $archive_name"
