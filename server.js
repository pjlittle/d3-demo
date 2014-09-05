/**
 * @file Contains the node.js server
 * webserver + api server for development
 * @copyright 2014 Base2 Solutions.  All rights reserved.
 */

var application_root = __dirname,
    express = require('express'), // web server framework
    path = require('path'),       // utilities for dealing with file paths
    favicon = require('serve-favicon'),
    logger = require('morgan'),
    methodOverride = require('method-override'),
    bodyParser = require('body-parser'),
    errorHandler = require('errorhandler');

// Create server
var app = express();

// configure server
// setup logger
app.use(logger('dev'));

// checks request.body for HTTP method overrides
app.use(methodOverride());

//parses request body and populates request.body
app.use(bodyParser.json());

// perform route lookup based on url and HTTP method
// app.use(app.router);

// where to serve static content
app.use(express.static(path.join( application_root, 'public')));

// show all errors in development
//app.use( express.errorHandler({ dumpExceptions: true, showStack: true }));
app.use(errorHandler({ dumpExceptions: true, showStack: true }));

app.set('port', 3300);

// start the server
var server = app.listen(app.get('port'), function() {
    console.log('Express server listening on port %d in %s mode', app.get('port'), app.settings.env);
});
