#!/usr/bin/env bash
jekyll build
s3cmd -v --region "${AWS_REGION}" --no-preserve --no-mime-magic --guess-mime-type sync _site/ "s3://${AWS_BUCKET}"
