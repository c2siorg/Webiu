// Karma configuration file.
// See link for more information:
// https://karma-runner.github.io/6.4/config/configuration-file.html

module.exports = function (config) {
    config.set({
        basePath: '',
        frameworks: ['jasmine', '@angular-devkit/build-angular'],
        plugins: [
            require('karma-jasmine'),
            require('karma-chrome-launcher'),
            require('karma-jasmine-html-reporter'),
            require('karma-coverage'),
            require('@angular-devkit/build-angular/plugins/karma'),
        ],
        client: {
            jasmine: {
                // You can add configuration options for Jasmine here.
                // The possible options are listed at https://jasmine.github.io/api/edge/Configuration.html
                // For example, you can disable the random execution with `random: false`
                // or set a specific seed with `seed: 4321`.
            },
            clearContext: false, // leave Jasmine Spec Runner output visible in browser
        },
        jasmineHtmlReporter: {
            suppressAll: true, // removes the duplicated traces
        },
        coverageReporter: {
            dir: require('path').join(__dirname, './coverage/webiu'),
            subdir: '.',
            reporters: [{ type: 'html' }, { type: 'text-summary' }],
        },
        reporters: ['progress', 'kjhtml'],
        browsers: ['Chrome'],

        // Custom launcher for CI environments (GitHub Actions, Docker, etc.)
        // Chrome requires --no-sandbox in containerised / restricted kernel environments.
        customLaunchers: {
            ChromeHeadlessNoSandbox: {
                base: 'ChromeHeadless',
                flags: [
                    '--no-sandbox',
                    '--disable-gpu',
                    '--disable-dev-shm-usage',   // prevents /dev/shm exhaustion in containers
                ],
            },
        },

        restartOnFileChange: true,
    });
};
