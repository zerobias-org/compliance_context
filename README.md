# Compliance Context mono-repo
Monorepo of compliance context artifacts.

# Starting Development
##  Fork Repository

Under the [zerobias-org/compliance_context](https://github.com/zerobias-org/compliance_context) repo, click the Fork button toward top right of the screen
* Under owner choose your personal account for development, and leave the repository name as compliance context
* Make sure the `Copy the main branch only` is unchecked, this is important
* Click the `Create Fork` button

Once you have forked the repository change, your working environment to the `dev` branch.
* Any PRs made against the `zerobias-org/compliance_context` repo should be agaisnt it's dev branch or they will be rejected.

## NPM Packages authentication
**ZB_TOKEN**

Set `ZB_TOKEN` in your environment variables to authenticate with npm registry.
`ZB_TOKEN` needs to be an API key from [ZeroBias](https://app.zerobias.com).

## Getting Started

**Please run `npm install` in the root directory as soon as the repository is cloned, this will setup husky hooks**

## Creating a new compliance context

### Create new compliance context folder

Create a folder for your new compliance context with the following naming convention:
{segmentTypeAbbreviation}\_{nameFirstLetters}\_{possibleIncrement} (ex. c_bad)
* segmentTypeAbbreviation: first letter of the segmentType being created - d (domain), c (category), t (tool), s (service), fg (feature_group)
* nameFirstLetters: first letter of each word in the compliance context name made lowercase: ex. bad (Business Application Development)
* possibleIncrement: If there is a duplicate folder with {segmentTypeAbbreviation}_{nameFirstLetters}, add increment number until unique

### Run create new compliance context script

Run the folowing script `sh scripts/createNewComplianceContext.sh <folder_path>`
* folder_path: the path to the folder you created above from the root of the repository, ex. package/zerobias/c_bad
* This will copy needed templates and files into your new directory with some automatic string replacements
* You will need to edit the index.yml file anywhere you see a {variable}
  * {name}: Replace this with the name of your compliance context
  * {description}: Replace this with the description of your compliance context
  * {externalId}: Replace this with a external view name of the compliance context, can just use name
  * Add aliases if you would like any aliases set for this compliance context
* You will need to edit the package.json file
  * {description}: Replace this with the description of your compliance context
  * If you added offerings in the offerings.yml, you will need to add these as dependencies (ex. "@zerobias-org/product-zerobias-zerobias": "latest")

### Install and Shrinkwrap

Run the following commands to update npm for your new compliance context
* `cd <folder_path>` cd into your new compliance context directory
* `npm install` run npm install
* `npm shrinkwrap` run npm shrinkwrap

### Validate new compliance contexts

In the root of the respository run the follow command to validate all edit or added compliance contexts
* `npm run validate` If any errors, edit what is needed and rerun

**Now you can commit your changes following the instructions below, then open a PR against the main repository branch**

## Commit conventions and Version management
### Versioning: [lerna](https://github.com/lerna/lerna)

#### Compliance Context versioning
Compliance Context versions are managed by `lerna`. 
* Add it to [lerna.json](./lerna.json) to enable lerna for a compliance context.
* The starting version of a compliance context should be `0.0.0`
* There should be no version bumps inside of pull requests.

Lerna will automatically version, generate changelogs and publish compliance contexts in `lerna.json` via our github actions workflows.

This works well for any starting version higher or equals to `1.0.0`. For versions that haven't had a major bump yet an additional step is required.

In order for a compliance_context/package to bump to `1.0.0` it must be explicitely told to do so via `premajor` and `conventional graduation`.
These are two lerna terms and re leveraged by our workflows described below.

The former will happen inside of a pull request and generate a release candidate.
The latter will graduate and publish it.

#### Lerna dry run

What lerna does can be simulated using `dry-run`.
* `npm run lerna:dry-run` will generate changelog as well as do local version bumps.
* You may also run `dry-run` on pull requests, for piece of mind, by assigning the p.r. to `nfci`

You may also run the following command to generate a local changelog without using `lerna version`:
```
npx lerna exec --concurrency 1 --no-sort --stream -- \
  conventional-changelog \
    --preset angular \
    --infile CHANGELOG.md \
    --same-file \
    --release-count 0 \
    --lerna-package \$LERNA_PACKAGE_NAME \
    --commit-path \$PWD
```

### Github Actions workflows.

Each compliance context should have one workflow that runs tests on Pull Request.
There are 3 other workflows involved in the publishing process.
* `pull_request.yml`
* `lerna_publish.yml`
* `lerna_post_publish.yml`

#### Pull Request
The `pull_request` workflow triggers when a pull request is `assigned` or `labeled` or `closed`.
* assigned to nfci: runs `lerna dry run`
* labeled as `premajor`: runs `lerna premajor`
* closed by merging:  triggers the `lerna-publish` workflow

#### Lerna Publish
This workflow will run lerna publish against all registered compliance contexts.
Compliance contexts that have changed are first bootstraped then tagged and published.
Implicitely this calls the following 2 package.json `scripts`
* `version`: before lerna commits the version change. There, we make sure `api.yml` is also included in said commit.
* `postpublish`: after lerna has published the npm. This triggers the final workflow. `post-publish`

#### Lerna Post Publish
This workflow is used to finalize compliance context publication. At the moment it:
<!-- * Publishes docs to [docs_cms]( TODO add new docs location here ). -->
* Sends a slack notification.

### Git Hooks: [Husky](https://typicode.github.io/husky/#/)

`Husky` has been configured on this repository to perform the following checks before a change is allowed to be commited.

#### Check commit Message Format against conventional commits

Any commit that does not comply with conventional commits will be rejected.

#### Build compliance context affected by change

The affected compliance context(s) will be built via `npm run build` and `unit` tested.
Additionally, `eslint` will be executed to catch any linting errors before they make it to a pull request.

The commit will be rejected if any of this fails.

*Example: good commit*
```
touch badcommit.txt
git add badcommit.txt
git commit -m 'this is a bad commit'
⧗   input: this is a bad commit
✖   subject may not be empty [subject-empty]
✖   type may not be empty [type-empty]

✖   found 2 problems, 0 warnings
ⓘ   Get help: https://github.com/conventional-changelog/commitlint/#what-is-commitlint
```

*Example: Good commit*
```
touch goodcommit.txt
git add goodcommit.txt 
git commit -m 'feat: some cool new feature'
[MOD-599-readme 4e70f32b] feat: some cool new feature
 1 file changed, 0 insertions(+), 0 deletions(-)
 create mode 100644 goodcommit.txt
```

### Commit Message Format
Every commit should follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0-beta.4/).
This section summarizes some of its guidelines.

Each commit message consists of a **header**, a **body** and a **footer**.  The header has a special
format that includes a **type**, a **scope** and a **subject**:

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

The **header** is mandatory and the **scope** of the header is optional.
Either the **body** or **footer** must begin with `BREAKING CHANGE` if the commit is a breaking change.

Example — `feat(lang): add polish language`

#### Type
Must be one of the following:

* **feat**: A new feature.
* **fix**: A bug fix.
* **docs**: Documentation only changes.
* **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc).
* **refactor**: A code change that neither fixes a bug nor adds a feature.
* **perf**: A code change that improves performance.
* **test**: Adding missing tests.
* **chore**: Changes to the build process or auxiliary tools and libraries such as documentation generation.

#### Scope
The scope is optional and could be anything specifying place of the commit change. For example `release`, `api`, `mappers`, etc...

#### Body
The body may include the motivation for the change and contrast this with previous behavior.
It should contain any information about **Breaking Changes** if not provided in the **footer**.

#### Footer
The footer should contain any information about **Breaking Changes** if not provided in the **body**.

**Breaking Changes** should start with the word `BREAKING CHANGE:` with a space or two newlines.
A description of the change should always follow.
