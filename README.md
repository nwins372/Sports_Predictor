## CECS 491 - Sports Predictor

- This web application aims to aggregate sports data in an easy to digest and customizable manner.
------------------------------------------------------------------------------------------------
To download the repo, you can cd into a desired directory and then type the following command:

```
git clone https://github.com/nwins372/Sports_Predictor.git
```

For Devs: To push to repository connect it with your local instance using:
```
git remote set-url origin git@github.com:nwins372/Sports_Predictor.git
```

------------------------------------------------------------------------------------------------

- Node.Js + NPM is required, you can find installation instructions from https://nodejs.org/en/download
- React installation instructions can be found here: https://www.freecodecamp.org/news/how-to-install-react-a-step-by-step-guide/
- After installing NPM and React,you can run the project from the root directory by running the command:
```
npm start
```

To use the database, Supabase credentials and access to "Sports Predictor Fall 2025" is needed.
------------------------------------------------------------------------------------------------
- NEW: You can build and run the project via the Dockerfile.
- You need Docker installed
- Then run the following commands:
```
docker build -t sports_predictor .
docker run -d -p 3000:80 --name sports_predictor sports_predictor
```
The app can be accessed at ```localhost:3000```

:)
