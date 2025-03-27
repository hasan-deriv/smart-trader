module.exports = function (grunt) {
    return {
        options: {
            processors: [
                require('autoprefixer')(),
                require('postcss-url')({
                    url: 'rebase',
                    assetsPath: global.dist,
                    useHash: true
                }),
            ],
        },
        dist: {
            src: `${global.dist}/css/{app,common,static,reset}.css`,
        },
    };
};
