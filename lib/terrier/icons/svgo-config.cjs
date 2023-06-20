module.exports = {
    plugins: [
        {
            name: 'preset-default',
            params: {
                overrides: {
                    removeViewBox: false, // we needed this for embedding glyps in site maps, not sure if we need it here
                },
            },
        },
    ],
};