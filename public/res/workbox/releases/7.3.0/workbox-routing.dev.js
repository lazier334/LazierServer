this.workbox = this.workbox || {};
this.workbox.routing = (function (exports, assert_js, logger_js, WorkboxError_js, getFriendlyURL_js) {
    'use strict';

    // @ts-ignore
    try {
      self['workbox:routing:7.3.0'] && _();
    } catch (e) {}

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * The default HTTP method, 'GET', used when there's no specific method
     * configured for a route.
     *
     * @type {string}
     *
     * @private
     */
    const defaultMethod = 'GET';
    /**
     * The list of valid HTTP methods associated with requests that could be routed.
     *
     * @type {Array<string>}
     *
     * @private
     */
    const validMethods = ['DELETE', 'GET', 'HEAD', 'PATCH', 'POST', 'PUT'];

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * @param {function()|Object} handler Either a function, or an object with a
     * 'handle' method.
     * @return {Object} An object with a handle method.
     *
     * @private
     */
    const normalizeHandler = handler => {
      if (handler && typeof handler === 'object') {
        {
          assert_js.assert.hasMethod(handler, 'handle', {
            moduleName: 'workbox-routing',
            className: 'Route',
            funcName: 'constructor',
            paramName: 'handler'
          });
        }
        return handler;
      } else {
        {
          assert_js.assert.isType(handler, 'function', {
            moduleName: 'workbox-routing',
            className: 'Route',
            funcName: 'constructor',
            paramName: 'handler'
          });
        }
        return {
          handle: handler
        };
      }
    };

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * A `Route` consists of a pair of callback functions, "match" and "handler".
     * The "match" callback determine if a route should be used to "handle" a
     * request by returning a non-falsy value if it can. The "handler" callback
     * is called when there is a match and should return a Promise that resolves
     * to a `Response`.
     *
     * @memberof workbox-routing
     */
    class Route {
      /**
       * Constructor for Route class.
       *
       * @param {workbox-routing~matchCallback} match
       * A callback function that determines whether the route matches a given
       * `fetch` event by returning a non-falsy value.
       * @param {workbox-routing~handlerCallback} handler A callback
       * function that returns a Promise resolving to a Response.
       * @param {string} [method='GET'] The HTTP method to match the Route
       * against.
       */
      constructor(match, handler, method = defaultMethod) {
        {
          assert_js.assert.isType(match, 'function', {
            moduleName: 'workbox-routing',
            className: 'Route',
            funcName: 'constructor',
            paramName: 'match'
          });
          if (method) {
            assert_js.assert.isOneOf(method, validMethods, {
              paramName: 'method'
            });
          }
        }
        // These values are referenced directly by Router so cannot be
        // altered by minificaton.
        this.handler = normalizeHandler(handler);
        this.match = match;
        this.method = method;
      }
      /**
       *
       * @param {workbox-routing-handlerCallback} handler A callback
       * function that returns a Promise resolving to a Response
       */
      setCatchHandler(handler) {
        this.catchHandler = normalizeHandler(handler);
      }
    }

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * NavigationRoute makes it easy to create a
     * {@link workbox-routing.Route} that matches for browser
     * [navigation requests]{@link https://developers.google.com/web/fundamentals/primers/service-workers/high-performance-loading#first_what_are_navigation_requests}.
     *
     * It will only match incoming Requests whose
     * {@link https://fetch.spec.whatwg.org/#concept-request-mode|mode}
     * is set to `navigate`.
     *
     * You can optionally only apply this route to a subset of navigation requests
     * by using one or both of the `denylist` and `allowlist` parameters.
     *
     * @memberof workbox-routing
     * @extends workbox-routing.Route
     */
    class NavigationRoute extends Route {
      /**
       * If both `denylist` and `allowlist` are provided, the `denylist` will
       * take precedence and the request will not match this route.
       *
       * The regular expressions in `allowlist` and `denylist`
       * are matched against the concatenated
       * [`pathname`]{@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLHyperlinkElementUtils/pathname}
       * and [`search`]{@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLHyperlinkElementUtils/search}
       * portions of the requested URL.
       *
       * *Note*: These RegExps may be evaluated against every destination URL during
       * a navigation. Avoid using
       * [complex RegExps](https://github.com/GoogleChrome/workbox/issues/3077),
       * or else your users may see delays when navigating your site.
       *
       * @param {workbox-routing~handlerCallback} handler A callback
       * function that returns a Promise resulting in a Response.
       * @param {Object} options
       * @param {Array<RegExp>} [options.denylist] If any of these patterns match,
       * the route will not handle the request (even if a allowlist RegExp matches).
       * @param {Array<RegExp>} [options.allowlist=[/./]] If any of these patterns
       * match the URL's pathname and search parameter, the route will handle the
       * request (assuming the denylist doesn't match).
       */
      constructor(handler, {
        allowlist = [/./],
        denylist = []
      } = {}) {
        {
          assert_js.assert.isArrayOfClass(allowlist, RegExp, {
            moduleName: 'workbox-routing',
            className: 'NavigationRoute',
            funcName: 'constructor',
            paramName: 'options.allowlist'
          });
          assert_js.assert.isArrayOfClass(denylist, RegExp, {
            moduleName: 'workbox-routing',
            className: 'NavigationRoute',
            funcName: 'constructor',
            paramName: 'options.denylist'
          });
        }
        super(options => this._match(options), handler);
        this._allowlist = allowlist;
        this._denylist = denylist;
      }
      /**
       * Routes match handler.
       *
       * @param {Object} options
       * @param {URL} options.url
       * @param {Request} options.request
       * @return {boolean}
       *
       * @private
       */
      _match({
        url,
        request
      }) {
        if (request && request.mode !== 'navigate') {
          return false;
        }
        const pathnameAndSearch = url.pathname + url.search;
        for (const regExp of this._denylist) {
          if (regExp.test(pathnameAndSearch)) {
            {
              logger_js.logger.log(`The navigation route ${pathnameAndSearch} is not ` + `being used, since the URL matches this denylist pattern: ` + `${regExp.toString()}`);
            }
            return false;
          }
        }
        if (this._allowlist.some(regExp => regExp.test(pathnameAndSearch))) {
          {
            logger_js.logger.debug(`The navigation route ${pathnameAndSearch} ` + `is being used.`);
          }
          return true;
        }
        {
          logger_js.logger.log(`The navigation route ${pathnameAndSearch} is not ` + `being used, since the URL being navigated to doesn't ` + `match the allowlist.`);
        }
        return false;
      }
    }

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * RegExpRoute makes it easy to create a regular expression based
     * {@link workbox-routing.Route}.
     *
     * For same-origin requests the RegExp only needs to match part of the URL. For
     * requests against third-party servers, you must define a RegExp that matches
     * the start of the URL.
     *
     * @memberof workbox-routing
     * @extends workbox-routing.Route
     */
    class RegExpRoute extends Route {
      /**
       * If the regular expression contains
       * [capture groups]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp#grouping-back-references},
       * the captured values will be passed to the
       * {@link workbox-routing~handlerCallback} `params`
       * argument.
       *
       * @param {RegExp} regExp The regular expression to match against URLs.
       * @param {workbox-routing~handlerCallback} handler A callback
       * function that returns a Promise resulting in a Response.
       * @param {string} [method='GET'] The HTTP method to match the Route
       * against.
       */
      constructor(regExp, handler, method) {
        {
          assert_js.assert.isInstance(regExp, RegExp, {
            moduleName: 'workbox-routing',
            className: 'RegExpRoute',
            funcName: 'constructor',
            paramName: 'pattern'
          });
        }
        const match = ({
          url
        }) => {
          const result = regExp.exec(url.href);
          // Return immediately if there's no match.
          if (!result) {
            return;
          }
          // Require that the match start at the first character in the URL string
          // if it's a cross-origin request.
          // See https://github.com/GoogleChrome/workbox/issues/281 for the context
          // behind this behavior.
          if (url.origin !== location.origin && result.index !== 0) {
            {
              logger_js.logger.debug(`The regular expression '${regExp.toString()}' only partially matched ` + `against the cross-origin URL '${url.toString()}'. RegExpRoute's will only ` + `handle cross-origin requests if they match the entire URL.`);
            }
            return;
          }
          // If the route matches, but there aren't any capture groups defined, then
          // this will return [], which is truthy and therefore sufficient to
          // indicate a match.
          // If there are capture groups, then it will return their values.
          return result.slice(1);
        };
        super(match, handler, method);
      }
    }

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * The Router can be used to process a `FetchEvent` using one or more
     * {@link workbox-routing.Route}, responding with a `Response` if
     * a matching route exists.
     *
     * If no route matches a given a request, the Router will use a "default"
     * handler if one is defined.
     *
     * Should the matching Route throw an error, the Router will use a "catch"
     * handler if one is defined to gracefully deal with issues and respond with a
     * Request.
     *
     * If a request matches multiple routes, the **earliest** registered route will
     * be used to respond to the request.
     *
     * @memberof workbox-routing
     */
    class Router {
      /**
       * Initializes a new Router.
       */
      constructor() {
        this._routes = new Map();
        this._defaultHandlerMap = new Map();
      }
      /**
       * @return {Map<string, Array<workbox-routing.Route>>} routes A `Map` of HTTP
       * method name ('GET', etc.) to an array of all the corresponding `Route`
       * instances that are registered.
       */
      get routes() {
        return this._routes;
      }
      /**
       * Adds a fetch event listener to respond to events when a route matches
       * the event's request.
       */
      addFetchListener() {
        // See https://github.com/Microsoft/TypeScript/issues/28357#issuecomment-436484705
        self.addEventListener('fetch', event => {
          const {
            request
          } = event;
          const responsePromise = this.handleRequest({
            request,
            event
          });
          if (responsePromise) {
            event.respondWith(responsePromise);
          }
        });
      }
      /**
       * Adds a message event listener for URLs to cache from the window.
       * This is useful to cache resources loaded on the page prior to when the
       * service worker started controlling it.
       *
       * The format of the message data sent from the window should be as follows.
       * Where the `urlsToCache` array may consist of URL strings or an array of
       * URL string + `requestInit` object (the same as you'd pass to `fetch()`).
       *
       * ```
       * {
       *   type: 'CACHE_URLS',
       *   payload: {
       *     urlsToCache: [
       *       './script1.js',
       *       './script2.js',
       *       ['./script3.js', {mode: 'no-cors'}],
       *     ],
       *   },
       * }
       * ```
       */
      addCacheListener() {
        // See https://github.com/Microsoft/TypeScript/issues/28357#issuecomment-436484705
        self.addEventListener('message', event => {
          // event.data is type 'any'
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (event.data && event.data.type === 'CACHE_URLS') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const {
              payload
            } = event.data;
            {
              logger_js.logger.debug(`Caching URLs from the window`, payload.urlsToCache);
            }
            const requestPromises = Promise.all(payload.urlsToCache.map(entry => {
              if (typeof entry === 'string') {
                entry = [entry];
              }
              const request = new Request(...entry);
              return this.handleRequest({
                request,
                event
              });
              // TODO(philipwalton): TypeScript errors without this typecast for
              // some reason (probably a bug). The real type here should work but
              // doesn't: `Array<Promise<Response> | undefined>`.
            })); // TypeScript
            event.waitUntil(requestPromises);
            // If a MessageChannel was used, reply to the message on success.
            if (event.ports && event.ports[0]) {
              void requestPromises.then(() => event.ports[0].postMessage(true));
            }
          }
        });
      }
      /**
       * Apply the routing rules to a FetchEvent object to get a Response from an
       * appropriate Route's handler.
       *
       * @param {Object} options
       * @param {Request} options.request The request to handle.
       * @param {ExtendableEvent} options.event The event that triggered the
       *     request.
       * @return {Promise<Response>|undefined} A promise is returned if a
       *     registered route can handle the request. If there is no matching
       *     route and there's no `defaultHandler`, `undefined` is returned.
       */
      handleRequest({
        request,
        event
      }) {
        {
          assert_js.assert.isInstance(request, Request, {
            moduleName: 'workbox-routing',
            className: 'Router',
            funcName: 'handleRequest',
            paramName: 'options.request'
          });
        }
        const url = new URL(request.url, location.href);
        if (!url.protocol.startsWith('http')) {
          {
            logger_js.logger.debug(`Workbox Router only supports URLs that start with 'http'.`);
          }
          return;
        }
        const sameOrigin = url.origin === location.origin;
        const {
          params,
          route
        } = this.findMatchingRoute({
          event,
          request,
          sameOrigin,
          url
        });
        let handler = route && route.handler;
        const debugMessages = [];
        {
          if (handler) {
            debugMessages.push([`Found a route to handle this request:`, route]);
            if (params) {
              debugMessages.push([`Passing the following params to the route's handler:`, params]);
            }
          }
        }
        // If we don't have a handler because there was no matching route, then
        // fall back to defaultHandler if that's defined.
        const method = request.method;
        if (!handler && this._defaultHandlerMap.has(method)) {
          {
            debugMessages.push(`Failed to find a matching route. Falling ` + `back to the default handler for ${method}.`);
          }
          handler = this._defaultHandlerMap.get(method);
        }
        if (!handler) {
          {
            // No handler so Workbox will do nothing. If logs is set of debug
            // i.e. verbose, we should print out this information.
            logger_js.logger.debug(`No route found for: ${getFriendlyURL_js.getFriendlyURL(url)}`);
          }
          return;
        }
        {
          // We have a handler, meaning Workbox is going to handle the route.
          // print the routing details to the console.
          logger_js.logger.groupCollapsed(`Router is responding to: ${getFriendlyURL_js.getFriendlyURL(url)}`);
          debugMessages.forEach(msg => {
            if (Array.isArray(msg)) {
              logger_js.logger.log(...msg);
            } else {
              logger_js.logger.log(msg);
            }
          });
          logger_js.logger.groupEnd();
        }
        // Wrap in try and catch in case the handle method throws a synchronous
        // error. It should still callback to the catch handler.
        let responsePromise;
        try {
          responsePromise = handler.handle({
            url,
            request,
            event,
            params
          });
        } catch (err) {
          responsePromise = Promise.reject(err);
        }
        // Get route's catch handler, if it exists
        const catchHandler = route && route.catchHandler;
        if (responsePromise instanceof Promise && (this._catchHandler || catchHandler)) {
          responsePromise = responsePromise.catch(async err => {
            // If there's a route catch handler, process that first
            if (catchHandler) {
              {
                // Still include URL here as it will be async from the console group
                // and may not make sense without the URL
                logger_js.logger.groupCollapsed(`Error thrown when responding to: ` + ` ${getFriendlyURL_js.getFriendlyURL(url)}. Falling back to route's Catch Handler.`);
                logger_js.logger.error(`Error thrown by:`, route);
                logger_js.logger.error(err);
                logger_js.logger.groupEnd();
              }
              try {
                return await catchHandler.handle({
                  url,
                  request,
                  event,
                  params
                });
              } catch (catchErr) {
                if (catchErr instanceof Error) {
                  err = catchErr;
                }
              }
            }
            if (this._catchHandler) {
              {
                // Still include URL here as it will be async from the console group
                // and may not make sense without the URL
                logger_js.logger.groupCollapsed(`Error thrown when responding to: ` + ` ${getFriendlyURL_js.getFriendlyURL(url)}. Falling back to global Catch Handler.`);
                logger_js.logger.error(`Error thrown by:`, route);
                logger_js.logger.error(err);
                logger_js.logger.groupEnd();
              }
              return this._catchHandler.handle({
                url,
                request,
                event
              });
            }
            throw err;
          });
        }
        return responsePromise;
      }
      /**
       * Checks a request and URL (and optionally an event) against the list of
       * registered routes, and if there's a match, returns the corresponding
       * route along with any params generated by the match.
       *
       * @param {Object} options
       * @param {URL} options.url
       * @param {boolean} options.sameOrigin The result of comparing `url.origin`
       *     against the current origin.
       * @param {Request} options.request The request to match.
       * @param {Event} options.event The corresponding event.
       * @return {Object} An object with `route` and `params` properties.
       *     They are populated if a matching route was found or `undefined`
       *     otherwise.
       */
      findMatchingRoute({
        url,
        sameOrigin,
        request,
        event
      }) {
        const routes = this._routes.get(request.method) || [];
        for (const route of routes) {
          let params;
          // route.match returns type any, not possible to change right now.
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const matchResult = route.match({
            url,
            sameOrigin,
            request,
            event
          });
          if (matchResult) {
            {
              // Warn developers that using an async matchCallback is almost always
              // not the right thing to do.
              if (matchResult instanceof Promise) {
                logger_js.logger.warn(`While routing ${getFriendlyURL_js.getFriendlyURL(url)}, an async ` + `matchCallback function was used. Please convert the ` + `following route to use a synchronous matchCallback function:`, route);
              }
            }
            // See https://github.com/GoogleChrome/workbox/issues/2079
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            params = matchResult;
            if (Array.isArray(params) && params.length === 0) {
              // Instead of passing an empty array in as params, use undefined.
              params = undefined;
            } else if (matchResult.constructor === Object &&
            // eslint-disable-line
            Object.keys(matchResult).length === 0) {
              // Instead of passing an empty object in as params, use undefined.
              params = undefined;
            } else if (typeof matchResult === 'boolean') {
              // For the boolean value true (rather than just something truth-y),
              // don't set params.
              // See https://github.com/GoogleChrome/workbox/pull/2134#issuecomment-513924353
              params = undefined;
            }
            // Return early if have a match.
            return {
              route,
              params
            };
          }
        }
        // If no match was found above, return and empty object.
        return {};
      }
      /**
       * Define a default `handler` that's called when no routes explicitly
       * match the incoming request.
       *
       * Each HTTP method ('GET', 'POST', etc.) gets its own default handler.
       *
       * Without a default handler, unmatched requests will go against the
       * network as if there were no service worker present.
       *
       * @param {workbox-routing~handlerCallback} handler A callback
       * function that returns a Promise resulting in a Response.
       * @param {string} [method='GET'] The HTTP method to associate with this
       * default handler. Each method has its own default.
       */
      setDefaultHandler(handler, method = defaultMethod) {
        this._defaultHandlerMap.set(method, normalizeHandler(handler));
      }
      /**
       * If a Route throws an error while handling a request, this `handler`
       * will be called and given a chance to provide a response.
       *
       * @param {workbox-routing~handlerCallback} handler A callback
       * function that returns a Promise resulting in a Response.
       */
      setCatchHandler(handler) {
        this._catchHandler = normalizeHandler(handler);
      }
      /**
       * Registers a route with the router.
       *
       * @param {workbox-routing.Route} route The route to register.
       */
      registerRoute(route) {
        {
          assert_js.assert.isType(route, 'object', {
            moduleName: 'workbox-routing',
            className: 'Router',
            funcName: 'registerRoute',
            paramName: 'route'
          });
          assert_js.assert.hasMethod(route, 'match', {
            moduleName: 'workbox-routing',
            className: 'Router',
            funcName: 'registerRoute',
            paramName: 'route'
          });
          assert_js.assert.isType(route.handler, 'object', {
            moduleName: 'workbox-routing',
            className: 'Router',
            funcName: 'registerRoute',
            paramName: 'route'
          });
          assert_js.assert.hasMethod(route.handler, 'handle', {
            moduleName: 'workbox-routing',
            className: 'Router',
            funcName: 'registerRoute',
            paramName: 'route.handler'
          });
          assert_js.assert.isType(route.method, 'string', {
            moduleName: 'workbox-routing',
            className: 'Router',
            funcName: 'registerRoute',
            paramName: 'route.method'
          });
        }
        if (!this._routes.has(route.method)) {
          this._routes.set(route.method, []);
        }
        // Give precedence to all of the earlier routes by adding this additional
        // route to the end of the array.
        this._routes.get(route.method).push(route);
      }
      /**
       * Unregisters a route with the router.
       *
       * @param {workbox-routing.Route} route The route to unregister.
       */
      unregisterRoute(route) {
        if (!this._routes.has(route.method)) {
          throw new WorkboxError_js.WorkboxError('unregister-route-but-not-found-with-method', {
            method: route.method
          });
        }
        const routeIndex = this._routes.get(route.method).indexOf(route);
        if (routeIndex > -1) {
          this._routes.get(route.method).splice(routeIndex, 1);
        } else {
          throw new WorkboxError_js.WorkboxError('unregister-route-route-not-registered');
        }
      }
    }

    /*
      Copyright 2019 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    let defaultRouter;
    /**
     * Creates a new, singleton Router instance if one does not exist. If one
     * does already exist, that instance is returned.
     *
     * @private
     * @return {Router}
     */
    const getOrCreateDefaultRouter = () => {
      if (!defaultRouter) {
        defaultRouter = new Router();
        // The helpers that use the default Router assume these listeners exist.
        defaultRouter.addFetchListener();
        defaultRouter.addCacheListener();
      }
      return defaultRouter;
    };

    /*
      Copyright 2019 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * Easily register a RegExp, string, or function with a caching
     * strategy to a singleton Router instance.
     *
     * This method will generate a Route for you if needed and
     * call {@link workbox-routing.Router#registerRoute}.
     *
     * @param {RegExp|string|workbox-routing.Route~matchCallback|workbox-routing.Route} capture
     * If the capture param is a `Route`, all other arguments will be ignored.
     * @param {workbox-routing~handlerCallback} [handler] A callback
     * function that returns a Promise resulting in a Response. This parameter
     * is required if `capture` is not a `Route` object.
     * @param {string} [method='GET'] The HTTP method to match the Route
     * against.
     * @return {workbox-routing.Route} The generated `Route`.
     *
     * @memberof workbox-routing
     */
    function registerRoute(capture, handler, method) {
      let route;
      if (typeof capture === 'string') {
        const captureUrl = new URL(capture, location.href);
        {
          if (!(capture.startsWith('/') || capture.startsWith('http'))) {
            throw new WorkboxError_js.WorkboxError('invalid-string', {
              moduleName: 'workbox-routing',
              funcName: 'registerRoute',
              paramName: 'capture'
            });
          }
          // We want to check if Express-style wildcards are in the pathname only.
          // TODO: Remove this log message in v4.
          const valueToCheck = capture.startsWith('http') ? captureUrl.pathname : capture;
          // See https://github.com/pillarjs/path-to-regexp#parameters
          const wildcards = '[*:?+]';
          if (new RegExp(`${wildcards}`).exec(valueToCheck)) {
            logger_js.logger.debug(`The '$capture' parameter contains an Express-style wildcard ` + `character (${wildcards}). Strings are now always interpreted as ` + `exact matches; use a RegExp for partial or wildcard matches.`);
          }
        }
        const matchCallback = ({
          url
        }) => {
          {
            if (url.pathname === captureUrl.pathname && url.origin !== captureUrl.origin) {
              logger_js.logger.debug(`${capture} only partially matches the cross-origin URL ` + `${url.toString()}. This route will only handle cross-origin requests ` + `if they match the entire URL.`);
            }
          }
          return url.href === captureUrl.href;
        };
        // If `capture` is a string then `handler` and `method` must be present.
        route = new Route(matchCallback, handler, method);
      } else if (capture instanceof RegExp) {
        // If `capture` is a `RegExp` then `handler` and `method` must be present.
        route = new RegExpRoute(capture, handler, method);
      } else if (typeof capture === 'function') {
        // If `capture` is a function then `handler` and `method` must be present.
        route = new Route(capture, handler, method);
      } else if (capture instanceof Route) {
        route = capture;
      } else {
        throw new WorkboxError_js.WorkboxError('unsupported-route-type', {
          moduleName: 'workbox-routing',
          funcName: 'registerRoute',
          paramName: 'capture'
        });
      }
      const defaultRouter = getOrCreateDefaultRouter();
      defaultRouter.registerRoute(route);
      return route;
    }

    /*
      Copyright 2019 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * If a Route throws an error while handling a request, this `handler`
     * will be called and given a chance to provide a response.
     *
     * @param {workbox-routing~handlerCallback} handler A callback
     * function that returns a Promise resulting in a Response.
     *
     * @memberof workbox-routing
     */
    function setCatchHandler(handler) {
      const defaultRouter = getOrCreateDefaultRouter();
      defaultRouter.setCatchHandler(handler);
    }

    /*
      Copyright 2019 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * Define a default `handler` that's called when no routes explicitly
     * match the incoming request.
     *
     * Without a default handler, unmatched requests will go against the
     * network as if there were no service worker present.
     *
     * @param {workbox-routing~handlerCallback} handler A callback
     * function that returns a Promise resulting in a Response.
     *
     * @memberof workbox-routing
     */
    function setDefaultHandler(handler) {
      const defaultRouter = getOrCreateDefaultRouter();
      defaultRouter.setDefaultHandler(handler);
    }

    exports.NavigationRoute = NavigationRoute;
    exports.RegExpRoute = RegExpRoute;
    exports.Route = Route;
    exports.Router = Router;
    exports.registerRoute = registerRoute;
    exports.setCatchHandler = setCatchHandler;
    exports.setDefaultHandler = setDefaultHandler;

    return exports;

})({}, workbox.core._private, workbox.core._private, workbox.core._private, workbox.core._private);
//# sourceMappingURL=workbox-routing.dev.js.map
