# wmf-a11y
wmf-a11y is an automated accessibility testing tool for Wikimedia skins. It runs accessibility tests on pages via the command line to help automate our testing process, and can be run within CI to generate [daily reports](https://integration.wikimedia.org/ci/view/selenium-daily/job/selenium-daily-beta-Vector) and track [accessibilty errors over time](https://grafana.wikimedia.org/d/q4OKvQCnk/a11y-tests?orgId=1).

It uses [pa11y-ci](https://github.com/pa11y/pa11y-ci) as the test runner and [axe-core](https://github.com/dequelabs/axe-core) as the accessibility testing engine.

🚨 wmf-a11y is currently an experimental proof of concept working towards becoming a more stable and useful solution. Only use it when you're feeling dangerous. 🚨

## Quick Start

### 1) Install `wmf-a11y` into the repo you want to test

```sh
npm install wmf-a11y --save-dev
```

### 2) Setup env variables

These need to be updated depending on where you are running wmf-ally, see [env variable](#env-variables) below for more details. 

A local setup with [MediaWiki-Docker](https://www.mediawiki.org/wiki/MediaWiki-Docker) will typically use the following env variables:
```sh
MW_SERVER=http://localhost:8080
MEDIAWIKI_USER=Admin
MEDIAWIKI_PASSWORD=dockerpass
```

While a setup in CI could look like this:
```sh
MW_SERVER=https://en.wikipedia.beta.wmflabs.org
MEDIAWIKI_USER=Selenium user
MEDIAWIKI_PASSWORD=********
WMF_JENKINS_BEACON_URL=https://meta.wikimedia.org/beacon/statsv/?
LOG_DIR=log/
```

### 3) Create a config file
The config file is based off of [pa11y-ci's config](https://github.com/pa11y/pa11y-ci#configuration). An example config file is provided at [example-a11y.config.js](https://github.com/bernardwang/wmf-a11y/blob/main/example-a11y.config.js). 

### 4) Run the tests!
Make sure to include the `config` option to pass in the location of the config file. Run `npx wmf-a11y --help` to see all options.
```sh
npx wmf-a11y --config 'a11y.config.js'
```

## Configuration
### Env variables
- `MW_SERVER` - the base url where tests are run against
- `MEDIAWIKI_USER` - username for logging in
- `MEDIAWIKI_PASSWORD` - password for logging in
- `WMF_JENKINS_BEACON_URL` - optional env used to report errors to statsv, used inside CI
- `LOG_DIR` - optional env to specify the directory where reports are generated, used inside CI
