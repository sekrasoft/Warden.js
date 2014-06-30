(function() {
  var Warden;

  Warden = {};

  Warden.version = "0.0.0";

  Warden.toString = function() {
    return Warden.stringify(Warden);
  };

  Warden.create = function(fn, config) {
    var callbacks, streams;
    streams = {};
    callbacks = {};
    fn.prototype.emit = function(ev) {
      var self;
      self = this;
      if (streams[ev.type] != null) {
        streams[ev.type].map(function(i) {
          return i.evaluate(ev, self);
        });
      }
      if (callbacks[ev.type] != null) {
        callbacks[ev.type].map(function(item) {
          var adj, context;
          context = (item.config && item.config.context) || self;
          adj = item.config && item.config.adj;
          return item.callback.apply(context, [ev].concat(adj));
        });
      }
      return this;
    };
    fn.prototype.on = function(ev, callback, config) {
      var c;
      c = callbacks[ev];
      if (callbacks[ev] == null) {
        callbacks[ev] = [];
      }
      callbacks[ev].push({
        callback: callback,
        config: config
      });
      return this;
    };
    fn.prototype.stream = function(type, name) {
      var stream;
      stream = Warden.stream(type, name);
      if (streams[type] == null) {
        streams[type] = [];
      }
      streams[type].push(stream);
      return stream;
    };
    return fn;
  };

  Warden.stream = function(ev, name) {
    var Bus, stream;
    Bus = (function() {
      function Bus(process) {
        this.process = process != null ? process : [];
      }

      Bus.prototype.exec = function(ev, cnt) {
        var event, process, self, _i, _len, _ref;
        self = this;
        event = ev;
        event.timestamp = (new Date()).getTime();
        event.environment = 'Warden 0.0.0';
        _ref = this.process;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          process = _ref[_i];
          switch (process.type) {
            case 'm':
              if (typeof process.fn === 'function') {
                event = process.fn(event);
              } else {
                event = process.fn;
              }
              self.mapped = true;
              break;
            case 'f':
              if (typeof process.fn === 'function') {
                if (process.fn(event) === false) {
                  return false;
                }
              } else {
                if (Boolean(process.fn) === false) {
                  return false;
                }
              }
          }
        }
        return this.final.apply(cnt, [event]);
      };

      return Bus;

    })();
    stream = {
      type: ev,
      name: name,
      config: [],
      activeBus: []
    };
    Bus.prototype.map = function(fn) {
      return new Bus(this.process.concat({
        type: 'm',
        fn: fn
      }));
    };
    Bus.prototype.filter = function(fn) {
      return new Bus(this.process.concat({
        type: 'f',
        fn: fn
      }));
    };
    Bus.prototype.listen = function(fn) {
      this.final = fn;
      stream.activeBus.push(this);
      return this;
    };
    Bus.prototype.evaluate = function(ev, cnt) {
      return stream.activeBus.map(function(bus) {
        return bus.exec(ev, cnt);
      });
    };
    return new Bus();
  };

  Warden.stringify = function(json, delim, n) {
    var i, key, offset, res, val;
    res = "{" + (delim ? "\n" : " ");
    if (!n) {
      n = 0;
    }
    if (n > 2) {
      res = "[object]";
      return res;
    }
    offset = "";
    i = 0;
    while (i++ <= n && delim) {
      offset += "\t";
    }
    for (key in json) {
      val = json[key];
      res += "" + offset + key + ":";
      if (typeof val === 'object') {
        res += Warden.stringify(val, delim, n + 1) + (delim ? ",\n" : ", ");
      } else {
        if (val) {
          if (typeof val === 'string') {
            if (delim) {
              res += "'" + (val.toString()) + "',\n";
            } else {
              res += "'" + (val.toString()) + "', ";
            }
          } else {
            if (delim) {
              res += "" + (val.toString()) + ",\n";
            } else {
              res += "" + (val.toString()) + ", ";
            }
          }
        } else {
          res += "'undefined'" + (delim ? ",\n" : ", ");
        }
      }
    }
    res = res.slice(0, -2);
    if (n > 0) {
      res += " }";
    } else {
      res += delim ? "\n}" : " }";
    }
    return res;
  };

  this.Warden = Warden;

}).call(this);
