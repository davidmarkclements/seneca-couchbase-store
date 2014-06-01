"use strict";


var assert = require('assert')


var seneca = require('seneca')
var async = require('async')


var shared = require('seneca-store-test')

var si = seneca()
si.use(require('..'),{
  //using the mocking tool, comment below out and uncomment
  //host and port to test against live server
  connection: new (require('couchbase').Mock).Connection,
  //test against an actual couch server:
  //NOTE: recommend tests happen on an empty bucket
  // host:'127.0.0.1',
  // port:8091,
  // name: 'default',
  keyPrefix: '',
})

si.__testcount = 0
var testcount = 0


describe('couchbase', function(){
  it('basic', function(done){
    testcount++
    shared.basictest(si,done)
  })


  it('close', function(done){
    shared.closetest(si,testcount,done)
  })
})



