/**
 * Created by pratikdesai on 7/5/15.
 */
var http = require('http');
var qs = require('querystring');

var postData = qs.stringify({
    'author_pk' : 1,
    'book_pk':2
});

var options = {
    host: 'example.com',
    port: 9080,
    path: '/books/author/add/',
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.length
    }
};


var req = http.request(options, function(res) {
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
        console.log('BODY: ' + chunk);
    });
});

req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
});

// write data to request body
console.log(postData);
req.write(postData);
req.end();