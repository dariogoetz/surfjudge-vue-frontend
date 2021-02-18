# Installation
Use `npm` to install with `npm install`

# Run the test setup
The dev setup assumes a (surfjudge actix) backend running at `https://localhost:8081/public`. This can be changed in the file `build/webpack.config.dev.js`. The dev server then serves the frontend at `https://localhost:8080`. 
1. Start the dev server with `npm run dev`

# Compile a production setup
The prod setup assumes a (surfjudge actix) backend running at `/public`. The resulting documents are stored in the `dist` directory (`index.html`, css-files, js-files and assets).
1. Start the compilation with `npm run prod`