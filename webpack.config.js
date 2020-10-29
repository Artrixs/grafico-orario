const path = require('path');

module.exports = {
    entry: './src/index.js',
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'public'),
    },
    //devtool: "eval-source-map",
    devServer: {
        contentBase: path.join(__dirname, 'public'),
        port: 8080
    }
}