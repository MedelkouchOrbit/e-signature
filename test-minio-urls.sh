#!/bin/bash

# Test script to verify the file upload URL structure matches the backend response

echo "🧪 Testing MinIO URL structure for file upload..."
echo ""

# Test 1: Direct backend call (what we know works)
echo "1️⃣ Testing direct backend call (known working):"
curl -X POST 'http://94.249.71.89:9000/api/app/functions/fileupload' \
  -H 'Content-Type: application/json' \
  -H 'X-Parse-Application-Id: opensign' \
  -H 'X-Parse-Session-Token: r:20fec308b4ae76427abe4377e4941561' \
  -d '{"url":"http://94.249.71.89:9000/minio/opensign-bucket/direct-test.pdf"}' \
  --max-time 10
echo -e "\n"

# Test 2: Through Next.js proxy (should match)
echo "2️⃣ Testing through Next.js proxy:"
curl -X POST 'http://localhost:3001/api/proxy/opensign/functions/fileupload' \
  -H 'Content-Type: application/json' \
  -H 'X-Parse-Application-Id: opensign' \
  -H 'X-Parse-Session-Token: r:20fec308b4ae76427abe4377e4941561' \
  -d '{"url":"http://94.249.71.89:9000/minio/opensign-bucket/proxy-test.pdf"}' \
  --max-time 10
echo -e "\n"

echo "✅ Both tests should return similar response structures with URLs like:"
echo "http://94.249.71.89:9000/minio/opensign-bucket/filename.pdf?token=..."
echo ""
echo "🔧 Updated environment variables:"
echo "NEXT_PUBLIC_OPENSIGN_MINIO_BUCKET_URL=http://94.249.71.89:9000/minio/opensign-bucket"
echo "OPENSIGN_MINIO_BUCKET_URL=http://94.249.71.89:9000/minio/opensign-bucket"
