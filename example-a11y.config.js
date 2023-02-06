const path = require( 'path' );

const testData = {
	baseUrl: process.env.MW_SERVER, 
	pageUrl: '/wiki/Polar_bear', // Default article page to test on
	loginUser: process.env.MEDIAWIKI_USER,
	loginPassword: process.env.MEDIAWIKI_PASSWORD
};

module.exports = {
	// LOG_DIR set in CI, used to make report files available in Jenkins
	reportDir: process.env.LOG_DIR || path.join( process.cwd(), 'a11y/' ),
	namespace: 'SkinName', // 
	defaults: { 
		viewport: {
			width: 1200,
			height: 1080
		},
		runners: [
			'axe',
			'htmlcs'
		],
		includeWarnings: true,
		includeNotices: true,
		hideElements: '#bodyContent, #siteNotice',
		chromeLaunchConfig: {
			headless: false,
			args: [
				'--no-sandbox',
				'--disable-setuid-sandbox'
			]
		}
	},
	tests: [
		{
			name: 'default',
			url: testData.baseUrl + testData.pageUrl,
			actions: []
		},
	]
};
