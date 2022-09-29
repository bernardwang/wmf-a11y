
const fs = require( 'fs' );
const fetch = require( 'node-fetch' );
const path = require( 'path' );
const pa11y = require( 'pa11y' );
const { program } = require( 'commander' );

const htmlReporter = require( path.resolve( __dirname, './reporter/reporter.js' ) );
const reportTemplate = fs.readFileSync( path.resolve( __dirname, './reporter/report.mustache' ), 'utf8' );

/**
 *  Delete and recreate the report directory
 */
function resetReportDir( config ) {
	// Delete and create report directory
	if ( fs.existsSync( config.reportDir ) ) {
		fs.rmSync( config.reportDir, { recursive: true } );
	}
	fs.mkdirSync( config.reportDir, { recursive: true } );
}

/**
 *  Get array of promises that run accessibility tests using pa11y
 *
 * @param {Object[]} tests
 * @param {Object} config
 * @return {Promise<any>[]}
 */
function getTestPromises( tests, config ) {
	return tests.map( ( test ) => {
		const { url, name, ...testOptions } = test;
		const options = { ...config.defaults, ...testOptions };
		// Automatically enable screen capture for every test;
		options.screenCapture = `${config.reportDir}/${name}.png`;

		return pa11y( url, options ).then( ( testResult ) => {
			testResult.name = name;
			return testResult;
		} );
	} );
}

/**
 *  Log test results to Graphite
 *
 * @param {string} namespace
 * @param {string} name
 * @param {number} count
 * @return {Promise<any>}
 */
function sendMetrics( namespace, name, count ) {
	const metricPrefix = 'ci_a11y';
	const url = `${process.env.WMF_JENKINS_BEACON_URL}${metricPrefix}.${namespace}.${name}=${count}c`;
	return fetch( url );
}

/**
 *  Process test results, log the results to console, Graphite and an HTML report.
 *
 * @param {Object[]} testResult
 */
async function processTestResult( testResult, config, opts) {
	testResult.issues.forEach( ( issue ) => {
		// Reassign axe warnings as errors
		if (issue.type === 'warning' && issue.runner === 'axe') {
			issue.type = 'error';
		}
	} );

	const errorNum = testResult.issues.filter( ( issue ) => issue.type === 'error' ).length;
	const warningNum = testResult.issues.filter( ( issue ) => issue.type === 'warning' ).length;
	const noticeNum = testResult.issues.filter( ( issue ) => issue.type === 'notice' ).length;

	const name = testResult.name;

	// Log results summary to console
	if ( !opts.silent ) {
		console.log( `'${name}'- ${errorNum} errors, ${warningNum} warnings, ${noticeNum} notices` );
	}

	// Send data to Graphite
	// WMF_JENKINS_BEACON_URL is only defined in CI env
	if ( opts.logResults ) {
		await sendMetrics( config.namespace, testResult.name, errorNum )
			.then( ( response ) => {
				if ( response.ok ) {
					console.log( `'${name}' results logged successfully` );
				} else {
					console.error( `Failed to log '${name}' results` );
				}
			} );
	}

	// Save in html report
	const html = await htmlReporter.results( testResult, reportTemplate );
	fs.promises.writeFile( `${config.reportDir}/report-${name}.html`, html, 'utf8' );
	// Save in json report
	fs.promises.writeFile( `${config.reportDir}/report-${name}.json`, JSON.stringify( testResult, null, '  ' ), 'utf8' );
}

/**
 *  Run pa11y on tests specified by the config.
 *
 * @param {Object} opts
 */
async function runTests( opts ) {	
	if ( !process.env.MW_SERVER ||
		!process.env.MEDIAWIKI_USER ||
		!process.env.MEDIAWIKI_PASSWORD ) {
		throw new Error( 'Missing env variables' );
	}
	const config = require( path.resolve( process.cwd(), opts.config ) );
	if ( !config || !config.tests || !config.reportDir ) {
		throw new Error( 'Missing config variables' );
	}

	const tests = config.tests;
	const allValidTests = tests.filter( ( test ) => test.name ).length === tests.length;
	if ( !allValidTests ) {
		throw new Error( 'Config missing test name' );
	}

	const canLogResults = process.env.WMF_JENKINS_BEACON_URL && config.namespace;
	if ( opts.logResults && !canLogResults ) {
		throw new Error( 'Unable to log results, missing config or env variables' );
	}

	resetReportDir( config );
	const testPromises = getTestPromises( tests, config );
	const results = await Promise.all( testPromises );
	results.forEach( ( result ) => processTestResult( result, config, opts ) );
}

function init() {
	program
		.option('-c, --config <path>', 'path to config file to use', './a11y.config.js' )
		.option( '-s, --silent', 'avoids logging results summary to console', false )
		.option( '-l, --logResults', 'log a11y results to Graphite, should only be used with --env ci', false )
		.action( ( opts ) => {
			runTests( opts );
		} );

	program.parse();
}

module.exports = { init };
