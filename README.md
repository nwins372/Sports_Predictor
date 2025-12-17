# :basketball: CECS 491 - Sports Predictor :football:

- This web application aims to aggregate sports data in an easy to digest and customizable manner.
- Some features such as Search Local Sports, AI Translate, and Notifications require specific access or API keys, so functionality may be limited to some.
###  List of Use Cases & Progress ( :white_check_mark: = finished | :large_orange_diamond: = still in progress )
- Display Game Schedule :white_check_mark:
- Recommend Games :large_orange_diamond:
- Choose Sports :white_check_mark:
- Notifications :white_check_mark:
- Show Where to Watch :white_check_mark:
- Login+Account :white_check_mark:
- Save User Info :white_check_mark:
- Customize Team Colors :large_orange_diamond:
- Follow Players :white_check_mark:
- Champion Predict :white_check_mark:
- Trade Machine :white_check_mark:
- Trade+Injury Report :large_orange_diamond:
- Win Percent Calculate :white_check_mark:
- Redirect to Game Hosts :white_check_mark:
- Comments :large_orange_diamond:
- Customize Feed :white_check_mark:
- Statistics :white_check_mark:
- Mock Draft :white_check_mark:
- Search Local Sports :white_check_mark:
- AI Translate :large_orange_diamond:

### Cloning
------------------------------------------------------------------------------------------------
To download the repo, you can cd into a desired directory and then type the following command:

```
git clone https://github.com/nwins372/Sports_Predictor.git
```

For Devs: To push to repository connect it with your local instance using:
```
git remote set-url origin git@github.com:nwins372/Sports_Predictor.git
```

### Installing NodeJS, React, & Dependencies
------------------------------------------------------------------------------------------------

- Node.Js + NPM is required, you can find installation instructions from https://nodejs.org/en/download
- React installation instructions can be found here: https://www.freecodecamp.org/news/how-to-install-react-a-step-by-step-guide/
- Install dependencies by the command `npm install`
- After installing NPM and React,you can run the project from the root directory by running the command `npm start`

- To view the database, Supabase credentials and access to "Sports Predictor Fall 2025" is needed.

### Docker (optional)
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
------------------------------------------------------------------------------------------------
