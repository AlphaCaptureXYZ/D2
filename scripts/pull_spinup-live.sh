
echo "Copying Dockerfile"
echo "Getting current id"
CURRENT_ID=$(sudo docker ps -a -q --filter ancestor=dii-site-live)
echo "the current id is $CURRENT_ID"
echo "Building the DII Site image"
sudo docker build . -t dii-site-live --file Dockerfile
echo "Stopping and removing the previous image"
sudo docker stop $CURRENT_ID
sudo docker rm $CURRENT_ID
echo "Running the new image"
sleep 1s
sudo docker run -d -p 4200:4200 dii-site-live
echo "Listing the running containers"
sudo docker ps
echo "Cleaning up (prune)"
sudo docker system prune --force