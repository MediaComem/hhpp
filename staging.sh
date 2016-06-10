#!/usr/bin/env bash
jekyll build

echo "Bucket: $AWS_BUCKET"
echo "Region: $AWS_REGION"

s3cmd -v --region "${AWS_REGION}" --no-preserve --no-mime-magic --guess-mime-type sync _site/ "s3://${AWS_BUCKET}"
