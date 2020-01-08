const core = require('@actions/core')
const github = require('@actions/github')
const request = require('request');

async function runAction() {
  try {
  // `who-to-greet` input defined in action metadata file
  const repoToken = core.getInput('token');
  //const repoToken = 'c49509e3f03ffe86dfdfab2c81b295fba0b65e2a';
  console.log(`Token is  ${repoToken}!`);
  //const {
      //payload: { pull_request: pullRequest, repository }
    //} = github.context;

  //if (!pullRequest) {
    //core.error("No Pull Request");
    //core.setOutput("comment-created", "false");
    //return;
  //}

  const owner = 'Man-Jain'
  const repo = 'Polling-App'

  const octokit = new github.GitHub(repoToken);
  const list = await octokit.pulls.list({
    owner,
    repo
  });

  const number = list.data[0].number
  const url = list.data[0].url;

  fileApi = url + '/files';

  request('https://reqres.in/api/users?page=2', function (error, response, body) {
    console.error('error:', error); // Print the error if one occurred
    console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
    console.log('body:', body); // Print the HTML for the Google homepage.
    core.setOutput(body)
  });
} catch (error) {
  core.setFailed(error.message);
  console.log(error);
}
}

runAction();
