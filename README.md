# AccountAble

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

### Installation

- This app requires Node.js and Yarn to build, test and run.

#### Clone repo

1. Clone source files

   ```
   git clone https://github.com/mithwick93/accountable.git
   cd accountable
   ```

2. Install dependencies

   ```
   yarn install
   ```

3. For https requests, provide your own SSL _.crt and _.key files in the infrastructure/ssl folder

4. Deploy docker
   ```
   docker-compose -p accountable-ui -f infrastructure/docker-compose.yml build --no-cache && docker-compose -p accountable-ui -f infrastructure/docker-compose.yml up --force-recreate -d && docker image prune -a -f
   ```

## Available Scripts

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `yarn test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more
information.

### `yarn build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.
