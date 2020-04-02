var compressor = require('node-minify');
 
// Using Google Closure Compiler
compressor.minify({
  compressor: 'gcc',
  input: './assets/js/form.js',
  output: './assets/js/form.min.js',
  callback: function(err, min) {}
});

compressor.minify({
  compressor: 'yui',
  input: './assets/css/style-form.css',
  output: './assets/css/style-form.min.css',
  type: 'css',
  callback: function(err, min) {
    console.log('YUI CSS one file');
    console.log(err);
    //console.log(min);
  }
});
