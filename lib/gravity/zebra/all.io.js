(function() {

(function() {

//  Faster operation analogues:
//  Math.floor(f)  => ~~(a)
//  Math.round(f)  =>  (f + 0.5) | 0
//
function isString(o)  { return typeof o !== "undefined" && o !== null && (typeof o === "string" || o.constructor === String); }
function isNumber(o)  { return typeof o !== "undefined" && o !== null && (typeof o === "number" || o.constructor === Number); }
function isBoolean(o) { return typeof o !== "undefined" && o !== null && (typeof o === "boolean" || o.constructor === Boolean); }

if (!String.prototype.trim) { String.prototype.trim = function() { return this.replace(/^\s+|\s+$/g,'');  }; }

if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(searchElement) {
        if (this == null) throw new TypeError();
        var t = Object(this), len = t.length >>> 0;
        if (len === 0) return -1;

        var n = 0;
        if (arguments.length > 0) {
            n = Number(arguments[1]);
            if (n != n) n = 0;
            else if (n !== 0 && n != Infinity && n != -Infinity) {
                n = (n > 0 || -1) * ~~Math.abs(n);
            }
        }
        if (n >= len) return -1;
        var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
        for (; k < len; k++) if (k in t && t[k] === searchElement) return k;
        return -1;
    };
}

if (!Array.isArray) Array.isArray = function(a) { return Object.prototype.toString.call(a) == '[object Array]'; };

var $$$ = 0, namespaces = {}, namespace = function(nsname, dontCreate) {
    if (isString(nsname) === false) throw new Error("Wrong nsname argument");
    if (namespaces.hasOwnProperty(nsname)) return namespaces[nsname];
    if (dontCreate === true) throw new Error("Namespace '" + nsname + "' doesn't exist");

    function Package() {
        this.$url = null;
        if (zebra.isInBrowser) {
            var s = document.getElementsByTagName('script'), ss = s[s.length - 1].getAttribute('src'),
                i = ss == null ? -1 : ss.lastIndexOf("/");
            this.$url = (i > 0) ? new zebra.URL(ss.substring(0, i + 1)) 
                                : new zebra.URL(document.location.toString()).getParentURL() ;
        }
    }

    if (isString(nsname) === false) throw new Error('invalid namespace id');
    if (namespaces.hasOwnProperty(nsname)) throw new Error("Namespace '" + nsname + "' already exists");

    var f = function(name) {
        if (arguments.length === 0) return f.$env;

        if (typeof name === 'function') {
            for(var k in f) if (f[k] instanceof Package) name(k, f[k]);
            return null;
        }

        var b = Array.isArray(name);
        if (isString(name) === false && b === false) {
            for(var k in name) if (name.hasOwnProperty(k)) f.$env[k] = name[k];
            return;
        }

        if (b) {
           for(var i = 0; i < name.length; i++) f(name[i]);
           return null;
        }

        if (f[name] instanceof Package) return f[name];

        var names = name.split('.'), target = f;
        for(var i = 0, k = names[0]; i < names.length; i++, k = [k, '.', names[i]].join('')) {
            var n = names[i], p = target[n];
            if (typeof p === "undefined") {
                p = new Package();
                target[n] = p;
                f[k] = p;
            }
            else
            if ((p instanceof Package) === false) throw new Error("Package '" + name +  "' conflicts with variable '" + n + "'");
            target = p;
        }
        return target;
    };

    f.Import = function() {
        var ns = ["=", nsname, "."].join(''), code = [], packages = arguments.length === 0 ? null : Array.prototype.slice.call(arguments, 0);
        f(function(n, p) {
            if (packages == null || packages.indexOf(n) >= 0) {
                for (var k in p) {
                    if (k[0] != '$' && (p[k] instanceof Package) === false && p.hasOwnProperty(k)) {
                        code.push([k, ns, n, ".", k].join(''));
                    }
                }
                if (packages != null) packages.splice(packages.indexOf(n), 1);
            }
        });
        if (packages != null && packages.length !== 0) throw new Error("Unknown package(s): " + packages.join(","));
        return code.length > 0 ? [ "var ", code.join(","), ";"].join('') : null;
    };

    f.$env = {};
    namespaces[nsname] = f;
    return f;
};

var FN = (typeof namespace.name === "undefined") ? (function(f) { var mt = f.toString().match(/^function ([^(]+)/); return (mt == null) ? '' : mt[1]; })
                                                 : (function(f) { return f.name; });

zebra = namespace('zebra');
var pkg = zebra;
pkg.namespaces = namespaces;
pkg.namespace = namespace;
pkg.FN = FN;
pkg.$global = this;
pkg.isString  = isString;
pkg.isNumber  = isNumber;
pkg.isBoolean = isBoolean;
pkg.version = "1.2.0";
pkg.$caller = null;

function mnf(name, params) {
    throw new ReferenceError("Method '" + (name==='' ? "constructor":name) + "(" + params + ")" + "' not found");
}

function $toString() { return this._hash_; }
function $equals(o) { return this == o; }

function make_template(pt, tf, p)
{
    tf._hash_ = ["$zebra_", $$$++].join('');
    tf.toString = $toString;
    if (pt != null) tf.prototype.getClazz = function() { return tf; };
    tf.getClazz = function() { return pt; };
    tf.prototype.toString = $toString;
    tf.prototype.equals   = $equals;
    tf.prototype.constructor = tf;

    if (p && p.length > 0) {
        tf.parents = {};
        for(var i=0; i < p.length; i++) {
            var l = p[i];
            if (typeof l === 'undefined') throw new ReferenceError("Unknown " + i + " parent");
            tf.parents[l] = true;
            if (l.parents) {
                var pp = l.parents;
                for(var k in pp) if (pp.hasOwnProperty(k)) tf.parents[k] = true;
            }
        }
    }
    return tf;
}

pkg.Interface = make_template(null, function() {
    var $Interface = make_template(pkg.Interface, function() {
        if (arguments.length > 0) return new (pkg.Class($Interface, arguments[0]))();
    }, arguments);
    return $Interface;
});

function ProxyMethod(name, f) {
    if (isString(name) === false) throw new TypeError('Method name has not been defined');

    var a = null;
    if (arguments.length == 1) {
        a = function() {
            var nm = a.methods[arguments.length];
            if (nm) {
                var cm = pkg.$caller;
                pkg.$caller = nm;
                try { return nm.apply(this, arguments); }
                finally { pkg.$caller = cm; }
            }
            mnf(a.methodName, arguments.length);
        };
        a.methods = {};
    }
    else {
        a = function() {
            var cm = pkg.$caller;
            pkg.$caller = f;
            try { return f.apply(this, arguments); }
            finally { pkg.$caller = cm; }
        };
        a.f = f;
    }

    a.$clone$ = function() {
        if (a.methodName === '') return null;
        if (a.f) return ProxyMethod(a.methodName, a.f);
        var m = ProxyMethod(a.methodName);
        for(var k in a.methods) m.methods[k] = a.methods[k];
        return m;
    };

    a.methodName = name;
    return a;
}

pkg.Class = make_template(null, function() {
    if (arguments.length === 0) throw new Error("No class definition was found");

    var df = arguments[arguments.length - 1], $parent = null, args = Array.prototype.slice.call(arguments, 0, arguments.length-1);
    if (args.length > 0 && (args[0] == null || args[0].getClazz() == pkg.Class)) $parent = args[0];

    var $template = make_template(pkg.Class, function() {
        this._hash_ = ["$zObj_", $$$++].join('');

        if (arguments.length > 0) {
            var a = arguments[arguments.length - 1];

            // inner is customized class instance if last arguments is array of functions
            if (Array.isArray(a) === true && typeof a[0] === 'function') {
                a = a[0];
                var args = [ $template ], k = arguments.length - 2;
                for(; k >= 0 && pkg.instanceOf(arguments[k], pkg.Interface); k--) args.push(arguments[k]);
                args.push(arguments[arguments.length - 1]);
                var cl = pkg.Class.apply(null, args), f = function() {};
                f.prototype = cl.prototype;
                var o = new f();
                cl.apply(o, Array.prototype.slice.call(arguments, 0, k + 1));
                o.constructor = cl;
                return o;
            }
        }

        this[''] && this[''].apply(this, arguments);
    }, args);

    $template.$parent = $parent;
    if ($parent != null) {
        for (var k in $parent.prototype) {
            var f = $parent.prototype[k];
            if (f && f.$clone$) {
                f = f.$clone$();
                if (f == null) continue;
            }
            $template.prototype[k] = f;
        }
    }

    $template.prototype.Field = function(f) {
        var n = FN(f), pv = this[n];
        if (pv) { if (this.hasOwnProperty(n) === false) pv = pv.$clone$(); }
        else pv = ProxyMethod(n);
        pv.methods[f.length] = f;
        f.boundTo = this.getClazz();
        this[n] = pv;
    };

    $template.prototype.$super = function() {
        if (pkg.$caller) {
            var name = pkg.$caller.methodName, $s = pkg.$caller.boundTo.$parent, args = arguments;
            if (arguments.length > 0 && typeof arguments[0] === 'function') {
                name = arguments[0].methodName;
                args = Array.prototype.slice.call(arguments, 1);
            }

            var params = args.length;
            while($s != null) {
                var m = $s.prototype[name];
                if (m && (typeof m.methods === "undefined" || m.methods[params])) return m.apply(this, args);
                $s = $s.$parent;
            }
            mnf(name, params);
        }
        throw new Error("$super is called outside of class context");
    };

    $template.prototype.getClazz = function() { return $template; };
    $template.prototype.$this = function() {  return pkg.$caller.boundTo.prototype[''].apply(this, arguments);  };

    $template.constructor.prototype.getMethods = function(name)  {
         var m = [];
         for (var n in this.prototype) {
             var f = this.prototype[n];
             if (arguments.length > 0 && name != n) continue;
             if (typeof f === 'function') {
                if (f.$clone$) {
                    for (var mk in f.methods) m.push(f.methods[mk]);
                }
                else m.push(f);
             }
         }
         return m;
    };

    $template.constructor.prototype.getMethod = function(name, params) {
        var m = this.prototype[name];
        if (typeof m === 'function') {
            if (m.$clone$) {
                if (typeof params === "undefined")  {
                    if (m.methods[0]) return m.methods[0];
                    for(var k in m.methods) return m.methods[k];
                    return null;
                }
                m = m.methods[params];
            }
            if (m) return m;
        }
        return null;
    };

    $template.Field = function(f) {
        var n = null;
        if (arguments.length > 1) {
            n = arguments[0];
            f = arguments[1];
        }
        else n = FN(f);

        if (f.boundTo) throw new Error("Method '" + n + "' is bound to other class");
        var sw = null, arity = f.length, vv = this.prototype[n];

        if (typeof vv === 'undefined') {
            // this commented code allow to speed up proxy execution a  little bit for a single method
            // sw = ProxyMethod(n, f);
            // f.boundTo    = this;
            // f.methodName = n;
            // this.prototype[n] = sw;
            // return;
            sw = ProxyMethod(n);
        }
        else {
            if (typeof vv === 'function') {
                if (vv.$clone$) {
                    if (typeof vv.methods === "undefined") {
                        sw = ProxyMethod(n);
                        sw.methods[vv.f.length] = vv.f;
                    }
                    else sw = vv;
                }
                else {
                    sw = ProxyMethod(n);
                    if (vv.length != arity) {
                        vv.methodName = n;
                        vv.boundTo = this;
                    }
                    sw.methods[vv.length] = vv;
                }
            }
            else throw new Error("Method '" + n + "' conflicts to property");
        }

        var pv = sw.methods[arity];
        if (typeof pv !== 'undefined' && pv.boundTo == this) {
            throw new Error("Duplicated method '" + sw.methodName + "(" + arity +")'");
        }

        f.boundTo    = this;
        f.methodName = n;
        sw.methods[arity] = f;
        this.prototype[n] = sw;
    };

    if (typeof df === 'function') df.call($template, function(f) { $template.Field(f); } );
    else {
        if (Array.isArray(df) === false) throw new Error("Wrong class definition format");
        for(var i=0; i < df.length; i++) {
            var ff = df[i], nn = FN(ff);
            if (nn[0] == "$") {
                var ctx = nn == "$prototype" ?  $template.prototype : (nn == "$clazz" ? $template : null);
                if (nn) {
                    ff.call(ctx);
                    continue;
                }
            }
            $template.Field(nn, ff);
        }
    }

    // validate constructor
    if ($template.$parent && $template.$parent.prototype[''] && typeof $template.prototype[''] === "undefined") {
        $template.prototype[''] = $template.$parent.prototype[''];
    }

    return $template;
});

var Class = pkg.Class, $cached = {}, $busy = 1, $f = [];

function $cache(name, clazz) {
    if (($cached[name] && $cached[name] != clazz) || pkg.$global[name]) throw Error("Class name conflict: " + name);
    $cached[name] = clazz;
}

Class.forName = function(name) {
    if (pkg.$global[name]) return pkg.$global[name];
    //!!!!!! infinite cache !!!!
    if ($cached.hasOwnProperty(name) === false) $cache(name, eval(name));
    var cl = $cached[name];
    if (cl == null) throw new Error("Class " + name + " cannot be found");
    return cl;
};

pkg.instanceOf = function(obj, clazz) {
    if (clazz) {
        if (obj == null || typeof obj.getClazz === 'undefined')  return false;
        var c = obj.getClazz();
        return c != null && (c === clazz || (typeof c.parents !== 'undefined' && c.parents.hasOwnProperty(clazz)));
    }
    throw new Error("instanceOf(): unknown class");
};

pkg.ready = function() {
    if (arguments.length === 0) {
        if ($busy > 0) $busy--;
    }
    else {
        if (arguments.length == 1 && $busy === 0 && $f.length === 0) {
            arguments[0]();
            return;
        }
    }

    for(var i = 0; i < arguments.length; i++) $f.push(arguments[i]);
    while($busy === 0 && $f.length > 0) $f.shift()();
};

pkg.busy = function() { $busy++; };

pkg.Output = Class([
    function print(o) { this._p(0, o); },
    function error(o) { this._p(2, o); },
    function warn(o)  { this._p(1, o); },

    function _p(l, o) {
        o = this.format(o);
        if (pkg.isInBrowser) {
            if (pkg.isIE) {
                console.log(o);
                // !!!! should check if IE9+ is used we can use  console.log
                // alert(o);
            }
            else {
                if (l === 0) console.log(o);
                else if (l == 1) console.warn(o);
                     else console.error(o);
            }
        }
        else pkg.$global.print(o);
    },

    function format(o) {
        if (o && o.stack) return [o.toString(), ":",  o.stack.toString()].join("\n");
        return o == null ? "$null" : (typeof o === "undefined" ? "$undefined" : o.toString());
    }
]);

pkg.HtmlOutput = Class(pkg.Output, [
    function() { this.$this(null); },

    function(element) {
        element = element || "zebra.out";
        if (pkg.isString(element)) {
            this.el = document.getElementById(element);
            if (this.el == null) {
                this.el = document.createElement('div');
                this.el.setAttribute("id", element);
                document.body.appendChild(this.el);
            }
        }
        else {
            if (element == null) throw new Error("Unknown HTML output element");
            this.el = element;
        }
    },

    function print(s) { this.out('black', s); },
    function error(s) { this.out('red', s); },
    function warn(s)  { this.out('orange', s); },

    function out(color, msg) {
        var t = ["<div class='zebra.out.print' style='color:", color, "'>", this.format(msg), "</div>" ];
        this.el.innerHTML += t.join('');
    }
]);

pkg.isInBrowser = typeof navigator !== "undefined";
pkg.isIE        = pkg.isInBrowser && /msie/i.test(navigator.userAgent) && !/opera/i.test(navigator.userAgent);
pkg.isOpera     = pkg.isInBrowser && !/opera/i.test(navigator.userAgent);
pkg.isChrome    = pkg.isInBrowser && typeof(window.chrome) !== "undefined";
pkg.isSafari    = pkg.isInBrowser && !pkg.isChrome && /Safari/i.test(navigator.userAgent);
pkg.isFF        = pkg.isInBrowser && window.mozInnerScreenX != null;
pkg.out         = new pkg.Output();

pkg.print = function(s) { pkg.out.print(s); };

function complete() {
    pkg(function(n, p) {
        for(var k in p) {
            var c = p[k];
            if (c && zebra.instanceOf(c, Class)) c.$name = k;
        }
    });
    pkg.ready();
}

if (pkg.isInBrowser) {
    var m = window.location.search.match(/[?&][a-zA-Z0-9_.]+=[^?&=]+/g), env = {};
    for(var i=0; m && i < m.length; i++) {
        var l = m[i].split('=');
        env[l[0].substring(1)] = l[1];
    }
    pkg(env);

    //               protocol[1]        host[2]  path[3]  querystr[4]
    var purl = /^([a-zA-Z_0-9]+\:)\/\/([^\/]*)(\/[^?]*)(\?[^?\/]*)?/;
    pkg.URL = function(url) {
        var a = document.createElement('a');
        a.href = url;
        var m = purl.exec(a.href);

        if (m == null) {
            m = purl.exec(window.location);
            if (m == null) throw Error("Cannot resolve '" + url + "' url");
            var p = m[3];
            a.href = m[1] + "//" + m[2] +  p.substring(0, p.lastIndexOf("/") + 1) + url;
            m = purl.exec(a.href);
        }

        this.path     = m[3];
        this.href     = a.href;
        this.protocol = m[1];
        this.host     = m[2];
        this.path     = this.path.replace(/[\/]+/g, "/");
        this.qs       = m[4];
    };

    pkg.URL.prototype.toString = function() { return this.href; };

    pkg.URL.prototype.getParentURL = function() {
        var i = this.path.lastIndexOf("/");
        if (i <= 0) throw new Error(this.toString() + " has no parent");
        var p = this.path.substring(0, i+1);
        return new pkg.URL([this.protocol, "//", this.host, p].join(''));
    };

    pkg.URL.isAbsolute = function(u) { return /^[a-zA-Z]+\:\/\//i.test(u);  };

    pkg.URL.prototype.join = function(p) {
        if (pkg.URL.isAbsolute(p)) throw new Error();
        return p[0] == '/' ? [ this.protocol, "//", this.host, p ].join('')
                           : [ this.protocol, "//", this.host, this.path, p ].join('');
    };

    if (window.addEventListener) window.addEventListener('DOMContentLoaded', complete, false);
    else window.attachEvent('onload', complete);
}
else complete();

})();




(function(pkg, Class, Interface) {

pkg.getPropertySetter = function(clazz, name) {
    if (clazz.$beanInfo) {
        if (clazz.$beanInfo.hasOwnProperty(name)) return clazz.$beanInfo[name];
    }
    else clazz.$beanInfo = {};

    var names = [ ["set", name[0].toUpperCase(), name.substring(1)].join(''), name ], f = null;
    for (var i=0; i < names.length && f == null; i++) {
        f = (function(m) {
            if (typeof m  === "function") {
                if (m.$clone$) {
                    for(var k in m.methods) {
                        if (k > 1) return (function(o, v) { m.apply(o, v && v.$new ? v.$new() : v); });
                    }
                }
                return m.length > 1 ? (function(o, v) { m.apply(o, v && v.$new ? v.$new() : v); })
                                    : function(o, v) { m.call(o, v && v.$new ? v.$new() : v); };
            }
        })(clazz.prototype[names[i]]);
    }

    if (f == null) f = function(o, v) { o[name] = v && v.$new ? v.$new() : v; };
    clazz.$beanInfo[name] = f;
    return f;
};

var HEX = "0123456789ABCDEF";
pkg.ID = function UUID(size) {
    if (typeof size === 'undefined') size = 16;
    var id = [];
    for (var i=0; i<36; i++)  id[i] = HEX[~~(Math.random() * 16)];
    return id.join('');
};

function hex(v) { return (v < 16) ? ["0", v.toString(16)].join('') :  v.toString(16); }

pkg.rgb = function (r, g, b, a) {
    if (arguments.length == 1) {
        if (zebra.isString(r)) {
            this.s = r;
            if (r[0] === '#') {
                r = parseInt(r.substring(1), 16);
            }
            else {
                if (r[0] === 'r' && r[1] === 'g' && r[2] === 'b') {
                    var i = r.indexOf('(', 3), p = r.substring(i + 1, r.indexOf(')', i + 1)).split(",");
                    this.r = parseInt(p[0].trim(), 10);
                    this.g = parseInt(p[1].trim(), 10);
                    this.b = parseInt(p[2].trim(), 10);
                    if (p.length > 3) this.D = parseInt(p[2].trim(), 10);
                    return;
                }
            }
        }
        this.r = r >> 16;
        this.g = (r >> 8) & 0xFF;
        this.b = (r & 0xFF);
    }
    else {
        this.r = r;
        this.g = g;
        this.b = b;
        if (arguments.length > 3) this.a = a;
    }

    if (this.s == null) {
        this.s = (typeof this.a !== "undefined") ? ['rgba(', this.r, ",", this.g, ",",
                                                             this.b, ",", this.a, ")"].join('')
                                                 : ['#', hex(this.r), hex(this.g), hex(this.b)].join('');
    }
};

var rgb = pkg.rgb;
rgb.prototype.toString = function() { return this.s; };

rgb.prototype.equals = function(c){
    return c != null && (c === this || (this.r == c.r && this.b == c.b && this.g == c.g && this.a == c.a));
};

rgb.prototype.paint = function(g,x,y,w,h,d) {
    if (this.s != g.fillStyle) g.fillStyle = this.s;
    g.fillRect(x, y, w, h);
};

rgb.prototype.getPreferredSize = function() {
    return { width:0, height:0 };
};

rgb.black     = new rgb(0);
rgb.white     = new rgb(0xFFFFFF);
rgb.red       = new rgb(255,0,0);
rgb.blue      = new rgb(0,0,255);
rgb.green     = new rgb(0,255,0);
rgb.gray      = new rgb(128,128,128);
rgb.lightGray = new rgb(211,211,211);
rgb.darkGray  = new rgb(169,169,169);
rgb.orange    = new rgb(255,165,0);
rgb.yellow    = new rgb(255,255,0);
rgb.pink      = new rgb(255,192,203);
rgb.cyan      = new rgb(0,255,255);
rgb.magenta   = new rgb(255,0,255);
rgb.darkBlue  = new rgb(0, 0, 140);

pkg.Actionable = Interface();

pkg.index2point  = function(offset,cols) { return [~~(offset / cols), (offset % cols)]; };
pkg.indexByPoint = function(row,col,cols){ return (cols <= 0) ?  -1 : (row * cols) + col; };

pkg.intersection = function(x1,y1,w1,h1,x2,y2,w2,h2,r){
    r.x = x1 > x2 ? x1 : x2;
    r.width = Math.min(x1 + w1, x2 + w2) - r.x;
    r.y = y1 > y2 ? y1 : y2;
    r.height = Math.min(y1 + h1, y2 + h2) - r.y;
};

pkg.isIntersect = function(x1,y1,w1,h1,x2,y2,w2,h2){
    return (Math.min(x1 + w1, x2 + w2) - (x1 > x2 ? x1 : x2)) > 0 &&
           (Math.min(y1 + h1, y2 + h2) - (y1 > y2 ? y1 : y2)) > 0;
};

pkg.unite = function(x1,y1,w1,h1,x2,y2,w2,h2,r){
    r.x = x1 < x2 ? x1 : x2;
    r.y = y1 < y2 ? y1 : y2;
    r.width  = Math.max(x1 + w1, x2 + w2) - r.x;
    r.height = Math.max(y1 + h1, y2 + h2) - r.y;
};

pkg.arraycopy = function(src, spos, dest, dpos, dlen) {
    for(var i=0; i<dlen; i++) dest[i + dpos] = src[spos + i];
};

pkg.currentTimeMillis = function() { return (new Date()).getTime(); };

pkg.str2bytes = function(s) {
    var ar = [];
    for (var i = 0; i < s.length; i++) {
        var code = s.charCodeAt(i);
        ar.push((code >> 8) & 0xFF);
        ar.push(code & 0xFF);
    }
    return ar;
};

var digitRE = /[0-9]/;
pkg.isDigit = function(ch) {
    if (ch.length != 1) throw new Error("Incorrect character");
    return digitRE.test(ch);
};

var letterRE = /[A-Za-z]/;
pkg.isLetter = function (ch) {
    if (ch.length != 1) throw new Error("Incorrect character");
    return letterRE.test(ch);
};

pkg.Listeners = function(n) {
    this.n = n ? n : 'fired';
};

var L = pkg.Listeners.prototype;

L.add = function(l) {
    if (!this.v) this.v = [];
    this.v.push(l);
};

L.remove = function(l) {
    if (this.v) {
        var i = 0;
        while((i = this.v.indexOf(l)) >= 0) this.v.splice(i, 1);
    }
};

L.fire = function() {
    if(this.v) {
        var n = this.n;
        for(var i = 0;i < this.v.length; i++) {
            var v = this.v[i];
            if (typeof v === 'function') v.apply(this, arguments);
            else v[n].apply(v, arguments);
        }
    }
};

L.removeAll = function(){ if (this.v) this.v.length = 0; };

pkg.MListeners = function() {
    if (arguments.length == 0) throw new Error();
    var $this = this;
    this.methods = {};
    for(var i=0; i<arguments.length; i++) {
        var c = [], m = arguments[i];
        this.methods[m] = c;
        (function(m, c) {
            $this[m] = function() {
                for(var i=0;i<c.length; i++) c[i][1].apply(c[i][0], arguments);
            };
        })(m, c);
    }
};

var ML = pkg.MListeners.prototype;

ML.add = function(l) {
    if (typeof l === 'function') {
        var n = zebra.FN(l);
        if (n == '') {
            for(var k in this.methods) {
                if (this.methods.hasOwnProperty(k)) this.methods[k].push([this, l]);
            }
        }
        else {
            if (this.methods.hasOwnProperty(n) === false) throw new Error("Unknown listener " + n);
            this.methods[n].push([this, l]);
        }
    }
    else {
        var b = false;
        for(var k in this.methods) {
            if (this.methods.hasOwnProperty(k)) {
                if (typeof l[k] === "function") {
                    this.methods[k].push([l, l[k]]);
                    b = true;
                }
            }
        }
        if (b === false) throw new Error("No listener can be registered for " + l);
    }
};

ML.remove = function(l) {
    for(var k in this.methods) {
        var v = this.methods[k];
        for(var i = 0; i < v.length; i++) {
            var f = v[i];
            if (l != this && (f[1] == l || f[0] == l)) v.splice(i, 1);
        }
    }
};

ML.removeAll = function(l) {
    for(var k in this.methods) {
        if (thi.methods.hasOwnProperty(k)) this.methods[k].length = 0;
    }
};

var Position = pkg.Position = Class([
    function $clazz() {
        this.PositionMetric = Interface();
        this.DOWN = 1;
        this.UP   = 2;
        this.BEG  = 3;
        this.END  = 4;
    },

    function $prototype() {
        this.invalidate = function (){ this.isValid = false; };

        this.clearPos = function (){
            if(this.offset >= 0){
                var prevOffset = this.offset, prevLine = this.currentLine, prevCol = this.currentCol;
                this.offset  = this.currentLine = this.currentCol - 1;
                this._.fire(this, prevOffset, prevLine, prevCol);
            }
        };

        this.setOffset = function(o){
            if(o < 0) o = 0;
            else {
                var max = this.metrics.getMaxOffset();
                if(o >= max) o = max;
            }

            if(o != this.offset){
                var prevOffset = this.offset, prevLine = this.currentLine, prevCol = this.currentCol,  p = this.getPointByOffset(o);
                this.offset = o;
                if(p != null){
                    this.currentLine = p[0];
                    this.currentCol = p[1];
                }
                this.isValid = true;
                this._.fire(this, prevOffset, prevLine, prevCol);
            }
        };

        this.seek = function(off){ this.setOffset(this.offset + off); };

        this.setRowCol = function (r,c){
            if(r != this.currentLine || c != this.currentCol){
                var prevOffset = this.offset, prevLine = this.currentLine, prevCol = this.currentCol;
                this.offset = this.getOffsetByPoint(r, c);
                this.currentLine = r;
                this.currentCol = c;
                this._.fire(this, prevOffset, prevLine, prevCol);
            }
        };

        this.inserted = function (off,size){
            if(this.offset >= 0 && off <= this.offset){
                this.invalidate();
                this.setOffset(this.offset + size);
            }
        };

        this.removed = function (off,size){
            if(this.offset >= 0 && this.offset >= off){
                this.invalidate();
                if(this.offset >= (off + size)) this.setOffset(this.offset - size);
                else this.setOffset(off);
            }
        };

        this.getPointByOffset = function(off){
            if(off == -1) return [-1, -1];
            var m = this.metrics, max = m.getMaxOffset();
            if(off > max) throw new Error("" + off);
            if(max === 0) return [(m.getLines() > 0 ? 0 : -1)];
            if(off === 0) return [0,0];
            var d = 0, sl = 0, so = 0;
            if(this.isValid && this.offset !=  -1){
                sl = this.currentLine;
                so = this.offset - this.currentCol;
                if(off > this.offset) d = 1;
                else
                    if(off < this.offset) d =  -1;
                    else return [sl, this.currentCol];
            }
            else{
                d = (~~(max / off) === 0) ?  -1 : 1;
                if(d < 0){
                    sl = m.getLines() - 1;
                    so = max - m.getLineSize(sl);
                }
            }
            for(; sl < m.getLines() && sl >= 0; sl += d){
                var ls = m.getLineSize(sl);
                if(off >= so && off < so + ls) return [sl, off - so];
                so += d > 0 ? ls : -m.getLineSize(sl - 1);
            }
            return [-1, -1];
        };

        this.getOffsetByPoint = function (row,col){
            var startOffset = 0, startLine = 0, m = this.metrics;

            if(row >= m.getLines() || col >= m.getLineSize(row)) throw new Error();
            if(this.isValid && this.offset !=  -1) {
                startOffset = this.offset - this.currentCol;
                startLine = this.currentLine;
            }
            if (startLine <= row) for(var i = startLine;i < row; i++) startOffset += m.getLineSize(i);
            else for(var i = startLine - 1;i >= row; i--) startOffset -= m.getLineSize(i);
            return startOffset + col;
        };

        this.calcMaxOffset = function (){
            var max = 0, m = this.metrics;
            for(var i = 0;i < m.getLines(); i ++ ) max += m.getLineSize(i);
            return max - 1;
        };
    },

    function (pi){
        this._ = new pkg.Listeners("posChanged");
        this.isValid = false;
        this.metrics = null;
        this.currentLine = this.currentCol = this.offset = 0;
        this.setPositionMetric(pi);
    },

    function setPositionMetric(p){
        if(p == null) throw new Error();
        if(p != this.metrics){
            this.metrics = p;
            this.clearPos();
        }
    },

    function seekLineTo(t){ this.seekLineTo(t, 1); },

    function seekLineTo(t,num){
        if(this.offset < 0){
            this.setOffset(0);
            return;
        }
        var prevOffset = this.offset, prevLine = this.currentLine, prevCol = this.currentCol;
        switch(t)
        {
            case Position.BEG:
                if(this.currentCol > 0){
                    this.offset -= this.currentCol;
                    this.currentCol = 0;
                    this._.fire(this, prevOffset, prevLine, prevCol);
                } break;
            case Position.END:
                var maxCol = this.metrics.getLineSize(this.currentLine);
                if(this.currentCol < (maxCol - 1)){
                    this.offset += (maxCol - this.currentCol - 1);
                    this.currentCol = maxCol - 1;
                    this._.fire(this, prevOffset, prevLine, prevCol);
                } break;
            case Position.UP:
                if(this.currentLine > 0){
                    this.offset -= (this.currentCol + 1);
                    this.currentLine--;
                    for(var i = 0;this.currentLine > 0 && i < (num - 1); i++ , this.currentLine--){
                        this.offset -= this.metrics.getLineSize(this.currentLine);
                    }
                    var maxCol = this.metrics.getLineSize(this.currentLine);
                    if(this.currentCol < maxCol) this.offset -= (maxCol - this.currentCol - 1);
                    else this.currentCol = maxCol - 1;
                    this._.fire(this, prevOffset, prevLine, prevCol);
                } break;
            case Position.DOWN:
                if(this.currentLine < (this.metrics.getLines() - 1)){
                    this.offset += (this.metrics.getLineSize(this.currentLine) - this.currentCol);
                    this.currentLine++;
                    var size = this.metrics.getLines() - 1;
                    for(var i = 0;this.currentLine < size && i < (num - 1); i++ ,this.currentLine++ ){
                        this.offset += this.metrics.getLineSize(this.currentLine);
                    }
                    var maxCol = this.metrics.getLineSize(this.currentLine);
                    if(this.currentCol < maxCol) this.offset += this.currentCol;
                    else {
                        this.currentCol = maxCol - 1;
                        this.offset += this.currentCol;
                    }
                    this._.fire(this, prevOffset, prevLine, prevCol);
                } break;
            default: throw new Error();
        }
    }
]);

pkg.Properties = Class([
    function() { this.values = {}; },

    function get(name) { return this.values.hasOwnProperty(name) ? this.values[name] : null;  },

    function put(name, value) {
        var prev = this.get(name);
        this.values[name] = value;
        return prev;
    },

    function load(txt) {
        var lines = txt.split("\n");
        for(var i=0; i<lines.length; i++)
        {
              var key = lines[i].trim();
              if (key.length > 0 && key[0] != '#')
              {
                  var comment = key.indexOf('#');
                  if (comment > 0) key = key.substring(0, comment).trim();
                  var index = key.indexOf('=');
                  if (index <= 0) throw new Error(key + " property is invalid");
                  this.put(key.substring(0, index).trim(), key.substring(index + 1).trim());
              }
        }
    }
]);

pkg.sleep = function() {
    var r = new XMLHttpRequest(), t = (new Date()).getTime().toString(), i = window.location.toString().lastIndexOf("?");
    r.open('GET', window.location + (i > 0 ? "&" : "?") + t, false);
    r.send(null);
};

pkg.timer = new (function() {
    var quantum = 40;

    function CI() {
       this.run = null;
       this.ri = this.si = 0;
    }

    this.consumers  = Array(5);
    this.aconsumers = 0;
    for(var i = 0; i< this.consumers.length; i++) this.consumers[i] = new CI();

    this.get = function(r) {
        if (this.aconsumers > 0) {
            for(var i=0; i < this.consumers.length; i++) {
                var c = this.consumers[i];
                if (c.run != null && c.run == r) return c;
            }
        }
        return null;
    };

    this.run = function(r, startIn, repeatIn){
        var ps = this.consumers.length;
        if (this.aconsumers == ps) throw new Error("Out of runners limit");

        var ci = this.get(r);
        if (ci == null) {
            var consumers = this.consumers, $this = this;
            for(var i=0; i < ps; i++) {
                var j = (i + this.aconsumers) % ps, c = consumers[j];
                if (c.run == null) {
                    c.run = r;
                    c.si = startIn;
                    c.ri = repeatIn;
                    break;
                }
            }
            this.aconsumers++;

            if (this.aconsumers == 1) {
                var ii = window.setInterval(function() {
                    for(var i = 0; i < ps; i++) {
                        var c = consumers[i];
                        if (c.run != null) {
                            if (c.si <= 0){
                                try { c.run.run(); }
                                catch(e) {
                                    if (e.msg && e.msg.toLowerCase() === "interrupt") {
                                        c.run = null;
                                        $this.aconsumers--;
                                        if ($this.aconsumers === 0) break;
                                        continue;
                                    }
                                    zebra.out.print(e);
                                }
                                c.siw += c.ri;
                            }
                            else c.si -= quantum;
                        }
                    }
                    if ($this.aconsumers === 0) window.clearInterval(ii);
                }, quantum);
            }
         }
         else {
             ci.si = startIn;
             ci.ri = repeatIn;
         }
    };

    this.remove = function(l) {
        this.get(l).run = null;
        this.aconsumers--;
    };

    this.clear = function(l){
        var c = this.get(l);
        c.si = c.ri;
    };
})();

// !!!
// b64 is supposed to be used with binary stuff, applying it to utf-8 encoded data can bring to error
// !!!
var b64str = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

pkg.b64encode = function(input) {
    var out = [], i = 0, len = input.length, c1, c2, c3;
    if (typeof ArrayBuffer !== "undefined") {
        if (input instanceof ArrayBuffer) input = new Uint8Array(input);
        input.charCodeAt = function(i) { return this[i]; };
    }
    if (Array.isArray(input)) input.charCodeAt = function(i) { return this[i]; };

    while(i < len) {
        c1 = input.charCodeAt(i++) & 0xff;
        out.push(b64str.charAt(c1 >> 2));
        if (i == len) {
            out.push(b64str.charAt((c1 & 0x3) << 4), "==");
            break;
        }
        c2 = input.charCodeAt(i++);
        out.push(b64str.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4)));
        if (i == len) {
            out.push(b64str.charAt((c2 & 0xF) << 2), "=");
            break;
        }
        c3 = input.charCodeAt(i++);
        out.push(b64str.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6)), b64str.charAt(c3 & 0x3F));
    }
    return out.join('');
};

pkg.b64decode = function(input) {
    var output = [], chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

    while ((input.length % 4) !== 0) input += "=";

    for(var i=0; i < input.length;) {
        enc1 = b64str.indexOf(input.charAt(i++));
        enc2 = b64str.indexOf(input.charAt(i++));
        enc3 = b64str.indexOf(input.charAt(i++));
        enc4 = b64str.indexOf(input.charAt(i++));

        chr1 = (enc1 << 2) | (enc2 >> 4);
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        chr3 = ((enc3 & 3) << 6) | enc4;
        output.push(String.fromCharCode(chr1));
        if (enc3 != 64) output.push(String.fromCharCode(chr2));
        if (enc4 != 64) output.push(String.fromCharCode(chr3));
    }
    return output.join('');
};

pkg.dateToISO8601 = function(d) {
    function pad(n) { return n < 10 ? '0'+n : n; }
    return [ d.getUTCFullYear(), '-', pad(d.getUTCMonth()+1), '-', pad(d.getUTCDate()), 'T', pad(d.getUTCHours()), ':',
             pad(d.getUTCMinutes()), ':', pad(d.getUTCSeconds()), 'Z'].join('');
};

// http://webcloud.se/log/JavaScript-and-ISO-8601/
pkg.ISO8601toDate = function(v) {
    var regexp = ["([0-9]{4})(-([0-9]{2})(-([0-9]{2})", "(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?",
                  "(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?"].join(''), d = v.match(new RegExp(regexp)),
                  offset = 0, date = new Date(d[1], 0, 1);

    if (d[3])  date.setMonth(d[3] - 1);
    if (d[5])  date.setDate(d[5]);
    if (d[7])  date.setHours(d[7]);
    if (d[8])  date.setMinutes(d[8]);
    if (d[10]) date.setSeconds(d[10]);
    if (d[12]) date.setMilliseconds(Number("0." + d[12]) * 1000);
    if (d[14]) {
        offset = (Number(d[16]) * 60) + Number(d[17]);
        offset *= ((d[15] == '-') ? 1 : -1);
    }

    offset -= date.getTimezoneOffset();
    date.setTime(Number(date) + (offset * 60 * 1000));
    return date;
};

pkg.parseXML = function(s) {
    function rmws(node) {
        if (node.childNodes !== null) {
            for (var i = node.childNodes.length; i-->0;) {
                var child= node.childNodes[i];
                if (child.nodeType === 3 && child.data.match(/^\s*$/)) node.removeChild(child);
                if (child.nodeType === 1) rmws(child);
            }
        }
        return node;
    }

    if (typeof DOMParser !== "undefined") return rmws((new DOMParser()).parseFromString(s, "text/xml"));
    else {
        for (var n in { "Microsoft.XMLDOM":0, "MSXML2.DOMDocument":1, "MSXML.DOMDocument":2 }) {
            var p = null;
            try {
                p = new ActiveXObject(n);
                p.async = false;
            }  catch (e) { continue; }
            if (p === null) throw new Error("XML parser is not available");
            p.loadXML(s);
            return p;
        }
    }
    throw new Error("No XML parser is available");
};

pkg.Bag = zebra.Class([
    function () { this.$this({}); },

    function (container) {
        this.aliases = {};
        this.objects = container;
        this.content = {};
    },

    function get(key) {
        if (key == null) throw new Error();
        var n = key.split('.'), v = this.objects;
        for(var i = 0; i < n.length; i++) {
            v = v[n[i]];
            if (typeof v === "undefined") return v;
        }
        return v != null && v.$new ? v.$new() : v;
    },

    function load(s) { return this.load(s, true); },

    function load(s, b) {
        if (this.isloaded === true) throw new Error("Load is done");
        var content = null;
        try { content = JSON.parse(s); }
        catch(e) { throw new Error("Wrong JSON format"); }
        this.content = this.mergeContent(this.content, content);
        this.loaded(this.content);
        if (b === true) this.end();
        return this;
    },

    function end() {
        if (typeof this.isloaded === "undefined") {
            this.isloaded = true;
            if (this.content.hasOwnProperty("$aliases")) {
                var aliases = this.content["$aliases"];
                for(var k in aliases) {
                    this.aliases[k.trim()] = Class.forName(aliases[k].trim());
                }
                delete this.content["$aliases"];
            }
            this.objects = this.mergeObjWithDesc(this.objects, this.content);
        }
    },

    function loaded(c) {},

    function preprocess(v, cb) {
        if (v == null || zebra.isNumber(v) || zebra.isBoolean(v)) return v;
        if (zebra.isString(v)) return cb(v);

        if (Array.isArray(v)) {
            for (var i = 0; i < v.length; i++) v[i] = this.preprocess(v[i], cb);
            return v;
        }

        for (var k in v) if (v.hasOwnProperty(k)) v[k] = this.preprocess(v[k], cb);
        return v;
    },

    function mergeContent(o, v) {
        if (v === null || zebra.isNumber(v) || zebra.isBoolean(v) || zebra.isString(v)) return v;

        if (Array.isArray(v)) {
            if (o && !Array.isArray(o)) throw new Error("Array merging type inconsistency");
            return o ? o.concat(v) : v;
        }

        for (var k in v) {
            if (v.hasOwnProperty(k)) {
                o[k] = o.hasOwnProperty(k) ? this.mergeContent(o[k], v[k]) : v[k];
            }
        }
        return o;
    },

    function inherit(o, pp) {
        for(var i=0; i < pp.length; i++) {
            var op = this.objects, n = pp[i].trim(), nn = n.split("."), j = 0;
            while (j < nn.length) {
                op = op[nn[j++]];
                if (op == null) {
                    for(var kk in this.objects) zebra.print(" kk = " + kk);
                    throw new Error("Cannot find referenced object by '" + n + "(" + nn[j-1] + ")' path");
                }
            }

            for(var k in op) {
                if (op.hasOwnProperty(k) && o.hasOwnProperty(k) === false) o[k] = op[k];
            }
        }
    },

    // pass object to be assigned with the given value
    function mergeObjWithDesc(o, d) {
        if (d === null || zebra.isNumber(d) || zebra.isBoolean(d)) {
            return d;
        }

        if (Array.isArray(d)) {
            var v = [];
            for(var i=0; i< d.length; i++) v[i] = this.mergeObjWithDesc(null, d[i]);
            if (o && !Array.isArray(o)) throw new Error("Destination has to be array");
            return (o != null) ? o.concat(v) : v;
        }

        if (zebra.isString(d)) {
            return (d[0] == "@") ? this.get(d.substring(1)) : this.decodeStringValue(d);
        }

        var inh = null;
        if (d.hasOwnProperty("$inherit")) {
            inh = d["$inherit"];
            delete d["$inherit"];
        }

        var v = (o == null || zebra.isNumber(o) || zebra.isBoolean(o) || zebra.isString(o) || Array.isArray(o)) ? d : o;
        for (var k in d) {
            if (d.hasOwnProperty(k)) {
                if (k[0] == ".") {
                    var vv = d[k], mn = k.substring(1).trim();
                    if (!Array.isArray(vv)) vv = [ vv ];
                    return this.objects[mn].apply(this.objects, this.mergeObjWithDesc(null, vv));
                }

                if (k[0] == "$") {
                    var args = d[k];
                    v["$args" ] = this.mergeObjWithDesc(null, Array.isArray(args) ? args : [ args ]);
                    v["$class"] = k.substring(1).trim();
                }
                else
                {
                    var po = o && o.hasOwnProperty(k) ? o[k] : null;
                    v[k] = d[k];
                    v[k] = this.mergeObjWithDesc(po, d[k]);
                }
            }
        }

        if (v.hasOwnProperty("$class")) {
            var cn = v["$class"], args = v["$args"], $this = this;
            if (cn[0] == "*") {
                return { $new : function() { return $this.newInstance(cn.substring(1).trim(), args, v); } };
            }
            return this.newInstance(cn, args, v);
        }

        if (inh !== null) this.inherit(v, inh);
        return v;
    },

    function newInstance(cn, args, p) {
        var clazz = this.resolveClass(cn), o = null;
        if (args && args.length > 0) {
            var f = function() {};
            f.prototype = clazz.prototype;
            o = new f();
            o.constructor = clazz;
            clazz.apply(o, args);
        }
        else o = new clazz();
        if (p) {
            for(var k in p) {
                if (p.hasOwnProperty(k) && k[0] != "$") o[k] = p[k];
            }
        }
        return o;
    },

    function decodeStringValue(v) {
        return (v[0] == "#" || (v[0] == 'r' && v[1] == 'g' && v[2] == 'b')) ? new pkg.rgb(v) : v;
    },

    function resolveClass(clazz) {
        return this.aliases.hasOwnProperty(clazz) ? this.aliases[clazz] : zebra.Class.forName(clazz);
    }
]);

})(zebra("util"), zebra.Class, zebra.Interface);

(function(pkg, Class) {



})();