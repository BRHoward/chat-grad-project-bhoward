module.exports = function (grunt) {
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-jscs");
    grunt.loadNpmTasks("grunt-mocha-test");
    grunt.loadNpmTasks("grunt-mocha-istanbul");
    grunt.loadNpmTasks("grunt-webpack");

    var files = ["Gruntfile.js", "server.js", "server/**/*.js", "test/**/*.js", "public/**/*.js"];
    var artifactsLocation = "build_artifacts";

    var webpack = require("webpack");

    grunt.initConfig({
        jshint: {
            all: files,
            options: {
                jshintrc: true,
                ignores: ["./public/js/bundle.js"]
            }
        },
        webpack: {
            ChatApp: {
                entry: "./public/js/ChatApp",
                output: {
                    path: "./public/js/",
                    filename: "bundle.js",
                },
                module: {
                    loaders: [{
                        test: /\.css$/,
                        loader: "style-loader!css-loader"
                    }]
                },
                // plugins: [
                //     new webpack.optimize.UglifyJsPlugin({
                //         minimize: true
                //     })
                // ]
            }
        },
        jscs: {
            all: files,
            options: {
                excludeFiles: ["./public/js/bundle.js"]
            }
        },
        mochaTest: {
            test: {
                src: ["test/**/*.js"]
            }
        },
        "mocha_istanbul": {
            test: {
                src: ["test/**/*.js"]
            },
            options: {
                coverageFolder: artifactsLocation,
                reportFormats: ["none"],
                print: "none"
            }
        },
        "istanbul_report": {
            test: {

            },
            options: {
                coverageFolder: artifactsLocation
            }
        },
        "istanbul_check_coverage": {
            test: {

            },
            options: {
                coverageFolder: artifactsLocation,
                check: true
            }
        }
    });

    grunt.registerMultiTask("istanbul_report", "Solo task for generating a report over multiple files.", function () {
        var done = this.async();
        var cmd = process.execPath;
        var istanbulPath = require.resolve("istanbul/lib/cli");
        var options = this.options({
            coverageFolder: "coverage"
        });
        grunt.util.spawn({
            cmd: cmd,
            args: [istanbulPath, "report", "--dir=" + options.coverageFolder]
        }, function (err) {
            if (err) {
                return done(err);
            }
            done();
        });
    });
    grunt.registerTask("bundle", ["webpack:ChatApp"]);
    grunt.registerTask("check", ["jshint", "jscs"]);
    grunt.registerTask("test", ["check", "bundle", "mochaTest", "mocha_istanbul", "istanbul_report",
        "istanbul_check_coverage"
    ]);
    grunt.registerTask("default", "test");
};
