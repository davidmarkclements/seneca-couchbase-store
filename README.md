# seneca-couchbase-store

### Seneca node.js data-storage plugin for Couchbase

This module is a plugin for the Seneca framework. It provides a
storage engine that uses Couchbase to persist data. This module is for production use.
It also provides an example of a document-oriented storage plugin code-base.

The Seneca framework provides an 
[ActiveRecord-style data storage API](http://senecajs.org/data-entities.html). 
Each supported database has a plugin, such as this one, that
provides the underlying Seneca plugin actions required for data
persistence.


### Support

If you're using this module, feel free to contact me on twitter if you
have any questions! :) [@davidmarkclem](http://twitter.com/davidmarkclem)

Current Version: 0.0.2

Tested on: Node 0.10.26, Seneca 0.5.17



### Quick example

```JavaScript
var seneca = require('seneca')()
seneca.use('couchbase-store', {
  name: 'bucketname',
  host: '127.0.0.1',
  port: 8091
})

seneca.ready(function(){
  var apple = seneca.make$('fruit')
  apple.name  = 'Pink Lady'
  apple.price = 0.99
  apple.save$(function(err,apple){
    console.log( "apple.id = "+apple.id  )
  })
})
```

## Install

```sh
npm install seneca
npm install seneca-couchbase-store
```


## Usage

You don't use this module directly. It provides an underlying data storage engine for the Seneca entity API:

```JavaScript
var entity = seneca.make$('typename')
entity.someproperty = "something"
entity.anotherproperty = 100

entity.save$( function(err,entity){ ... } )
entity.load$( {id: ...}, function(err,entity){ ... } )
entity.list$( {property: ...}, function(err,entity){ ... } )
entity.remove$( {id: ...}, function(err,entity){ ... } )
```

### Options

  The object passed as the second parameter of seneca.use can
  contain the following

  * _name_ - name of the bucket to connect to
  * _bucket_ - alias for name (default: 'default')
  * _host_ - address of couchbase server (default: '127.0.0.1')
  * _server_ - alias for host
  * _port_ - the port on which the server resides (default: 8091). 
    If desired the port can instead be provided with host, e.g. 127.0.0.1:8091
  * _connection_ - pass a node-couchbase Connection object directly to 
    the store, if set name/bucket host/server and port will be ignored
  * _keyPrefix_ - it's recommend with couchbase to use as few buckets
    as possible, no more than 5. In this case, couchbase-store can use namespacing
    to differentiate keys in a bucket that belong to the store plugin
    If unset, the default keyPrefix will be 'seneca-'. To have no
    keyPrefix use keyPrefix: ''


### Queries

The standard Seneca query format is supported:

   * `entity.list$({field1:value1, field2:value2, ...})` implies pseudo-query `field1==value1 AND field2==value2, ...`
   * `entity.list$({f1:v1,...},{sort$: 'descending'})` sorts by descending id, can also be ascending (default)
   * `entity.list$({f1:v1,...},{limit$:10})` means only return 10 results (default)
   * `entity.list$({f1:v1,...},{skip$:5})` means skip the first 5   
   * you can use sort$, limit$ and skip$ together



### Native Driver

As with all seneca stores, you can access the native driver, in this case, 
the returned instance of instantiating the `node-couchbase` Connection instance. 

The native driver is accesssed using `entity.native$(function(err, db){...})`.


## Test

Tests do not require a couchbase server to be running, 
it uses `node-couchbase` modules Mock tool. 

To run tests (within seneca-couchbase-store folder):

```bash
npm install
npm test
```

To test against a live server edit test/couchbase.test.js,
comment out the "connection" property, and uncomment host, port and name
properties, filling it appropriate details as relevant. 

