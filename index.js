const core = require('@actions/core')
const github = require('@actions/github')
var request = require('request');

async function addLibraryLabels(files, owner, repo, pullNumber, octokit) {
  const labels = {
    compiler: ['@mesg/compiler'],
    api: ['@mesg/api'],
    application: ['@mesg/application'],
    cli: ['@mesg/cli'],
    service: ['@mesg/service']
  }
  files.data.forEach(async function (file) {
    const library = file.filename.split('/')[1];

    if (library in labels) {
      const labelToAdd = labels[library];

      try {
        await octokit.issues.addLabels({
          owner,
          repo,
          issue_number: pullNumber,
          labels: labelToAdd
        })
      } catch (e) {
        console.log(e);
        core.setFailed(e.message)
      }
    }
  })
}

function addChangelogLabel(files, owner, repo, pullNumber, octokit) {
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

                if (category === "Bug fixes") {
                  labelToAdd = ["breaking change"]
                } if (category === "Improvements") {
                  labelToAdd = ["enhancement"]
                } else {
                  labelToAdd = ["bug"]
                }

                try {
                  await octokit.issues.addLabels({
                    owner,
                    repo,
                    issue_number: pullNumber,
                    labels: labelToAdd
                  })
                } catch (e) {
                  console.log(e);
                  core.setFailed(e.message)
                }
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
      
    await addLibraryLabels(pullFiles, owner, repo, pullNumber, octokit);
    await addChangelogLabel(pullFiles, owner, repo, pullNumber, octokit);

  } catch (error) {
    core.setFailed(error.message);
    console.log(error);
  }
}

runAction();
