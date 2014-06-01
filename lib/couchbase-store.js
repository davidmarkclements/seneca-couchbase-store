/* Copyright (c) 2014 David Mark Clements, MIT License */
"use strict";

var _     = require('underscore')
var couchbase = require('couchbase')
var nid = require('nid')

var name = "couchbase-store"
var cache = {};
var db;

function getdoc(id, cb) {
  if (!cache[id]) {
    return db.get(id, function(err, result) {
      if (err) { return cb(err);}
      if (!result.value) { return cb(Error('No Document')); }
      cache[id] = result.value;
      cb(null, result.value);
    })
  }

  cb(null, cache[id])
}

module.exports = function(opts) {
  var seneca = this;
  var meta;
  var keyPrefix;
  var dbopts;
  var store;

  if (opts.connection) {
    db = opts.connection;
  } else {
    opts.host = opts.host || opts.server || '127.0.0.1'
    opts.port = opts.port || 8091;
    opts.password = opts.password || opts.pass
    opts.name = opts.name || opts.bucket || 'default'

    if (opts.host.indexOf(':')) {
      opts.host = opts.host.split(':');
      opts.port = opts.host[1] || opts.port;
      opts.host = opts.host[0];
    }
    opts.host = [opts.host, opts.port].join(':');

    dbopts = seneca.util.deepextend({
      host: opts.host,
      bucket: opts.name,
      password: opts.password
    }, opts.options);

    if (!dbopts.password) { delete dbopts.password; }

    db = new couchbase.Connection(dbopts);
  }

  opts.keyPrefix = ('keyPrefix' in opts) ? (opts.keyPrefix || '') : 'seneca-';
  keyPrefix = opts.keyPrefix;

  store = {
    name: name,

    close: function(args, cb) {
      if (db) {
        db.shutdown()
      }
      
      cb();
    },

    save: function(args, cb) {
      var ent = args.ent


      ent.id = ent.id || ent.id$ || args.name + '-' + nid();
      ent.id = keyPrefix + ent.id;

      if (ent.id in cache) { delete cache[ent.id]; }

      db.set(ent.id, ent, function (err, result) {
        if (!result || !result.cas) { cb(Error('Failed to save')); }
        cb(err, ent)
      });

    },


    load: function(args, cb) {
      getdoc(args.q.id, function(err, doc) {
        cb(err, args.qent.make$(doc));
      });

    },


    list: function(args, cb) {
      var qent = args.qent
      var q    = args.q

      if (q.id && !q.id$) { q.id$ = q.id; }

      var opts = Object.keys(q)
        .filter(function (key) {
          return /\$$/.test(key);
        })
        .reduce(function (o, key) {
          o[key.substr(0, key.length - 1)] = q[key]
          delete q[key];
          return o;
        }, {startkey: keyPrefix});

      if (opts.id) { 
        opts.key = opts.id;
        delete opts.id;
      }


      opts.stale = 'stale' in opts ? opts.stale : false;

      db.view('seneca', 'list').query(opts, function(err, list) {

        if (err) { cb(err); return; }

          var qKeys = Object.keys(q);

          list = list.map(function(doc) { 
            return doc.value;
          })

          if (qKeys.length) {
            list = list.filter(function(doc) {

              return qKeys.every(function (key) {
                return doc[key] === q[key];
              })
            })
          }
          
          list = list.map(function(doc) { 
            return seneca.make$(doc); 
          })
 

          cb(null, list);

      });

    },

  
    remove: function(args, cb) {
      var qent = args.qent
      var q    = args.q

      var load  = _.isUndefined(q.load$) ? true : q.load$ // default true

      q.id = q.id || q.id$;
      delete q.id$;

      if (q.id) {
        db.remove(q.id, function(err, res) {
          cb(err, res)
        })
      } else {
        delete q.id;
      }

      if (q.all$) {
        q = {};
      }

      qent.list$(q, function (err, list) {
        if (err) { cb(err); return; }
        if (!list.length) { cb(null, {}); return; }
        db.removeMulti(list.map(function(doc) {return doc.id}), {}, function (err, res) {
          cb(err, res);
        })
        
      });
             
    },

    native: function(args, done) {
      
      if (!db) { done(Error('Not connected')); }
      done(null, db);

    }
  }


  meta = seneca.store.init(seneca, opts, store)


  seneca.add({init: store.name, tag: meta.tag}, function (args, done) {

    db.setDesignDoc('seneca', {
      views: {
        list: {
          map: function (doc, meta) {
            emit(meta.id, doc);
          }.toString()
        }
      }
    }, function (err) {
      done(err);
    })

  }); 


  return {name: store.name, tag: meta.tag}
}












