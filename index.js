const core = require('@actions/core')
const github = require('@actions/github')

async function addLibraryLabels(files, owner, repo, pullNumber) {
  const labels = {
    compiler: ['@mesg/compiler'],
    api: ['@mesg/api'],
    application: ['@mesg/application'],
    compiler: ['@mesg/compiler'],
    service: ['@mesg/compiler']
  }
  files.data.forEach(async function (file) {
    const library = file.filename.split('/')[1];
    if (library in labels) {
      const labelToAdd = labels[library];
      await octokit.issues.addLabels({
        owner,
        repo,
        issue_number: pullNumber,
        labels: labelToAdd
      })
      core.setOutput('Label Added', labelToAdd[0])
    }
  })
}

// function checkChangeLog(files) {
//   const libraries = [ "compiler","api","application","compiler","service" ]

//   const changeLogFiles = files.data.filter(function(file){
//     return file.filename.split('/').splice(-1) == "CHANGELOG.md";
//   })
//   const libraryFiles = files.data.filter(function(file){
//     return libraries.includes(file.filename.split('/')[1]) && file.filename.split('/').reverse()[0] != "CHANGELOG.md";
//   })

//   libraryFiles.forEach(function(file){
//     const libraryName = file.filename;
//     const changelogforLibrary = changeLogFiles.filter(function(file){
//       return file.filename.split('/')[1] == libraryName;
//     })
//     if (!changelogforLibrary){
//       core.setFailed('No CHANGELOG.md found for ', libraryName);
//     }
//   })
//   core.setOutput("CHANGELOG.md found for all Libraries");
// }

function checkDescription(pullRequest) {
  const { body: pullBody } = pullRequest;
  if (!pullBody) {
    core.setFailed('No Description Found for Pull Request');
  }
  core.setOutput("Correct Description for Pull Request");
}

function addChangelogLabel(files, owner, repo, pullNumber) {
  files.data.forEach(function (file) {
    if (file.filename.split('/').splice(-1) == "CHANGELOG.md") {
      lines = file.patch.split('\n')

      index = []
      patchlines = []
      lines.forEach(function (line, i) {
        if (line[0] === "+") {
          index.push({ lines: line, index: i })
        }
        if (line[0] == "@" && line[1] == "@") {
          const lno = line.match(/@@\s-\d*/g)[0].split("-").slice("-1")
          patchlines.push({ lines: line, index: i, linenumber: lno })
        }
      })

      request.get(files.data[0].raw_url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          const file = body.split('\n')
          patchlines.forEach(async function (patch) {
            const fileline = parseInt(patch.linenumber[0]) + 2
            for (var i = fileline; i >= 0; i--) {
              if (file[i].match(/####\s.*$/)) {
                var labelToAdd;
                const category = file[i].match(/####\s.*$/)[0].split('####')[1].trim()
                console.log('category is', category);
                if (category === "Bug fixes") {
                  labelToAdd = ["breaking change"]
                } if ( category === "Improvements" ){
                  labelToAdd = ["enhancement"] 
                } else {
                  labelToAdd = ["bug"]
                }
                await octokit.issues.addLabels({
                  owner,
                  repo,
                  issue_number: pullNumber,
                  labels: labelToAdd
                })
                break;
              }
            }
          })
        }
      });
    }
  })
}

async function runAction() {
  try {
    const repoToken = core.getInput('token');
    const {
      payload: { pull_request: pullRequest, repository }
    } = github.context;

    if (!pullRequest) {
      core.error("No Pull Request");
      core.setOutput("comment-created", "false");
      return;
    }
    const { number: pullNumber } = pullRequest;
    const { full_name: repoFullName } = repository;
    const [owner, repo] = repoFullName.split("/");
    const octokit = new github.GitHub(repoToken);

    const pullFiles = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: pullNumber
    });

    await addLibraryLabels(pullFiles, owner, repo, pullNumber);
    checkDescription(pullRequest);
    //checkChangeLog(pullFiles);
    addChangelogLabel(pullFiles);

  } catch (error) {
    core.setFailed(error.message);
    console.log(error);
  }
}

runAction();
