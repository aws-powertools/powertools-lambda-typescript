"use strict";
var H = Object.getOwnPropertySymbols;
var J = Object.prototype.hasOwnProperty, Y = Object.prototype.propertyIsEnumerable;
var W = (e, t) => {
  var n = {};
  for (var s in e)
    J.call(e, s) && t.indexOf(s) < 0 && (n[s] = e[s]);
  if (e != null && H)
    for (var s of H(e))
      t.indexOf(s) < 0 && Y.call(e, s) && (n[s] = e[s]);
  return n;
};
var assert_1 = require("assert"), require$$0 = require("os"), fs = require("fs"), require$$1 = require("path"), http = require("http"), https = require("https");
require("net");
var tls = require("tls"), events = require("events"), util_1 = require("util"), Stream = require("stream"), Url = require("url"), zlib = require("zlib"), string_decoder_1 = require("string_decoder"), require$$0$1 = require("child_process"), timers_1 = require("timers");
function _interopDefaultLegacy(e) {
  return e && typeof e == "object" && "default" in e ? e : { default: e };
}
var assert_1__default = /* @__PURE__ */ _interopDefaultLegacy(assert_1), require$$0__default = /* @__PURE__ */ _interopDefaultLegacy(require$$0), fs__default = /* @__PURE__ */ _interopDefaultLegacy(fs), require$$1__default = /* @__PURE__ */ _interopDefaultLegacy(require$$1), http__default = /* @__PURE__ */ _interopDefaultLegacy(http), https__default = /* @__PURE__ */ _interopDefaultLegacy(https), tls__default = /* @__PURE__ */ _interopDefaultLegacy(tls), events__default = /* @__PURE__ */ _interopDefaultLegacy(events), util_1__default = /* @__PURE__ */ _interopDefaultLegacy(util_1), Stream__default = /* @__PURE__ */ _interopDefaultLegacy(Stream), Url__default = /* @__PURE__ */ _interopDefaultLegacy(Url), zlib__default = /* @__PURE__ */ _interopDefaultLegacy(zlib), string_decoder_1__default = /* @__PURE__ */ _interopDefaultLegacy(string_decoder_1), require$$0__default$1 = /* @__PURE__ */ _interopDefaultLegacy(require$$0$1), timers_1__default = /* @__PURE__ */ _interopDefaultLegacy(timers_1), commonjsGlobal = typeof globalThis != "undefined" ? globalThis : typeof window != "undefined" ? window : typeof global != "undefined" ? global : typeof self != "undefined" ? self : {};
function getAugmentedNamespace(e) {
  if (e.__esModule)
    return e;
  var t = Object.defineProperty({}, "__esModule", { value: !0 });
  return Object.keys(e).forEach(function(n) {
    var s = Object.getOwnPropertyDescriptor(e, n);
    Object.defineProperty(t, n, s.get ? s : {
      enumerable: !0,
      get: function() {
        return e[n];
      }
    });
  }), t;
}
function createCommonjsModule(e) {
  var t = { exports: {} };
  return e(t, t.exports), t.exports;
}
var utils$2 = createCommonjsModule(function(e, t) {
  Object.defineProperty(t, "__esModule", { value: !0 }), t.toCommandValue = void 0;
  function n(s) {
    return s == null ? "" : typeof s == "string" || s instanceof String ? s : JSON.stringify(s);
  }
  t.toCommandValue = n;
}), command = createCommonjsModule(function(e, t) {
  var n = commonjsGlobal && commonjsGlobal.__createBinding || (Object.create ? function(_, E, P, G) {
    G === void 0 && (G = P), Object.defineProperty(_, G, { enumerable: !0, get: function() {
      return E[P];
    } });
  } : function(_, E, P, G) {
    G === void 0 && (G = P), _[G] = E[P];
  }), s = commonjsGlobal && commonjsGlobal.__setModuleDefault || (Object.create ? function(_, E) {
    Object.defineProperty(_, "default", { enumerable: !0, value: E });
  } : function(_, E) {
    _.default = E;
  }), o = commonjsGlobal && commonjsGlobal.__importStar || function(_) {
    if (_ && _.__esModule)
      return _;
    var E = {};
    if (_ != null)
      for (var P in _)
        P !== "default" && Object.hasOwnProperty.call(_, P) && n(E, _, P);
    return s(E, _), E;
  };
  Object.defineProperty(t, "__esModule", { value: !0 }), t.issue = t.issueCommand = void 0;
  const i = o(require$$0__default.default);
  function p(_, E, P) {
    const G = new h(_, E, P);
    process.stdout.write(G.toString() + i.EOL);
  }
  t.issueCommand = p;
  function a(_, E = "") {
    p(_, {}, E);
  }
  t.issue = a;
  const u = "::";
  class h {
    constructor(E, P, G) {
      E || (E = "missing.command"), this.command = E, this.properties = P, this.message = G;
    }
    toString() {
      let E = u + this.command;
      if (this.properties && Object.keys(this.properties).length > 0) {
        E += " ";
        let P = !0;
        for (const G in this.properties)
          if (this.properties.hasOwnProperty(G)) {
            const d = this.properties[G];
            d && (P ? P = !1 : E += ",", E += `${G}=${y(d)}`);
          }
      }
      return E += `${u}${b(this.message)}`, E;
    }
  }
  function b(_) {
    return utils$2.toCommandValue(_).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
  }
  function y(_) {
    return utils$2.toCommandValue(_).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A").replace(/:/g, "%3A").replace(/,/g, "%2C");
  }
}), fileCommand = createCommonjsModule(function(e, t) {
  var n = commonjsGlobal && commonjsGlobal.__createBinding || (Object.create ? function(u, h, b, y) {
    y === void 0 && (y = b), Object.defineProperty(u, y, { enumerable: !0, get: function() {
      return h[b];
    } });
  } : function(u, h, b, y) {
    y === void 0 && (y = b), u[y] = h[b];
  }), s = commonjsGlobal && commonjsGlobal.__setModuleDefault || (Object.create ? function(u, h) {
    Object.defineProperty(u, "default", { enumerable: !0, value: h });
  } : function(u, h) {
    u.default = h;
  }), o = commonjsGlobal && commonjsGlobal.__importStar || function(u) {
    if (u && u.__esModule)
      return u;
    var h = {};
    if (u != null)
      for (var b in u)
        b !== "default" && Object.hasOwnProperty.call(u, b) && n(h, u, b);
    return s(h, u), h;
  };
  Object.defineProperty(t, "__esModule", { value: !0 }), t.issueCommand = void 0;
  const i = o(fs__default.default), p = o(require$$0__default.default);
  function a(u, h) {
    const b = process.env[`GITHUB_${u}`];
    if (!b)
      throw new Error(`Unable to find environment variable for file command ${u}`);
    if (!i.existsSync(b))
      throw new Error(`Missing file at path: ${b}`);
    i.appendFileSync(b, `${utils$2.toCommandValue(h)}${p.EOL}`, {
      encoding: "utf8"
    });
  }
  t.issueCommand = a;
}), core = createCommonjsModule(function(e, t) {
  var n = commonjsGlobal && commonjsGlobal.__createBinding || (Object.create ? function(S, j, U, F) {
    F === void 0 && (F = U), Object.defineProperty(S, F, { enumerable: !0, get: function() {
      return j[U];
    } });
  } : function(S, j, U, F) {
    F === void 0 && (F = U), S[F] = j[U];
  }), s = commonjsGlobal && commonjsGlobal.__setModuleDefault || (Object.create ? function(S, j) {
    Object.defineProperty(S, "default", { enumerable: !0, value: j });
  } : function(S, j) {
    S.default = j;
  }), o = commonjsGlobal && commonjsGlobal.__importStar || function(S) {
    if (S && S.__esModule)
      return S;
    var j = {};
    if (S != null)
      for (var U in S)
        U !== "default" && Object.hasOwnProperty.call(S, U) && n(j, S, U);
    return s(j, S), j;
  }, i = commonjsGlobal && commonjsGlobal.__awaiter || function(S, j, U, F) {
    function I(B) {
      return B instanceof U ? B : new U(function(N) {
        N(B);
      });
    }
    return new (U || (U = Promise))(function(B, N) {
      function V(M) {
        try {
          q(F.next(M));
        } catch (z) {
          N(z);
        }
      }
      function K(M) {
        try {
          q(F.throw(M));
        } catch (z) {
          N(z);
        }
      }
      function q(M) {
        M.done ? B(M.value) : I(M.value).then(V, K);
      }
      q((F = F.apply(S, j || [])).next());
    });
  };
  Object.defineProperty(t, "__esModule", { value: !0 }), t.getState = t.saveState = t.group = t.endGroup = t.startGroup = t.info = t.warning = t.error = t.debug = t.isDebug = t.setFailed = t.setCommandEcho = t.setOutput = t.getBooleanInput = t.getMultilineInput = t.getInput = t.addPath = t.setSecret = t.exportVariable = t.ExitCode = void 0;
  const p = o(require$$0__default.default), a = o(require$$1__default.default);
  var u;
  (function(S) {
    S[S.Success = 0] = "Success", S[S.Failure = 1] = "Failure";
  })(u = t.ExitCode || (t.ExitCode = {}));
  function h(S, j) {
    const U = utils$2.toCommandValue(j);
    if (process.env[S] = U, process.env.GITHUB_ENV || "") {
      const I = "_GitHubActionsFileCommandDelimeter_", B = `${S}<<${I}${p.EOL}${U}${p.EOL}${I}`;
      fileCommand.issueCommand("ENV", B);
    } else
      command.issueCommand("set-env", { name: S }, U);
  }
  t.exportVariable = h;
  function b(S) {
    command.issueCommand("add-mask", {}, S);
  }
  t.setSecret = b;
  function y(S) {
    process.env.GITHUB_PATH || "" ? fileCommand.issueCommand("PATH", S) : command.issueCommand("add-path", {}, S), process.env.PATH = `${S}${a.delimiter}${process.env.PATH}`;
  }
  t.addPath = y;
  function _(S, j) {
    const U = process.env[`INPUT_${S.replace(/ /g, "_").toUpperCase()}`] || "";
    if (j && j.required && !U)
      throw new Error(`Input required and not supplied: ${S}`);
    return j && j.trimWhitespace === !1 ? U : U.trim();
  }
  t.getInput = _;
  function E(S, j) {
    return _(S, j).split(`
`).filter((F) => F !== "");
  }
  t.getMultilineInput = E;
  function P(S, j) {
    const U = ["true", "True", "TRUE"], F = ["false", "False", "FALSE"], I = _(S, j);
    if (U.includes(I))
      return !0;
    if (F.includes(I))
      return !1;
    throw new TypeError(`Input does not meet YAML 1.2 "Core Schema" specification: ${S}
Support boolean input list: \`true | True | TRUE | false | False | FALSE\``);
  }
  t.getBooleanInput = P;
  function G(S, j) {
    process.stdout.write(p.EOL), command.issueCommand("set-output", { name: S }, j);
  }
  t.setOutput = G;
  function d(S) {
    command.issue("echo", S ? "on" : "off");
  }
  t.setCommandEcho = d;
  function f(S) {
    process.exitCode = u.Failure, g(S);
  }
  t.setFailed = f;
  function w() {
    return process.env.RUNNER_DEBUG === "1";
  }
  t.isDebug = w;
  function m(S) {
    command.issueCommand("debug", {}, S);
  }
  t.debug = m;
  function g(S) {
    command.issue("error", S instanceof Error ? S.toString() : S);
  }
  t.error = g;
  function T(S) {
    command.issue("warning", S instanceof Error ? S.toString() : S);
  }
  t.warning = T;
  function v(S) {
    process.stdout.write(S + p.EOL);
  }
  t.info = v;
  function O(S) {
    command.issue("group", S);
  }
  t.startGroup = O;
  function $() {
    command.issue("endgroup");
  }
  t.endGroup = $;
  function A(S, j) {
    return i(this, void 0, void 0, function* () {
      O(S);
      let U;
      try {
        U = yield j();
      } finally {
        $();
      }
      return U;
    });
  }
  t.group = A;
  function k(S, j) {
    command.issueCommand("save-state", { name: S }, j);
  }
  t.saveState = k;
  function D(S) {
    return process.env[`STATE_${S}`] || "";
  }
  t.getState = D;
}), context = createCommonjsModule(function(e, t) {
  Object.defineProperty(t, "__esModule", { value: !0 }), t.Context = void 0;
  class n {
    constructor() {
      if (this.payload = {}, process.env.GITHUB_EVENT_PATH)
        if (fs__default.default.existsSync(process.env.GITHUB_EVENT_PATH))
          this.payload = JSON.parse(fs__default.default.readFileSync(process.env.GITHUB_EVENT_PATH, { encoding: "utf8" }));
        else {
          const o = process.env.GITHUB_EVENT_PATH;
          process.stdout.write(`GITHUB_EVENT_PATH ${o} does not exist${require$$0__default.default.EOL}`);
        }
      this.eventName = process.env.GITHUB_EVENT_NAME, this.sha = process.env.GITHUB_SHA, this.ref = process.env.GITHUB_REF, this.workflow = process.env.GITHUB_WORKFLOW, this.action = process.env.GITHUB_ACTION, this.actor = process.env.GITHUB_ACTOR, this.job = process.env.GITHUB_JOB, this.runNumber = parseInt(process.env.GITHUB_RUN_NUMBER, 10), this.runId = parseInt(process.env.GITHUB_RUN_ID, 10);
    }
    get issue() {
      const o = this.payload;
      return Object.assign(Object.assign({}, this.repo), { number: (o.issue || o.pull_request || o).number });
    }
    get repo() {
      if (process.env.GITHUB_REPOSITORY) {
        const [o, i] = process.env.GITHUB_REPOSITORY.split("/");
        return { owner: o, repo: i };
      }
      if (this.payload.repository)
        return {
          owner: this.payload.repository.owner.login,
          repo: this.payload.repository.name
        };
      throw new Error("context.repo requires a GITHUB_REPOSITORY environment variable like 'owner/repo'");
    }
  }
  t.Context = n;
});
function getProxyUrl(e) {
  let t = e.protocol === "https:", n;
  if (checkBypass(e))
    return n;
  let s;
  return t ? s = process.env.https_proxy || process.env.HTTPS_PROXY : s = process.env.http_proxy || process.env.HTTP_PROXY, s && (n = new URL(s)), n;
}
var getProxyUrl_1 = getProxyUrl;
function checkBypass(e) {
  if (!e.hostname)
    return !1;
  let t = process.env.no_proxy || process.env.NO_PROXY || "";
  if (!t)
    return !1;
  let n;
  e.port ? n = Number(e.port) : e.protocol === "http:" ? n = 80 : e.protocol === "https:" && (n = 443);
  let s = [e.hostname.toUpperCase()];
  typeof n == "number" && s.push(`${s[0]}:${n}`);
  for (let o of t.split(",").map((i) => i.trim().toUpperCase()).filter((i) => i))
    if (s.some((i) => i === o))
      return !0;
  return !1;
}
var checkBypass_1 = checkBypass, proxy = /* @__PURE__ */ Object.defineProperty({
  getProxyUrl: getProxyUrl_1,
  checkBypass: checkBypass_1
}, "__esModule", { value: !0 }), httpOverHttp_1 = httpOverHttp, httpsOverHttp_1 = httpsOverHttp, httpOverHttps_1 = httpOverHttps, httpsOverHttps_1 = httpsOverHttps;
function httpOverHttp(e) {
  var t = new TunnelingAgent(e);
  return t.request = http__default.default.request, t;
}
function httpsOverHttp(e) {
  var t = new TunnelingAgent(e);
  return t.request = http__default.default.request, t.createSocket = createSecureSocket, t.defaultPort = 443, t;
}
function httpOverHttps(e) {
  var t = new TunnelingAgent(e);
  return t.request = https__default.default.request, t;
}
function httpsOverHttps(e) {
  var t = new TunnelingAgent(e);
  return t.request = https__default.default.request, t.createSocket = createSecureSocket, t.defaultPort = 443, t;
}
function TunnelingAgent(e) {
  var t = this;
  t.options = e || {}, t.proxyOptions = t.options.proxy || {}, t.maxSockets = t.options.maxSockets || http__default.default.Agent.defaultMaxSockets, t.requests = [], t.sockets = [], t.on("free", function(s, o, i, p) {
    for (var a = toOptions(o, i, p), u = 0, h = t.requests.length; u < h; ++u) {
      var b = t.requests[u];
      if (b.host === a.host && b.port === a.port) {
        t.requests.splice(u, 1), b.request.onSocket(s);
        return;
      }
    }
    s.destroy(), t.removeSocket(s);
  });
}
util_1__default.default.inherits(TunnelingAgent, events__default.default.EventEmitter), TunnelingAgent.prototype.addRequest = function(t, n, s, o) {
  var i = this, p = mergeOptions({ request: t }, i.options, toOptions(n, s, o));
  if (i.sockets.length >= this.maxSockets) {
    i.requests.push(p);
    return;
  }
  i.createSocket(p, function(a) {
    a.on("free", u), a.on("close", h), a.on("agentRemove", h), t.onSocket(a);
    function u() {
      i.emit("free", a, p);
    }
    function h(b) {
      i.removeSocket(a), a.removeListener("free", u), a.removeListener("close", h), a.removeListener("agentRemove", h);
    }
  });
}, TunnelingAgent.prototype.createSocket = function(t, n) {
  var s = this, o = {};
  s.sockets.push(o);
  var i = mergeOptions({}, s.proxyOptions, {
    method: "CONNECT",
    path: t.host + ":" + t.port,
    agent: !1,
    headers: {
      host: t.host + ":" + t.port
    }
  });
  t.localAddress && (i.localAddress = t.localAddress), i.proxyAuth && (i.headers = i.headers || {}, i.headers["Proxy-Authorization"] = "Basic " + new Buffer(i.proxyAuth).toString("base64")), debug("making CONNECT request");
  var p = s.request(i);
  p.useChunkedEncodingByDefault = !1, p.once("response", a), p.once("upgrade", u), p.once("connect", h), p.once("error", b), p.end();
  function a(y) {
    y.upgrade = !0;
  }
  function u(y, _, E) {
    process.nextTick(function() {
      h(y, _, E);
    });
  }
  function h(y, _, E) {
    if (p.removeAllListeners(), _.removeAllListeners(), y.statusCode !== 200) {
      debug("tunneling socket could not be established, statusCode=%d", y.statusCode), _.destroy();
      var P = new Error("tunneling socket could not be established, statusCode=" + y.statusCode);
      P.code = "ECONNRESET", t.request.emit("error", P), s.removeSocket(o);
      return;
    }
    if (E.length > 0) {
      debug("got illegal response body from proxy"), _.destroy();
      var P = new Error("got illegal response body from proxy");
      P.code = "ECONNRESET", t.request.emit("error", P), s.removeSocket(o);
      return;
    }
    return debug("tunneling connection has established"), s.sockets[s.sockets.indexOf(o)] = _, n(_);
  }
  function b(y) {
    p.removeAllListeners(), debug(`tunneling socket could not be established, cause=%s
`, y.message, y.stack);
    var _ = new Error("tunneling socket could not be established, cause=" + y.message);
    _.code = "ECONNRESET", t.request.emit("error", _), s.removeSocket(o);
  }
}, TunnelingAgent.prototype.removeSocket = function(t) {
  var n = this.sockets.indexOf(t);
  if (n !== -1) {
    this.sockets.splice(n, 1);
    var s = this.requests.shift();
    s && this.createSocket(s, function(o) {
      s.request.onSocket(o);
    });
  }
};
function createSecureSocket(e, t) {
  var n = this;
  TunnelingAgent.prototype.createSocket.call(n, e, function(s) {
    var o = e.request.getHeader("host"), i = mergeOptions({}, n.options, {
      socket: s,
      servername: o ? o.replace(/:.*$/, "") : e.host
    }), p = tls__default.default.connect(0, i);
    n.sockets[n.sockets.indexOf(s)] = p, t(p);
  });
}
function toOptions(e, t, n) {
  return typeof e == "string" ? {
    host: e,
    port: t,
    localAddress: n
  } : e;
}
function mergeOptions(e) {
  for (var t = 1, n = arguments.length; t < n; ++t) {
    var s = arguments[t];
    if (typeof s == "object")
      for (var o = Object.keys(s), i = 0, p = o.length; i < p; ++i) {
        var a = o[i];
        s[a] !== void 0 && (e[a] = s[a]);
      }
  }
  return e;
}
var debug;
process.env.NODE_DEBUG && /\btunnel\b/.test(process.env.NODE_DEBUG) ? debug = function() {
  var e = Array.prototype.slice.call(arguments);
  typeof e[0] == "string" ? e[0] = "TUNNEL: " + e[0] : e.unshift("TUNNEL:"), console.error.apply(console, e);
} : debug = function() {
};
var debug_1 = debug, tunnel$1 = {
  httpOverHttp: httpOverHttp_1,
  httpsOverHttp: httpsOverHttp_1,
  httpOverHttps: httpOverHttps_1,
  httpsOverHttps: httpsOverHttps_1,
  debug: debug_1
}, tunnel = tunnel$1, httpClient = createCommonjsModule(function(e, t) {
  Object.defineProperty(t, "__esModule", { value: !0 });
  let n;
  var s;
  (function(d) {
    d[d.OK = 200] = "OK", d[d.MultipleChoices = 300] = "MultipleChoices", d[d.MovedPermanently = 301] = "MovedPermanently", d[d.ResourceMoved = 302] = "ResourceMoved", d[d.SeeOther = 303] = "SeeOther", d[d.NotModified = 304] = "NotModified", d[d.UseProxy = 305] = "UseProxy", d[d.SwitchProxy = 306] = "SwitchProxy", d[d.TemporaryRedirect = 307] = "TemporaryRedirect", d[d.PermanentRedirect = 308] = "PermanentRedirect", d[d.BadRequest = 400] = "BadRequest", d[d.Unauthorized = 401] = "Unauthorized", d[d.PaymentRequired = 402] = "PaymentRequired", d[d.Forbidden = 403] = "Forbidden", d[d.NotFound = 404] = "NotFound", d[d.MethodNotAllowed = 405] = "MethodNotAllowed", d[d.NotAcceptable = 406] = "NotAcceptable", d[d.ProxyAuthenticationRequired = 407] = "ProxyAuthenticationRequired", d[d.RequestTimeout = 408] = "RequestTimeout", d[d.Conflict = 409] = "Conflict", d[d.Gone = 410] = "Gone", d[d.TooManyRequests = 429] = "TooManyRequests", d[d.InternalServerError = 500] = "InternalServerError", d[d.NotImplemented = 501] = "NotImplemented", d[d.BadGateway = 502] = "BadGateway", d[d.ServiceUnavailable = 503] = "ServiceUnavailable", d[d.GatewayTimeout = 504] = "GatewayTimeout";
  })(s = t.HttpCodes || (t.HttpCodes = {}));
  var o;
  (function(d) {
    d.Accept = "accept", d.ContentType = "content-type";
  })(o = t.Headers || (t.Headers = {}));
  var i;
  (function(d) {
    d.ApplicationJson = "application/json";
  })(i = t.MediaTypes || (t.MediaTypes = {}));
  function p(d) {
    let f = proxy.getProxyUrl(new URL(d));
    return f ? f.href : "";
  }
  t.getProxyUrl = p;
  const a = [
    s.MovedPermanently,
    s.ResourceMoved,
    s.SeeOther,
    s.TemporaryRedirect,
    s.PermanentRedirect
  ], u = [
    s.BadGateway,
    s.ServiceUnavailable,
    s.GatewayTimeout
  ], h = ["OPTIONS", "GET", "DELETE", "HEAD"], b = 10, y = 5;
  class _ extends Error {
    constructor(f, w) {
      super(f);
      this.name = "HttpClientError", this.statusCode = w, Object.setPrototypeOf(this, _.prototype);
    }
  }
  t.HttpClientError = _;
  class E {
    constructor(f) {
      this.message = f;
    }
    readBody() {
      return new Promise(async (f, w) => {
        let m = Buffer.alloc(0);
        this.message.on("data", (g) => {
          m = Buffer.concat([m, g]);
        }), this.message.on("end", () => {
          f(m.toString());
        });
      });
    }
  }
  t.HttpClientResponse = E;
  function P(d) {
    return new URL(d).protocol === "https:";
  }
  t.isHttps = P;
  class G {
    constructor(f, w, m) {
      this._ignoreSslError = !1, this._allowRedirects = !0, this._allowRedirectDowngrade = !1, this._maxRedirects = 50, this._allowRetries = !1, this._maxRetries = 1, this._keepAlive = !1, this._disposed = !1, this.userAgent = f, this.handlers = w || [], this.requestOptions = m, m && (m.ignoreSslError != null && (this._ignoreSslError = m.ignoreSslError), this._socketTimeout = m.socketTimeout, m.allowRedirects != null && (this._allowRedirects = m.allowRedirects), m.allowRedirectDowngrade != null && (this._allowRedirectDowngrade = m.allowRedirectDowngrade), m.maxRedirects != null && (this._maxRedirects = Math.max(m.maxRedirects, 0)), m.keepAlive != null && (this._keepAlive = m.keepAlive), m.allowRetries != null && (this._allowRetries = m.allowRetries), m.maxRetries != null && (this._maxRetries = m.maxRetries));
    }
    options(f, w) {
      return this.request("OPTIONS", f, null, w || {});
    }
    get(f, w) {
      return this.request("GET", f, null, w || {});
    }
    del(f, w) {
      return this.request("DELETE", f, null, w || {});
    }
    post(f, w, m) {
      return this.request("POST", f, w, m || {});
    }
    patch(f, w, m) {
      return this.request("PATCH", f, w, m || {});
    }
    put(f, w, m) {
      return this.request("PUT", f, w, m || {});
    }
    head(f, w) {
      return this.request("HEAD", f, null, w || {});
    }
    sendStream(f, w, m, g) {
      return this.request(f, w, m, g);
    }
    async getJson(f, w = {}) {
      w[o.Accept] = this._getExistingOrDefaultHeader(w, o.Accept, i.ApplicationJson);
      let m = await this.get(f, w);
      return this._processResponse(m, this.requestOptions);
    }
    async postJson(f, w, m = {}) {
      let g = JSON.stringify(w, null, 2);
      m[o.Accept] = this._getExistingOrDefaultHeader(m, o.Accept, i.ApplicationJson), m[o.ContentType] = this._getExistingOrDefaultHeader(m, o.ContentType, i.ApplicationJson);
      let T = await this.post(f, g, m);
      return this._processResponse(T, this.requestOptions);
    }
    async putJson(f, w, m = {}) {
      let g = JSON.stringify(w, null, 2);
      m[o.Accept] = this._getExistingOrDefaultHeader(m, o.Accept, i.ApplicationJson), m[o.ContentType] = this._getExistingOrDefaultHeader(m, o.ContentType, i.ApplicationJson);
      let T = await this.put(f, g, m);
      return this._processResponse(T, this.requestOptions);
    }
    async patchJson(f, w, m = {}) {
      let g = JSON.stringify(w, null, 2);
      m[o.Accept] = this._getExistingOrDefaultHeader(m, o.Accept, i.ApplicationJson), m[o.ContentType] = this._getExistingOrDefaultHeader(m, o.ContentType, i.ApplicationJson);
      let T = await this.patch(f, g, m);
      return this._processResponse(T, this.requestOptions);
    }
    async request(f, w, m, g) {
      if (this._disposed)
        throw new Error("Client has already been disposed.");
      let T = new URL(w), v = this._prepareRequest(f, T, g), O = this._allowRetries && h.indexOf(f) != -1 ? this._maxRetries + 1 : 1, $ = 0, A;
      for (; $ < O; ) {
        if (A = await this.requestRaw(v, m), A && A.message && A.message.statusCode === s.Unauthorized) {
          let D;
          for (let S = 0; S < this.handlers.length; S++)
            if (this.handlers[S].canHandleAuthentication(A)) {
              D = this.handlers[S];
              break;
            }
          return D ? D.handleAuthentication(this, v, m) : A;
        }
        let k = this._maxRedirects;
        for (; a.indexOf(A.message.statusCode) != -1 && this._allowRedirects && k > 0; ) {
          const D = A.message.headers.location;
          if (!D)
            break;
          let S = new URL(D);
          if (T.protocol == "https:" && T.protocol != S.protocol && !this._allowRedirectDowngrade)
            throw new Error("Redirect from HTTPS to HTTP protocol. This downgrade is not allowed for security reasons. If you want to allow this behavior, set the allowRedirectDowngrade option to true.");
          if (await A.readBody(), S.hostname !== T.hostname)
            for (let j in g)
              j.toLowerCase() === "authorization" && delete g[j];
          v = this._prepareRequest(f, S, g), A = await this.requestRaw(v, m), k--;
        }
        if (u.indexOf(A.message.statusCode) == -1)
          return A;
        $ += 1, $ < O && (await A.readBody(), await this._performExponentialBackoff($));
      }
      return A;
    }
    dispose() {
      this._agent && this._agent.destroy(), this._disposed = !0;
    }
    requestRaw(f, w) {
      return new Promise((m, g) => {
        let T = function(v, O) {
          v && g(v), m(O);
        };
        this.requestRawWithCallback(f, w, T);
      });
    }
    requestRawWithCallback(f, w, m) {
      let g;
      typeof w == "string" && (f.options.headers["Content-Length"] = Buffer.byteLength(w, "utf8"));
      let T = !1, v = ($, A) => {
        T || (T = !0, m($, A));
      }, O = f.httpModule.request(f.options, ($) => {
        let A = new E($);
        v(null, A);
      });
      O.on("socket", ($) => {
        g = $;
      }), O.setTimeout(this._socketTimeout || 3 * 6e4, () => {
        g && g.end(), v(new Error("Request timeout: " + f.options.path), null);
      }), O.on("error", function($) {
        v($, null);
      }), w && typeof w == "string" && O.write(w, "utf8"), w && typeof w != "string" ? (w.on("close", function() {
        O.end();
      }), w.pipe(O)) : O.end();
    }
    getAgent(f) {
      let w = new URL(f);
      return this._getAgent(w);
    }
    _prepareRequest(f, w, m) {
      const g = {};
      g.parsedUrl = w;
      const T = g.parsedUrl.protocol === "https:";
      g.httpModule = T ? https__default.default : http__default.default;
      const v = T ? 443 : 80;
      return g.options = {}, g.options.host = g.parsedUrl.hostname, g.options.port = g.parsedUrl.port ? parseInt(g.parsedUrl.port) : v, g.options.path = (g.parsedUrl.pathname || "") + (g.parsedUrl.search || ""), g.options.method = f, g.options.headers = this._mergeHeaders(m), this.userAgent != null && (g.options.headers["user-agent"] = this.userAgent), g.options.agent = this._getAgent(g.parsedUrl), this.handlers && this.handlers.forEach((O) => {
        O.prepareRequest(g.options);
      }), g;
    }
    _mergeHeaders(f) {
      const w = (m) => Object.keys(m).reduce((g, T) => (g[T.toLowerCase()] = m[T], g), {});
      return this.requestOptions && this.requestOptions.headers ? Object.assign({}, w(this.requestOptions.headers), w(f)) : w(f || {});
    }
    _getExistingOrDefaultHeader(f, w, m) {
      const g = (v) => Object.keys(v).reduce((O, $) => (O[$.toLowerCase()] = v[$], O), {});
      let T;
      return this.requestOptions && this.requestOptions.headers && (T = g(this.requestOptions.headers)[w]), f[w] || T || m;
    }
    _getAgent(f) {
      let w, m = proxy.getProxyUrl(f), g = m && m.hostname;
      if (this._keepAlive && g && (w = this._proxyAgent), this._keepAlive && !g && (w = this._agent), w)
        return w;
      const T = f.protocol === "https:";
      let v = 100;
      if (this.requestOptions && (v = this.requestOptions.maxSockets || http__default.default.globalAgent.maxSockets), g) {
        n || (n = tunnel);
        const O = {
          maxSockets: v,
          keepAlive: this._keepAlive,
          proxy: {
            proxyAuth: `${m.username}:${m.password}`,
            host: m.hostname,
            port: m.port
          }
        };
        let $;
        const A = m.protocol === "https:";
        T ? $ = A ? n.httpsOverHttps : n.httpsOverHttp : $ = A ? n.httpOverHttps : n.httpOverHttp, w = $(O), this._proxyAgent = w;
      }
      if (this._keepAlive && !w) {
        const O = { keepAlive: this._keepAlive, maxSockets: v };
        w = T ? new https__default.default.Agent(O) : new http__default.default.Agent(O), this._agent = w;
      }
      return w || (w = T ? https__default.default.globalAgent : http__default.default.globalAgent), T && this._ignoreSslError && (w.options = Object.assign(w.options || {}, {
        rejectUnauthorized: !1
      })), w;
    }
    _performExponentialBackoff(f) {
      f = Math.min(b, f);
      const w = y * Math.pow(2, f);
      return new Promise((m) => setTimeout(() => m(), w));
    }
    static dateTimeDeserializer(f, w) {
      if (typeof w == "string") {
        let m = new Date(w);
        if (!isNaN(m.valueOf()))
          return m;
      }
      return w;
    }
    async _processResponse(f, w) {
      return new Promise(async (m, g) => {
        const T = f.message.statusCode, v = {
          statusCode: T,
          result: null,
          headers: {}
        };
        T == s.NotFound && m(v);
        let O, $;
        try {
          $ = await f.readBody(), $ && $.length > 0 && (w && w.deserializeDates ? O = JSON.parse($, G.dateTimeDeserializer) : O = JSON.parse($), v.result = O), v.headers = f.message.headers;
        } catch (A) {
        }
        if (T > 299) {
          let A;
          O && O.message ? A = O.message : $ && $.length > 0 ? A = $ : A = "Failed request: (" + T + ")";
          let k = new _(A, T);
          k.result = v.result, g(k);
        } else
          m(v);
      });
    }
  }
  t.HttpClient = G;
}), utils$1 = createCommonjsModule(function(e, t) {
  var n = commonjsGlobal && commonjsGlobal.__createBinding || (Object.create ? function(h, b, y, _) {
    _ === void 0 && (_ = y), Object.defineProperty(h, _, { enumerable: !0, get: function() {
      return b[y];
    } });
  } : function(h, b, y, _) {
    _ === void 0 && (_ = y), h[_] = b[y];
  }), s = commonjsGlobal && commonjsGlobal.__setModuleDefault || (Object.create ? function(h, b) {
    Object.defineProperty(h, "default", { enumerable: !0, value: b });
  } : function(h, b) {
    h.default = b;
  }), o = commonjsGlobal && commonjsGlobal.__importStar || function(h) {
    if (h && h.__esModule)
      return h;
    var b = {};
    if (h != null)
      for (var y in h)
        Object.hasOwnProperty.call(h, y) && n(b, h, y);
    return s(b, h), b;
  };
  Object.defineProperty(t, "__esModule", { value: !0 }), t.getApiBaseUrl = t.getProxyAgent = t.getAuthString = void 0;
  const i = o(httpClient);
  function p(h, b) {
    if (!h && !b.auth)
      throw new Error("Parameter token or opts.auth is required");
    if (h && b.auth)
      throw new Error("Parameters token and opts.auth may not both be specified");
    return typeof b.auth == "string" ? b.auth : `token ${h}`;
  }
  t.getAuthString = p;
  function a(h) {
    return new i.HttpClient().getAgent(h);
  }
  t.getProxyAgent = a;
  function u() {
    return process.env.GITHUB_API_URL || "https://api.github.com";
  }
  t.getApiBaseUrl = u;
});
function getUserAgent() {
  return typeof navigator == "object" && "userAgent" in navigator ? navigator.userAgent : typeof process == "object" && "version" in process ? `Node.js/${process.version.substr(1)} (${process.platform}; ${process.arch})` : "<environment undetectable>";
}
var register_1 = register;
function register(e, t, n, s) {
  if (typeof n != "function")
    throw new Error("method for before hook must be a function");
  return s || (s = {}), Array.isArray(t) ? t.reverse().reduce(function(o, i) {
    return register.bind(null, e, i, o, s);
  }, n)() : Promise.resolve().then(function() {
    return e.registry[t] ? e.registry[t].reduce(function(o, i) {
      return i.hook.bind(null, o, s);
    }, n)() : n(s);
  });
}
var add = addHook;
function addHook(e, t, n, s) {
  var o = s;
  e.registry[n] || (e.registry[n] = []), t === "before" && (s = function(i, p) {
    return Promise.resolve().then(o.bind(null, p)).then(i.bind(null, p));
  }), t === "after" && (s = function(i, p) {
    var a;
    return Promise.resolve().then(i.bind(null, p)).then(function(u) {
      return a = u, o(a, p);
    }).then(function() {
      return a;
    });
  }), t === "error" && (s = function(i, p) {
    return Promise.resolve().then(i.bind(null, p)).catch(function(a) {
      return o(a, p);
    });
  }), e.registry[n].push({
    hook: s,
    orig: o
  });
}
var remove = removeHook;
function removeHook(e, t, n) {
  if (!!e.registry[t]) {
    var s = e.registry[t].map(function(o) {
      return o.orig;
    }).indexOf(n);
    s !== -1 && e.registry[t].splice(s, 1);
  }
}
var bind = Function.bind, bindable = bind.bind(bind);
function bindApi(e, t, n) {
  var s = bindable(remove, null).apply(null, n ? [t, n] : [t]);
  e.api = { remove: s }, e.remove = s, ["before", "error", "after", "wrap"].forEach(function(o) {
    var i = n ? [t, o, n] : [t, o];
    e[o] = e.api[o] = bindable(add, null).apply(null, i);
  });
}
function HookSingular() {
  var e = "h", t = {
    registry: {}
  }, n = register_1.bind(null, t, e);
  return bindApi(n, t, e), n;
}
function HookCollection() {
  var e = {
    registry: {}
  }, t = register_1.bind(null, e);
  return bindApi(t, e), t;
}
var collectionHookDeprecationMessageDisplayed = !1;
function Hook() {
  return collectionHookDeprecationMessageDisplayed || (console.warn('[before-after-hook]: "Hook()" repurposing warning, use "Hook.Collection()". Read more: https://git.io/upgrade-before-after-hook-to-1.4'), collectionHookDeprecationMessageDisplayed = !0), HookCollection();
}
Hook.Singular = HookSingular.bind(), Hook.Collection = HookCollection.bind();
var beforeAfterHook = Hook, Hook_1 = Hook, Singular = Hook.Singular, Collection = Hook.Collection;
beforeAfterHook.Hook = Hook_1, beforeAfterHook.Singular = Singular, beforeAfterHook.Collection = Collection;
/*!
 * is-plain-object <https://github.com/jonschlinkert/is-plain-object>
 *
 * Copyright (c) 2014-2017, Jon Schlinkert.
 * Released under the MIT License.
 */
function isObject$1(e) {
  return Object.prototype.toString.call(e) === "[object Object]";
}
function isPlainObject(e) {
  var t, n;
  return isObject$1(e) === !1 ? !1 : (t = e.constructor, t === void 0 ? !0 : (n = t.prototype, !(isObject$1(n) === !1 || n.hasOwnProperty("isPrototypeOf") === !1)));
}
function lowercaseKeys(e) {
  return e ? Object.keys(e).reduce((t, n) => (t[n.toLowerCase()] = e[n], t), {}) : {};
}
function mergeDeep(e, t) {
  const n = Object.assign({}, e);
  return Object.keys(t).forEach((s) => {
    isPlainObject(t[s]) ? s in e ? n[s] = mergeDeep(e[s], t[s]) : Object.assign(n, { [s]: t[s] }) : Object.assign(n, { [s]: t[s] });
  }), n;
}
function removeUndefinedProperties(e) {
  for (const t in e)
    e[t] === void 0 && delete e[t];
  return e;
}
function merge(e, t, n) {
  if (typeof t == "string") {
    let [o, i] = t.split(" ");
    n = Object.assign(i ? { method: o, url: i } : { url: o }, n);
  } else
    n = Object.assign({}, t);
  n.headers = lowercaseKeys(n.headers), removeUndefinedProperties(n), removeUndefinedProperties(n.headers);
  const s = mergeDeep(e || {}, n);
  return e && e.mediaType.previews.length && (s.mediaType.previews = e.mediaType.previews.filter((o) => !s.mediaType.previews.includes(o)).concat(s.mediaType.previews)), s.mediaType.previews = s.mediaType.previews.map((o) => o.replace(/-preview/, "")), s;
}
function addQueryParameters(e, t) {
  const n = /\?/.test(e) ? "&" : "?", s = Object.keys(t);
  return s.length === 0 ? e : e + n + s.map((o) => o === "q" ? "q=" + t.q.split("+").map(encodeURIComponent).join("+") : `${o}=${encodeURIComponent(t[o])}`).join("&");
}
const urlVariableRegex = /\{[^}]+\}/g;
function removeNonChars(e) {
  return e.replace(/^\W+|\W+$/g, "").split(/,/);
}
function extractUrlVariableNames(e) {
  const t = e.match(urlVariableRegex);
  return t ? t.map(removeNonChars).reduce((n, s) => n.concat(s), []) : [];
}
function omit(e, t) {
  return Object.keys(e).filter((n) => !t.includes(n)).reduce((n, s) => (n[s] = e[s], n), {});
}
function encodeReserved(e) {
  return e.split(/(%[0-9A-Fa-f]{2})/g).map(function(t) {
    return /%[0-9A-Fa-f]/.test(t) || (t = encodeURI(t).replace(/%5B/g, "[").replace(/%5D/g, "]")), t;
  }).join("");
}
function encodeUnreserved(e) {
  return encodeURIComponent(e).replace(/[!'()*]/g, function(t) {
    return "%" + t.charCodeAt(0).toString(16).toUpperCase();
  });
}
function encodeValue(e, t, n) {
  return t = e === "+" || e === "#" ? encodeReserved(t) : encodeUnreserved(t), n ? encodeUnreserved(n) + "=" + t : t;
}
function isDefined(e) {
  return e != null;
}
function isKeyOperator(e) {
  return e === ";" || e === "&" || e === "?";
}
function getValues(e, t, n, s) {
  var o = e[n], i = [];
  if (isDefined(o) && o !== "")
    if (typeof o == "string" || typeof o == "number" || typeof o == "boolean")
      o = o.toString(), s && s !== "*" && (o = o.substring(0, parseInt(s, 10))), i.push(encodeValue(t, o, isKeyOperator(t) ? n : ""));
    else if (s === "*")
      Array.isArray(o) ? o.filter(isDefined).forEach(function(p) {
        i.push(encodeValue(t, p, isKeyOperator(t) ? n : ""));
      }) : Object.keys(o).forEach(function(p) {
        isDefined(o[p]) && i.push(encodeValue(t, o[p], p));
      });
    else {
      const p = [];
      Array.isArray(o) ? o.filter(isDefined).forEach(function(a) {
        p.push(encodeValue(t, a));
      }) : Object.keys(o).forEach(function(a) {
        isDefined(o[a]) && (p.push(encodeUnreserved(a)), p.push(encodeValue(t, o[a].toString())));
      }), isKeyOperator(t) ? i.push(encodeUnreserved(n) + "=" + p.join(",")) : p.length !== 0 && i.push(p.join(","));
    }
  else
    t === ";" ? isDefined(o) && i.push(encodeUnreserved(n)) : o === "" && (t === "&" || t === "?") ? i.push(encodeUnreserved(n) + "=") : o === "" && i.push("");
  return i;
}
function parseUrl(e) {
  return {
    expand: expand.bind(null, e)
  };
}
function expand(e, t) {
  var n = ["+", "#", ".", "/", ";", "?", "&"];
  return e.replace(/\{([^\{\}]+)\}|([^\{\}]+)/g, function(s, o, i) {
    if (o) {
      let a = "";
      const u = [];
      if (n.indexOf(o.charAt(0)) !== -1 && (a = o.charAt(0), o = o.substr(1)), o.split(/,/g).forEach(function(h) {
        var b = /([^:\*]*)(?::(\d+)|(\*))?/.exec(h);
        u.push(getValues(t, a, b[1], b[2] || b[3]));
      }), a && a !== "+") {
        var p = ",";
        return a === "?" ? p = "&" : a !== "#" && (p = a), (u.length !== 0 ? a : "") + u.join(p);
      } else
        return u.join(",");
    } else
      return encodeReserved(i);
  });
}
function parse(e) {
  let t = e.method.toUpperCase(), n = (e.url || "/").replace(/:([a-z]\w+)/g, "{$1}"), s = Object.assign({}, e.headers), o, i = omit(e, [
    "method",
    "baseUrl",
    "url",
    "headers",
    "request",
    "mediaType"
  ]);
  const p = extractUrlVariableNames(n);
  n = parseUrl(n).expand(i), /^http/.test(n) || (n = e.baseUrl + n);
  const a = Object.keys(e).filter((b) => p.includes(b)).concat("baseUrl"), u = omit(i, a);
  if (!/application\/octet-stream/i.test(s.accept) && (e.mediaType.format && (s.accept = s.accept.split(/,/).map((b) => b.replace(/application\/vnd(\.\w+)(\.v3)?(\.\w+)?(\+json)?$/, `application/vnd$1$2.${e.mediaType.format}`)).join(",")), e.mediaType.previews.length)) {
    const b = s.accept.match(/[\w-]+(?=-preview)/g) || [];
    s.accept = b.concat(e.mediaType.previews).map((y) => {
      const _ = e.mediaType.format ? `.${e.mediaType.format}` : "+json";
      return `application/vnd.github.${y}-preview${_}`;
    }).join(",");
  }
  return ["GET", "HEAD"].includes(t) ? n = addQueryParameters(n, u) : "data" in u ? o = u.data : Object.keys(u).length ? o = u : s["content-length"] = 0, !s["content-type"] && typeof o != "undefined" && (s["content-type"] = "application/json; charset=utf-8"), ["PATCH", "PUT"].includes(t) && typeof o == "undefined" && (o = ""), Object.assign({ method: t, url: n, headers: s }, typeof o != "undefined" ? { body: o } : null, e.request ? { request: e.request } : null);
}
function endpointWithDefaults(e, t, n) {
  return parse(merge(e, t, n));
}
function withDefaults$2(e, t) {
  const n = merge(e, t), s = endpointWithDefaults.bind(null, n);
  return Object.assign(s, {
    DEFAULTS: n,
    defaults: withDefaults$2.bind(null, n),
    merge: merge.bind(null, n),
    parse
  });
}
const VERSION$5 = "6.0.10", userAgent = `octokit-endpoint.js/${VERSION$5} ${getUserAgent()}`, DEFAULTS = {
  method: "GET",
  baseUrl: "https://api.github.com",
  headers: {
    accept: "application/vnd.github.v3+json",
    "user-agent": userAgent
  },
  mediaType: {
    format: "",
    previews: []
  }
}, endpoint = withDefaults$2(null, DEFAULTS), Readable = Stream__default.default.Readable, BUFFER = Symbol("buffer"), TYPE = Symbol("type");
class Blob {
  constructor() {
    this[TYPE] = "";
    const t = arguments[0], n = arguments[1], s = [];
    let o = 0;
    if (t) {
      const p = t, a = Number(p.length);
      for (let u = 0; u < a; u++) {
        const h = p[u];
        let b;
        h instanceof Buffer ? b = h : ArrayBuffer.isView(h) ? b = Buffer.from(h.buffer, h.byteOffset, h.byteLength) : h instanceof ArrayBuffer ? b = Buffer.from(h) : h instanceof Blob ? b = h[BUFFER] : b = Buffer.from(typeof h == "string" ? h : String(h)), o += b.length, s.push(b);
      }
    }
    this[BUFFER] = Buffer.concat(s);
    let i = n && n.type !== void 0 && String(n.type).toLowerCase();
    i && !/[^\u0020-\u007E]/.test(i) && (this[TYPE] = i);
  }
  get size() {
    return this[BUFFER].length;
  }
  get type() {
    return this[TYPE];
  }
  text() {
    return Promise.resolve(this[BUFFER].toString());
  }
  arrayBuffer() {
    const t = this[BUFFER], n = t.buffer.slice(t.byteOffset, t.byteOffset + t.byteLength);
    return Promise.resolve(n);
  }
  stream() {
    const t = new Readable();
    return t._read = function() {
    }, t.push(this[BUFFER]), t.push(null), t;
  }
  toString() {
    return "[object Blob]";
  }
  slice() {
    const t = this.size, n = arguments[0], s = arguments[1];
    let o, i;
    n === void 0 ? o = 0 : n < 0 ? o = Math.max(t + n, 0) : o = Math.min(n, t), s === void 0 ? i = t : s < 0 ? i = Math.max(t + s, 0) : i = Math.min(s, t);
    const p = Math.max(i - o, 0), u = this[BUFFER].slice(o, o + p), h = new Blob([], { type: arguments[2] });
    return h[BUFFER] = u, h;
  }
}
Object.defineProperties(Blob.prototype, {
  size: { enumerable: !0 },
  type: { enumerable: !0 },
  slice: { enumerable: !0 }
}), Object.defineProperty(Blob.prototype, Symbol.toStringTag, {
  value: "Blob",
  writable: !1,
  enumerable: !1,
  configurable: !0
});
function FetchError(e, t, n) {
  Error.call(this, e), this.message = e, this.type = t, n && (this.code = this.errno = n.code), Error.captureStackTrace(this, this.constructor);
}
FetchError.prototype = Object.create(Error.prototype), FetchError.prototype.constructor = FetchError, FetchError.prototype.name = "FetchError";
let convert;
try {
  convert = require("encoding").convert;
} catch (e) {
}
const INTERNALS = Symbol("Body internals"), PassThrough = Stream__default.default.PassThrough;
function Body(e) {
  var t = this, n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, s = n.size;
  let o = s === void 0 ? 0 : s;
  var i = n.timeout;
  let p = i === void 0 ? 0 : i;
  e == null ? e = null : isURLSearchParams(e) ? e = Buffer.from(e.toString()) : isBlob(e) || Buffer.isBuffer(e) || (Object.prototype.toString.call(e) === "[object ArrayBuffer]" ? e = Buffer.from(e) : ArrayBuffer.isView(e) ? e = Buffer.from(e.buffer, e.byteOffset, e.byteLength) : e instanceof Stream__default.default || (e = Buffer.from(String(e)))), this[INTERNALS] = {
    body: e,
    disturbed: !1,
    error: null
  }, this.size = o, this.timeout = p, e instanceof Stream__default.default && e.on("error", function(a) {
    const u = a.name === "AbortError" ? a : new FetchError(`Invalid response body while trying to fetch ${t.url}: ${a.message}`, "system", a);
    t[INTERNALS].error = u;
  });
}
Body.prototype = {
  get body() {
    return this[INTERNALS].body;
  },
  get bodyUsed() {
    return this[INTERNALS].disturbed;
  },
  arrayBuffer() {
    return consumeBody.call(this).then(function(e) {
      return e.buffer.slice(e.byteOffset, e.byteOffset + e.byteLength);
    });
  },
  blob() {
    let e = this.headers && this.headers.get("content-type") || "";
    return consumeBody.call(this).then(function(t) {
      return Object.assign(new Blob([], {
        type: e.toLowerCase()
      }), {
        [BUFFER]: t
      });
    });
  },
  json() {
    var e = this;
    return consumeBody.call(this).then(function(t) {
      try {
        return JSON.parse(t.toString());
      } catch (n) {
        return Body.Promise.reject(new FetchError(`invalid json response body at ${e.url} reason: ${n.message}`, "invalid-json"));
      }
    });
  },
  text() {
    return consumeBody.call(this).then(function(e) {
      return e.toString();
    });
  },
  buffer() {
    return consumeBody.call(this);
  },
  textConverted() {
    var e = this;
    return consumeBody.call(this).then(function(t) {
      return convertBody(t, e.headers);
    });
  }
}, Object.defineProperties(Body.prototype, {
  body: { enumerable: !0 },
  bodyUsed: { enumerable: !0 },
  arrayBuffer: { enumerable: !0 },
  blob: { enumerable: !0 },
  json: { enumerable: !0 },
  text: { enumerable: !0 }
}), Body.mixIn = function(e) {
  for (const t of Object.getOwnPropertyNames(Body.prototype))
    if (!(t in e)) {
      const n = Object.getOwnPropertyDescriptor(Body.prototype, t);
      Object.defineProperty(e, t, n);
    }
};
function consumeBody() {
  var e = this;
  if (this[INTERNALS].disturbed)
    return Body.Promise.reject(new TypeError(`body used already for: ${this.url}`));
  if (this[INTERNALS].disturbed = !0, this[INTERNALS].error)
    return Body.Promise.reject(this[INTERNALS].error);
  let t = this.body;
  if (t === null)
    return Body.Promise.resolve(Buffer.alloc(0));
  if (isBlob(t) && (t = t.stream()), Buffer.isBuffer(t))
    return Body.Promise.resolve(t);
  if (!(t instanceof Stream__default.default))
    return Body.Promise.resolve(Buffer.alloc(0));
  let n = [], s = 0, o = !1;
  return new Body.Promise(function(i, p) {
    let a;
    e.timeout && (a = setTimeout(function() {
      o = !0, p(new FetchError(`Response timeout while trying to fetch ${e.url} (over ${e.timeout}ms)`, "body-timeout"));
    }, e.timeout)), t.on("error", function(u) {
      u.name === "AbortError" ? (o = !0, p(u)) : p(new FetchError(`Invalid response body while trying to fetch ${e.url}: ${u.message}`, "system", u));
    }), t.on("data", function(u) {
      if (!(o || u === null)) {
        if (e.size && s + u.length > e.size) {
          o = !0, p(new FetchError(`content size at ${e.url} over limit: ${e.size}`, "max-size"));
          return;
        }
        s += u.length, n.push(u);
      }
    }), t.on("end", function() {
      if (!o) {
        clearTimeout(a);
        try {
          i(Buffer.concat(n, s));
        } catch (u) {
          p(new FetchError(`Could not create Buffer from response body for ${e.url}: ${u.message}`, "system", u));
        }
      }
    });
  });
}
function convertBody(e, t) {
  if (typeof convert != "function")
    throw new Error("The package `encoding` must be installed to use the textConverted() function");
  const n = t.get("content-type");
  let s = "utf-8", o, i;
  return n && (o = /charset=([^;]*)/i.exec(n)), i = e.slice(0, 1024).toString(), !o && i && (o = /<meta.+?charset=(['"])(.+?)\1/i.exec(i)), !o && i && (o = /<meta[\s]+?http-equiv=(['"])content-type\1[\s]+?content=(['"])(.+?)\2/i.exec(i), o || (o = /<meta[\s]+?content=(['"])(.+?)\1[\s]+?http-equiv=(['"])content-type\3/i.exec(i), o && o.pop()), o && (o = /charset=(.*)/i.exec(o.pop()))), !o && i && (o = /<\?xml.+?encoding=(['"])(.+?)\1/i.exec(i)), o && (s = o.pop(), (s === "gb2312" || s === "gbk") && (s = "gb18030")), convert(e, "UTF-8", s).toString();
}
function isURLSearchParams(e) {
  return typeof e != "object" || typeof e.append != "function" || typeof e.delete != "function" || typeof e.get != "function" || typeof e.getAll != "function" || typeof e.has != "function" || typeof e.set != "function" ? !1 : e.constructor.name === "URLSearchParams" || Object.prototype.toString.call(e) === "[object URLSearchParams]" || typeof e.sort == "function";
}
function isBlob(e) {
  return typeof e == "object" && typeof e.arrayBuffer == "function" && typeof e.type == "string" && typeof e.stream == "function" && typeof e.constructor == "function" && typeof e.constructor.name == "string" && /^(Blob|File)$/.test(e.constructor.name) && /^(Blob|File)$/.test(e[Symbol.toStringTag]);
}
function clone(e) {
  let t, n, s = e.body;
  if (e.bodyUsed)
    throw new Error("cannot clone body after it is used");
  return s instanceof Stream__default.default && typeof s.getBoundary != "function" && (t = new PassThrough(), n = new PassThrough(), s.pipe(t), s.pipe(n), e[INTERNALS].body = t, s = n), s;
}
function extractContentType(e) {
  return e === null ? null : typeof e == "string" ? "text/plain;charset=UTF-8" : isURLSearchParams(e) ? "application/x-www-form-urlencoded;charset=UTF-8" : isBlob(e) ? e.type || null : Buffer.isBuffer(e) || Object.prototype.toString.call(e) === "[object ArrayBuffer]" || ArrayBuffer.isView(e) ? null : typeof e.getBoundary == "function" ? `multipart/form-data;boundary=${e.getBoundary()}` : e instanceof Stream__default.default ? null : "text/plain;charset=UTF-8";
}
function getTotalBytes(e) {
  const t = e.body;
  return t === null ? 0 : isBlob(t) ? t.size : Buffer.isBuffer(t) ? t.length : t && typeof t.getLengthSync == "function" && (t._lengthRetrievers && t._lengthRetrievers.length == 0 || t.hasKnownLength && t.hasKnownLength()) ? t.getLengthSync() : null;
}
function writeToStream(e, t) {
  const n = t.body;
  n === null ? e.end() : isBlob(n) ? n.stream().pipe(e) : Buffer.isBuffer(n) ? (e.write(n), e.end()) : n.pipe(e);
}
Body.Promise = global.Promise;
const invalidTokenRegex = /[^\^_`a-zA-Z\-0-9!#$%&'*+.|~]/, invalidHeaderCharRegex = /[^\t\x20-\x7e\x80-\xff]/;
function validateName(e) {
  if (e = `${e}`, invalidTokenRegex.test(e) || e === "")
    throw new TypeError(`${e} is not a legal HTTP header name`);
}
function validateValue(e) {
  if (e = `${e}`, invalidHeaderCharRegex.test(e))
    throw new TypeError(`${e} is not a legal HTTP header value`);
}
function find(e, t) {
  t = t.toLowerCase();
  for (const n in e)
    if (n.toLowerCase() === t)
      return n;
}
const MAP = Symbol("map");
class Headers {
  constructor() {
    let t = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : void 0;
    if (this[MAP] = Object.create(null), t instanceof Headers) {
      const n = t.raw(), s = Object.keys(n);
      for (const o of s)
        for (const i of n[o])
          this.append(o, i);
      return;
    }
    if (t != null)
      if (typeof t == "object") {
        const n = t[Symbol.iterator];
        if (n != null) {
          if (typeof n != "function")
            throw new TypeError("Header pairs must be iterable");
          const s = [];
          for (const o of t) {
            if (typeof o != "object" || typeof o[Symbol.iterator] != "function")
              throw new TypeError("Each header pair must be iterable");
            s.push(Array.from(o));
          }
          for (const o of s) {
            if (o.length !== 2)
              throw new TypeError("Each header pair must be a name/value tuple");
            this.append(o[0], o[1]);
          }
        } else
          for (const s of Object.keys(t)) {
            const o = t[s];
            this.append(s, o);
          }
      } else
        throw new TypeError("Provided initializer must be an object");
  }
  get(t) {
    t = `${t}`, validateName(t);
    const n = find(this[MAP], t);
    return n === void 0 ? null : this[MAP][n].join(", ");
  }
  forEach(t) {
    let n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : void 0, s = getHeaders(this), o = 0;
    for (; o < s.length; ) {
      var i = s[o];
      const p = i[0], a = i[1];
      t.call(n, a, p, this), s = getHeaders(this), o++;
    }
  }
  set(t, n) {
    t = `${t}`, n = `${n}`, validateName(t), validateValue(n);
    const s = find(this[MAP], t);
    this[MAP][s !== void 0 ? s : t] = [n];
  }
  append(t, n) {
    t = `${t}`, n = `${n}`, validateName(t), validateValue(n);
    const s = find(this[MAP], t);
    s !== void 0 ? this[MAP][s].push(n) : this[MAP][t] = [n];
  }
  has(t) {
    return t = `${t}`, validateName(t), find(this[MAP], t) !== void 0;
  }
  delete(t) {
    t = `${t}`, validateName(t);
    const n = find(this[MAP], t);
    n !== void 0 && delete this[MAP][n];
  }
  raw() {
    return this[MAP];
  }
  keys() {
    return createHeadersIterator(this, "key");
  }
  values() {
    return createHeadersIterator(this, "value");
  }
  [Symbol.iterator]() {
    return createHeadersIterator(this, "key+value");
  }
}
Headers.prototype.entries = Headers.prototype[Symbol.iterator], Object.defineProperty(Headers.prototype, Symbol.toStringTag, {
  value: "Headers",
  writable: !1,
  enumerable: !1,
  configurable: !0
}), Object.defineProperties(Headers.prototype, {
  get: { enumerable: !0 },
  forEach: { enumerable: !0 },
  set: { enumerable: !0 },
  append: { enumerable: !0 },
  has: { enumerable: !0 },
  delete: { enumerable: !0 },
  keys: { enumerable: !0 },
  values: { enumerable: !0 },
  entries: { enumerable: !0 }
});
function getHeaders(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "key+value";
  return Object.keys(e[MAP]).sort().map(t === "key" ? function(s) {
    return s.toLowerCase();
  } : t === "value" ? function(s) {
    return e[MAP][s].join(", ");
  } : function(s) {
    return [s.toLowerCase(), e[MAP][s].join(", ")];
  });
}
const INTERNAL = Symbol("internal");
function createHeadersIterator(e, t) {
  const n = Object.create(HeadersIteratorPrototype);
  return n[INTERNAL] = {
    target: e,
    kind: t,
    index: 0
  }, n;
}
const HeadersIteratorPrototype = Object.setPrototypeOf({
  next() {
    if (!this || Object.getPrototypeOf(this) !== HeadersIteratorPrototype)
      throw new TypeError("Value of `this` is not a HeadersIterator");
    var e = this[INTERNAL];
    const t = e.target, n = e.kind, s = e.index, o = getHeaders(t, n), i = o.length;
    return s >= i ? {
      value: void 0,
      done: !0
    } : (this[INTERNAL].index = s + 1, {
      value: o[s],
      done: !1
    });
  }
}, Object.getPrototypeOf(Object.getPrototypeOf([][Symbol.iterator]())));
Object.defineProperty(HeadersIteratorPrototype, Symbol.toStringTag, {
  value: "HeadersIterator",
  writable: !1,
  enumerable: !1,
  configurable: !0
});
function exportNodeCompatibleHeaders(e) {
  const t = Object.assign({ __proto__: null }, e[MAP]), n = find(e[MAP], "Host");
  return n !== void 0 && (t[n] = t[n][0]), t;
}
function createHeadersLenient(e) {
  const t = new Headers();
  for (const n of Object.keys(e))
    if (!invalidTokenRegex.test(n))
      if (Array.isArray(e[n]))
        for (const s of e[n])
          invalidHeaderCharRegex.test(s) || (t[MAP][n] === void 0 ? t[MAP][n] = [s] : t[MAP][n].push(s));
      else
        invalidHeaderCharRegex.test(e[n]) || (t[MAP][n] = [e[n]]);
  return t;
}
const INTERNALS$1 = Symbol("Response internals"), STATUS_CODES = http__default.default.STATUS_CODES;
class Response {
  constructor() {
    let t = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : null, n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    Body.call(this, t, n);
    const s = n.status || 200, o = new Headers(n.headers);
    if (t != null && !o.has("Content-Type")) {
      const i = extractContentType(t);
      i && o.append("Content-Type", i);
    }
    this[INTERNALS$1] = {
      url: n.url,
      status: s,
      statusText: n.statusText || STATUS_CODES[s],
      headers: o,
      counter: n.counter
    };
  }
  get url() {
    return this[INTERNALS$1].url || "";
  }
  get status() {
    return this[INTERNALS$1].status;
  }
  get ok() {
    return this[INTERNALS$1].status >= 200 && this[INTERNALS$1].status < 300;
  }
  get redirected() {
    return this[INTERNALS$1].counter > 0;
  }
  get statusText() {
    return this[INTERNALS$1].statusText;
  }
  get headers() {
    return this[INTERNALS$1].headers;
  }
  clone() {
    return new Response(clone(this), {
      url: this.url,
      status: this.status,
      statusText: this.statusText,
      headers: this.headers,
      ok: this.ok,
      redirected: this.redirected
    });
  }
}
Body.mixIn(Response.prototype), Object.defineProperties(Response.prototype, {
  url: { enumerable: !0 },
  status: { enumerable: !0 },
  ok: { enumerable: !0 },
  redirected: { enumerable: !0 },
  statusText: { enumerable: !0 },
  headers: { enumerable: !0 },
  clone: { enumerable: !0 }
}), Object.defineProperty(Response.prototype, Symbol.toStringTag, {
  value: "Response",
  writable: !1,
  enumerable: !1,
  configurable: !0
});
const INTERNALS$2 = Symbol("Request internals"), parse_url = Url__default.default.parse, format_url = Url__default.default.format, streamDestructionSupported = "destroy" in Stream__default.default.Readable.prototype;
function isRequest(e) {
  return typeof e == "object" && typeof e[INTERNALS$2] == "object";
}
function isAbortSignal(e) {
  const t = e && typeof e == "object" && Object.getPrototypeOf(e);
  return !!(t && t.constructor.name === "AbortSignal");
}
class Request {
  constructor(t) {
    let n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, s;
    isRequest(t) ? s = parse_url(t.url) : (t && t.href ? s = parse_url(t.href) : s = parse_url(`${t}`), t = {});
    let o = n.method || t.method || "GET";
    if (o = o.toUpperCase(), (n.body != null || isRequest(t) && t.body !== null) && (o === "GET" || o === "HEAD"))
      throw new TypeError("Request with GET/HEAD method cannot have body");
    let i = n.body != null ? n.body : isRequest(t) && t.body !== null ? clone(t) : null;
    Body.call(this, i, {
      timeout: n.timeout || t.timeout || 0,
      size: n.size || t.size || 0
    });
    const p = new Headers(n.headers || t.headers || {});
    if (i != null && !p.has("Content-Type")) {
      const u = extractContentType(i);
      u && p.append("Content-Type", u);
    }
    let a = isRequest(t) ? t.signal : null;
    if ("signal" in n && (a = n.signal), a != null && !isAbortSignal(a))
      throw new TypeError("Expected signal to be an instanceof AbortSignal");
    this[INTERNALS$2] = {
      method: o,
      redirect: n.redirect || t.redirect || "follow",
      headers: p,
      parsedURL: s,
      signal: a
    }, this.follow = n.follow !== void 0 ? n.follow : t.follow !== void 0 ? t.follow : 20, this.compress = n.compress !== void 0 ? n.compress : t.compress !== void 0 ? t.compress : !0, this.counter = n.counter || t.counter || 0, this.agent = n.agent || t.agent;
  }
  get method() {
    return this[INTERNALS$2].method;
  }
  get url() {
    return format_url(this[INTERNALS$2].parsedURL);
  }
  get headers() {
    return this[INTERNALS$2].headers;
  }
  get redirect() {
    return this[INTERNALS$2].redirect;
  }
  get signal() {
    return this[INTERNALS$2].signal;
  }
  clone() {
    return new Request(this);
  }
}
Body.mixIn(Request.prototype), Object.defineProperty(Request.prototype, Symbol.toStringTag, {
  value: "Request",
  writable: !1,
  enumerable: !1,
  configurable: !0
}), Object.defineProperties(Request.prototype, {
  method: { enumerable: !0 },
  url: { enumerable: !0 },
  headers: { enumerable: !0 },
  redirect: { enumerable: !0 },
  clone: { enumerable: !0 },
  signal: { enumerable: !0 }
});
function getNodeRequestOptions(e) {
  const t = e[INTERNALS$2].parsedURL, n = new Headers(e[INTERNALS$2].headers);
  if (n.has("Accept") || n.set("Accept", "*/*"), !t.protocol || !t.hostname)
    throw new TypeError("Only absolute URLs are supported");
  if (!/^https?:$/.test(t.protocol))
    throw new TypeError("Only HTTP(S) protocols are supported");
  if (e.signal && e.body instanceof Stream__default.default.Readable && !streamDestructionSupported)
    throw new Error("Cancellation of streamed requests with AbortSignal is not supported in node < 8");
  let s = null;
  if (e.body == null && /^(POST|PUT)$/i.test(e.method) && (s = "0"), e.body != null) {
    const i = getTotalBytes(e);
    typeof i == "number" && (s = String(i));
  }
  s && n.set("Content-Length", s), n.has("User-Agent") || n.set("User-Agent", "node-fetch/1.0 (+https://github.com/bitinn/node-fetch)"), e.compress && !n.has("Accept-Encoding") && n.set("Accept-Encoding", "gzip,deflate");
  let o = e.agent;
  return typeof o == "function" && (o = o(t)), !n.has("Connection") && !o && n.set("Connection", "close"), Object.assign({}, t, {
    method: e.method,
    headers: exportNodeCompatibleHeaders(n),
    agent: o
  });
}
function AbortError(e) {
  Error.call(this, e), this.type = "aborted", this.message = e, Error.captureStackTrace(this, this.constructor);
}
AbortError.prototype = Object.create(Error.prototype), AbortError.prototype.constructor = AbortError, AbortError.prototype.name = "AbortError";
const PassThrough$1 = Stream__default.default.PassThrough, resolve_url = Url__default.default.resolve;
function fetch(e, t) {
  if (!fetch.Promise)
    throw new Error("native promise missing, set fetch.Promise to your favorite alternative");
  return Body.Promise = fetch.Promise, new fetch.Promise(function(n, s) {
    const o = new Request(e, t), i = getNodeRequestOptions(o), p = (i.protocol === "https:" ? https__default.default : http__default.default).request, a = o.signal;
    let u = null;
    const h = function() {
      let G = new AbortError("The user aborted a request.");
      s(G), o.body && o.body instanceof Stream__default.default.Readable && o.body.destroy(G), !(!u || !u.body) && u.body.emit("error", G);
    };
    if (a && a.aborted) {
      h();
      return;
    }
    const b = function() {
      h(), E();
    }, y = p(i);
    let _;
    a && a.addEventListener("abort", b);
    function E() {
      y.abort(), a && a.removeEventListener("abort", b), clearTimeout(_);
    }
    o.timeout && y.once("socket", function(P) {
      _ = setTimeout(function() {
        s(new FetchError(`network timeout at: ${o.url}`, "request-timeout")), E();
      }, o.timeout);
    }), y.on("error", function(P) {
      s(new FetchError(`request to ${o.url} failed, reason: ${P.message}`, "system", P)), E();
    }), y.on("response", function(P) {
      clearTimeout(_);
      const G = createHeadersLenient(P.headers);
      if (fetch.isRedirect(P.statusCode)) {
        const g = G.get("Location"), T = g === null ? null : resolve_url(o.url, g);
        switch (o.redirect) {
          case "error":
            s(new FetchError(`uri requested responds with a redirect, redirect mode is set to error: ${o.url}`, "no-redirect")), E();
            return;
          case "manual":
            if (T !== null)
              try {
                G.set("Location", T);
              } catch (O) {
                s(O);
              }
            break;
          case "follow":
            if (T === null)
              break;
            if (o.counter >= o.follow) {
              s(new FetchError(`maximum redirect reached at: ${o.url}`, "max-redirect")), E();
              return;
            }
            const v = {
              headers: new Headers(o.headers),
              follow: o.follow,
              counter: o.counter + 1,
              agent: o.agent,
              compress: o.compress,
              method: o.method,
              body: o.body,
              signal: o.signal,
              timeout: o.timeout,
              size: o.size
            };
            if (P.statusCode !== 303 && o.body && getTotalBytes(o) === null) {
              s(new FetchError("Cannot follow redirect with body being a readable stream", "unsupported-redirect")), E();
              return;
            }
            (P.statusCode === 303 || (P.statusCode === 301 || P.statusCode === 302) && o.method === "POST") && (v.method = "GET", v.body = void 0, v.headers.delete("content-length")), n(fetch(new Request(T, v))), E();
            return;
        }
      }
      P.once("end", function() {
        a && a.removeEventListener("abort", b);
      });
      let d = P.pipe(new PassThrough$1());
      const f = {
        url: o.url,
        status: P.statusCode,
        statusText: P.statusMessage,
        headers: G,
        size: o.size,
        timeout: o.timeout,
        counter: o.counter
      }, w = G.get("Content-Encoding");
      if (!o.compress || o.method === "HEAD" || w === null || P.statusCode === 204 || P.statusCode === 304) {
        u = new Response(d, f), n(u);
        return;
      }
      const m = {
        flush: zlib__default.default.Z_SYNC_FLUSH,
        finishFlush: zlib__default.default.Z_SYNC_FLUSH
      };
      if (w == "gzip" || w == "x-gzip") {
        d = d.pipe(zlib__default.default.createGunzip(m)), u = new Response(d, f), n(u);
        return;
      }
      if (w == "deflate" || w == "x-deflate") {
        P.pipe(new PassThrough$1()).once("data", function(T) {
          (T[0] & 15) == 8 ? d = d.pipe(zlib__default.default.createInflate()) : d = d.pipe(zlib__default.default.createInflateRaw()), u = new Response(d, f), n(u);
        });
        return;
      }
      if (w == "br" && typeof zlib__default.default.createBrotliDecompress == "function") {
        d = d.pipe(zlib__default.default.createBrotliDecompress()), u = new Response(d, f), n(u);
        return;
      }
      u = new Response(d, f), n(u);
    }), writeToStream(y, o);
  });
}
fetch.isRedirect = function(e) {
  return e === 301 || e === 302 || e === 303 || e === 307 || e === 308;
}, fetch.Promise = global.Promise;
class Deprecation extends Error {
  constructor(t) {
    super(t);
    Error.captureStackTrace && Error.captureStackTrace(this, this.constructor), this.name = "Deprecation";
  }
}
var wrappy_1 = wrappy;
function wrappy(e, t) {
  if (e && t)
    return wrappy(e)(t);
  if (typeof e != "function")
    throw new TypeError("need wrapper function");
  return Object.keys(e).forEach(function(s) {
    n[s] = e[s];
  }), n;
  function n() {
    for (var s = new Array(arguments.length), o = 0; o < s.length; o++)
      s[o] = arguments[o];
    var i = e.apply(this, s), p = s[s.length - 1];
    return typeof i == "function" && i !== p && Object.keys(p).forEach(function(a) {
      i[a] = p[a];
    }), i;
  }
}
var once_1 = wrappy_1(once), strict = wrappy_1(onceStrict);
once.proto = once(function() {
  Object.defineProperty(Function.prototype, "once", {
    value: function() {
      return once(this);
    },
    configurable: !0
  }), Object.defineProperty(Function.prototype, "onceStrict", {
    value: function() {
      return onceStrict(this);
    },
    configurable: !0
  });
});
function once(e) {
  var t = function() {
    return t.called ? t.value : (t.called = !0, t.value = e.apply(this, arguments));
  };
  return t.called = !1, t;
}
function onceStrict(e) {
  var t = function() {
    if (t.called)
      throw new Error(t.onceError);
    return t.called = !0, t.value = e.apply(this, arguments);
  }, n = e.name || "Function wrapped with `once`";
  return t.onceError = n + " shouldn't be called more than once", t.called = !1, t;
}
once_1.strict = strict;
const logOnce = once_1((e) => console.warn(e));
class RequestError extends Error {
  constructor(t, n, s) {
    super(t);
    Error.captureStackTrace && Error.captureStackTrace(this, this.constructor), this.name = "HttpError", this.status = n, Object.defineProperty(this, "code", {
      get() {
        return logOnce(new Deprecation("[@octokit/request-error] `error.code` is deprecated, use `error.status`.")), n;
      }
    }), this.headers = s.headers || {};
    const o = Object.assign({}, s.request);
    s.request.headers.authorization && (o.headers = Object.assign({}, s.request.headers, {
      authorization: s.request.headers.authorization.replace(/ .*$/, " [REDACTED]")
    })), o.url = o.url.replace(/\bclient_secret=\w+/g, "client_secret=[REDACTED]").replace(/\baccess_token=\w+/g, "access_token=[REDACTED]"), this.request = o;
  }
}
const VERSION$4 = "5.4.12";
function getBufferResponse(e) {
  return e.arrayBuffer();
}
function fetchWrapper(e) {
  (isPlainObject(e.body) || Array.isArray(e.body)) && (e.body = JSON.stringify(e.body));
  let t = {}, n, s;
  return (e.request && e.request.fetch || fetch)(e.url, Object.assign({
    method: e.method,
    body: e.body,
    headers: e.headers,
    redirect: e.redirect
  }, e.request)).then((i) => {
    s = i.url, n = i.status;
    for (const a of i.headers)
      t[a[0]] = a[1];
    if (n === 204 || n === 205)
      return;
    if (e.method === "HEAD") {
      if (n < 400)
        return;
      throw new RequestError(i.statusText, n, {
        headers: t,
        request: e
      });
    }
    if (n === 304)
      throw new RequestError("Not modified", n, {
        headers: t,
        request: e
      });
    if (n >= 400)
      return i.text().then((a) => {
        const u = new RequestError(a, n, {
          headers: t,
          request: e
        });
        try {
          let h = JSON.parse(u.message);
          Object.assign(u, h);
          let b = h.errors;
          u.message = u.message + ": " + b.map(JSON.stringify).join(", ");
        } catch (h) {
        }
        throw u;
      });
    const p = i.headers.get("content-type");
    return /application\/json/.test(p) ? i.json() : !p || /^text\/|charset=utf-8$/.test(p) ? i.text() : getBufferResponse(i);
  }).then((i) => ({
    status: n,
    url: s,
    headers: t,
    data: i
  })).catch((i) => {
    throw i instanceof RequestError ? i : new RequestError(i.message, 500, {
      headers: t,
      request: e
    });
  });
}
function withDefaults$1(e, t) {
  const n = e.defaults(t);
  return Object.assign(function(o, i) {
    const p = n.merge(o, i);
    if (!p.request || !p.request.hook)
      return fetchWrapper(n.parse(p));
    const a = (u, h) => fetchWrapper(n.parse(n.merge(u, h)));
    return Object.assign(a, {
      endpoint: n,
      defaults: withDefaults$1.bind(null, n)
    }), p.request.hook(a, p);
  }, {
    endpoint: n,
    defaults: withDefaults$1.bind(null, n)
  });
}
const request = withDefaults$1(endpoint, {
  headers: {
    "user-agent": `octokit-request.js/${VERSION$4} ${getUserAgent()}`
  }
}), VERSION$3 = "4.5.8";
class GraphqlError extends Error {
  constructor(t, n) {
    const s = n.data.errors[0].message;
    super(s);
    Object.assign(this, n.data), Object.assign(this, { headers: n.headers }), this.name = "GraphqlError", this.request = t, Error.captureStackTrace && Error.captureStackTrace(this, this.constructor);
  }
}
const NON_VARIABLE_OPTIONS = [
  "method",
  "baseUrl",
  "url",
  "headers",
  "request",
  "query",
  "mediaType"
], GHES_V3_SUFFIX_REGEX = /\/api\/v3\/?$/;
function graphql(e, t, n) {
  if (typeof t == "string" && n && "query" in n)
    return Promise.reject(new Error('[@octokit/graphql] "query" cannot be used as variable name'));
  const s = typeof t == "string" ? Object.assign({ query: t }, n) : t, o = Object.keys(s).reduce((p, a) => NON_VARIABLE_OPTIONS.includes(a) ? (p[a] = s[a], p) : (p.variables || (p.variables = {}), p.variables[a] = s[a], p), {}), i = s.baseUrl || e.endpoint.DEFAULTS.baseUrl;
  return GHES_V3_SUFFIX_REGEX.test(i) && (o.url = i.replace(GHES_V3_SUFFIX_REGEX, "/api/graphql")), e(o).then((p) => {
    if (p.data.errors) {
      const a = {};
      for (const u of Object.keys(p.headers))
        a[u] = p.headers[u];
      throw new GraphqlError(o, {
        headers: a,
        data: p.data
      });
    }
    return p.data.data;
  });
}
function withDefaults(e, t) {
  const n = e.defaults(t);
  return Object.assign((o, i) => graphql(n, o, i), {
    defaults: withDefaults.bind(null, n),
    endpoint: request.endpoint
  });
}
withDefaults(request, {
  headers: {
    "user-agent": `octokit-graphql.js/${VERSION$3} ${getUserAgent()}`
  },
  method: "POST",
  url: "/graphql"
});
function withCustomRequest(e) {
  return withDefaults(e, {
    method: "POST",
    url: "/graphql"
  });
}
async function auth(e) {
  const t = e.split(/\./).length === 3 ? "app" : /^v\d+\./.test(e) ? "installation" : "oauth";
  return {
    type: "token",
    token: e,
    tokenType: t
  };
}
function withAuthorizationPrefix(e) {
  return e.split(/\./).length === 3 ? `bearer ${e}` : `token ${e}`;
}
async function hook(e, t, n, s) {
  const o = t.endpoint.merge(n, s);
  return o.headers.authorization = withAuthorizationPrefix(e), t(o);
}
const createTokenAuth = function(t) {
  if (!t)
    throw new Error("[@octokit/auth-token] No token passed to createTokenAuth");
  if (typeof t != "string")
    throw new Error("[@octokit/auth-token] Token passed to createTokenAuth is not a string");
  return t = t.replace(/^(token|bearer) +/i, ""), Object.assign(auth.bind(null, t), {
    hook: hook.bind(null, t)
  });
}, VERSION$2 = "3.2.4";
class Octokit {
  constructor(t = {}) {
    const n = new Collection(), s = {
      baseUrl: request.endpoint.DEFAULTS.baseUrl,
      headers: {},
      request: Object.assign({}, t.request, {
        hook: n.bind(null, "request")
      }),
      mediaType: {
        previews: [],
        format: ""
      }
    };
    if (s.headers["user-agent"] = [
      t.userAgent,
      `octokit-core.js/${VERSION$2} ${getUserAgent()}`
    ].filter(Boolean).join(" "), t.baseUrl && (s.baseUrl = t.baseUrl), t.previews && (s.mediaType.previews = t.previews), t.timeZone && (s.headers["time-zone"] = t.timeZone), this.request = request.defaults(s), this.graphql = withCustomRequest(this.request).defaults(s), this.log = Object.assign({
      debug: () => {
      },
      info: () => {
      },
      warn: console.warn.bind(console),
      error: console.error.bind(console)
    }, t.log), this.hook = n, t.authStrategy) {
      const i = t, { authStrategy: p } = i, a = W(i, ["authStrategy"]), u = p(Object.assign({
        request: this.request,
        log: this.log,
        octokit: this,
        octokitOptions: a
      }, t.auth));
      n.wrap("request", u.hook), this.auth = u;
    } else if (!t.auth)
      this.auth = async () => ({
        type: "unauthenticated"
      });
    else {
      const p = createTokenAuth(t.auth);
      n.wrap("request", p.hook), this.auth = p;
    }
    this.constructor.plugins.forEach((p) => {
      Object.assign(this, p(this, t));
    });
  }
  static defaults(t) {
    return class extends this {
      constructor(...s) {
        const o = s[0] || {};
        if (typeof t == "function") {
          super(t(o));
          return;
        }
        super(Object.assign({}, t, o, o.userAgent && t.userAgent ? {
          userAgent: `${o.userAgent} ${t.userAgent}`
        } : null));
      }
    };
  }
  static plugin(...t) {
    var n;
    const s = this.plugins;
    return n = class extends this {
    }, n.plugins = s.concat(t.filter((i) => !s.includes(i))), n;
  }
}
Octokit.VERSION = VERSION$2, Octokit.plugins = [];
var distWeb$2 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  Octokit
});
const Endpoints = {
  actions: {
    addSelectedRepoToOrgSecret: [
      "PUT /orgs/{org}/actions/secrets/{secret_name}/repositories/{repository_id}"
    ],
    cancelWorkflowRun: [
      "POST /repos/{owner}/{repo}/actions/runs/{run_id}/cancel"
    ],
    createOrUpdateOrgSecret: ["PUT /orgs/{org}/actions/secrets/{secret_name}"],
    createOrUpdateRepoSecret: [
      "PUT /repos/{owner}/{repo}/actions/secrets/{secret_name}"
    ],
    createRegistrationTokenForOrg: [
      "POST /orgs/{org}/actions/runners/registration-token"
    ],
    createRegistrationTokenForRepo: [
      "POST /repos/{owner}/{repo}/actions/runners/registration-token"
    ],
    createRemoveTokenForOrg: ["POST /orgs/{org}/actions/runners/remove-token"],
    createRemoveTokenForRepo: [
      "POST /repos/{owner}/{repo}/actions/runners/remove-token"
    ],
    createWorkflowDispatch: [
      "POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches"
    ],
    deleteArtifact: [
      "DELETE /repos/{owner}/{repo}/actions/artifacts/{artifact_id}"
    ],
    deleteOrgSecret: ["DELETE /orgs/{org}/actions/secrets/{secret_name}"],
    deleteRepoSecret: [
      "DELETE /repos/{owner}/{repo}/actions/secrets/{secret_name}"
    ],
    deleteSelfHostedRunnerFromOrg: [
      "DELETE /orgs/{org}/actions/runners/{runner_id}"
    ],
    deleteSelfHostedRunnerFromRepo: [
      "DELETE /repos/{owner}/{repo}/actions/runners/{runner_id}"
    ],
    deleteWorkflowRun: ["DELETE /repos/{owner}/{repo}/actions/runs/{run_id}"],
    deleteWorkflowRunLogs: [
      "DELETE /repos/{owner}/{repo}/actions/runs/{run_id}/logs"
    ],
    disableSelectedRepositoryGithubActionsOrganization: [
      "DELETE /orgs/{org}/actions/permissions/repositories/{repository_id}"
    ],
    disableWorkflow: [
      "PUT /repos/{owner}/{repo}/actions/workflows/{workflow_id}/disable"
    ],
    downloadArtifact: [
      "GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}/{archive_format}"
    ],
    downloadJobLogsForWorkflowRun: [
      "GET /repos/{owner}/{repo}/actions/jobs/{job_id}/logs"
    ],
    downloadWorkflowRunLogs: [
      "GET /repos/{owner}/{repo}/actions/runs/{run_id}/logs"
    ],
    enableSelectedRepositoryGithubActionsOrganization: [
      "PUT /orgs/{org}/actions/permissions/repositories/{repository_id}"
    ],
    enableWorkflow: [
      "PUT /repos/{owner}/{repo}/actions/workflows/{workflow_id}/enable"
    ],
    getAllowedActionsOrganization: [
      "GET /orgs/{org}/actions/permissions/selected-actions"
    ],
    getAllowedActionsRepository: [
      "GET /repos/{owner}/{repo}/actions/permissions/selected-actions"
    ],
    getArtifact: ["GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}"],
    getGithubActionsPermissionsOrganization: [
      "GET /orgs/{org}/actions/permissions"
    ],
    getGithubActionsPermissionsRepository: [
      "GET /repos/{owner}/{repo}/actions/permissions"
    ],
    getJobForWorkflowRun: ["GET /repos/{owner}/{repo}/actions/jobs/{job_id}"],
    getOrgPublicKey: ["GET /orgs/{org}/actions/secrets/public-key"],
    getOrgSecret: ["GET /orgs/{org}/actions/secrets/{secret_name}"],
    getRepoPermissions: [
      "GET /repos/{owner}/{repo}/actions/permissions",
      {},
      { renamed: ["actions", "getGithubActionsPermissionsRepository"] }
    ],
    getRepoPublicKey: ["GET /repos/{owner}/{repo}/actions/secrets/public-key"],
    getRepoSecret: ["GET /repos/{owner}/{repo}/actions/secrets/{secret_name}"],
    getSelfHostedRunnerForOrg: ["GET /orgs/{org}/actions/runners/{runner_id}"],
    getSelfHostedRunnerForRepo: [
      "GET /repos/{owner}/{repo}/actions/runners/{runner_id}"
    ],
    getWorkflow: ["GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}"],
    getWorkflowRun: ["GET /repos/{owner}/{repo}/actions/runs/{run_id}"],
    getWorkflowRunUsage: [
      "GET /repos/{owner}/{repo}/actions/runs/{run_id}/timing"
    ],
    getWorkflowUsage: [
      "GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/timing"
    ],
    listArtifactsForRepo: ["GET /repos/{owner}/{repo}/actions/artifacts"],
    listJobsForWorkflowRun: [
      "GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs"
    ],
    listOrgSecrets: ["GET /orgs/{org}/actions/secrets"],
    listRepoSecrets: ["GET /repos/{owner}/{repo}/actions/secrets"],
    listRepoWorkflows: ["GET /repos/{owner}/{repo}/actions/workflows"],
    listRunnerApplicationsForOrg: ["GET /orgs/{org}/actions/runners/downloads"],
    listRunnerApplicationsForRepo: [
      "GET /repos/{owner}/{repo}/actions/runners/downloads"
    ],
    listSelectedReposForOrgSecret: [
      "GET /orgs/{org}/actions/secrets/{secret_name}/repositories"
    ],
    listSelectedRepositoriesEnabledGithubActionsOrganization: [
      "GET /orgs/{org}/actions/permissions/repositories"
    ],
    listSelfHostedRunnersForOrg: ["GET /orgs/{org}/actions/runners"],
    listSelfHostedRunnersForRepo: ["GET /repos/{owner}/{repo}/actions/runners"],
    listWorkflowRunArtifacts: [
      "GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts"
    ],
    listWorkflowRuns: [
      "GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs"
    ],
    listWorkflowRunsForRepo: ["GET /repos/{owner}/{repo}/actions/runs"],
    reRunWorkflow: ["POST /repos/{owner}/{repo}/actions/runs/{run_id}/rerun"],
    removeSelectedRepoFromOrgSecret: [
      "DELETE /orgs/{org}/actions/secrets/{secret_name}/repositories/{repository_id}"
    ],
    setAllowedActionsOrganization: [
      "PUT /orgs/{org}/actions/permissions/selected-actions"
    ],
    setAllowedActionsRepository: [
      "PUT /repos/{owner}/{repo}/actions/permissions/selected-actions"
    ],
    setGithubActionsPermissionsOrganization: [
      "PUT /orgs/{org}/actions/permissions"
    ],
    setGithubActionsPermissionsRepository: [
      "PUT /repos/{owner}/{repo}/actions/permissions"
    ],
    setSelectedReposForOrgSecret: [
      "PUT /orgs/{org}/actions/secrets/{secret_name}/repositories"
    ],
    setSelectedRepositoriesEnabledGithubActionsOrganization: [
      "PUT /orgs/{org}/actions/permissions/repositories"
    ]
  },
  activity: {
    checkRepoIsStarredByAuthenticatedUser: ["GET /user/starred/{owner}/{repo}"],
    deleteRepoSubscription: ["DELETE /repos/{owner}/{repo}/subscription"],
    deleteThreadSubscription: [
      "DELETE /notifications/threads/{thread_id}/subscription"
    ],
    getFeeds: ["GET /feeds"],
    getRepoSubscription: ["GET /repos/{owner}/{repo}/subscription"],
    getThread: ["GET /notifications/threads/{thread_id}"],
    getThreadSubscriptionForAuthenticatedUser: [
      "GET /notifications/threads/{thread_id}/subscription"
    ],
    listEventsForAuthenticatedUser: ["GET /users/{username}/events"],
    listNotificationsForAuthenticatedUser: ["GET /notifications"],
    listOrgEventsForAuthenticatedUser: [
      "GET /users/{username}/events/orgs/{org}"
    ],
    listPublicEvents: ["GET /events"],
    listPublicEventsForRepoNetwork: ["GET /networks/{owner}/{repo}/events"],
    listPublicEventsForUser: ["GET /users/{username}/events/public"],
    listPublicOrgEvents: ["GET /orgs/{org}/events"],
    listReceivedEventsForUser: ["GET /users/{username}/received_events"],
    listReceivedPublicEventsForUser: [
      "GET /users/{username}/received_events/public"
    ],
    listRepoEvents: ["GET /repos/{owner}/{repo}/events"],
    listRepoNotificationsForAuthenticatedUser: [
      "GET /repos/{owner}/{repo}/notifications"
    ],
    listReposStarredByAuthenticatedUser: ["GET /user/starred"],
    listReposStarredByUser: ["GET /users/{username}/starred"],
    listReposWatchedByUser: ["GET /users/{username}/subscriptions"],
    listStargazersForRepo: ["GET /repos/{owner}/{repo}/stargazers"],
    listWatchedReposForAuthenticatedUser: ["GET /user/subscriptions"],
    listWatchersForRepo: ["GET /repos/{owner}/{repo}/subscribers"],
    markNotificationsAsRead: ["PUT /notifications"],
    markRepoNotificationsAsRead: ["PUT /repos/{owner}/{repo}/notifications"],
    markThreadAsRead: ["PATCH /notifications/threads/{thread_id}"],
    setRepoSubscription: ["PUT /repos/{owner}/{repo}/subscription"],
    setThreadSubscription: [
      "PUT /notifications/threads/{thread_id}/subscription"
    ],
    starRepoForAuthenticatedUser: ["PUT /user/starred/{owner}/{repo}"],
    unstarRepoForAuthenticatedUser: ["DELETE /user/starred/{owner}/{repo}"]
  },
  apps: {
    addRepoToInstallation: [
      "PUT /user/installations/{installation_id}/repositories/{repository_id}"
    ],
    checkToken: ["POST /applications/{client_id}/token"],
    createContentAttachment: [
      "POST /content_references/{content_reference_id}/attachments",
      { mediaType: { previews: ["corsair"] } }
    ],
    createFromManifest: ["POST /app-manifests/{code}/conversions"],
    createInstallationAccessToken: [
      "POST /app/installations/{installation_id}/access_tokens"
    ],
    deleteAuthorization: ["DELETE /applications/{client_id}/grant"],
    deleteInstallation: ["DELETE /app/installations/{installation_id}"],
    deleteToken: ["DELETE /applications/{client_id}/token"],
    getAuthenticated: ["GET /app"],
    getBySlug: ["GET /apps/{app_slug}"],
    getInstallation: ["GET /app/installations/{installation_id}"],
    getOrgInstallation: ["GET /orgs/{org}/installation"],
    getRepoInstallation: ["GET /repos/{owner}/{repo}/installation"],
    getSubscriptionPlanForAccount: [
      "GET /marketplace_listing/accounts/{account_id}"
    ],
    getSubscriptionPlanForAccountStubbed: [
      "GET /marketplace_listing/stubbed/accounts/{account_id}"
    ],
    getUserInstallation: ["GET /users/{username}/installation"],
    getWebhookConfigForApp: ["GET /app/hook/config"],
    listAccountsForPlan: ["GET /marketplace_listing/plans/{plan_id}/accounts"],
    listAccountsForPlanStubbed: [
      "GET /marketplace_listing/stubbed/plans/{plan_id}/accounts"
    ],
    listInstallationReposForAuthenticatedUser: [
      "GET /user/installations/{installation_id}/repositories"
    ],
    listInstallations: ["GET /app/installations"],
    listInstallationsForAuthenticatedUser: ["GET /user/installations"],
    listPlans: ["GET /marketplace_listing/plans"],
    listPlansStubbed: ["GET /marketplace_listing/stubbed/plans"],
    listReposAccessibleToInstallation: ["GET /installation/repositories"],
    listSubscriptionsForAuthenticatedUser: ["GET /user/marketplace_purchases"],
    listSubscriptionsForAuthenticatedUserStubbed: [
      "GET /user/marketplace_purchases/stubbed"
    ],
    removeRepoFromInstallation: [
      "DELETE /user/installations/{installation_id}/repositories/{repository_id}"
    ],
    resetToken: ["PATCH /applications/{client_id}/token"],
    revokeInstallationAccessToken: ["DELETE /installation/token"],
    suspendInstallation: ["PUT /app/installations/{installation_id}/suspended"],
    unsuspendInstallation: [
      "DELETE /app/installations/{installation_id}/suspended"
    ],
    updateWebhookConfigForApp: ["PATCH /app/hook/config"]
  },
  billing: {
    getGithubActionsBillingOrg: ["GET /orgs/{org}/settings/billing/actions"],
    getGithubActionsBillingUser: [
      "GET /users/{username}/settings/billing/actions"
    ],
    getGithubPackagesBillingOrg: ["GET /orgs/{org}/settings/billing/packages"],
    getGithubPackagesBillingUser: [
      "GET /users/{username}/settings/billing/packages"
    ],
    getSharedStorageBillingOrg: [
      "GET /orgs/{org}/settings/billing/shared-storage"
    ],
    getSharedStorageBillingUser: [
      "GET /users/{username}/settings/billing/shared-storage"
    ]
  },
  checks: {
    create: ["POST /repos/{owner}/{repo}/check-runs"],
    createSuite: ["POST /repos/{owner}/{repo}/check-suites"],
    get: ["GET /repos/{owner}/{repo}/check-runs/{check_run_id}"],
    getSuite: ["GET /repos/{owner}/{repo}/check-suites/{check_suite_id}"],
    listAnnotations: [
      "GET /repos/{owner}/{repo}/check-runs/{check_run_id}/annotations"
    ],
    listForRef: ["GET /repos/{owner}/{repo}/commits/{ref}/check-runs"],
    listForSuite: [
      "GET /repos/{owner}/{repo}/check-suites/{check_suite_id}/check-runs"
    ],
    listSuitesForRef: ["GET /repos/{owner}/{repo}/commits/{ref}/check-suites"],
    rerequestSuite: [
      "POST /repos/{owner}/{repo}/check-suites/{check_suite_id}/rerequest"
    ],
    setSuitesPreferences: [
      "PATCH /repos/{owner}/{repo}/check-suites/preferences"
    ],
    update: ["PATCH /repos/{owner}/{repo}/check-runs/{check_run_id}"]
  },
  codeScanning: {
    getAlert: [
      "GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}",
      {},
      { renamedParameters: { alert_id: "alert_number" } }
    ],
    listAlertsForRepo: ["GET /repos/{owner}/{repo}/code-scanning/alerts"],
    listRecentAnalyses: ["GET /repos/{owner}/{repo}/code-scanning/analyses"],
    updateAlert: [
      "PATCH /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}"
    ],
    uploadSarif: ["POST /repos/{owner}/{repo}/code-scanning/sarifs"]
  },
  codesOfConduct: {
    getAllCodesOfConduct: [
      "GET /codes_of_conduct",
      { mediaType: { previews: ["scarlet-witch"] } }
    ],
    getConductCode: [
      "GET /codes_of_conduct/{key}",
      { mediaType: { previews: ["scarlet-witch"] } }
    ],
    getForRepo: [
      "GET /repos/{owner}/{repo}/community/code_of_conduct",
      { mediaType: { previews: ["scarlet-witch"] } }
    ]
  },
  emojis: { get: ["GET /emojis"] },
  enterpriseAdmin: {
    disableSelectedOrganizationGithubActionsEnterprise: [
      "DELETE /enterprises/{enterprise}/actions/permissions/organizations/{org_id}"
    ],
    enableSelectedOrganizationGithubActionsEnterprise: [
      "PUT /enterprises/{enterprise}/actions/permissions/organizations/{org_id}"
    ],
    getAllowedActionsEnterprise: [
      "GET /enterprises/{enterprise}/actions/permissions/selected-actions"
    ],
    getGithubActionsPermissionsEnterprise: [
      "GET /enterprises/{enterprise}/actions/permissions"
    ],
    listSelectedOrganizationsEnabledGithubActionsEnterprise: [
      "GET /enterprises/{enterprise}/actions/permissions/organizations"
    ],
    setAllowedActionsEnterprise: [
      "PUT /enterprises/{enterprise}/actions/permissions/selected-actions"
    ],
    setGithubActionsPermissionsEnterprise: [
      "PUT /enterprises/{enterprise}/actions/permissions"
    ],
    setSelectedOrganizationsEnabledGithubActionsEnterprise: [
      "PUT /enterprises/{enterprise}/actions/permissions/organizations"
    ]
  },
  gists: {
    checkIsStarred: ["GET /gists/{gist_id}/star"],
    create: ["POST /gists"],
    createComment: ["POST /gists/{gist_id}/comments"],
    delete: ["DELETE /gists/{gist_id}"],
    deleteComment: ["DELETE /gists/{gist_id}/comments/{comment_id}"],
    fork: ["POST /gists/{gist_id}/forks"],
    get: ["GET /gists/{gist_id}"],
    getComment: ["GET /gists/{gist_id}/comments/{comment_id}"],
    getRevision: ["GET /gists/{gist_id}/{sha}"],
    list: ["GET /gists"],
    listComments: ["GET /gists/{gist_id}/comments"],
    listCommits: ["GET /gists/{gist_id}/commits"],
    listForUser: ["GET /users/{username}/gists"],
    listForks: ["GET /gists/{gist_id}/forks"],
    listPublic: ["GET /gists/public"],
    listStarred: ["GET /gists/starred"],
    star: ["PUT /gists/{gist_id}/star"],
    unstar: ["DELETE /gists/{gist_id}/star"],
    update: ["PATCH /gists/{gist_id}"],
    updateComment: ["PATCH /gists/{gist_id}/comments/{comment_id}"]
  },
  git: {
    createBlob: ["POST /repos/{owner}/{repo}/git/blobs"],
    createCommit: ["POST /repos/{owner}/{repo}/git/commits"],
    createRef: ["POST /repos/{owner}/{repo}/git/refs"],
    createTag: ["POST /repos/{owner}/{repo}/git/tags"],
    createTree: ["POST /repos/{owner}/{repo}/git/trees"],
    deleteRef: ["DELETE /repos/{owner}/{repo}/git/refs/{ref}"],
    getBlob: ["GET /repos/{owner}/{repo}/git/blobs/{file_sha}"],
    getCommit: ["GET /repos/{owner}/{repo}/git/commits/{commit_sha}"],
    getRef: ["GET /repos/{owner}/{repo}/git/ref/{ref}"],
    getTag: ["GET /repos/{owner}/{repo}/git/tags/{tag_sha}"],
    getTree: ["GET /repos/{owner}/{repo}/git/trees/{tree_sha}"],
    listMatchingRefs: ["GET /repos/{owner}/{repo}/git/matching-refs/{ref}"],
    updateRef: ["PATCH /repos/{owner}/{repo}/git/refs/{ref}"]
  },
  gitignore: {
    getAllTemplates: ["GET /gitignore/templates"],
    getTemplate: ["GET /gitignore/templates/{name}"]
  },
  interactions: {
    getRestrictionsForOrg: ["GET /orgs/{org}/interaction-limits"],
    getRestrictionsForRepo: ["GET /repos/{owner}/{repo}/interaction-limits"],
    getRestrictionsForYourPublicRepos: ["GET /user/interaction-limits"],
    removeRestrictionsForOrg: ["DELETE /orgs/{org}/interaction-limits"],
    removeRestrictionsForRepo: [
      "DELETE /repos/{owner}/{repo}/interaction-limits"
    ],
    removeRestrictionsForYourPublicRepos: ["DELETE /user/interaction-limits"],
    setRestrictionsForOrg: ["PUT /orgs/{org}/interaction-limits"],
    setRestrictionsForRepo: ["PUT /repos/{owner}/{repo}/interaction-limits"],
    setRestrictionsForYourPublicRepos: ["PUT /user/interaction-limits"]
  },
  issues: {
    addAssignees: [
      "POST /repos/{owner}/{repo}/issues/{issue_number}/assignees"
    ],
    addLabels: ["POST /repos/{owner}/{repo}/issues/{issue_number}/labels"],
    checkUserCanBeAssigned: ["GET /repos/{owner}/{repo}/assignees/{assignee}"],
    create: ["POST /repos/{owner}/{repo}/issues"],
    createComment: [
      "POST /repos/{owner}/{repo}/issues/{issue_number}/comments"
    ],
    createLabel: ["POST /repos/{owner}/{repo}/labels"],
    createMilestone: ["POST /repos/{owner}/{repo}/milestones"],
    deleteComment: [
      "DELETE /repos/{owner}/{repo}/issues/comments/{comment_id}"
    ],
    deleteLabel: ["DELETE /repos/{owner}/{repo}/labels/{name}"],
    deleteMilestone: [
      "DELETE /repos/{owner}/{repo}/milestones/{milestone_number}"
    ],
    get: ["GET /repos/{owner}/{repo}/issues/{issue_number}"],
    getComment: ["GET /repos/{owner}/{repo}/issues/comments/{comment_id}"],
    getEvent: ["GET /repos/{owner}/{repo}/issues/events/{event_id}"],
    getLabel: ["GET /repos/{owner}/{repo}/labels/{name}"],
    getMilestone: ["GET /repos/{owner}/{repo}/milestones/{milestone_number}"],
    list: ["GET /issues"],
    listAssignees: ["GET /repos/{owner}/{repo}/assignees"],
    listComments: ["GET /repos/{owner}/{repo}/issues/{issue_number}/comments"],
    listCommentsForRepo: ["GET /repos/{owner}/{repo}/issues/comments"],
    listEvents: ["GET /repos/{owner}/{repo}/issues/{issue_number}/events"],
    listEventsForRepo: ["GET /repos/{owner}/{repo}/issues/events"],
    listEventsForTimeline: [
      "GET /repos/{owner}/{repo}/issues/{issue_number}/timeline",
      { mediaType: { previews: ["mockingbird"] } }
    ],
    listForAuthenticatedUser: ["GET /user/issues"],
    listForOrg: ["GET /orgs/{org}/issues"],
    listForRepo: ["GET /repos/{owner}/{repo}/issues"],
    listLabelsForMilestone: [
      "GET /repos/{owner}/{repo}/milestones/{milestone_number}/labels"
    ],
    listLabelsForRepo: ["GET /repos/{owner}/{repo}/labels"],
    listLabelsOnIssue: [
      "GET /repos/{owner}/{repo}/issues/{issue_number}/labels"
    ],
    listMilestones: ["GET /repos/{owner}/{repo}/milestones"],
    lock: ["PUT /repos/{owner}/{repo}/issues/{issue_number}/lock"],
    removeAllLabels: [
      "DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels"
    ],
    removeAssignees: [
      "DELETE /repos/{owner}/{repo}/issues/{issue_number}/assignees"
    ],
    removeLabel: [
      "DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels/{name}"
    ],
    setLabels: ["PUT /repos/{owner}/{repo}/issues/{issue_number}/labels"],
    unlock: ["DELETE /repos/{owner}/{repo}/issues/{issue_number}/lock"],
    update: ["PATCH /repos/{owner}/{repo}/issues/{issue_number}"],
    updateComment: ["PATCH /repos/{owner}/{repo}/issues/comments/{comment_id}"],
    updateLabel: ["PATCH /repos/{owner}/{repo}/labels/{name}"],
    updateMilestone: [
      "PATCH /repos/{owner}/{repo}/milestones/{milestone_number}"
    ]
  },
  licenses: {
    get: ["GET /licenses/{license}"],
    getAllCommonlyUsed: ["GET /licenses"],
    getForRepo: ["GET /repos/{owner}/{repo}/license"]
  },
  markdown: {
    render: ["POST /markdown"],
    renderRaw: [
      "POST /markdown/raw",
      { headers: { "content-type": "text/plain; charset=utf-8" } }
    ]
  },
  meta: {
    get: ["GET /meta"],
    getOctocat: ["GET /octocat"],
    getZen: ["GET /zen"],
    root: ["GET /"]
  },
  migrations: {
    cancelImport: ["DELETE /repos/{owner}/{repo}/import"],
    deleteArchiveForAuthenticatedUser: [
      "DELETE /user/migrations/{migration_id}/archive",
      { mediaType: { previews: ["wyandotte"] } }
    ],
    deleteArchiveForOrg: [
      "DELETE /orgs/{org}/migrations/{migration_id}/archive",
      { mediaType: { previews: ["wyandotte"] } }
    ],
    downloadArchiveForOrg: [
      "GET /orgs/{org}/migrations/{migration_id}/archive",
      { mediaType: { previews: ["wyandotte"] } }
    ],
    getArchiveForAuthenticatedUser: [
      "GET /user/migrations/{migration_id}/archive",
      { mediaType: { previews: ["wyandotte"] } }
    ],
    getCommitAuthors: ["GET /repos/{owner}/{repo}/import/authors"],
    getImportStatus: ["GET /repos/{owner}/{repo}/import"],
    getLargeFiles: ["GET /repos/{owner}/{repo}/import/large_files"],
    getStatusForAuthenticatedUser: [
      "GET /user/migrations/{migration_id}",
      { mediaType: { previews: ["wyandotte"] } }
    ],
    getStatusForOrg: [
      "GET /orgs/{org}/migrations/{migration_id}",
      { mediaType: { previews: ["wyandotte"] } }
    ],
    listForAuthenticatedUser: [
      "GET /user/migrations",
      { mediaType: { previews: ["wyandotte"] } }
    ],
    listForOrg: [
      "GET /orgs/{org}/migrations",
      { mediaType: { previews: ["wyandotte"] } }
    ],
    listReposForOrg: [
      "GET /orgs/{org}/migrations/{migration_id}/repositories",
      { mediaType: { previews: ["wyandotte"] } }
    ],
    listReposForUser: [
      "GET /user/migrations/{migration_id}/repositories",
      { mediaType: { previews: ["wyandotte"] } }
    ],
    mapCommitAuthor: ["PATCH /repos/{owner}/{repo}/import/authors/{author_id}"],
    setLfsPreference: ["PATCH /repos/{owner}/{repo}/import/lfs"],
    startForAuthenticatedUser: ["POST /user/migrations"],
    startForOrg: ["POST /orgs/{org}/migrations"],
    startImport: ["PUT /repos/{owner}/{repo}/import"],
    unlockRepoForAuthenticatedUser: [
      "DELETE /user/migrations/{migration_id}/repos/{repo_name}/lock",
      { mediaType: { previews: ["wyandotte"] } }
    ],
    unlockRepoForOrg: [
      "DELETE /orgs/{org}/migrations/{migration_id}/repos/{repo_name}/lock",
      { mediaType: { previews: ["wyandotte"] } }
    ],
    updateImport: ["PATCH /repos/{owner}/{repo}/import"]
  },
  orgs: {
    blockUser: ["PUT /orgs/{org}/blocks/{username}"],
    checkBlockedUser: ["GET /orgs/{org}/blocks/{username}"],
    checkMembershipForUser: ["GET /orgs/{org}/members/{username}"],
    checkPublicMembershipForUser: ["GET /orgs/{org}/public_members/{username}"],
    convertMemberToOutsideCollaborator: [
      "PUT /orgs/{org}/outside_collaborators/{username}"
    ],
    createInvitation: ["POST /orgs/{org}/invitations"],
    createWebhook: ["POST /orgs/{org}/hooks"],
    deleteWebhook: ["DELETE /orgs/{org}/hooks/{hook_id}"],
    get: ["GET /orgs/{org}"],
    getMembershipForAuthenticatedUser: ["GET /user/memberships/orgs/{org}"],
    getMembershipForUser: ["GET /orgs/{org}/memberships/{username}"],
    getWebhook: ["GET /orgs/{org}/hooks/{hook_id}"],
    getWebhookConfigForOrg: ["GET /orgs/{org}/hooks/{hook_id}/config"],
    list: ["GET /organizations"],
    listAppInstallations: ["GET /orgs/{org}/installations"],
    listBlockedUsers: ["GET /orgs/{org}/blocks"],
    listForAuthenticatedUser: ["GET /user/orgs"],
    listForUser: ["GET /users/{username}/orgs"],
    listInvitationTeams: ["GET /orgs/{org}/invitations/{invitation_id}/teams"],
    listMembers: ["GET /orgs/{org}/members"],
    listMembershipsForAuthenticatedUser: ["GET /user/memberships/orgs"],
    listOutsideCollaborators: ["GET /orgs/{org}/outside_collaborators"],
    listPendingInvitations: ["GET /orgs/{org}/invitations"],
    listPublicMembers: ["GET /orgs/{org}/public_members"],
    listWebhooks: ["GET /orgs/{org}/hooks"],
    pingWebhook: ["POST /orgs/{org}/hooks/{hook_id}/pings"],
    removeMember: ["DELETE /orgs/{org}/members/{username}"],
    removeMembershipForUser: ["DELETE /orgs/{org}/memberships/{username}"],
    removeOutsideCollaborator: [
      "DELETE /orgs/{org}/outside_collaborators/{username}"
    ],
    removePublicMembershipForAuthenticatedUser: [
      "DELETE /orgs/{org}/public_members/{username}"
    ],
    setMembershipForUser: ["PUT /orgs/{org}/memberships/{username}"],
    setPublicMembershipForAuthenticatedUser: [
      "PUT /orgs/{org}/public_members/{username}"
    ],
    unblockUser: ["DELETE /orgs/{org}/blocks/{username}"],
    update: ["PATCH /orgs/{org}"],
    updateMembershipForAuthenticatedUser: [
      "PATCH /user/memberships/orgs/{org}"
    ],
    updateWebhook: ["PATCH /orgs/{org}/hooks/{hook_id}"],
    updateWebhookConfigForOrg: ["PATCH /orgs/{org}/hooks/{hook_id}/config"]
  },
  projects: {
    addCollaborator: [
      "PUT /projects/{project_id}/collaborators/{username}",
      { mediaType: { previews: ["inertia"] } }
    ],
    createCard: [
      "POST /projects/columns/{column_id}/cards",
      { mediaType: { previews: ["inertia"] } }
    ],
    createColumn: [
      "POST /projects/{project_id}/columns",
      { mediaType: { previews: ["inertia"] } }
    ],
    createForAuthenticatedUser: [
      "POST /user/projects",
      { mediaType: { previews: ["inertia"] } }
    ],
    createForOrg: [
      "POST /orgs/{org}/projects",
      { mediaType: { previews: ["inertia"] } }
    ],
    createForRepo: [
      "POST /repos/{owner}/{repo}/projects",
      { mediaType: { previews: ["inertia"] } }
    ],
    delete: [
      "DELETE /projects/{project_id}",
      { mediaType: { previews: ["inertia"] } }
    ],
    deleteCard: [
      "DELETE /projects/columns/cards/{card_id}",
      { mediaType: { previews: ["inertia"] } }
    ],
    deleteColumn: [
      "DELETE /projects/columns/{column_id}",
      { mediaType: { previews: ["inertia"] } }
    ],
    get: [
      "GET /projects/{project_id}",
      { mediaType: { previews: ["inertia"] } }
    ],
    getCard: [
      "GET /projects/columns/cards/{card_id}",
      { mediaType: { previews: ["inertia"] } }
    ],
    getColumn: [
      "GET /projects/columns/{column_id}",
      { mediaType: { previews: ["inertia"] } }
    ],
    getPermissionForUser: [
      "GET /projects/{project_id}/collaborators/{username}/permission",
      { mediaType: { previews: ["inertia"] } }
    ],
    listCards: [
      "GET /projects/columns/{column_id}/cards",
      { mediaType: { previews: ["inertia"] } }
    ],
    listCollaborators: [
      "GET /projects/{project_id}/collaborators",
      { mediaType: { previews: ["inertia"] } }
    ],
    listColumns: [
      "GET /projects/{project_id}/columns",
      { mediaType: { previews: ["inertia"] } }
    ],
    listForOrg: [
      "GET /orgs/{org}/projects",
      { mediaType: { previews: ["inertia"] } }
    ],
    listForRepo: [
      "GET /repos/{owner}/{repo}/projects",
      { mediaType: { previews: ["inertia"] } }
    ],
    listForUser: [
      "GET /users/{username}/projects",
      { mediaType: { previews: ["inertia"] } }
    ],
    moveCard: [
      "POST /projects/columns/cards/{card_id}/moves",
      { mediaType: { previews: ["inertia"] } }
    ],
    moveColumn: [
      "POST /projects/columns/{column_id}/moves",
      { mediaType: { previews: ["inertia"] } }
    ],
    removeCollaborator: [
      "DELETE /projects/{project_id}/collaborators/{username}",
      { mediaType: { previews: ["inertia"] } }
    ],
    update: [
      "PATCH /projects/{project_id}",
      { mediaType: { previews: ["inertia"] } }
    ],
    updateCard: [
      "PATCH /projects/columns/cards/{card_id}",
      { mediaType: { previews: ["inertia"] } }
    ],
    updateColumn: [
      "PATCH /projects/columns/{column_id}",
      { mediaType: { previews: ["inertia"] } }
    ]
  },
  pulls: {
    checkIfMerged: ["GET /repos/{owner}/{repo}/pulls/{pull_number}/merge"],
    create: ["POST /repos/{owner}/{repo}/pulls"],
    createReplyForReviewComment: [
      "POST /repos/{owner}/{repo}/pulls/{pull_number}/comments/{comment_id}/replies"
    ],
    createReview: ["POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews"],
    createReviewComment: [
      "POST /repos/{owner}/{repo}/pulls/{pull_number}/comments"
    ],
    deletePendingReview: [
      "DELETE /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}"
    ],
    deleteReviewComment: [
      "DELETE /repos/{owner}/{repo}/pulls/comments/{comment_id}"
    ],
    dismissReview: [
      "PUT /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/dismissals"
    ],
    get: ["GET /repos/{owner}/{repo}/pulls/{pull_number}"],
    getReview: [
      "GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}"
    ],
    getReviewComment: ["GET /repos/{owner}/{repo}/pulls/comments/{comment_id}"],
    list: ["GET /repos/{owner}/{repo}/pulls"],
    listCommentsForReview: [
      "GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/comments"
    ],
    listCommits: ["GET /repos/{owner}/{repo}/pulls/{pull_number}/commits"],
    listFiles: ["GET /repos/{owner}/{repo}/pulls/{pull_number}/files"],
    listRequestedReviewers: [
      "GET /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers"
    ],
    listReviewComments: [
      "GET /repos/{owner}/{repo}/pulls/{pull_number}/comments"
    ],
    listReviewCommentsForRepo: ["GET /repos/{owner}/{repo}/pulls/comments"],
    listReviews: ["GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews"],
    merge: ["PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge"],
    removeRequestedReviewers: [
      "DELETE /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers"
    ],
    requestReviewers: [
      "POST /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers"
    ],
    submitReview: [
      "POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/events"
    ],
    update: ["PATCH /repos/{owner}/{repo}/pulls/{pull_number}"],
    updateBranch: [
      "PUT /repos/{owner}/{repo}/pulls/{pull_number}/update-branch",
      { mediaType: { previews: ["lydian"] } }
    ],
    updateReview: [
      "PUT /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}"
    ],
    updateReviewComment: [
      "PATCH /repos/{owner}/{repo}/pulls/comments/{comment_id}"
    ]
  },
  rateLimit: { get: ["GET /rate_limit"] },
  reactions: {
    createForCommitComment: [
      "POST /repos/{owner}/{repo}/comments/{comment_id}/reactions",
      { mediaType: { previews: ["squirrel-girl"] } }
    ],
    createForIssue: [
      "POST /repos/{owner}/{repo}/issues/{issue_number}/reactions",
      { mediaType: { previews: ["squirrel-girl"] } }
    ],
    createForIssueComment: [
      "POST /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions",
      { mediaType: { previews: ["squirrel-girl"] } }
    ],
    createForPullRequestReviewComment: [
      "POST /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions",
      { mediaType: { previews: ["squirrel-girl"] } }
    ],
    createForTeamDiscussionCommentInOrg: [
      "POST /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}/reactions",
      { mediaType: { previews: ["squirrel-girl"] } }
    ],
    createForTeamDiscussionInOrg: [
      "POST /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/reactions",
      { mediaType: { previews: ["squirrel-girl"] } }
    ],
    deleteForCommitComment: [
      "DELETE /repos/{owner}/{repo}/comments/{comment_id}/reactions/{reaction_id}",
      { mediaType: { previews: ["squirrel-girl"] } }
    ],
    deleteForIssue: [
      "DELETE /repos/{owner}/{repo}/issues/{issue_number}/reactions/{reaction_id}",
      { mediaType: { previews: ["squirrel-girl"] } }
    ],
    deleteForIssueComment: [
      "DELETE /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions/{reaction_id}",
      { mediaType: { previews: ["squirrel-girl"] } }
    ],
    deleteForPullRequestComment: [
      "DELETE /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions/{reaction_id}",
      { mediaType: { previews: ["squirrel-girl"] } }
    ],
    deleteForTeamDiscussion: [
      "DELETE /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/reactions/{reaction_id}",
      { mediaType: { previews: ["squirrel-girl"] } }
    ],
    deleteForTeamDiscussionComment: [
      "DELETE /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}/reactions/{reaction_id}",
      { mediaType: { previews: ["squirrel-girl"] } }
    ],
    deleteLegacy: [
      "DELETE /reactions/{reaction_id}",
      { mediaType: { previews: ["squirrel-girl"] } },
      {
        deprecated: "octokit.reactions.deleteLegacy() is deprecated, see https://docs.github.com/v3/reactions/#delete-a-reaction-legacy"
      }
    ],
    listForCommitComment: [
      "GET /repos/{owner}/{repo}/comments/{comment_id}/reactions",
      { mediaType: { previews: ["squirrel-girl"] } }
    ],
    listForIssue: [
      "GET /repos/{owner}/{repo}/issues/{issue_number}/reactions",
      { mediaType: { previews: ["squirrel-girl"] } }
    ],
    listForIssueComment: [
      "GET /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions",
      { mediaType: { previews: ["squirrel-girl"] } }
    ],
    listForPullRequestReviewComment: [
      "GET /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions",
      { mediaType: { previews: ["squirrel-girl"] } }
    ],
    listForTeamDiscussionCommentInOrg: [
      "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}/reactions",
      { mediaType: { previews: ["squirrel-girl"] } }
    ],
    listForTeamDiscussionInOrg: [
      "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/reactions",
      { mediaType: { previews: ["squirrel-girl"] } }
    ]
  },
  repos: {
    acceptInvitation: ["PATCH /user/repository_invitations/{invitation_id}"],
    addAppAccessRestrictions: [
      "POST /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps",
      {},
      { mapToData: "apps" }
    ],
    addCollaborator: ["PUT /repos/{owner}/{repo}/collaborators/{username}"],
    addStatusCheckContexts: [
      "POST /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts",
      {},
      { mapToData: "contexts" }
    ],
    addTeamAccessRestrictions: [
      "POST /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams",
      {},
      { mapToData: "teams" }
    ],
    addUserAccessRestrictions: [
      "POST /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users",
      {},
      { mapToData: "users" }
    ],
    checkCollaborator: ["GET /repos/{owner}/{repo}/collaborators/{username}"],
    checkVulnerabilityAlerts: [
      "GET /repos/{owner}/{repo}/vulnerability-alerts",
      { mediaType: { previews: ["dorian"] } }
    ],
    compareCommits: ["GET /repos/{owner}/{repo}/compare/{base}...{head}"],
    createCommitComment: [
      "POST /repos/{owner}/{repo}/commits/{commit_sha}/comments"
    ],
    createCommitSignatureProtection: [
      "POST /repos/{owner}/{repo}/branches/{branch}/protection/required_signatures",
      { mediaType: { previews: ["zzzax"] } }
    ],
    createCommitStatus: ["POST /repos/{owner}/{repo}/statuses/{sha}"],
    createDeployKey: ["POST /repos/{owner}/{repo}/keys"],
    createDeployment: ["POST /repos/{owner}/{repo}/deployments"],
    createDeploymentStatus: [
      "POST /repos/{owner}/{repo}/deployments/{deployment_id}/statuses"
    ],
    createDispatchEvent: ["POST /repos/{owner}/{repo}/dispatches"],
    createForAuthenticatedUser: ["POST /user/repos"],
    createFork: ["POST /repos/{owner}/{repo}/forks"],
    createInOrg: ["POST /orgs/{org}/repos"],
    createOrUpdateFileContents: ["PUT /repos/{owner}/{repo}/contents/{path}"],
    createPagesSite: [
      "POST /repos/{owner}/{repo}/pages",
      { mediaType: { previews: ["switcheroo"] } }
    ],
    createRelease: ["POST /repos/{owner}/{repo}/releases"],
    createUsingTemplate: [
      "POST /repos/{template_owner}/{template_repo}/generate",
      { mediaType: { previews: ["baptiste"] } }
    ],
    createWebhook: ["POST /repos/{owner}/{repo}/hooks"],
    declineInvitation: ["DELETE /user/repository_invitations/{invitation_id}"],
    delete: ["DELETE /repos/{owner}/{repo}"],
    deleteAccessRestrictions: [
      "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions"
    ],
    deleteAdminBranchProtection: [
      "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/enforce_admins"
    ],
    deleteBranchProtection: [
      "DELETE /repos/{owner}/{repo}/branches/{branch}/protection"
    ],
    deleteCommitComment: ["DELETE /repos/{owner}/{repo}/comments/{comment_id}"],
    deleteCommitSignatureProtection: [
      "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_signatures",
      { mediaType: { previews: ["zzzax"] } }
    ],
    deleteDeployKey: ["DELETE /repos/{owner}/{repo}/keys/{key_id}"],
    deleteDeployment: [
      "DELETE /repos/{owner}/{repo}/deployments/{deployment_id}"
    ],
    deleteFile: ["DELETE /repos/{owner}/{repo}/contents/{path}"],
    deleteInvitation: [
      "DELETE /repos/{owner}/{repo}/invitations/{invitation_id}"
    ],
    deletePagesSite: [
      "DELETE /repos/{owner}/{repo}/pages",
      { mediaType: { previews: ["switcheroo"] } }
    ],
    deletePullRequestReviewProtection: [
      "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_pull_request_reviews"
    ],
    deleteRelease: ["DELETE /repos/{owner}/{repo}/releases/{release_id}"],
    deleteReleaseAsset: [
      "DELETE /repos/{owner}/{repo}/releases/assets/{asset_id}"
    ],
    deleteWebhook: ["DELETE /repos/{owner}/{repo}/hooks/{hook_id}"],
    disableAutomatedSecurityFixes: [
      "DELETE /repos/{owner}/{repo}/automated-security-fixes",
      { mediaType: { previews: ["london"] } }
    ],
    disableVulnerabilityAlerts: [
      "DELETE /repos/{owner}/{repo}/vulnerability-alerts",
      { mediaType: { previews: ["dorian"] } }
    ],
    downloadArchive: [
      "GET /repos/{owner}/{repo}/zipball/{ref}",
      {},
      { renamed: ["repos", "downloadZipballArchive"] }
    ],
    downloadTarballArchive: ["GET /repos/{owner}/{repo}/tarball/{ref}"],
    downloadZipballArchive: ["GET /repos/{owner}/{repo}/zipball/{ref}"],
    enableAutomatedSecurityFixes: [
      "PUT /repos/{owner}/{repo}/automated-security-fixes",
      { mediaType: { previews: ["london"] } }
    ],
    enableVulnerabilityAlerts: [
      "PUT /repos/{owner}/{repo}/vulnerability-alerts",
      { mediaType: { previews: ["dorian"] } }
    ],
    get: ["GET /repos/{owner}/{repo}"],
    getAccessRestrictions: [
      "GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions"
    ],
    getAdminBranchProtection: [
      "GET /repos/{owner}/{repo}/branches/{branch}/protection/enforce_admins"
    ],
    getAllStatusCheckContexts: [
      "GET /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts"
    ],
    getAllTopics: [
      "GET /repos/{owner}/{repo}/topics",
      { mediaType: { previews: ["mercy"] } }
    ],
    getAppsWithAccessToProtectedBranch: [
      "GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps"
    ],
    getBranch: ["GET /repos/{owner}/{repo}/branches/{branch}"],
    getBranchProtection: [
      "GET /repos/{owner}/{repo}/branches/{branch}/protection"
    ],
    getClones: ["GET /repos/{owner}/{repo}/traffic/clones"],
    getCodeFrequencyStats: ["GET /repos/{owner}/{repo}/stats/code_frequency"],
    getCollaboratorPermissionLevel: [
      "GET /repos/{owner}/{repo}/collaborators/{username}/permission"
    ],
    getCombinedStatusForRef: ["GET /repos/{owner}/{repo}/commits/{ref}/status"],
    getCommit: ["GET /repos/{owner}/{repo}/commits/{ref}"],
    getCommitActivityStats: ["GET /repos/{owner}/{repo}/stats/commit_activity"],
    getCommitComment: ["GET /repos/{owner}/{repo}/comments/{comment_id}"],
    getCommitSignatureProtection: [
      "GET /repos/{owner}/{repo}/branches/{branch}/protection/required_signatures",
      { mediaType: { previews: ["zzzax"] } }
    ],
    getCommunityProfileMetrics: ["GET /repos/{owner}/{repo}/community/profile"],
    getContent: ["GET /repos/{owner}/{repo}/contents/{path}"],
    getContributorsStats: ["GET /repos/{owner}/{repo}/stats/contributors"],
    getDeployKey: ["GET /repos/{owner}/{repo}/keys/{key_id}"],
    getDeployment: ["GET /repos/{owner}/{repo}/deployments/{deployment_id}"],
    getDeploymentStatus: [
      "GET /repos/{owner}/{repo}/deployments/{deployment_id}/statuses/{status_id}"
    ],
    getLatestPagesBuild: ["GET /repos/{owner}/{repo}/pages/builds/latest"],
    getLatestRelease: ["GET /repos/{owner}/{repo}/releases/latest"],
    getPages: ["GET /repos/{owner}/{repo}/pages"],
    getPagesBuild: ["GET /repos/{owner}/{repo}/pages/builds/{build_id}"],
    getParticipationStats: ["GET /repos/{owner}/{repo}/stats/participation"],
    getPullRequestReviewProtection: [
      "GET /repos/{owner}/{repo}/branches/{branch}/protection/required_pull_request_reviews"
    ],
    getPunchCardStats: ["GET /repos/{owner}/{repo}/stats/punch_card"],
    getReadme: ["GET /repos/{owner}/{repo}/readme"],
    getRelease: ["GET /repos/{owner}/{repo}/releases/{release_id}"],
    getReleaseAsset: ["GET /repos/{owner}/{repo}/releases/assets/{asset_id}"],
    getReleaseByTag: ["GET /repos/{owner}/{repo}/releases/tags/{tag}"],
    getStatusChecksProtection: [
      "GET /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks"
    ],
    getTeamsWithAccessToProtectedBranch: [
      "GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams"
    ],
    getTopPaths: ["GET /repos/{owner}/{repo}/traffic/popular/paths"],
    getTopReferrers: ["GET /repos/{owner}/{repo}/traffic/popular/referrers"],
    getUsersWithAccessToProtectedBranch: [
      "GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users"
    ],
    getViews: ["GET /repos/{owner}/{repo}/traffic/views"],
    getWebhook: ["GET /repos/{owner}/{repo}/hooks/{hook_id}"],
    getWebhookConfigForRepo: [
      "GET /repos/{owner}/{repo}/hooks/{hook_id}/config"
    ],
    listBranches: ["GET /repos/{owner}/{repo}/branches"],
    listBranchesForHeadCommit: [
      "GET /repos/{owner}/{repo}/commits/{commit_sha}/branches-where-head",
      { mediaType: { previews: ["groot"] } }
    ],
    listCollaborators: ["GET /repos/{owner}/{repo}/collaborators"],
    listCommentsForCommit: [
      "GET /repos/{owner}/{repo}/commits/{commit_sha}/comments"
    ],
    listCommitCommentsForRepo: ["GET /repos/{owner}/{repo}/comments"],
    listCommitStatusesForRef: [
      "GET /repos/{owner}/{repo}/commits/{ref}/statuses"
    ],
    listCommits: ["GET /repos/{owner}/{repo}/commits"],
    listContributors: ["GET /repos/{owner}/{repo}/contributors"],
    listDeployKeys: ["GET /repos/{owner}/{repo}/keys"],
    listDeploymentStatuses: [
      "GET /repos/{owner}/{repo}/deployments/{deployment_id}/statuses"
    ],
    listDeployments: ["GET /repos/{owner}/{repo}/deployments"],
    listForAuthenticatedUser: ["GET /user/repos"],
    listForOrg: ["GET /orgs/{org}/repos"],
    listForUser: ["GET /users/{username}/repos"],
    listForks: ["GET /repos/{owner}/{repo}/forks"],
    listInvitations: ["GET /repos/{owner}/{repo}/invitations"],
    listInvitationsForAuthenticatedUser: ["GET /user/repository_invitations"],
    listLanguages: ["GET /repos/{owner}/{repo}/languages"],
    listPagesBuilds: ["GET /repos/{owner}/{repo}/pages/builds"],
    listPublic: ["GET /repositories"],
    listPullRequestsAssociatedWithCommit: [
      "GET /repos/{owner}/{repo}/commits/{commit_sha}/pulls",
      { mediaType: { previews: ["groot"] } }
    ],
    listReleaseAssets: [
      "GET /repos/{owner}/{repo}/releases/{release_id}/assets"
    ],
    listReleases: ["GET /repos/{owner}/{repo}/releases"],
    listTags: ["GET /repos/{owner}/{repo}/tags"],
    listTeams: ["GET /repos/{owner}/{repo}/teams"],
    listWebhooks: ["GET /repos/{owner}/{repo}/hooks"],
    merge: ["POST /repos/{owner}/{repo}/merges"],
    pingWebhook: ["POST /repos/{owner}/{repo}/hooks/{hook_id}/pings"],
    removeAppAccessRestrictions: [
      "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps",
      {},
      { mapToData: "apps" }
    ],
    removeCollaborator: [
      "DELETE /repos/{owner}/{repo}/collaborators/{username}"
    ],
    removeStatusCheckContexts: [
      "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts",
      {},
      { mapToData: "contexts" }
    ],
    removeStatusCheckProtection: [
      "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks"
    ],
    removeTeamAccessRestrictions: [
      "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams",
      {},
      { mapToData: "teams" }
    ],
    removeUserAccessRestrictions: [
      "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users",
      {},
      { mapToData: "users" }
    ],
    replaceAllTopics: [
      "PUT /repos/{owner}/{repo}/topics",
      { mediaType: { previews: ["mercy"] } }
    ],
    requestPagesBuild: ["POST /repos/{owner}/{repo}/pages/builds"],
    setAdminBranchProtection: [
      "POST /repos/{owner}/{repo}/branches/{branch}/protection/enforce_admins"
    ],
    setAppAccessRestrictions: [
      "PUT /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps",
      {},
      { mapToData: "apps" }
    ],
    setStatusCheckContexts: [
      "PUT /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts",
      {},
      { mapToData: "contexts" }
    ],
    setTeamAccessRestrictions: [
      "PUT /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams",
      {},
      { mapToData: "teams" }
    ],
    setUserAccessRestrictions: [
      "PUT /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users",
      {},
      { mapToData: "users" }
    ],
    testPushWebhook: ["POST /repos/{owner}/{repo}/hooks/{hook_id}/tests"],
    transfer: ["POST /repos/{owner}/{repo}/transfer"],
    update: ["PATCH /repos/{owner}/{repo}"],
    updateBranchProtection: [
      "PUT /repos/{owner}/{repo}/branches/{branch}/protection"
    ],
    updateCommitComment: ["PATCH /repos/{owner}/{repo}/comments/{comment_id}"],
    updateInformationAboutPagesSite: ["PUT /repos/{owner}/{repo}/pages"],
    updateInvitation: [
      "PATCH /repos/{owner}/{repo}/invitations/{invitation_id}"
    ],
    updatePullRequestReviewProtection: [
      "PATCH /repos/{owner}/{repo}/branches/{branch}/protection/required_pull_request_reviews"
    ],
    updateRelease: ["PATCH /repos/{owner}/{repo}/releases/{release_id}"],
    updateReleaseAsset: [
      "PATCH /repos/{owner}/{repo}/releases/assets/{asset_id}"
    ],
    updateStatusCheckPotection: [
      "PATCH /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks",
      {},
      { renamed: ["repos", "updateStatusCheckProtection"] }
    ],
    updateStatusCheckProtection: [
      "PATCH /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks"
    ],
    updateWebhook: ["PATCH /repos/{owner}/{repo}/hooks/{hook_id}"],
    updateWebhookConfigForRepo: [
      "PATCH /repos/{owner}/{repo}/hooks/{hook_id}/config"
    ],
    uploadReleaseAsset: [
      "POST /repos/{owner}/{repo}/releases/{release_id}/assets{?name,label}",
      { baseUrl: "https://uploads.github.com" }
    ]
  },
  search: {
    code: ["GET /search/code"],
    commits: ["GET /search/commits", { mediaType: { previews: ["cloak"] } }],
    issuesAndPullRequests: ["GET /search/issues"],
    labels: ["GET /search/labels"],
    repos: ["GET /search/repositories"],
    topics: ["GET /search/topics", { mediaType: { previews: ["mercy"] } }],
    users: ["GET /search/users"]
  },
  secretScanning: {
    getAlert: [
      "GET /repos/{owner}/{repo}/secret-scanning/alerts/{alert_number}"
    ],
    listAlertsForRepo: ["GET /repos/{owner}/{repo}/secret-scanning/alerts"],
    updateAlert: [
      "PATCH /repos/{owner}/{repo}/secret-scanning/alerts/{alert_number}"
    ]
  },
  teams: {
    addOrUpdateMembershipForUserInOrg: [
      "PUT /orgs/{org}/teams/{team_slug}/memberships/{username}"
    ],
    addOrUpdateProjectPermissionsInOrg: [
      "PUT /orgs/{org}/teams/{team_slug}/projects/{project_id}",
      { mediaType: { previews: ["inertia"] } }
    ],
    addOrUpdateRepoPermissionsInOrg: [
      "PUT /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}"
    ],
    checkPermissionsForProjectInOrg: [
      "GET /orgs/{org}/teams/{team_slug}/projects/{project_id}",
      { mediaType: { previews: ["inertia"] } }
    ],
    checkPermissionsForRepoInOrg: [
      "GET /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}"
    ],
    create: ["POST /orgs/{org}/teams"],
    createDiscussionCommentInOrg: [
      "POST /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments"
    ],
    createDiscussionInOrg: ["POST /orgs/{org}/teams/{team_slug}/discussions"],
    deleteDiscussionCommentInOrg: [
      "DELETE /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}"
    ],
    deleteDiscussionInOrg: [
      "DELETE /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}"
    ],
    deleteInOrg: ["DELETE /orgs/{org}/teams/{team_slug}"],
    getByName: ["GET /orgs/{org}/teams/{team_slug}"],
    getDiscussionCommentInOrg: [
      "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}"
    ],
    getDiscussionInOrg: [
      "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}"
    ],
    getMembershipForUserInOrg: [
      "GET /orgs/{org}/teams/{team_slug}/memberships/{username}"
    ],
    list: ["GET /orgs/{org}/teams"],
    listChildInOrg: ["GET /orgs/{org}/teams/{team_slug}/teams"],
    listDiscussionCommentsInOrg: [
      "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments"
    ],
    listDiscussionsInOrg: ["GET /orgs/{org}/teams/{team_slug}/discussions"],
    listForAuthenticatedUser: ["GET /user/teams"],
    listMembersInOrg: ["GET /orgs/{org}/teams/{team_slug}/members"],
    listPendingInvitationsInOrg: [
      "GET /orgs/{org}/teams/{team_slug}/invitations"
    ],
    listProjectsInOrg: [
      "GET /orgs/{org}/teams/{team_slug}/projects",
      { mediaType: { previews: ["inertia"] } }
    ],
    listReposInOrg: ["GET /orgs/{org}/teams/{team_slug}/repos"],
    removeMembershipForUserInOrg: [
      "DELETE /orgs/{org}/teams/{team_slug}/memberships/{username}"
    ],
    removeProjectInOrg: [
      "DELETE /orgs/{org}/teams/{team_slug}/projects/{project_id}"
    ],
    removeRepoInOrg: [
      "DELETE /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}"
    ],
    updateDiscussionCommentInOrg: [
      "PATCH /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}"
    ],
    updateDiscussionInOrg: [
      "PATCH /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}"
    ],
    updateInOrg: ["PATCH /orgs/{org}/teams/{team_slug}"]
  },
  users: {
    addEmailForAuthenticated: ["POST /user/emails"],
    block: ["PUT /user/blocks/{username}"],
    checkBlocked: ["GET /user/blocks/{username}"],
    checkFollowingForUser: ["GET /users/{username}/following/{target_user}"],
    checkPersonIsFollowedByAuthenticated: ["GET /user/following/{username}"],
    createGpgKeyForAuthenticated: ["POST /user/gpg_keys"],
    createPublicSshKeyForAuthenticated: ["POST /user/keys"],
    deleteEmailForAuthenticated: ["DELETE /user/emails"],
    deleteGpgKeyForAuthenticated: ["DELETE /user/gpg_keys/{gpg_key_id}"],
    deletePublicSshKeyForAuthenticated: ["DELETE /user/keys/{key_id}"],
    follow: ["PUT /user/following/{username}"],
    getAuthenticated: ["GET /user"],
    getByUsername: ["GET /users/{username}"],
    getContextForUser: ["GET /users/{username}/hovercard"],
    getGpgKeyForAuthenticated: ["GET /user/gpg_keys/{gpg_key_id}"],
    getPublicSshKeyForAuthenticated: ["GET /user/keys/{key_id}"],
    list: ["GET /users"],
    listBlockedByAuthenticated: ["GET /user/blocks"],
    listEmailsForAuthenticated: ["GET /user/emails"],
    listFollowedByAuthenticated: ["GET /user/following"],
    listFollowersForAuthenticatedUser: ["GET /user/followers"],
    listFollowersForUser: ["GET /users/{username}/followers"],
    listFollowingForUser: ["GET /users/{username}/following"],
    listGpgKeysForAuthenticated: ["GET /user/gpg_keys"],
    listGpgKeysForUser: ["GET /users/{username}/gpg_keys"],
    listPublicEmailsForAuthenticated: ["GET /user/public_emails"],
    listPublicKeysForUser: ["GET /users/{username}/keys"],
    listPublicSshKeysForAuthenticated: ["GET /user/keys"],
    setPrimaryEmailVisibilityForAuthenticated: ["PATCH /user/email/visibility"],
    unblock: ["DELETE /user/blocks/{username}"],
    unfollow: ["DELETE /user/following/{username}"],
    updateAuthenticated: ["PATCH /user"]
  }
}, VERSION$1 = "4.4.1";
function endpointsToMethods(e, t) {
  const n = {};
  for (const [s, o] of Object.entries(t))
    for (const [i, p] of Object.entries(o)) {
      const [a, u, h] = p, [b, y] = a.split(/ /), _ = Object.assign({ method: b, url: y }, u);
      n[s] || (n[s] = {});
      const E = n[s];
      if (h) {
        E[i] = decorate(e, s, i, _, h);
        continue;
      }
      E[i] = e.request.defaults(_);
    }
  return n;
}
function decorate(e, t, n, s, o) {
  const i = e.request.defaults(s);
  function p(...a) {
    let u = i.endpoint.merge(...a);
    if (o.mapToData)
      return u = Object.assign({}, u, {
        data: u[o.mapToData],
        [o.mapToData]: void 0
      }), i(u);
    if (o.renamed) {
      const [h, b] = o.renamed;
      e.log.warn(`octokit.${t}.${n}() has been renamed to octokit.${h}.${b}()`);
    }
    if (o.deprecated && e.log.warn(o.deprecated), o.renamedParameters) {
      const h = i.endpoint.merge(...a);
      for (const [b, y] of Object.entries(o.renamedParameters))
        b in h && (e.log.warn(`"${b}" parameter is deprecated for "octokit.${t}.${n}()". Use "${y}" instead`), y in h || (h[y] = h[b]), delete h[b]);
      return i(h);
    }
    return i(...a);
  }
  return Object.assign(p, i);
}
function restEndpointMethods(e) {
  return endpointsToMethods(e, Endpoints);
}
restEndpointMethods.VERSION = VERSION$1;
var distWeb$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  restEndpointMethods
});
const VERSION = "2.6.2";
function normalizePaginatedListResponse(e) {
  if (!("total_count" in e.data && !("url" in e.data)))
    return e;
  const n = e.data.incomplete_results, s = e.data.repository_selection, o = e.data.total_count;
  delete e.data.incomplete_results, delete e.data.repository_selection, delete e.data.total_count;
  const i = Object.keys(e.data)[0], p = e.data[i];
  return e.data = p, typeof n != "undefined" && (e.data.incomplete_results = n), typeof s != "undefined" && (e.data.repository_selection = s), e.data.total_count = o, e;
}
function iterator(e, t, n) {
  const s = typeof t == "function" ? t.endpoint(n) : e.request.endpoint(t, n), o = typeof t == "function" ? t : e.request, i = s.method, p = s.headers;
  let a = s.url;
  return {
    [Symbol.asyncIterator]: () => ({
      async next() {
        if (!a)
          return { done: !0 };
        const u = await o({ method: i, url: a, headers: p }), h = normalizePaginatedListResponse(u);
        return a = ((h.headers.link || "").match(/<([^>]+)>;\s*rel="next"/) || [])[1], { value: h };
      }
    })
  };
}
function paginate(e, t, n, s) {
  return typeof n == "function" && (s = n, n = void 0), gather(e, [], iterator(e, t, n)[Symbol.asyncIterator](), s);
}
function gather(e, t, n, s) {
  return n.next().then((o) => {
    if (o.done)
      return t;
    let i = !1;
    function p() {
      i = !0;
    }
    return t = t.concat(s ? s(o.value, p) : o.value.data), i ? t : gather(e, t, n, s);
  });
}
const composePaginateRest = Object.assign(paginate, {
  iterator
});
function paginateRest(e) {
  return {
    paginate: Object.assign(paginate.bind(null, e), {
      iterator: iterator.bind(null, e)
    })
  };
}
paginateRest.VERSION = VERSION;
var distWeb = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  composePaginateRest,
  paginateRest
}), core_1 = /* @__PURE__ */ getAugmentedNamespace(distWeb$2), plugin_rest_endpoint_methods_1 = /* @__PURE__ */ getAugmentedNamespace(distWeb$1), plugin_paginate_rest_1 = /* @__PURE__ */ getAugmentedNamespace(distWeb), utils = createCommonjsModule(function(e, t) {
  var n = commonjsGlobal && commonjsGlobal.__createBinding || (Object.create ? function(b, y, _, E) {
    E === void 0 && (E = _), Object.defineProperty(b, E, { enumerable: !0, get: function() {
      return y[_];
    } });
  } : function(b, y, _, E) {
    E === void 0 && (E = _), b[E] = y[_];
  }), s = commonjsGlobal && commonjsGlobal.__setModuleDefault || (Object.create ? function(b, y) {
    Object.defineProperty(b, "default", { enumerable: !0, value: y });
  } : function(b, y) {
    b.default = y;
  }), o = commonjsGlobal && commonjsGlobal.__importStar || function(b) {
    if (b && b.__esModule)
      return b;
    var y = {};
    if (b != null)
      for (var _ in b)
        Object.hasOwnProperty.call(b, _) && n(y, b, _);
    return s(y, b), y;
  };
  Object.defineProperty(t, "__esModule", { value: !0 }), t.getOctokitOptions = t.GitHub = t.context = void 0;
  const i = o(context), p = o(utils$1);
  t.context = new i.Context();
  const a = p.getApiBaseUrl(), u = {
    baseUrl: a,
    request: {
      agent: p.getProxyAgent(a)
    }
  };
  t.GitHub = core_1.Octokit.plugin(plugin_rest_endpoint_methods_1.restEndpointMethods, plugin_paginate_rest_1.paginateRest).defaults(u);
  function h(b, y) {
    const _ = Object.assign({}, y || {}), E = p.getAuthString(b, _);
    return E && (_.auth = E), _;
  }
  t.getOctokitOptions = h;
}), github = createCommonjsModule(function(e, t) {
  var n = commonjsGlobal && commonjsGlobal.__createBinding || (Object.create ? function(a, u, h, b) {
    b === void 0 && (b = h), Object.defineProperty(a, b, { enumerable: !0, get: function() {
      return u[h];
    } });
  } : function(a, u, h, b) {
    b === void 0 && (b = h), a[b] = u[h];
  }), s = commonjsGlobal && commonjsGlobal.__setModuleDefault || (Object.create ? function(a, u) {
    Object.defineProperty(a, "default", { enumerable: !0, value: u });
  } : function(a, u) {
    a.default = u;
  }), o = commonjsGlobal && commonjsGlobal.__importStar || function(a) {
    if (a && a.__esModule)
      return a;
    var u = {};
    if (a != null)
      for (var h in a)
        Object.hasOwnProperty.call(a, h) && n(u, a, h);
    return s(u, a), u;
  };
  Object.defineProperty(t, "__esModule", { value: !0 }), t.getOctokit = t.context = void 0;
  const i = o(context);
  t.context = new i.Context();
  function p(a, u) {
    return new utils.GitHub(utils.getOctokitOptions(a, u));
  }
  t.getOctokit = p;
});
const c$1 = (e) => `\`${e}\``, link = (e, t) => `[${e}](${t})`, sub = (e) => `<sub>${e}</sub>`, sup = (e) => `<sup>${e}</sup>`, strong = (e) => `**${e}**`;
var __defProp$4 = Object.defineProperty, __defProps$4 = Object.defineProperties, __getOwnPropDescs$4 = Object.getOwnPropertyDescriptors, __getOwnPropSymbols$4 = Object.getOwnPropertySymbols, __hasOwnProp$4 = Object.prototype.hasOwnProperty, __propIsEnum$4 = Object.prototype.propertyIsEnumerable, __defNormalProp$4 = (e, t, n) => t in e ? __defProp$4(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n, __spreadValues$4 = (e, t) => {
  for (var n in t || (t = {}))
    __hasOwnProp$4.call(t, n) && __defNormalProp$4(e, n, t[n]);
  if (__getOwnPropSymbols$4)
    for (var n of __getOwnPropSymbols$4(t))
      __propIsEnum$4.call(t, n) && __defNormalProp$4(e, n, t[n]);
  return e;
}, __spreadProps$4 = (e, t) => __defProps$4(e, __getOwnPropDescs$4(t));
async function upsertComment({
  token: e,
  commentSignature: t,
  repo: n,
  prNumber: s,
  body: o
}) {
  core.startGroup("Comment on PR"), o += `

${t}`;
  const i = github.getOctokit(e);
  core.info("Getting list of comments");
  const { data: p } = await i.issues.listComments(__spreadProps$4(__spreadValues$4({}, n), {
    issue_number: s
  })), a = p.find((u) => u.body.endsWith(t));
  a ? (core.info(`Updating previous comment ID ${a.id}`), await i.issues.updateComment(__spreadProps$4(__spreadValues$4({}, n), {
    comment_id: a.id,
    body: o
  }))) : (core.info("Posting new comment"), await i.issues.createComment(__spreadProps$4(__spreadValues$4({}, n), {
    issue_number: s,
    body: o
  }))), core.endGroup();
}
var dist = createCommonjsModule(function(e, t) {
  (function(n, s) {
    e.exports = s();
  })(commonjsGlobal, function() {
    let n = {};
    const s = new WeakMap();
    class o {
      constructor(a, u) {
        u = Object.assign({
          units: "metric",
          precision: 1
        }, n, u), s.set(this, u);
        const h = {
          metric: [
            { from: 0, to: 1e3, unit: "B", long: "bytes" },
            { from: 1e3, to: 1e6, unit: "kB", long: "kilobytes" },
            { from: 1e6, to: 1e9, unit: "MB", long: "megabytes" },
            { from: 1e9, to: 1e12, unit: "GB", long: "gigabytes" },
            { from: 1e12, to: 1e15, unit: "TB", long: "terabytes" },
            { from: 1e15, to: 1e18, unit: "PB", long: "petabytes" },
            { from: 1e18, to: 1e21, unit: "EB", long: "exabytes" },
            { from: 1e21, to: 1e24, unit: "ZB", long: "zettabytes" },
            { from: 1e24, to: 1e27, unit: "YB", long: "yottabytes" }
          ],
          metric_octet: [
            { from: 0, to: 1e3, unit: "o", long: "octets" },
            { from: 1e3, to: 1e6, unit: "ko", long: "kilooctets" },
            { from: 1e6, to: 1e9, unit: "Mo", long: "megaoctets" },
            { from: 1e9, to: 1e12, unit: "Go", long: "gigaoctets" },
            { from: 1e12, to: 1e15, unit: "To", long: "teraoctets" },
            { from: 1e15, to: 1e18, unit: "Po", long: "petaoctets" },
            { from: 1e18, to: 1e21, unit: "Eo", long: "exaoctets" },
            { from: 1e21, to: 1e24, unit: "Zo", long: "zettaoctets" },
            { from: 1e24, to: 1e27, unit: "Yo", long: "yottaoctets" }
          ],
          iec: [
            { from: 0, to: Math.pow(1024, 1), unit: "B", long: "bytes" },
            { from: Math.pow(1024, 1), to: Math.pow(1024, 2), unit: "KiB", long: "kibibytes" },
            { from: Math.pow(1024, 2), to: Math.pow(1024, 3), unit: "MiB", long: "mebibytes" },
            { from: Math.pow(1024, 3), to: Math.pow(1024, 4), unit: "GiB", long: "gibibytes" },
            { from: Math.pow(1024, 4), to: Math.pow(1024, 5), unit: "TiB", long: "tebibytes" },
            { from: Math.pow(1024, 5), to: Math.pow(1024, 6), unit: "PiB", long: "pebibytes" },
            { from: Math.pow(1024, 6), to: Math.pow(1024, 7), unit: "EiB", long: "exbibytes" },
            { from: Math.pow(1024, 7), to: Math.pow(1024, 8), unit: "ZiB", long: "zebibytes" },
            { from: Math.pow(1024, 8), to: Math.pow(1024, 9), unit: "YiB", long: "yobibytes" }
          ],
          iec_octet: [
            { from: 0, to: Math.pow(1024, 1), unit: "o", long: "octets" },
            { from: Math.pow(1024, 1), to: Math.pow(1024, 2), unit: "Kio", long: "kibioctets" },
            { from: Math.pow(1024, 2), to: Math.pow(1024, 3), unit: "Mio", long: "mebioctets" },
            { from: Math.pow(1024, 3), to: Math.pow(1024, 4), unit: "Gio", long: "gibioctets" },
            { from: Math.pow(1024, 4), to: Math.pow(1024, 5), unit: "Tio", long: "tebioctets" },
            { from: Math.pow(1024, 5), to: Math.pow(1024, 6), unit: "Pio", long: "pebioctets" },
            { from: Math.pow(1024, 6), to: Math.pow(1024, 7), unit: "Eio", long: "exbioctets" },
            { from: Math.pow(1024, 7), to: Math.pow(1024, 8), unit: "Zio", long: "zebioctets" },
            { from: Math.pow(1024, 8), to: Math.pow(1024, 9), unit: "Yio", long: "yobioctets" }
          ]
        };
        Object.assign(h, u.customUnits);
        const b = a < 0 ? "-" : "";
        a = Math.abs(a);
        const y = h[u.units];
        if (y) {
          const _ = y.find((E) => a >= E.from && a < E.to);
          if (_) {
            const E = _.from === 0 ? b + a : b + (a / _.from).toFixed(u.precision);
            this.value = E, this.unit = _.unit, this.long = _.long;
          } else
            this.value = b + a, this.unit = "", this.long = "";
        } else
          throw new Error(`Invalid units specified: ${u.units}`);
      }
      toString() {
        const a = s.get(this);
        return a.toStringFn ? a.toStringFn.bind(this)() : `${this.value} ${this.unit}`;
      }
    }
    function i(p, a) {
      return new o(p, a);
    }
    return i.defaultOptions = function(p) {
      n = p;
    }, i;
  });
});
/*!
 * repeat-string <https://github.com/jonschlinkert/repeat-string>
 *
 * Copyright (c) 2014-2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */
var res = "", cache, repeatString = repeat;
function repeat(e, t) {
  if (typeof e != "string")
    throw new TypeError("expected a string");
  if (t === 1)
    return e;
  if (t === 2)
    return e + e;
  var n = e.length * t;
  if (cache !== e || typeof cache == "undefined")
    cache = e, res = "";
  else if (res.length >= n)
    return res.substr(0, n);
  for (; n > res.length && t > 1; )
    t & 1 && (res += e), t >>= 1, e += e;
  return res += e, res = res.substr(0, n), res;
}
var markdownTable_1 = markdownTable, trailingWhitespace = / +$/, space = " ", lineFeed = `
`, dash = "-", colon = ":", verticalBar = "|", x = 0, C = 67, L = 76, R = 82, c = 99, l = 108, r = 114;
function markdownTable(e, t) {
  for (var n = t || {}, s = n.padding !== !1, o = n.delimiterStart !== !1, i = n.delimiterEnd !== !1, p = (n.align || []).concat(), a = n.alignDelimiters !== !1, u = [], h = n.stringLength || defaultStringLength, b = -1, y = e.length, _ = [], E = [], P = [], G = [], d = [], f = 0, w, m, g, T, v, O, $, A, k, D, S; ++b < y; ) {
    for (w = e[b], m = -1, g = w.length, P = [], G = [], g > f && (f = g); ++m < g; )
      O = serialize(w[m]), a === !0 && (v = h(O), G[m] = v, T = d[m], (T === void 0 || v > T) && (d[m] = v)), P.push(O);
    _[b] = P, E[b] = G;
  }
  if (m = -1, g = f, typeof p == "object" && "length" in p)
    for (; ++m < g; )
      u[m] = toAlignment(p[m]);
  else
    for (S = toAlignment(p); ++m < g; )
      u[m] = S;
  for (m = -1, g = f, P = [], G = []; ++m < g; )
    S = u[m], k = "", D = "", S === l ? k = colon : S === r ? D = colon : S === c && (k = colon, D = colon), v = a ? Math.max(1, d[m] - k.length - D.length) : 1, O = k + repeatString(dash, v) + D, a === !0 && (v = k.length + v + D.length, v > d[m] && (d[m] = v), G[m] = v), P[m] = O;
  for (_.splice(1, 0, P), E.splice(1, 0, G), b = -1, y = _.length, $ = []; ++b < y; ) {
    for (P = _[b], G = E[b], m = -1, g = f, A = []; ++m < g; )
      O = P[m] || "", k = "", D = "", a === !0 && (v = d[m] - (G[m] || 0), S = u[m], S === r ? k = repeatString(space, v) : S === c ? v % 2 == 0 ? (k = repeatString(space, v / 2), D = k) : (k = repeatString(space, v / 2 + 0.5), D = repeatString(space, v / 2 - 0.5)) : D = repeatString(space, v)), o === !0 && m === 0 && A.push(verticalBar), s === !0 && !(a === !1 && O === "") && (o === !0 || m !== 0) && A.push(space), a === !0 && A.push(k), A.push(O), a === !0 && A.push(D), s === !0 && A.push(space), (i === !0 || m !== g - 1) && A.push(verticalBar);
    A = A.join(""), i === !1 && (A = A.replace(trailingWhitespace, "")), $.push(A);
  }
  return $.join(lineFeed);
}
function serialize(e) {
  return e == null ? "" : String(e);
}
function defaultStringLength(e) {
  return e.length;
}
function toAlignment(e) {
  var t = typeof e == "string" ? e.charCodeAt(0) : x;
  return t === L || t === l ? l : t === R || t === r ? r : t === C || t === c ? c : x;
}
function noop() {
  for (var e = [], t = 0; t < arguments.length; t++)
    e[t] = arguments[t];
}
function createWeakMap() {
  return typeof WeakMap != "undefined" ? new WeakMap() : fakeSetOrMap();
}
function fakeSetOrMap() {
  return {
    add: noop,
    delete: noop,
    get: noop,
    set: noop,
    has: function(e) {
      return !1;
    }
  };
}
var hop = Object.prototype.hasOwnProperty, has = function(e, t) {
  return hop.call(e, t);
};
function extend(e, t) {
  for (var n in t)
    has(t, n) && (e[n] = t[n]);
  return e;
}
var reLeadingNewline = /^[ \t]*(?:\r\n|\r|\n)/, reTrailingNewline = /(?:\r\n|\r|\n)[ \t]*$/, reStartsWithNewlineOrIsEmpty = /^(?:[\r\n]|$)/, reDetectIndentation = /(?:\r\n|\r|\n)([ \t]*)(?:[^ \t\r\n]|$)/, reOnlyWhitespaceWithAtLeastOneNewline = /^[ \t]*[\r\n][ \t\r\n]*$/;
function _outdentArray(e, t, n) {
  var s = 0, o = e[0].match(reDetectIndentation);
  o && (s = o[1].length);
  var i = "(\\r\\n|\\r|\\n).{0," + s + "}", p = new RegExp(i, "g");
  t && (e = e.slice(1));
  var a = n.newline, u = n.trimLeadingNewline, h = n.trimTrailingNewline, b = typeof a == "string", y = e.length, _ = e.map(function(E, P) {
    return E = E.replace(p, "$1"), P === 0 && u && (E = E.replace(reLeadingNewline, "")), P === y - 1 && h && (E = E.replace(reTrailingNewline, "")), b && (E = E.replace(/\r\n|\n|\r/g, function(G) {
      return a;
    })), E;
  });
  return _;
}
function concatStringsAndValues(e, t) {
  for (var n = "", s = 0, o = e.length; s < o; s++)
    n += e[s], s < o - 1 && (n += t[s]);
  return n;
}
function isTemplateStringsArray(e) {
  return has(e, "raw") && has(e, "length");
}
function createInstance(e) {
  var t = createWeakMap(), n = createWeakMap();
  function s(i) {
    for (var p = [], a = 1; a < arguments.length; a++)
      p[a - 1] = arguments[a];
    if (isTemplateStringsArray(i)) {
      var u = i, h = (p[0] === s || p[0] === defaultOutdent) && reOnlyWhitespaceWithAtLeastOneNewline.test(u[0]) && reStartsWithNewlineOrIsEmpty.test(u[1]), b = h ? n : t, y = b.get(u);
      if (y || (y = _outdentArray(u, h, e), b.set(u, y)), p.length === 0)
        return y[0];
      var _ = concatStringsAndValues(y, h ? p.slice(1) : p);
      return _;
    } else
      return createInstance(extend(extend({}, e), i || {}));
  }
  var o = extend(s, {
    string: function(i) {
      return _outdentArray([i], !1, e)[0];
    }
  });
  return o;
}
var defaultOutdent = createInstance({
  trimLeadingNewline: !0,
  trimTrailingNewline: !0
});
if (typeof module != "undefined")
  try {
    module.exports = defaultOutdent, Object.defineProperty(defaultOutdent, "__esModule", { value: !0 }), defaultOutdent.default = defaultOutdent, defaultOutdent.outdent = defaultOutdent;
  } catch (e) {
  }
var freeGlobal = typeof global == "object" && global && global.Object === Object && global, freeGlobal$1 = freeGlobal, freeSelf = typeof self == "object" && self && self.Object === Object && self, root = freeGlobal$1 || freeSelf || Function("return this")(), root$1 = root, Symbol$1 = root$1.Symbol, Symbol$2 = Symbol$1, objectProto$b = Object.prototype, hasOwnProperty$8 = objectProto$b.hasOwnProperty, nativeObjectToString$1 = objectProto$b.toString, symToStringTag$1 = Symbol$2 ? Symbol$2.toStringTag : void 0;
function getRawTag(e) {
  var t = hasOwnProperty$8.call(e, symToStringTag$1), n = e[symToStringTag$1];
  try {
    e[symToStringTag$1] = void 0;
    var s = !0;
  } catch (i) {
  }
  var o = nativeObjectToString$1.call(e);
  return s && (t ? e[symToStringTag$1] = n : delete e[symToStringTag$1]), o;
}
var objectProto$a = Object.prototype, nativeObjectToString = objectProto$a.toString;
function objectToString(e) {
  return nativeObjectToString.call(e);
}
var nullTag = "[object Null]", undefinedTag = "[object Undefined]", symToStringTag = Symbol$2 ? Symbol$2.toStringTag : void 0;
function baseGetTag(e) {
  return e == null ? e === void 0 ? undefinedTag : nullTag : symToStringTag && symToStringTag in Object(e) ? getRawTag(e) : objectToString(e);
}
function isObjectLike(e) {
  return e != null && typeof e == "object";
}
var symbolTag$1 = "[object Symbol]";
function isSymbol(e) {
  return typeof e == "symbol" || isObjectLike(e) && baseGetTag(e) == symbolTag$1;
}
function arrayMap(e, t) {
  for (var n = -1, s = e == null ? 0 : e.length, o = Array(s); ++n < s; )
    o[n] = t(e[n], n, e);
  return o;
}
var isArray = Array.isArray, isArray$1 = isArray, INFINITY$2 = 1 / 0, symbolProto$1 = Symbol$2 ? Symbol$2.prototype : void 0, symbolToString = symbolProto$1 ? symbolProto$1.toString : void 0;
function baseToString(e) {
  if (typeof e == "string")
    return e;
  if (isArray$1(e))
    return arrayMap(e, baseToString) + "";
  if (isSymbol(e))
    return symbolToString ? symbolToString.call(e) : "";
  var t = e + "";
  return t == "0" && 1 / e == -INFINITY$2 ? "-0" : t;
}
var reWhitespace = /\s/;
function trimmedEndIndex(e) {
  for (var t = e.length; t-- && reWhitespace.test(e.charAt(t)); )
    ;
  return t;
}
var reTrimStart = /^\s+/;
function baseTrim(e) {
  return e && e.slice(0, trimmedEndIndex(e) + 1).replace(reTrimStart, "");
}
function isObject(e) {
  var t = typeof e;
  return e != null && (t == "object" || t == "function");
}
var NAN = 0 / 0, reIsBadHex = /^[-+]0x[0-9a-f]+$/i, reIsBinary = /^0b[01]+$/i, reIsOctal = /^0o[0-7]+$/i, freeParseInt = parseInt;
function toNumber(e) {
  if (typeof e == "number")
    return e;
  if (isSymbol(e))
    return NAN;
  if (isObject(e)) {
    var t = typeof e.valueOf == "function" ? e.valueOf() : e;
    e = isObject(t) ? t + "" : t;
  }
  if (typeof e != "string")
    return e === 0 ? e : +e;
  e = baseTrim(e);
  var n = reIsBinary.test(e);
  return n || reIsOctal.test(e) ? freeParseInt(e.slice(2), n ? 2 : 8) : reIsBadHex.test(e) ? NAN : +e;
}
var INFINITY$1 = 1 / 0, MAX_INTEGER = 17976931348623157e292;
function toFinite(e) {
  if (!e)
    return e === 0 ? e : 0;
  if (e = toNumber(e), e === INFINITY$1 || e === -INFINITY$1) {
    var t = e < 0 ? -1 : 1;
    return t * MAX_INTEGER;
  }
  return e === e ? e : 0;
}
function toInteger(e) {
  var t = toFinite(e), n = t % 1;
  return t === t ? n ? t - n : t : 0;
}
function identity(e) {
  return e;
}
var asyncTag = "[object AsyncFunction]", funcTag$1 = "[object Function]", genTag = "[object GeneratorFunction]", proxyTag = "[object Proxy]";
function isFunction(e) {
  if (!isObject(e))
    return !1;
  var t = baseGetTag(e);
  return t == funcTag$1 || t == genTag || t == asyncTag || t == proxyTag;
}
var coreJsData = root$1["__core-js_shared__"], coreJsData$1 = coreJsData, maskSrcKey = function() {
  var e = /[^.]+$/.exec(coreJsData$1 && coreJsData$1.keys && coreJsData$1.keys.IE_PROTO || "");
  return e ? "Symbol(src)_1." + e : "";
}();
function isMasked(e) {
  return !!maskSrcKey && maskSrcKey in e;
}
var funcProto$1 = Function.prototype, funcToString$1 = funcProto$1.toString;
function toSource(e) {
  if (e != null) {
    try {
      return funcToString$1.call(e);
    } catch (t) {
    }
    try {
      return e + "";
    } catch (t) {
    }
  }
  return "";
}
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g, reIsHostCtor = /^\[object .+?Constructor\]$/, funcProto = Function.prototype, objectProto$9 = Object.prototype, funcToString = funcProto.toString, hasOwnProperty$7 = objectProto$9.hasOwnProperty, reIsNative = RegExp("^" + funcToString.call(hasOwnProperty$7).replace(reRegExpChar, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$");
function baseIsNative(e) {
  if (!isObject(e) || isMasked(e))
    return !1;
  var t = isFunction(e) ? reIsNative : reIsHostCtor;
  return t.test(toSource(e));
}
function getValue(e, t) {
  return e == null ? void 0 : e[t];
}
function getNative(e, t) {
  var n = getValue(e, t);
  return baseIsNative(n) ? n : void 0;
}
var WeakMap$1 = getNative(root$1, "WeakMap"), WeakMap$2 = WeakMap$1, MAX_SAFE_INTEGER$1 = 9007199254740991, reIsUint = /^(?:0|[1-9]\d*)$/;
function isIndex(e, t) {
  var n = typeof e;
  return t = t == null ? MAX_SAFE_INTEGER$1 : t, !!t && (n == "number" || n != "symbol" && reIsUint.test(e)) && e > -1 && e % 1 == 0 && e < t;
}
function eq(e, t) {
  return e === t || e !== e && t !== t;
}
var MAX_SAFE_INTEGER = 9007199254740991;
function isLength(e) {
  return typeof e == "number" && e > -1 && e % 1 == 0 && e <= MAX_SAFE_INTEGER;
}
function isArrayLike(e) {
  return e != null && isLength(e.length) && !isFunction(e);
}
var objectProto$8 = Object.prototype;
function isPrototype(e) {
  var t = e && e.constructor, n = typeof t == "function" && t.prototype || objectProto$8;
  return e === n;
}
function baseTimes(e, t) {
  for (var n = -1, s = Array(e); ++n < e; )
    s[n] = t(n);
  return s;
}
var argsTag$2 = "[object Arguments]";
function baseIsArguments(e) {
  return isObjectLike(e) && baseGetTag(e) == argsTag$2;
}
var objectProto$7 = Object.prototype, hasOwnProperty$6 = objectProto$7.hasOwnProperty, propertyIsEnumerable$1 = objectProto$7.propertyIsEnumerable, isArguments = baseIsArguments(function() {
  return arguments;
}()) ? baseIsArguments : function(e) {
  return isObjectLike(e) && hasOwnProperty$6.call(e, "callee") && !propertyIsEnumerable$1.call(e, "callee");
}, isArguments$1 = isArguments;
function stubFalse() {
  return !1;
}
var freeExports$1 = typeof exports == "object" && exports && !exports.nodeType && exports, freeModule$1 = freeExports$1 && typeof module == "object" && module && !module.nodeType && module, moduleExports$1 = freeModule$1 && freeModule$1.exports === freeExports$1, Buffer$1 = moduleExports$1 ? root$1.Buffer : void 0, nativeIsBuffer = Buffer$1 ? Buffer$1.isBuffer : void 0, isBuffer = nativeIsBuffer || stubFalse, isBuffer$1 = isBuffer, argsTag$1 = "[object Arguments]", arrayTag$1 = "[object Array]", boolTag$1 = "[object Boolean]", dateTag$1 = "[object Date]", errorTag$1 = "[object Error]", funcTag = "[object Function]", mapTag$2 = "[object Map]", numberTag$1 = "[object Number]", objectTag$2 = "[object Object]", regexpTag$1 = "[object RegExp]", setTag$2 = "[object Set]", stringTag$1 = "[object String]", weakMapTag$1 = "[object WeakMap]", arrayBufferTag$1 = "[object ArrayBuffer]", dataViewTag$2 = "[object DataView]", float32Tag = "[object Float32Array]", float64Tag = "[object Float64Array]", int8Tag = "[object Int8Array]", int16Tag = "[object Int16Array]", int32Tag = "[object Int32Array]", uint8Tag = "[object Uint8Array]", uint8ClampedTag = "[object Uint8ClampedArray]", uint16Tag = "[object Uint16Array]", uint32Tag = "[object Uint32Array]", typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] = typedArrayTags[int8Tag] = typedArrayTags[int16Tag] = typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] = typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] = typedArrayTags[uint32Tag] = !0, typedArrayTags[argsTag$1] = typedArrayTags[arrayTag$1] = typedArrayTags[arrayBufferTag$1] = typedArrayTags[boolTag$1] = typedArrayTags[dataViewTag$2] = typedArrayTags[dateTag$1] = typedArrayTags[errorTag$1] = typedArrayTags[funcTag] = typedArrayTags[mapTag$2] = typedArrayTags[numberTag$1] = typedArrayTags[objectTag$2] = typedArrayTags[regexpTag$1] = typedArrayTags[setTag$2] = typedArrayTags[stringTag$1] = typedArrayTags[weakMapTag$1] = !1;
function baseIsTypedArray(e) {
  return isObjectLike(e) && isLength(e.length) && !!typedArrayTags[baseGetTag(e)];
}
function baseUnary(e) {
  return function(t) {
    return e(t);
  };
}
var freeExports = typeof exports == "object" && exports && !exports.nodeType && exports, freeModule = freeExports && typeof module == "object" && module && !module.nodeType && module, moduleExports = freeModule && freeModule.exports === freeExports, freeProcess = moduleExports && freeGlobal$1.process, nodeUtil = function() {
  try {
    var e = freeModule && freeModule.require && freeModule.require("util").types;
    return e || freeProcess && freeProcess.binding && freeProcess.binding("util");
  } catch (t) {
  }
}(), nodeUtil$1 = nodeUtil, nodeIsTypedArray = nodeUtil$1 && nodeUtil$1.isTypedArray, isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray, isTypedArray$1 = isTypedArray, objectProto$6 = Object.prototype, hasOwnProperty$5 = objectProto$6.hasOwnProperty;
function arrayLikeKeys(e, t) {
  var n = isArray$1(e), s = !n && isArguments$1(e), o = !n && !s && isBuffer$1(e), i = !n && !s && !o && isTypedArray$1(e), p = n || s || o || i, a = p ? baseTimes(e.length, String) : [], u = a.length;
  for (var h in e)
    (t || hasOwnProperty$5.call(e, h)) && !(p && (h == "length" || o && (h == "offset" || h == "parent") || i && (h == "buffer" || h == "byteLength" || h == "byteOffset") || isIndex(h, u))) && a.push(h);
  return a;
}
function overArg(e, t) {
  return function(n) {
    return e(t(n));
  };
}
var nativeKeys = overArg(Object.keys, Object), nativeKeys$1 = nativeKeys, objectProto$5 = Object.prototype, hasOwnProperty$4 = objectProto$5.hasOwnProperty;
function baseKeys(e) {
  if (!isPrototype(e))
    return nativeKeys$1(e);
  var t = [];
  for (var n in Object(e))
    hasOwnProperty$4.call(e, n) && n != "constructor" && t.push(n);
  return t;
}
function keys(e) {
  return isArrayLike(e) ? arrayLikeKeys(e) : baseKeys(e);
}
var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/, reIsPlainProp = /^\w*$/;
function isKey(e, t) {
  if (isArray$1(e))
    return !1;
  var n = typeof e;
  return n == "number" || n == "symbol" || n == "boolean" || e == null || isSymbol(e) ? !0 : reIsPlainProp.test(e) || !reIsDeepProp.test(e) || t != null && e in Object(t);
}
var nativeCreate = getNative(Object, "create"), nativeCreate$1 = nativeCreate;
function hashClear() {
  this.__data__ = nativeCreate$1 ? nativeCreate$1(null) : {}, this.size = 0;
}
function hashDelete(e) {
  var t = this.has(e) && delete this.__data__[e];
  return this.size -= t ? 1 : 0, t;
}
var HASH_UNDEFINED$2 = "__lodash_hash_undefined__", objectProto$4 = Object.prototype, hasOwnProperty$3 = objectProto$4.hasOwnProperty;
function hashGet(e) {
  var t = this.__data__;
  if (nativeCreate$1) {
    var n = t[e];
    return n === HASH_UNDEFINED$2 ? void 0 : n;
  }
  return hasOwnProperty$3.call(t, e) ? t[e] : void 0;
}
var objectProto$3 = Object.prototype, hasOwnProperty$2 = objectProto$3.hasOwnProperty;
function hashHas(e) {
  var t = this.__data__;
  return nativeCreate$1 ? t[e] !== void 0 : hasOwnProperty$2.call(t, e);
}
var HASH_UNDEFINED$1 = "__lodash_hash_undefined__";
function hashSet(e, t) {
  var n = this.__data__;
  return this.size += this.has(e) ? 0 : 1, n[e] = nativeCreate$1 && t === void 0 ? HASH_UNDEFINED$1 : t, this;
}
function Hash(e) {
  var t = -1, n = e == null ? 0 : e.length;
  for (this.clear(); ++t < n; ) {
    var s = e[t];
    this.set(s[0], s[1]);
  }
}
Hash.prototype.clear = hashClear, Hash.prototype.delete = hashDelete, Hash.prototype.get = hashGet, Hash.prototype.has = hashHas, Hash.prototype.set = hashSet;
function listCacheClear() {
  this.__data__ = [], this.size = 0;
}
function assocIndexOf(e, t) {
  for (var n = e.length; n--; )
    if (eq(e[n][0], t))
      return n;
  return -1;
}
var arrayProto = Array.prototype, splice = arrayProto.splice;
function listCacheDelete(e) {
  var t = this.__data__, n = assocIndexOf(t, e);
  if (n < 0)
    return !1;
  var s = t.length - 1;
  return n == s ? t.pop() : splice.call(t, n, 1), --this.size, !0;
}
function listCacheGet(e) {
  var t = this.__data__, n = assocIndexOf(t, e);
  return n < 0 ? void 0 : t[n][1];
}
function listCacheHas(e) {
  return assocIndexOf(this.__data__, e) > -1;
}
function listCacheSet(e, t) {
  var n = this.__data__, s = assocIndexOf(n, e);
  return s < 0 ? (++this.size, n.push([e, t])) : n[s][1] = t, this;
}
function ListCache(e) {
  var t = -1, n = e == null ? 0 : e.length;
  for (this.clear(); ++t < n; ) {
    var s = e[t];
    this.set(s[0], s[1]);
  }
}
ListCache.prototype.clear = listCacheClear, ListCache.prototype.delete = listCacheDelete, ListCache.prototype.get = listCacheGet, ListCache.prototype.has = listCacheHas, ListCache.prototype.set = listCacheSet;
var Map = getNative(root$1, "Map"), Map$1 = Map;
function mapCacheClear() {
  this.size = 0, this.__data__ = {
    hash: new Hash(),
    map: new (Map$1 || ListCache)(),
    string: new Hash()
  };
}
function isKeyable(e) {
  var t = typeof e;
  return t == "string" || t == "number" || t == "symbol" || t == "boolean" ? e !== "__proto__" : e === null;
}
function getMapData(e, t) {
  var n = e.__data__;
  return isKeyable(t) ? n[typeof t == "string" ? "string" : "hash"] : n.map;
}
function mapCacheDelete(e) {
  var t = getMapData(this, e).delete(e);
  return this.size -= t ? 1 : 0, t;
}
function mapCacheGet(e) {
  return getMapData(this, e).get(e);
}
function mapCacheHas(e) {
  return getMapData(this, e).has(e);
}
function mapCacheSet(e, t) {
  var n = getMapData(this, e), s = n.size;
  return n.set(e, t), this.size += n.size == s ? 0 : 1, this;
}
function MapCache(e) {
  var t = -1, n = e == null ? 0 : e.length;
  for (this.clear(); ++t < n; ) {
    var s = e[t];
    this.set(s[0], s[1]);
  }
}
MapCache.prototype.clear = mapCacheClear, MapCache.prototype.delete = mapCacheDelete, MapCache.prototype.get = mapCacheGet, MapCache.prototype.has = mapCacheHas, MapCache.prototype.set = mapCacheSet;
var FUNC_ERROR_TEXT = "Expected a function";
function memoize(e, t) {
  if (typeof e != "function" || t != null && typeof t != "function")
    throw new TypeError(FUNC_ERROR_TEXT);
  var n = function() {
    var s = arguments, o = t ? t.apply(this, s) : s[0], i = n.cache;
    if (i.has(o))
      return i.get(o);
    var p = e.apply(this, s);
    return n.cache = i.set(o, p) || i, p;
  };
  return n.cache = new (memoize.Cache || MapCache)(), n;
}
memoize.Cache = MapCache;
var MAX_MEMOIZE_SIZE = 500;
function memoizeCapped(e) {
  var t = memoize(e, function(s) {
    return n.size === MAX_MEMOIZE_SIZE && n.clear(), s;
  }), n = t.cache;
  return t;
}
var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g, reEscapeChar = /\\(\\)?/g, stringToPath = memoizeCapped(function(e) {
  var t = [];
  return e.charCodeAt(0) === 46 && t.push(""), e.replace(rePropName, function(n, s, o, i) {
    t.push(o ? i.replace(reEscapeChar, "$1") : s || n);
  }), t;
}), stringToPath$1 = stringToPath;
function toString(e) {
  return e == null ? "" : baseToString(e);
}
function castPath(e, t) {
  return isArray$1(e) ? e : isKey(e, t) ? [e] : stringToPath$1(toString(e));
}
var INFINITY = 1 / 0;
function toKey(e) {
  if (typeof e == "string" || isSymbol(e))
    return e;
  var t = e + "";
  return t == "0" && 1 / e == -INFINITY ? "-0" : t;
}
function baseGet(e, t) {
  t = castPath(t, e);
  for (var n = 0, s = t.length; e != null && n < s; )
    e = e[toKey(t[n++])];
  return n && n == s ? e : void 0;
}
function get(e, t, n) {
  var s = e == null ? void 0 : baseGet(e, t);
  return s === void 0 ? n : s;
}
function arrayPush(e, t) {
  for (var n = -1, s = t.length, o = e.length; ++n < s; )
    e[o + n] = t[n];
  return e;
}
var nativeIsFinite = root$1.isFinite, nativeMin = Math.min;
function createRound(e) {
  var t = Math[e];
  return function(n, s) {
    if (n = toNumber(n), s = s == null ? 0 : nativeMin(toInteger(s), 292), s && nativeIsFinite(n)) {
      var o = (toString(n) + "e").split("e"), i = t(o[0] + "e" + (+o[1] + s));
      return o = (toString(i) + "e").split("e"), +(o[0] + "e" + (+o[1] - s));
    }
    return t(n);
  };
}
function stackClear() {
  this.__data__ = new ListCache(), this.size = 0;
}
function stackDelete(e) {
  var t = this.__data__, n = t.delete(e);
  return this.size = t.size, n;
}
function stackGet(e) {
  return this.__data__.get(e);
}
function stackHas(e) {
  return this.__data__.has(e);
}
var LARGE_ARRAY_SIZE = 200;
function stackSet(e, t) {
  var n = this.__data__;
  if (n instanceof ListCache) {
    var s = n.__data__;
    if (!Map$1 || s.length < LARGE_ARRAY_SIZE - 1)
      return s.push([e, t]), this.size = ++n.size, this;
    n = this.__data__ = new MapCache(s);
  }
  return n.set(e, t), this.size = n.size, this;
}
function Stack(e) {
  var t = this.__data__ = new ListCache(e);
  this.size = t.size;
}
Stack.prototype.clear = stackClear, Stack.prototype.delete = stackDelete, Stack.prototype.get = stackGet, Stack.prototype.has = stackHas, Stack.prototype.set = stackSet;
function arrayFilter(e, t) {
  for (var n = -1, s = e == null ? 0 : e.length, o = 0, i = []; ++n < s; ) {
    var p = e[n];
    t(p, n, e) && (i[o++] = p);
  }
  return i;
}
function stubArray() {
  return [];
}
var objectProto$2 = Object.prototype, propertyIsEnumerable = objectProto$2.propertyIsEnumerable, nativeGetSymbols = Object.getOwnPropertySymbols, getSymbols = nativeGetSymbols ? function(e) {
  return e == null ? [] : (e = Object(e), arrayFilter(nativeGetSymbols(e), function(t) {
    return propertyIsEnumerable.call(e, t);
  }));
} : stubArray, getSymbols$1 = getSymbols;
function baseGetAllKeys(e, t, n) {
  var s = t(e);
  return isArray$1(e) ? s : arrayPush(s, n(e));
}
function getAllKeys(e) {
  return baseGetAllKeys(e, keys, getSymbols$1);
}
var DataView = getNative(root$1, "DataView"), DataView$1 = DataView, Promise$1 = getNative(root$1, "Promise"), Promise$2 = Promise$1, Set = getNative(root$1, "Set"), Set$1 = Set, mapTag$1 = "[object Map]", objectTag$1 = "[object Object]", promiseTag = "[object Promise]", setTag$1 = "[object Set]", weakMapTag = "[object WeakMap]", dataViewTag$1 = "[object DataView]", dataViewCtorString = toSource(DataView$1), mapCtorString = toSource(Map$1), promiseCtorString = toSource(Promise$2), setCtorString = toSource(Set$1), weakMapCtorString = toSource(WeakMap$2), getTag = baseGetTag;
(DataView$1 && getTag(new DataView$1(new ArrayBuffer(1))) != dataViewTag$1 || Map$1 && getTag(new Map$1()) != mapTag$1 || Promise$2 && getTag(Promise$2.resolve()) != promiseTag || Set$1 && getTag(new Set$1()) != setTag$1 || WeakMap$2 && getTag(new WeakMap$2()) != weakMapTag) && (getTag = function(e) {
  var t = baseGetTag(e), n = t == objectTag$1 ? e.constructor : void 0, s = n ? toSource(n) : "";
  if (s)
    switch (s) {
      case dataViewCtorString:
        return dataViewTag$1;
      case mapCtorString:
        return mapTag$1;
      case promiseCtorString:
        return promiseTag;
      case setCtorString:
        return setTag$1;
      case weakMapCtorString:
        return weakMapTag;
    }
  return t;
});
var getTag$1 = getTag, Uint8Array = root$1.Uint8Array, Uint8Array$1 = Uint8Array, HASH_UNDEFINED = "__lodash_hash_undefined__";
function setCacheAdd(e) {
  return this.__data__.set(e, HASH_UNDEFINED), this;
}
function setCacheHas(e) {
  return this.__data__.has(e);
}
function SetCache(e) {
  var t = -1, n = e == null ? 0 : e.length;
  for (this.__data__ = new MapCache(); ++t < n; )
    this.add(e[t]);
}
SetCache.prototype.add = SetCache.prototype.push = setCacheAdd, SetCache.prototype.has = setCacheHas;
function arraySome(e, t) {
  for (var n = -1, s = e == null ? 0 : e.length; ++n < s; )
    if (t(e[n], n, e))
      return !0;
  return !1;
}
function cacheHas(e, t) {
  return e.has(t);
}
var COMPARE_PARTIAL_FLAG$5 = 1, COMPARE_UNORDERED_FLAG$3 = 2;
function equalArrays(e, t, n, s, o, i) {
  var p = n & COMPARE_PARTIAL_FLAG$5, a = e.length, u = t.length;
  if (a != u && !(p && u > a))
    return !1;
  var h = i.get(e), b = i.get(t);
  if (h && b)
    return h == t && b == e;
  var y = -1, _ = !0, E = n & COMPARE_UNORDERED_FLAG$3 ? new SetCache() : void 0;
  for (i.set(e, t), i.set(t, e); ++y < a; ) {
    var P = e[y], G = t[y];
    if (s)
      var d = p ? s(G, P, y, t, e, i) : s(P, G, y, e, t, i);
    if (d !== void 0) {
      if (d)
        continue;
      _ = !1;
      break;
    }
    if (E) {
      if (!arraySome(t, function(f, w) {
        if (!cacheHas(E, w) && (P === f || o(P, f, n, s, i)))
          return E.push(w);
      })) {
        _ = !1;
        break;
      }
    } else if (!(P === G || o(P, G, n, s, i))) {
      _ = !1;
      break;
    }
  }
  return i.delete(e), i.delete(t), _;
}
function mapToArray(e) {
  var t = -1, n = Array(e.size);
  return e.forEach(function(s, o) {
    n[++t] = [o, s];
  }), n;
}
function setToArray(e) {
  var t = -1, n = Array(e.size);
  return e.forEach(function(s) {
    n[++t] = s;
  }), n;
}
var COMPARE_PARTIAL_FLAG$4 = 1, COMPARE_UNORDERED_FLAG$2 = 2, boolTag = "[object Boolean]", dateTag = "[object Date]", errorTag = "[object Error]", mapTag = "[object Map]", numberTag = "[object Number]", regexpTag = "[object RegExp]", setTag = "[object Set]", stringTag = "[object String]", symbolTag = "[object Symbol]", arrayBufferTag = "[object ArrayBuffer]", dataViewTag = "[object DataView]", symbolProto = Symbol$2 ? Symbol$2.prototype : void 0, symbolValueOf = symbolProto ? symbolProto.valueOf : void 0;
function equalByTag(e, t, n, s, o, i, p) {
  switch (n) {
    case dataViewTag:
      if (e.byteLength != t.byteLength || e.byteOffset != t.byteOffset)
        return !1;
      e = e.buffer, t = t.buffer;
    case arrayBufferTag:
      return !(e.byteLength != t.byteLength || !i(new Uint8Array$1(e), new Uint8Array$1(t)));
    case boolTag:
    case dateTag:
    case numberTag:
      return eq(+e, +t);
    case errorTag:
      return e.name == t.name && e.message == t.message;
    case regexpTag:
    case stringTag:
      return e == t + "";
    case mapTag:
      var a = mapToArray;
    case setTag:
      var u = s & COMPARE_PARTIAL_FLAG$4;
      if (a || (a = setToArray), e.size != t.size && !u)
        return !1;
      var h = p.get(e);
      if (h)
        return h == t;
      s |= COMPARE_UNORDERED_FLAG$2, p.set(e, t);
      var b = equalArrays(a(e), a(t), s, o, i, p);
      return p.delete(e), b;
    case symbolTag:
      if (symbolValueOf)
        return symbolValueOf.call(e) == symbolValueOf.call(t);
  }
  return !1;
}
var COMPARE_PARTIAL_FLAG$3 = 1, objectProto$1 = Object.prototype, hasOwnProperty$1 = objectProto$1.hasOwnProperty;
function equalObjects(e, t, n, s, o, i) {
  var p = n & COMPARE_PARTIAL_FLAG$3, a = getAllKeys(e), u = a.length, h = getAllKeys(t), b = h.length;
  if (u != b && !p)
    return !1;
  for (var y = u; y--; ) {
    var _ = a[y];
    if (!(p ? _ in t : hasOwnProperty$1.call(t, _)))
      return !1;
  }
  var E = i.get(e), P = i.get(t);
  if (E && P)
    return E == t && P == e;
  var G = !0;
  i.set(e, t), i.set(t, e);
  for (var d = p; ++y < u; ) {
    _ = a[y];
    var f = e[_], w = t[_];
    if (s)
      var m = p ? s(w, f, _, t, e, i) : s(f, w, _, e, t, i);
    if (!(m === void 0 ? f === w || o(f, w, n, s, i) : m)) {
      G = !1;
      break;
    }
    d || (d = _ == "constructor");
  }
  if (G && !d) {
    var g = e.constructor, T = t.constructor;
    g != T && "constructor" in e && "constructor" in t && !(typeof g == "function" && g instanceof g && typeof T == "function" && T instanceof T) && (G = !1);
  }
  return i.delete(e), i.delete(t), G;
}
var COMPARE_PARTIAL_FLAG$2 = 1, argsTag = "[object Arguments]", arrayTag = "[object Array]", objectTag = "[object Object]", objectProto = Object.prototype, hasOwnProperty = objectProto.hasOwnProperty;
function baseIsEqualDeep(e, t, n, s, o, i) {
  var p = isArray$1(e), a = isArray$1(t), u = p ? arrayTag : getTag$1(e), h = a ? arrayTag : getTag$1(t);
  u = u == argsTag ? objectTag : u, h = h == argsTag ? objectTag : h;
  var b = u == objectTag, y = h == objectTag, _ = u == h;
  if (_ && isBuffer$1(e)) {
    if (!isBuffer$1(t))
      return !1;
    p = !0, b = !1;
  }
  if (_ && !b)
    return i || (i = new Stack()), p || isTypedArray$1(e) ? equalArrays(e, t, n, s, o, i) : equalByTag(e, t, u, n, s, o, i);
  if (!(n & COMPARE_PARTIAL_FLAG$2)) {
    var E = b && hasOwnProperty.call(e, "__wrapped__"), P = y && hasOwnProperty.call(t, "__wrapped__");
    if (E || P) {
      var G = E ? e.value() : e, d = P ? t.value() : t;
      return i || (i = new Stack()), o(G, d, n, s, i);
    }
  }
  return _ ? (i || (i = new Stack()), equalObjects(e, t, n, s, o, i)) : !1;
}
function baseIsEqual(e, t, n, s, o) {
  return e === t ? !0 : e == null || t == null || !isObjectLike(e) && !isObjectLike(t) ? e !== e && t !== t : baseIsEqualDeep(e, t, n, s, baseIsEqual, o);
}
var COMPARE_PARTIAL_FLAG$1 = 1, COMPARE_UNORDERED_FLAG$1 = 2;
function baseIsMatch(e, t, n, s) {
  var o = n.length, i = o, p = !s;
  if (e == null)
    return !i;
  for (e = Object(e); o--; ) {
    var a = n[o];
    if (p && a[2] ? a[1] !== e[a[0]] : !(a[0] in e))
      return !1;
  }
  for (; ++o < i; ) {
    a = n[o];
    var u = a[0], h = e[u], b = a[1];
    if (p && a[2]) {
      if (h === void 0 && !(u in e))
        return !1;
    } else {
      var y = new Stack();
      if (s)
        var _ = s(h, b, u, e, t, y);
      if (!(_ === void 0 ? baseIsEqual(b, h, COMPARE_PARTIAL_FLAG$1 | COMPARE_UNORDERED_FLAG$1, s, y) : _))
        return !1;
    }
  }
  return !0;
}
function isStrictComparable(e) {
  return e === e && !isObject(e);
}
function getMatchData(e) {
  for (var t = keys(e), n = t.length; n--; ) {
    var s = t[n], o = e[s];
    t[n] = [s, o, isStrictComparable(o)];
  }
  return t;
}
function matchesStrictComparable(e, t) {
  return function(n) {
    return n == null ? !1 : n[e] === t && (t !== void 0 || e in Object(n));
  };
}
function baseMatches(e) {
  var t = getMatchData(e);
  return t.length == 1 && t[0][2] ? matchesStrictComparable(t[0][0], t[0][1]) : function(n) {
    return n === e || baseIsMatch(n, e, t);
  };
}
function baseHasIn(e, t) {
  return e != null && t in Object(e);
}
function hasPath(e, t, n) {
  t = castPath(t, e);
  for (var s = -1, o = t.length, i = !1; ++s < o; ) {
    var p = toKey(t[s]);
    if (!(i = e != null && n(e, p)))
      break;
    e = e[p];
  }
  return i || ++s != o ? i : (o = e == null ? 0 : e.length, !!o && isLength(o) && isIndex(p, o) && (isArray$1(e) || isArguments$1(e)));
}
function hasIn(e, t) {
  return e != null && hasPath(e, t, baseHasIn);
}
var COMPARE_PARTIAL_FLAG = 1, COMPARE_UNORDERED_FLAG = 2;
function baseMatchesProperty(e, t) {
  return isKey(e) && isStrictComparable(t) ? matchesStrictComparable(toKey(e), t) : function(n) {
    var s = get(n, e);
    return s === void 0 && s === t ? hasIn(n, e) : baseIsEqual(t, s, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG);
  };
}
function baseProperty(e) {
  return function(t) {
    return t == null ? void 0 : t[e];
  };
}
function basePropertyDeep(e) {
  return function(t) {
    return baseGet(t, e);
  };
}
function property(e) {
  return isKey(e) ? baseProperty(toKey(e)) : basePropertyDeep(e);
}
function baseIteratee(e) {
  return typeof e == "function" ? e : e == null ? identity : typeof e == "object" ? isArray$1(e) ? baseMatchesProperty(e[0], e[1]) : baseMatches(e) : property(e);
}
function arrayAggregator(e, t, n, s) {
  for (var o = -1, i = e == null ? 0 : e.length; ++o < i; ) {
    var p = e[o];
    t(s, p, n(p), e);
  }
  return s;
}
function createBaseFor(e) {
  return function(t, n, s) {
    for (var o = -1, i = Object(t), p = s(t), a = p.length; a--; ) {
      var u = p[e ? a : ++o];
      if (n(i[u], u, i) === !1)
        break;
    }
    return t;
  };
}
var baseFor = createBaseFor(), baseFor$1 = baseFor;
function baseForOwn(e, t) {
  return e && baseFor$1(e, t, keys);
}
function createBaseEach(e, t) {
  return function(n, s) {
    if (n == null)
      return n;
    if (!isArrayLike(n))
      return e(n, s);
    for (var o = n.length, i = t ? o : -1, p = Object(n); (t ? i-- : ++i < o) && s(p[i], i, p) !== !1; )
      ;
    return n;
  };
}
var baseEach = createBaseEach(baseForOwn), baseEach$1 = baseEach;
function baseAggregator(e, t, n, s) {
  return baseEach$1(e, function(o, i, p) {
    t(s, o, n(o), p);
  }), s;
}
function createAggregator(e, t) {
  return function(n, s) {
    var o = isArray$1(n) ? arrayAggregator : baseAggregator, i = t ? t() : {};
    return o(n, e, baseIteratee(s), i);
  };
}
var partition = createAggregator(function(e, t, n) {
  e[n ? 0 : 1].push(t);
}, function() {
  return [[], []];
}), partition$1 = partition, round = createRound("round"), round$1 = round, globToRegexp = function(e, t) {
  if (typeof e != "string")
    throw new TypeError("Expected a string");
  for (var n = String(e), s = "", o = t ? !!t.extended : !1, i = t ? !!t.globstar : !1, p = !1, a = t && typeof t.flags == "string" ? t.flags : "", u, h = 0, b = n.length; h < b; h++)
    switch (u = n[h], u) {
      case "/":
      case "$":
      case "^":
      case "+":
      case ".":
      case "(":
      case ")":
      case "=":
      case "!":
      case "|":
        s += "\\" + u;
        break;
      case "?":
        if (o) {
          s += ".";
          break;
        }
      case "[":
      case "]":
        if (o) {
          s += u;
          break;
        }
      case "{":
        if (o) {
          p = !0, s += "(";
          break;
        }
      case "}":
        if (o) {
          p = !1, s += ")";
          break;
        }
      case ",":
        if (p) {
          s += "|";
          break;
        }
        s += "\\" + u;
        break;
      case "*":
        for (var y = n[h - 1], _ = 1; n[h + 1] === "*"; )
          _++, h++;
        var E = n[h + 1];
        if (!i)
          s += ".*";
        else {
          var P = _ > 1 && (y === "/" || y === void 0) && (E === "/" || E === void 0);
          P ? (s += "((?:[^/]*(?:/|$))*)", h++) : s += "([^/]*)";
        }
        break;
      default:
        s += u;
    }
  return (!a || !~a.indexOf("g")) && (s = "^" + s + "$"), new RegExp(s, a);
};
function partionHidden(e, t) {
  if (!e)
    return [[], t];
  const n = globToRegexp(e, { extended: !0 });
  return partition$1(t, (s) => n.test(s.path));
}
function getSizeLabels(e) {
  return e.length === 1 && e[0].property === "size" ? "" : ` (${e.map((t) => t.label).join(" / ")})`;
}
const supportedSizes = {
  uncompressed: {
    label: "Size",
    property: "size"
  },
  gzip: {
    label: "Gzip",
    property: "sizeGzip"
  },
  brotli: {
    label: "Brotli",
    property: "sizeBrotli"
  }
};
function parseDisplaySize(e) {
  return e.split(",").map((t) => t.trim()).filter((t) => supportedSizes.hasOwnProperty(t)).map((t) => supportedSizes[t]);
}
const listSizes = (e, t) => e.map(({ property: n }) => t(n)).join(" / ");
function sortFiles(e, t, n) {
  e.sort((s, o) => o[t] - s[t] || s.path.localeCompare(o.path)), n === "asc" && e.reverse();
}
var __defProp$3 = Object.defineProperty, __defProps$3 = Object.defineProperties, __getOwnPropDescs$3 = Object.getOwnPropertyDescriptors, __getOwnPropSymbols$3 = Object.getOwnPropertySymbols, __hasOwnProp$3 = Object.prototype.hasOwnProperty, __propIsEnum$3 = Object.prototype.propertyIsEnumerable, __defNormalProp$3 = (e, t, n) => t in e ? __defProp$3(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n, __spreadValues$3 = (e, t) => {
  for (var n in t || (t = {}))
    __hasOwnProp$3.call(t, n) && __defNormalProp$3(e, n, t[n]);
  if (__getOwnPropSymbols$3)
    for (var n of __getOwnPropSymbols$3(t))
      __propIsEnum$3.call(t, n) && __defNormalProp$3(e, n, t[n]);
  return e;
}, __spreadProps$3 = (e, t) => __defProps$3(e, __getOwnPropDescs$3(t));
const percent = (e) => (e < 1e-3 ? e = round$1(e, 4) : e < 0.01 ? e = round$1(e, 3) : e = round$1(e, 2), e.toLocaleString(void 0, {
  style: "percent",
  maximumSignificantDigits: 3
}));
function calculateDiffBy(e, t, n) {
  const s = e[n] - t[n];
  return {
    delta: s,
    percent: percent(s / t[n])
  };
}
function calculateDiff(e, t) {
  return {
    size: calculateDiffBy(e, t, "size"),
    sizeGzip: calculateDiffBy(e, t, "sizeGzip"),
    sizeBrotli: calculateDiffBy(e, t, "sizeBrotli")
  };
}
function processPkgFiles(e, t, n) {
  for (const s of n.files) {
    e[s.path] || (e[s.path] = {
      path: s.path,
      label: s.label
    });
    const o = e[s.path];
    o[t] = s, o.head && o.base && (o.diff = calculateDiff(o.head, o.base));
  }
}
function comparePackages(e, t, {
  sortBy: n,
  sortOrder: s,
  hideFiles: o
} = {}) {
  const i = {};
  processPkgFiles(i, "head", e), processPkgFiles(i, "base", t);
  const p = Object.values(i);
  sortFiles(p, n, s);
  const [a, u] = partionHidden(o, p), [h, b] = partition$1(u, (y) => y.diff && y.diff.size.delta === 0);
  return {
    head: e,
    base: t,
    diff: __spreadProps$3(__spreadValues$3({}, calculateDiff(e, t)), {
      tarballSize: calculateDiffBy(e, t, "tarballSize")
    }),
    files: {
      changed: b,
      unchanged: h,
      hidden: a
    }
  };
}
const directionSymbol = (e) => e < 0 ? "\u2193" : e > 0 ? "\u2191" : "", formatDelta = ({ delta: e, percent: t }) => e ? t + directionSymbol(e) : "";
function generateComment({
  headPkgData: e,
  basePkgData: t,
  sortBy: n,
  sortOrder: s,
  hideFiles: o,
  unchangedFiles: i,
  displaySize: p
}) {
  const a = comparePackages(e, t, {
    sortBy: n,
    sortOrder: s,
    hideFiles: o
  });
  core.setOutput("regressionData", a);
  const { changed: u, unchanged: h, hidden: b } = a.files, y = parseDisplaySize(p), _ = getSizeLabels(y), E = markdownTable_1([
    ["File", `Before${_}`, `After${_}`],
    ...[
      ...u,
      ...i === "show" ? h : []
    ].map((d) => [
      d.label,
      d.base && d.base.size ? listSizes(y, (f) => c$1(dist(d.base[f]))) : "\u2014",
      d.head && d.head.size ? listSizes(y, (f) => (d.base && d.base[f] ? sup(formatDelta(d.diff[f])) : "") + c$1(dist(d.head[f]))) : "\u2014"
    ]),
    [
      `${strong("Total")} ${i === "show" ? "" : sub("_(Includes all files)_")}`,
      listSizes(y, (d) => c$1(dist(a.base[d]))),
      listSizes(y, (d) => sup(formatDelta(a.diff[d])) + c$1(dist(a.head[d])))
    ],
    [
      strong("Tarball size"),
      c$1(dist(a.base.tarballSize)),
      sup(formatDelta(a.diff.tarballSize)) + c$1(dist(a.head.tarballSize))
    ]
  ], {
    align: ["", "r", "r"]
  });
  let P = "";
  i === "collapse" && h.length > 0 && (P = markdownTable_1([
    ["File", `Size${_}`],
    ...h.map((d) => [
      d.label,
      listSizes(y, (f) => c$1(dist(d.base[f])))
    ])
  ], {
    align: ["", "r"]
  }), P = `<details><summary>Unchanged files</summary>

${P}
</details>`);
  let G = "";
  return b.length > 0 && (G = markdownTable_1([
    ["File", `Before${_}`, `After${_}`],
    ...b.map((d) => [
      d.label,
      d.base && d.base.size ? listSizes(y, (f) => c$1(dist(d.base[f]))) : "\u2014",
      d.head && d.head.size ? listSizes(y, (f) => (d.base && d.base[f] ? sup(formatDelta(d.diff[f])) : "") + c$1(dist(d.head[f]))) : "\u2014"
    ])
  ], {
    align: ["", "r", "r"]
  }), G = `<details><summary>Hidden files</summary>

${G}
</details>`), defaultOutdent`
	### 📊 Package size report&nbsp;&nbsp;&nbsp;<kbd>${formatDelta(a.diff.size) || "No changes"}</kbd>

	${E}

	${P}

	${G}
	`;
}
function headOnly({
  headPkgData: e,
  hideFiles: t,
  displaySize: n,
  sortBy: s,
  sortOrder: o
}) {
  const i = parseDisplaySize(n), p = getSizeLabels(i);
  sortFiles(e.files, s, o);
  const [a, u] = partionHidden(t, e.files), h = markdownTable_1([
    ["File", `Size${p}`],
    ...u.map((y) => [
      y.label,
      listSizes(i, (_) => c$1(dist(y[_])))
    ]),
    [
      strong("Total"),
      listSizes(i, (y) => c$1(dist(e[y])))
    ],
    [
      strong("Tarball size"),
      c$1(dist(e.tarballSize))
    ]
  ], {
    align: ["", "r"]
  });
  let b = "";
  return a.length > 0 && (b = markdownTable_1([
    ["File", `Size${p}`],
    ...a.map((y) => [
      y.label,
      listSizes(i, (_) => c$1(dist(y[_])))
    ])
  ], {
    align: ["", "r"]
  }), b = `<details><summary>Hidden files</summary>

${b}
</details>`), defaultOutdent`
	### 📊 Package size report

	${h}

	${b}
	`;
}
var ioUtil = createCommonjsModule(function(e, t) {
  var n = commonjsGlobal && commonjsGlobal.__createBinding || (Object.create ? function(d, f, w, m) {
    m === void 0 && (m = w), Object.defineProperty(d, m, { enumerable: !0, get: function() {
      return f[w];
    } });
  } : function(d, f, w, m) {
    m === void 0 && (m = w), d[m] = f[w];
  }), s = commonjsGlobal && commonjsGlobal.__setModuleDefault || (Object.create ? function(d, f) {
    Object.defineProperty(d, "default", { enumerable: !0, value: f });
  } : function(d, f) {
    d.default = f;
  }), o = commonjsGlobal && commonjsGlobal.__importStar || function(d) {
    if (d && d.__esModule)
      return d;
    var f = {};
    if (d != null)
      for (var w in d)
        w !== "default" && Object.hasOwnProperty.call(d, w) && n(f, d, w);
    return s(f, d), f;
  }, i = commonjsGlobal && commonjsGlobal.__awaiter || function(d, f, w, m) {
    function g(T) {
      return T instanceof w ? T : new w(function(v) {
        v(T);
      });
    }
    return new (w || (w = Promise))(function(T, v) {
      function O(k) {
        try {
          A(m.next(k));
        } catch (D) {
          v(D);
        }
      }
      function $(k) {
        try {
          A(m.throw(k));
        } catch (D) {
          v(D);
        }
      }
      function A(k) {
        k.done ? T(k.value) : g(k.value).then(O, $);
      }
      A((m = m.apply(d, f || [])).next());
    });
  }, p;
  Object.defineProperty(t, "__esModule", { value: !0 }), t.getCmdPath = t.tryGetExecutablePath = t.isRooted = t.isDirectory = t.exists = t.IS_WINDOWS = t.unlink = t.symlink = t.stat = t.rmdir = t.rename = t.readlink = t.readdir = t.mkdir = t.lstat = t.copyFile = t.chmod = void 0;
  const a = o(fs__default.default), u = o(require$$1__default.default);
  p = a.promises, t.chmod = p.chmod, t.copyFile = p.copyFile, t.lstat = p.lstat, t.mkdir = p.mkdir, t.readdir = p.readdir, t.readlink = p.readlink, t.rename = p.rename, t.rmdir = p.rmdir, t.stat = p.stat, t.symlink = p.symlink, t.unlink = p.unlink, t.IS_WINDOWS = process.platform === "win32";
  function h(d) {
    return i(this, void 0, void 0, function* () {
      try {
        yield t.stat(d);
      } catch (f) {
        if (f.code === "ENOENT")
          return !1;
        throw f;
      }
      return !0;
    });
  }
  t.exists = h;
  function b(d, f = !1) {
    return i(this, void 0, void 0, function* () {
      return (f ? yield t.stat(d) : yield t.lstat(d)).isDirectory();
    });
  }
  t.isDirectory = b;
  function y(d) {
    if (d = E(d), !d)
      throw new Error('isRooted() parameter "p" cannot be empty');
    return t.IS_WINDOWS ? d.startsWith("\\") || /^[A-Z]:/i.test(d) : d.startsWith("/");
  }
  t.isRooted = y;
  function _(d, f) {
    return i(this, void 0, void 0, function* () {
      let w;
      try {
        w = yield t.stat(d);
      } catch (g) {
        g.code !== "ENOENT" && console.log(`Unexpected error attempting to determine if executable file exists '${d}': ${g}`);
      }
      if (w && w.isFile()) {
        if (t.IS_WINDOWS) {
          const g = u.extname(d).toUpperCase();
          if (f.some((T) => T.toUpperCase() === g))
            return d;
        } else if (P(w))
          return d;
      }
      const m = d;
      for (const g of f) {
        d = m + g, w = void 0;
        try {
          w = yield t.stat(d);
        } catch (T) {
          T.code !== "ENOENT" && console.log(`Unexpected error attempting to determine if executable file exists '${d}': ${T}`);
        }
        if (w && w.isFile()) {
          if (t.IS_WINDOWS) {
            try {
              const T = u.dirname(d), v = u.basename(d).toUpperCase();
              for (const O of yield t.readdir(T))
                if (v === O.toUpperCase()) {
                  d = u.join(T, O);
                  break;
                }
            } catch (T) {
              console.log(`Unexpected error attempting to determine the actual case of the file '${d}': ${T}`);
            }
            return d;
          } else if (P(w))
            return d;
        }
      }
      return "";
    });
  }
  t.tryGetExecutablePath = _;
  function E(d) {
    return d = d || "", t.IS_WINDOWS ? (d = d.replace(/\//g, "\\"), d.replace(/\\\\+/g, "\\")) : d.replace(/\/\/+/g, "/");
  }
  function P(d) {
    return (d.mode & 1) > 0 || (d.mode & 8) > 0 && d.gid === process.getgid() || (d.mode & 64) > 0 && d.uid === process.getuid();
  }
  function G() {
    var d;
    return (d = process.env.COMSPEC) !== null && d !== void 0 ? d : "cmd.exe";
  }
  t.getCmdPath = G;
}), io = createCommonjsModule(function(e, t) {
  var n = commonjsGlobal && commonjsGlobal.__createBinding || (Object.create ? function(g, T, v, O) {
    O === void 0 && (O = v), Object.defineProperty(g, O, { enumerable: !0, get: function() {
      return T[v];
    } });
  } : function(g, T, v, O) {
    O === void 0 && (O = v), g[O] = T[v];
  }), s = commonjsGlobal && commonjsGlobal.__setModuleDefault || (Object.create ? function(g, T) {
    Object.defineProperty(g, "default", { enumerable: !0, value: T });
  } : function(g, T) {
    g.default = T;
  }), o = commonjsGlobal && commonjsGlobal.__importStar || function(g) {
    if (g && g.__esModule)
      return g;
    var T = {};
    if (g != null)
      for (var v in g)
        v !== "default" && Object.hasOwnProperty.call(g, v) && n(T, g, v);
    return s(T, g), T;
  }, i = commonjsGlobal && commonjsGlobal.__awaiter || function(g, T, v, O) {
    function $(A) {
      return A instanceof v ? A : new v(function(k) {
        k(A);
      });
    }
    return new (v || (v = Promise))(function(A, k) {
      function D(U) {
        try {
          j(O.next(U));
        } catch (F) {
          k(F);
        }
      }
      function S(U) {
        try {
          j(O.throw(U));
        } catch (F) {
          k(F);
        }
      }
      function j(U) {
        U.done ? A(U.value) : $(U.value).then(D, S);
      }
      j((O = O.apply(g, T || [])).next());
    });
  };
  Object.defineProperty(t, "__esModule", { value: !0 }), t.findInPath = t.which = t.mkdirP = t.rmRF = t.mv = t.cp = void 0;
  const p = o(require$$0__default$1.default), a = o(require$$1__default.default), u = o(ioUtil), h = util_1__default.default.promisify(p.exec), b = util_1__default.default.promisify(p.execFile);
  function y(g, T, v = {}) {
    return i(this, void 0, void 0, function* () {
      const { force: O, recursive: $, copySourceDirectory: A } = f(v), k = (yield u.exists(T)) ? yield u.stat(T) : null;
      if (k && k.isFile() && !O)
        return;
      const D = k && k.isDirectory() && A ? a.join(T, a.basename(g)) : T;
      if (!(yield u.exists(g)))
        throw new Error(`no such file or directory: ${g}`);
      if ((yield u.stat(g)).isDirectory())
        if ($)
          yield w(g, D, 0, O);
        else
          throw new Error(`Failed to copy. ${g} is a directory, but tried to copy without recursive flag.`);
      else {
        if (a.relative(g, D) === "")
          throw new Error(`'${D}' and '${g}' are the same file`);
        yield m(g, D, O);
      }
    });
  }
  t.cp = y;
  function _(g, T, v = {}) {
    return i(this, void 0, void 0, function* () {
      if (yield u.exists(T)) {
        let O = !0;
        if ((yield u.isDirectory(T)) && (T = a.join(T, a.basename(g)), O = yield u.exists(T)), O)
          if (v.force == null || v.force)
            yield E(T);
          else
            throw new Error("Destination already exists");
      }
      yield P(a.dirname(T)), yield u.rename(g, T);
    });
  }
  t.mv = _;
  function E(g) {
    return i(this, void 0, void 0, function* () {
      if (u.IS_WINDOWS) {
        if (/[*"<>|]/.test(g))
          throw new Error('File path must not contain `*`, `"`, `<`, `>` or `|` on Windows');
        try {
          const T = u.getCmdPath();
          (yield u.isDirectory(g, !0)) ? yield h(`${T} /s /c "rd /s /q "%inputPath%""`, {
            env: { inputPath: g }
          }) : yield h(`${T} /s /c "del /f /a "%inputPath%""`, {
            env: { inputPath: g }
          });
        } catch (T) {
          if (T.code !== "ENOENT")
            throw T;
        }
        try {
          yield u.unlink(g);
        } catch (T) {
          if (T.code !== "ENOENT")
            throw T;
        }
      } else {
        let T = !1;
        try {
          T = yield u.isDirectory(g);
        } catch (v) {
          if (v.code !== "ENOENT")
            throw v;
          return;
        }
        T ? yield b("rm", ["-rf", `${g}`]) : yield u.unlink(g);
      }
    });
  }
  t.rmRF = E;
  function P(g) {
    return i(this, void 0, void 0, function* () {
      assert_1__default.default.ok(g, "a path argument must be provided"), yield u.mkdir(g, { recursive: !0 });
    });
  }
  t.mkdirP = P;
  function G(g, T) {
    return i(this, void 0, void 0, function* () {
      if (!g)
        throw new Error("parameter 'tool' is required");
      if (T) {
        const O = yield G(g, !1);
        if (!O)
          throw u.IS_WINDOWS ? new Error(`Unable to locate executable file: ${g}. Please verify either the file path exists or the file can be found within a directory specified by the PATH environment variable. Also verify the file has a valid extension for an executable file.`) : new Error(`Unable to locate executable file: ${g}. Please verify either the file path exists or the file can be found within a directory specified by the PATH environment variable. Also check the file mode to verify the file is executable.`);
        return O;
      }
      const v = yield d(g);
      return v && v.length > 0 ? v[0] : "";
    });
  }
  t.which = G;
  function d(g) {
    return i(this, void 0, void 0, function* () {
      if (!g)
        throw new Error("parameter 'tool' is required");
      const T = [];
      if (u.IS_WINDOWS && process.env.PATHEXT)
        for (const $ of process.env.PATHEXT.split(a.delimiter))
          $ && T.push($);
      if (u.isRooted(g)) {
        const $ = yield u.tryGetExecutablePath(g, T);
        return $ ? [$] : [];
      }
      if (g.includes(a.sep))
        return [];
      const v = [];
      if (process.env.PATH)
        for (const $ of process.env.PATH.split(a.delimiter))
          $ && v.push($);
      const O = [];
      for (const $ of v) {
        const A = yield u.tryGetExecutablePath(a.join($, g), T);
        A && O.push(A);
      }
      return O;
    });
  }
  t.findInPath = d;
  function f(g) {
    const T = g.force == null ? !0 : g.force, v = Boolean(g.recursive), O = g.copySourceDirectory == null ? !0 : Boolean(g.copySourceDirectory);
    return { force: T, recursive: v, copySourceDirectory: O };
  }
  function w(g, T, v, O) {
    return i(this, void 0, void 0, function* () {
      if (v >= 255)
        return;
      v++, yield P(T);
      const $ = yield u.readdir(g);
      for (const A of $) {
        const k = `${g}/${A}`, D = `${T}/${A}`;
        (yield u.lstat(k)).isDirectory() ? yield w(k, D, v, O) : yield m(k, D, O);
      }
      yield u.chmod(T, (yield u.stat(g)).mode);
    });
  }
  function m(g, T, v) {
    return i(this, void 0, void 0, function* () {
      if ((yield u.lstat(g)).isSymbolicLink()) {
        try {
          yield u.lstat(T), yield u.unlink(T);
        } catch ($) {
          $.code === "EPERM" && (yield u.chmod(T, "0666"), yield u.unlink(T));
        }
        const O = yield u.readlink(g);
        yield u.symlink(O, T, u.IS_WINDOWS ? "junction" : null);
      } else
        (!(yield u.exists(T)) || v) && (yield u.copyFile(g, T));
    });
  }
}), toolrunner = createCommonjsModule(function(e, t) {
  var n = commonjsGlobal && commonjsGlobal.__createBinding || (Object.create ? function(d, f, w, m) {
    m === void 0 && (m = w), Object.defineProperty(d, m, { enumerable: !0, get: function() {
      return f[w];
    } });
  } : function(d, f, w, m) {
    m === void 0 && (m = w), d[m] = f[w];
  }), s = commonjsGlobal && commonjsGlobal.__setModuleDefault || (Object.create ? function(d, f) {
    Object.defineProperty(d, "default", { enumerable: !0, value: f });
  } : function(d, f) {
    d.default = f;
  }), o = commonjsGlobal && commonjsGlobal.__importStar || function(d) {
    if (d && d.__esModule)
      return d;
    var f = {};
    if (d != null)
      for (var w in d)
        w !== "default" && Object.hasOwnProperty.call(d, w) && n(f, d, w);
    return s(f, d), f;
  }, i = commonjsGlobal && commonjsGlobal.__awaiter || function(d, f, w, m) {
    function g(T) {
      return T instanceof w ? T : new w(function(v) {
        v(T);
      });
    }
    return new (w || (w = Promise))(function(T, v) {
      function O(k) {
        try {
          A(m.next(k));
        } catch (D) {
          v(D);
        }
      }
      function $(k) {
        try {
          A(m.throw(k));
        } catch (D) {
          v(D);
        }
      }
      function A(k) {
        k.done ? T(k.value) : g(k.value).then(O, $);
      }
      A((m = m.apply(d, f || [])).next());
    });
  };
  Object.defineProperty(t, "__esModule", { value: !0 }), t.argStringToArray = t.ToolRunner = void 0;
  const p = o(require$$0__default.default), a = o(events__default.default), u = o(require$$0__default$1.default), h = o(require$$1__default.default), b = o(io), y = o(ioUtil), _ = process.platform === "win32";
  class E extends a.EventEmitter {
    constructor(f, w, m) {
      super();
      if (!f)
        throw new Error("Parameter 'toolPath' cannot be null or empty.");
      this.toolPath = f, this.args = w || [], this.options = m || {};
    }
    _debug(f) {
      this.options.listeners && this.options.listeners.debug && this.options.listeners.debug(f);
    }
    _getCommandString(f, w) {
      const m = this._getSpawnFileName(), g = this._getSpawnArgs(f);
      let T = w ? "" : "[command]";
      if (_)
        if (this._isCmdFile()) {
          T += m;
          for (const v of g)
            T += ` ${v}`;
        } else if (f.windowsVerbatimArguments) {
          T += `"${m}"`;
          for (const v of g)
            T += ` ${v}`;
        } else {
          T += this._windowsQuoteCmdArg(m);
          for (const v of g)
            T += ` ${this._windowsQuoteCmdArg(v)}`;
        }
      else {
        T += m;
        for (const v of g)
          T += ` ${v}`;
      }
      return T;
    }
    _processLineBuffer(f, w, m) {
      try {
        let g = w + f.toString(), T = g.indexOf(p.EOL);
        for (; T > -1; ) {
          const v = g.substring(0, T);
          m(v), g = g.substring(T + p.EOL.length), T = g.indexOf(p.EOL);
        }
        return g;
      } catch (g) {
        return this._debug(`error processing line. Failed with error ${g}`), "";
      }
    }
    _getSpawnFileName() {
      return _ && this._isCmdFile() ? process.env.COMSPEC || "cmd.exe" : this.toolPath;
    }
    _getSpawnArgs(f) {
      if (_ && this._isCmdFile()) {
        let w = `/D /S /C "${this._windowsQuoteCmdArg(this.toolPath)}`;
        for (const m of this.args)
          w += " ", w += f.windowsVerbatimArguments ? m : this._windowsQuoteCmdArg(m);
        return w += '"', [w];
      }
      return this.args;
    }
    _endsWith(f, w) {
      return f.endsWith(w);
    }
    _isCmdFile() {
      const f = this.toolPath.toUpperCase();
      return this._endsWith(f, ".CMD") || this._endsWith(f, ".BAT");
    }
    _windowsQuoteCmdArg(f) {
      if (!this._isCmdFile())
        return this._uvQuoteCmdArg(f);
      if (!f)
        return '""';
      const w = [
        " ",
        "	",
        "&",
        "(",
        ")",
        "[",
        "]",
        "{",
        "}",
        "^",
        "=",
        ";",
        "!",
        "'",
        "+",
        ",",
        "`",
        "~",
        "|",
        "<",
        ">",
        '"'
      ];
      let m = !1;
      for (const v of f)
        if (w.some((O) => O === v)) {
          m = !0;
          break;
        }
      if (!m)
        return f;
      let g = '"', T = !0;
      for (let v = f.length; v > 0; v--)
        g += f[v - 1], T && f[v - 1] === "\\" ? g += "\\" : f[v - 1] === '"' ? (T = !0, g += '"') : T = !1;
      return g += '"', g.split("").reverse().join("");
    }
    _uvQuoteCmdArg(f) {
      if (!f)
        return '""';
      if (!f.includes(" ") && !f.includes("	") && !f.includes('"'))
        return f;
      if (!f.includes('"') && !f.includes("\\"))
        return `"${f}"`;
      let w = '"', m = !0;
      for (let g = f.length; g > 0; g--)
        w += f[g - 1], m && f[g - 1] === "\\" ? w += "\\" : f[g - 1] === '"' ? (m = !0, w += "\\") : m = !1;
      return w += '"', w.split("").reverse().join("");
    }
    _cloneExecOptions(f) {
      f = f || {};
      const w = {
        cwd: f.cwd || process.cwd(),
        env: f.env || process.env,
        silent: f.silent || !1,
        windowsVerbatimArguments: f.windowsVerbatimArguments || !1,
        failOnStdErr: f.failOnStdErr || !1,
        ignoreReturnCode: f.ignoreReturnCode || !1,
        delay: f.delay || 1e4
      };
      return w.outStream = f.outStream || process.stdout, w.errStream = f.errStream || process.stderr, w;
    }
    _getSpawnOptions(f, w) {
      f = f || {};
      const m = {};
      return m.cwd = f.cwd, m.env = f.env, m.windowsVerbatimArguments = f.windowsVerbatimArguments || this._isCmdFile(), f.windowsVerbatimArguments && (m.argv0 = `"${w}"`), m;
    }
    exec() {
      return i(this, void 0, void 0, function* () {
        return !y.isRooted(this.toolPath) && (this.toolPath.includes("/") || _ && this.toolPath.includes("\\")) && (this.toolPath = h.resolve(process.cwd(), this.options.cwd || process.cwd(), this.toolPath)), this.toolPath = yield b.which(this.toolPath, !0), new Promise((f, w) => i(this, void 0, void 0, function* () {
          this._debug(`exec tool: ${this.toolPath}`), this._debug("arguments:");
          for (const A of this.args)
            this._debug(`   ${A}`);
          const m = this._cloneExecOptions(this.options);
          !m.silent && m.outStream && m.outStream.write(this._getCommandString(m) + p.EOL);
          const g = new G(m, this.toolPath);
          if (g.on("debug", (A) => {
            this._debug(A);
          }), this.options.cwd && !(yield y.exists(this.options.cwd)))
            return w(new Error(`The cwd: ${this.options.cwd} does not exist!`));
          const T = this._getSpawnFileName(), v = u.spawn(T, this._getSpawnArgs(m), this._getSpawnOptions(this.options, T));
          let O = "";
          v.stdout && v.stdout.on("data", (A) => {
            this.options.listeners && this.options.listeners.stdout && this.options.listeners.stdout(A), !m.silent && m.outStream && m.outStream.write(A), O = this._processLineBuffer(A, O, (k) => {
              this.options.listeners && this.options.listeners.stdline && this.options.listeners.stdline(k);
            });
          });
          let $ = "";
          if (v.stderr && v.stderr.on("data", (A) => {
            g.processStderr = !0, this.options.listeners && this.options.listeners.stderr && this.options.listeners.stderr(A), !m.silent && m.errStream && m.outStream && (m.failOnStdErr ? m.errStream : m.outStream).write(A), $ = this._processLineBuffer(A, $, (k) => {
              this.options.listeners && this.options.listeners.errline && this.options.listeners.errline(k);
            });
          }), v.on("error", (A) => {
            g.processError = A.message, g.processExited = !0, g.processClosed = !0, g.CheckComplete();
          }), v.on("exit", (A) => {
            g.processExitCode = A, g.processExited = !0, this._debug(`Exit code ${A} received from tool '${this.toolPath}'`), g.CheckComplete();
          }), v.on("close", (A) => {
            g.processExitCode = A, g.processExited = !0, g.processClosed = !0, this._debug(`STDIO streams have closed for tool '${this.toolPath}'`), g.CheckComplete();
          }), g.on("done", (A, k) => {
            O.length > 0 && this.emit("stdline", O), $.length > 0 && this.emit("errline", $), v.removeAllListeners(), A ? w(A) : f(k);
          }), this.options.input) {
            if (!v.stdin)
              throw new Error("child process missing stdin");
            v.stdin.end(this.options.input);
          }
        }));
      });
    }
  }
  t.ToolRunner = E;
  function P(d) {
    const f = [];
    let w = !1, m = !1, g = "";
    function T(v) {
      m && v !== '"' && (g += "\\"), g += v, m = !1;
    }
    for (let v = 0; v < d.length; v++) {
      const O = d.charAt(v);
      if (O === '"') {
        m ? T(O) : w = !w;
        continue;
      }
      if (O === "\\" && m) {
        T(O);
        continue;
      }
      if (O === "\\" && w) {
        m = !0;
        continue;
      }
      if (O === " " && !w) {
        g.length > 0 && (f.push(g), g = "");
        continue;
      }
      T(O);
    }
    return g.length > 0 && f.push(g.trim()), f;
  }
  t.argStringToArray = P;
  class G extends a.EventEmitter {
    constructor(f, w) {
      super();
      if (this.processClosed = !1, this.processError = "", this.processExitCode = 0, this.processExited = !1, this.processStderr = !1, this.delay = 1e4, this.done = !1, this.timeout = null, !w)
        throw new Error("toolPath must not be empty");
      this.options = f, this.toolPath = w, f.delay && (this.delay = f.delay);
    }
    CheckComplete() {
      this.done || (this.processClosed ? this._setResult() : this.processExited && (this.timeout = timers_1__default.default.setTimeout(G.HandleTimeout, this.delay, this)));
    }
    _debug(f) {
      this.emit("debug", f);
    }
    _setResult() {
      let f;
      this.processExited && (this.processError ? f = new Error(`There was an error when attempting to execute the process '${this.toolPath}'. This may indicate the process failed to start. Error: ${this.processError}`) : this.processExitCode !== 0 && !this.options.ignoreReturnCode ? f = new Error(`The process '${this.toolPath}' failed with exit code ${this.processExitCode}`) : this.processStderr && this.options.failOnStdErr && (f = new Error(`The process '${this.toolPath}' failed because one or more lines were written to the STDERR stream`))), this.timeout && (clearTimeout(this.timeout), this.timeout = null), this.done = !0, this.emit("done", f, this.processExitCode);
    }
    static HandleTimeout(f) {
      if (!f.done) {
        if (!f.processClosed && f.processExited) {
          const w = `The STDIO streams did not close within ${f.delay / 1e3} seconds of the exit event from process '${f.toolPath}'. This may indicate a child process inherited the STDIO streams and has not yet exited.`;
          f._debug(w);
        }
        f._setResult();
      }
    }
  }
}), exec_1 = createCommonjsModule(function(e, t) {
  var n = commonjsGlobal && commonjsGlobal.__createBinding || (Object.create ? function(h, b, y, _) {
    _ === void 0 && (_ = y), Object.defineProperty(h, _, { enumerable: !0, get: function() {
      return b[y];
    } });
  } : function(h, b, y, _) {
    _ === void 0 && (_ = y), h[_] = b[y];
  }), s = commonjsGlobal && commonjsGlobal.__setModuleDefault || (Object.create ? function(h, b) {
    Object.defineProperty(h, "default", { enumerable: !0, value: b });
  } : function(h, b) {
    h.default = b;
  }), o = commonjsGlobal && commonjsGlobal.__importStar || function(h) {
    if (h && h.__esModule)
      return h;
    var b = {};
    if (h != null)
      for (var y in h)
        y !== "default" && Object.hasOwnProperty.call(h, y) && n(b, h, y);
    return s(b, h), b;
  }, i = commonjsGlobal && commonjsGlobal.__awaiter || function(h, b, y, _) {
    function E(P) {
      return P instanceof y ? P : new y(function(G) {
        G(P);
      });
    }
    return new (y || (y = Promise))(function(P, G) {
      function d(m) {
        try {
          w(_.next(m));
        } catch (g) {
          G(g);
        }
      }
      function f(m) {
        try {
          w(_.throw(m));
        } catch (g) {
          G(g);
        }
      }
      function w(m) {
        m.done ? P(m.value) : E(m.value).then(d, f);
      }
      w((_ = _.apply(h, b || [])).next());
    });
  };
  Object.defineProperty(t, "__esModule", { value: !0 }), t.getExecOutput = t.exec = void 0;
  const p = o(toolrunner);
  function a(h, b, y) {
    return i(this, void 0, void 0, function* () {
      const _ = p.argStringToArray(h);
      if (_.length === 0)
        throw new Error("Parameter 'commandLine' cannot be null or empty.");
      const E = _[0];
      return b = _.slice(1).concat(b || []), new p.ToolRunner(E, b, y).exec();
    });
  }
  t.exec = a;
  function u(h, b, y) {
    var _, E;
    return i(this, void 0, void 0, function* () {
      let P = "", G = "";
      const d = new string_decoder_1__default.default.StringDecoder("utf8"), f = new string_decoder_1__default.default.StringDecoder("utf8"), w = (_ = y == null ? void 0 : y.listeners) === null || _ === void 0 ? void 0 : _.stdout, m = (E = y == null ? void 0 : y.listeners) === null || E === void 0 ? void 0 : E.stderr, g = ($) => {
        G += f.write($), m && m($);
      }, T = ($) => {
        P += d.write($), w && w($);
      }, v = Object.assign(Object.assign({}, y == null ? void 0 : y.listeners), { stdout: T, stderr: g }), O = yield a(h, b, Object.assign(Object.assign({}, y), { listeners: v }));
      return P += d.end(), G += f.end(), {
        exitCode: O,
        stdout: P,
        stderr: G
      };
    });
  }
  t.getExecOutput = u;
}), __defProp$2 = Object.defineProperty, __defProps$2 = Object.defineProperties, __getOwnPropDescs$2 = Object.getOwnPropertyDescriptors, __getOwnPropSymbols$2 = Object.getOwnPropertySymbols, __hasOwnProp$2 = Object.prototype.hasOwnProperty, __propIsEnum$2 = Object.prototype.propertyIsEnumerable, __defNormalProp$2 = (e, t, n) => t in e ? __defProp$2(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n, __spreadValues$2 = (e, t) => {
  for (var n in t || (t = {}))
    __hasOwnProp$2.call(t, n) && __defNormalProp$2(e, n, t[n]);
  if (__getOwnPropSymbols$2)
    for (var n of __getOwnPropSymbols$2(t))
      __propIsEnum$2.call(t, n) && __defNormalProp$2(e, n, t[n]);
  return e;
}, __spreadProps$2 = (e, t) => __defProps$2(e, __getOwnPropDescs$2(t));
async function exec(e, t) {
  let n = "", s = "";
  const o = Date.now(), i = await exec_1.exec(e, null, __spreadProps$2(__spreadValues$2({}, t), {
    silent: !0,
    listeners: {
      stdout(a) {
        n += a.toString();
      },
      stderr(a) {
        s += a.toString();
      }
    }
  })), p = Date.now() - o;
  return {
    exitCode: i,
    duration: p,
    stdout: n,
    stderr: s
  };
}
async function isBaseDiffFromHead(e) {
  try {
    await exec(`git fetch origin ${e} --depth=1`);
  } catch (n) {
    throw new Error(`Failed to git fetch ${e} ${n.message}`);
  }
  const { exitCode: t } = await exec(`git diff --quiet origin/${e}`, { ignoreReturnCode: !0 });
  return t !== 0;
}
async function npmCi({ cwd: e } = {}) {
  fs__default.default.existsSync("node_modules") && (core.info("Cleaning node_modules"), await io.rmRF(require$$1__default.default.join(e, "node_modules")));
  const t = {
    cwd: e,
    ignoreReturnCode: !0
  };
  let n = "";
  fs__default.default.existsSync("package-lock.json") ? (core.info("Installing dependencies with npm"), n = "npm ci") : fs__default.default.existsSync("yarn.lock") ? (core.info("Installing dependencies with yarn"), n = "yarn install --frozen-lockfile") : fs__default.default.existsSync("pnpm-lock.yaml") ? (core.info("Installing dependencies with pnpm"), n = "npx pnpm i --frozen-lockfile") : (core.info("No lock file detected. Installing dependencies with npm"), n = "npm i");
  const { exitCode: s, stdout: o, stderr: i } = await exec(n, t);
  if (s > 0)
    throw new Error(`${i}
${o}`);
}
async function isFileTracked(e) {
  const { exitCode: t } = await exec(`git ls-files --error-unmatch ${e}`, { ignoreReturnCode: !0 });
  return t === 0;
}
var __defProp$1 = Object.defineProperty, __defProps$1 = Object.defineProperties, __getOwnPropDescs$1 = Object.getOwnPropertyDescriptors, __getOwnPropSymbols$1 = Object.getOwnPropertySymbols, __hasOwnProp$1 = Object.prototype.hasOwnProperty, __propIsEnum$1 = Object.prototype.propertyIsEnumerable, __defNormalProp$1 = (e, t, n) => t in e ? __defProp$1(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n, __spreadValues$1 = (e, t) => {
  for (var n in t || (t = {}))
    __hasOwnProp$1.call(t, n) && __defNormalProp$1(e, n, t[n]);
  if (__getOwnPropSymbols$1)
    for (var n of __getOwnPropSymbols$1(t))
      __propIsEnum$1.call(t, n) && __defNormalProp$1(e, n, t[n]);
  return e;
}, __spreadProps$1 = (e, t) => __defProps$1(e, __getOwnPropDescs$1(t));
let pkgSizeInstalled = !1;
async function buildRef({
  checkoutRef: e,
  refData: t,
  buildCommand: n
}) {
  const s = process.cwd();
  if (core.info(`Current working directory: ${s}`), e && (core.info(`Checking out ref '${e}'`), await exec(`git checkout -f ${e}`)), n !== "false") {
    if (!n) {
      let a;
      try {
        a = JSON.parse(fs__default.default.readFileSync("./package.json"));
      } catch (u) {
        core.warning("Error reading package.json", u);
      }
      a && a.scripts && a.scripts.build && (core.info("Build script found in package.json"), n = "npm run build");
    }
    if (n) {
      await npmCi({ cwd: s }).catch((u) => {
        throw new Error(`Failed to install dependencies:
${u.message}`);
      }), core.info(`Running build command: ${n}`);
      const a = Date.now();
      await exec(n, { cwd: s }).catch((u) => {
        throw new Error(`Failed to run build command: ${n}
${u.message}`);
      }), core.info(`Build completed in ${(Date.now() - a) / 1e3}s`);
    }
  }
  pkgSizeInstalled || (core.info("Installing pkg-size globally"), await exec("npm i -g pkg-size"), pkgSizeInstalled = !0), core.info("Getting package size");
  const o = await exec("pkg-size --json", { cwd: s }).catch((a) => {
    throw new Error(`Failed to determine package size: ${a.message}`);
  });
  core.debug(JSON.stringify(o, null, 4));
  const i = __spreadProps$1(__spreadValues$1({}, JSON.parse(o.stdout)), {
    ref: t,
    size: 0,
    sizeGzip: 0,
    sizeBrotli: 0
  });
  await Promise.all(i.files.map(async (a) => {
    i.size += a.size, i.sizeGzip += a.sizeGzip, i.sizeBrotli += a.sizeBrotli;
    const u = await isFileTracked(a.path);
    a.isTracked = u, a.label = u ? link(c$1(a.path), `${t.repo.html_url}/blob/${t.ref}/${a.path}`) : c$1(a.path);
  })), core.info("Cleaning up"), await exec("git reset --hard");
  const { stdout: p } = await exec("git clean -dfx");
  return core.debug(p), i;
}
var __defProp = Object.defineProperty, __defProps = Object.defineProperties, __getOwnPropDescs = Object.getOwnPropertyDescriptors, __getOwnPropSymbols = Object.getOwnPropertySymbols, __hasOwnProp = Object.prototype.hasOwnProperty, __propIsEnum = Object.prototype.propertyIsEnumerable, __defNormalProp = (e, t, n) => t in e ? __defProp(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n, __spreadValues = (e, t) => {
  for (var n in t || (t = {}))
    __hasOwnProp.call(t, n) && __defNormalProp(e, n, t[n]);
  if (__getOwnPropSymbols)
    for (var n of __getOwnPropSymbols(t))
      __propIsEnum.call(t, n) && __defNormalProp(e, n, t[n]);
  return e;
}, __spreadProps = (e, t) => __defProps(e, __getOwnPropDescs(t));
async function generateSizeReport({
  pr: e,
  buildCommand: t,
  commentReport: n,
  mode: s,
  unchangedFiles: o,
  hideFiles: i,
  sortBy: p,
  sortOrder: a,
  displaySize: u
}) {
  core.startGroup("Build HEAD");
  const h = await buildRef({
    refData: e.head,
    buildCommand: t
  });
  if (core.setOutput("headPkgData", h), core.endGroup(), s === "head-only")
    return n !== "false" ? headOnly({
      headPkgData: h,
      displaySize: u,
      sortBy: p,
      sortOrder: a,
      hideFiles: i
    }) : !1;
  const { ref: b } = e.base;
  let y;
  return await isBaseDiffFromHead(b) ? (core.info("HEAD is different from BASE. Triggering build."), core.startGroup("Build BASE"), y = await buildRef({
    checkoutRef: b,
    refData: e.base,
    buildCommand: t
  }), core.endGroup()) : (core.info("HEAD is identical to BASE. Skipping base build."), y = __spreadProps(__spreadValues({}, h), {
    ref: e.base
  })), core.setOutput("basePkgData", y), n !== "false" ? generateComment({
    headPkgData: h,
    basePkgData: y,
    displaySize: u,
    sortBy: p,
    sortOrder: a,
    hideFiles: i,
    unchangedFiles: o
  }) : !1;
}
const COMMENT_SIGNATURE = sub("\u{1F916} This report was automatically generated by [pkg-size-action](https://github.com/pkg-size/action/)");
(async () => {
  const { GITHUB_TOKEN: e } = process.env;
  assert_1__default.default(e, 'Environment variable "GITHUB_TOKEN" not set. Required for accessing and reporting on the PR.');
  const { pull_request: t } = github.context.payload, n = await generateSizeReport({
    pr: t,
    buildCommand: core.getInput("build-command"),
    commentReport: core.getInput("comment-report"),
    mode: core.getInput("mode") || "regression",
    unchangedFiles: core.getInput("unchanged-files") || "collapse",
    hideFiles: core.getInput("hide-files"),
    sortBy: core.getInput("sort-by") || "delta",
    sortOrder: core.getInput("sort-order") || "desc",
    displaySize: core.getInput("display-size") || "uncompressed"
  });
  await exec(`git checkout -f ${github.context.sha}`), n && await upsertComment({
    token: e,
    commentSignature: COMMENT_SIGNATURE,
    repo: github.context.repo,
    prNumber: t.number,
    body: n
  });
})().catch((e) => {
  core.setFailed(e.message), core.warning(e.stack);
});
