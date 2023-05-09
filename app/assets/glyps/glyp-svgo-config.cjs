module.exports = {
    plugins: [
        {
            name: 'preset-default',
            params: {
                overrides: {
                    removeViewBox: false, // we rely on the viewbox when inserting them into other SVGs on the client
                },
            },
        },
    ],
};