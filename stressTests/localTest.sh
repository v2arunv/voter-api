#!/bin/bash
for i in {0..110}
  do
    curl -w "@localTestFormat" -H "Content-Type: application/x-www-form-urlencoded" -X POST -d "postId=$RANDOM&userId=$RANDOM&score=$(( RANDOM % 2 == 0 ? 1 : -1 ))"  -s "http://localhost:3000/vote" >> results.csv
  done
curl "http://localhost:3000/vote-status" 
