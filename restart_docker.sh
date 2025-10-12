var=$(sudo docker ps -a -q -f "name=sports_predictor")
if [ -n "$var" ]; then
    echo "Container exists. Stopping and removing..."
    sudo docker stop $var
    sudo docker rm $var
else
    echo "No existing container found."
fi

sudo docker build -t sports_predictor .
sudo docker run -d -p 3000:80 --name sports_predictor sports_predictor