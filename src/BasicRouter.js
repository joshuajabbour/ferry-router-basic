'use strict';

import BasicRouter from 'router';
import finalHandler from 'finalhandler';
import http from 'http';

import {Router} from 'ferry';

class BasicRouterAdapter extends Router {

  constructor(config = {}) {
    super(config);
    this.name = 'Basic Router';
    this.app = new BasicRouter();
  }

  route(action) {

    let collection = this.ferry.storage.getModel(req.resourceType);

    // @todo Remove Waterline dependency.
    switch (action) {

      case 'index':
        return (req, res)=> {
          collection.find().exec(function(err, models) {
            if(err) return res.json(JSON.stringify({ err: err }), 500);

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify(models));
          });
        };
        break;

      case 'view':
        return (req, res)=> {
          collection.findOne({ id: req.params.id }, function(err, model) {
            if(err) return res.end(JSON.stringify({ err: err }), 500);

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify(model));
          });
        };
        break;

      case 'create':
        return (req, res)=> {
          collection.create(req.body, function(err, model) {
            if(err) return res.end(JSON.stringify({ err: err }), 500);

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify(model));
          });
        };
        break;

      case 'update':
        return (req, res)=> {
          // Don't pass ID to update
          delete req.body.id;

          collection.update({ id: req.params.id }, req.body, function(err, model) {
            if(err) return res.end(JSON.stringify({ err: err }), 500);
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify(model));
          });
        };
        break;

      case 'delete':
        return (req, res)=> {
          collection.destroy({ id: req.params.id }, function(err) {
            if(err) return res.end(JSON.stringify({ err: err }), 500);

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end('{"status": "ok"}');
          });
        };
        break;

      default:
        // Look for overriden handler actions
        break;

    }

  }

  initialize(basePath, routes, callback) {

    let self = this;
    let basicRouter = new BasicRouter();

    // @todo Rework routes definition.
    for (let resourceType in routes) {

      let resourceRouter = new BasicRouter();
      let basePath = routes[resourceType].basePath;

      let configurator = function configureRoute() {
        return (req, res, next) => {
          req.resourceType = resourceType;
          return next();
        };
      };

      for (let action in routes[resourceType].actions) {

        let method = routes[resourceType].actions[action].method;
        let route = routes[resourceType].actions[action].route;

        resourceRouter[method](route, configurator(), function (req, res, next) {
          self.route(action)(req, res, next);
        });

      }

      basicRouter.use(basePath, resourceRouter);

    };

    this.app.use(basePath, basicRouter);

  }

  start(port = 3000, callback) {

    let self = this;

    http.createServer(function(req, res) {
      self.app(req, res, finalHandler(req, res))
    }).listen(port, callback);

  }

}

export default BasicRouterAdapter;
