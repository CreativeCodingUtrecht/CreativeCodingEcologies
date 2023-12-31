const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
    mode: 'development',
    entry: './src/app.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    devtool: 'inline-source-map',
    devServer: {
        contentBase: "./dist",
        hot: true
    },
    module: {
        rules: [{
            test: /\.scss$/,
            exclude: /(node_modules)/,
            use: [{
                loader: "style-loader"
            }, {
                loader: "css-loader"
            }, {
                loader: "sass-loader",
                options: {
                    sourceMap: true
                }
            }]
        },
        {
            test: /\.(png|gif)$/,
            use: 'file-loader'
        }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            inject: true,
            template: "template.html",
            filename:'index.html'
        }),
    ],
    watch: true
};
