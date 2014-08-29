((function (root, factory) {
  if (typeof exports === "object" && exports) {
    factory(exports);   } else {
    if(root.Warden == null){       Warden = {};
    }
    factory(Warden);
    if (typeof define === "function" && define.amd) {
      define(Warden);     } else {
      root.Warden = Warden;     }
  }
})(this, function(Warden){
  
  'use strict';
  Warden.version = "0.0.4"; 
  Warden.log = function(x){
    console.log(x);
  }
  
/* Begin: src/modules/Helpers.js */
  /* 
    Helpers module
    v.0.2.0
  */

  /* 
    Data type checking methods
  */

  var Utils = (function(){
    var utils = {};

    utils.is = {
      fn : function (x) {
        return typeof x === 'function';
      },
      num : function (x) {
        return typeof x === 'number';
      },
      str : function (x) {
        return typeof x === 'string';
      },
      obj : function(x){
        return typeof x === 'object' && !this.array(x);
      },

      /*
        Function isArray(@mixed x):
        Checks is x param is real array or object (or arguments object)
      */
      array : (function(){    
        if(Array.isArray){
          return function(x){ 
            return Array.isArray(x); 
          }
        }else{
          return function(x){ 
            Object.prototype.toString.call(x) === '[object Array]';
          }
        }
      }()),

      /*
        Function exists(@mixed x):
        Returns true is x exists and not equal null.
      */
      exist : function(x){
        return typeof x !== 'undefined' && x !== null;
      }
    };


    /* 
      Function forEach(@array arr, @function fn):
      Applies @fn for each item from array @arr usage: forEach([1,2], function(item){...})
    */
    utils.forEach = (function(){
      if(Array.prototype.forEach){
        return function(arr, fn){ 
          return arr ? arr.forEach(fn) : null;
        }
      }else{
        return function(arr, fn){ 
          for(var i=0, l=arr.length; i<l;i++){ 
            fn(arr[i], i);
          }
        }
      }
    }());

    /* Extending objects */
    utils.extend = (typeof $ !== 'undefined' && $.extend) ? $.extend : function (){var a,b,c,d,e,f,g=arguments[0]||{},h=1,i=arguments.length,j=!1;for("boolean"==typeof g&&(j=g,g=arguments[h]||{},h++),"object"==typeof g||m.isFunction(g)||(g={}),h===i&&(g=this,h--);i>h;h++)if(null!=(e=arguments[h]))for(d in e)a=g[d],c=e[d],g!==c&&(j&&c&&(m.isPlainObject(c)||(b=m.isArray(c)))?(b?(b=!1,f=a&&m.isArray(a)?a:[]):f=a&&m.isPlainObject(a)?a:{},g[d]=m.extend(j,f,c)):void 0!==c&&(g[d]=c));return g}

    /* 
      Queue class @arr is Array, @maxlength is Number
    */
    utils.Queue = function Queue(max, arr){
      var res = arr || [],
          max = max || 16,
          oldpush = res.push;

      res.push = function(x){
        if(this.length>=max){
          this.shift();
        }
        return oldpush.apply(res, [x]);
      }
      return res;
    }

    utils.$hash = (function(){
      var hash = {};
      return {
        get : function(n){
          return hash[n];
        },
        set : function(i){
          var current = parseInt(hash[i], 16) || 0;      
          return hash[i] = (current+1) . toString(16);
        }
      }
    })();


    /* 
      Datatype analyzer
    */

    utils.Analyze = function(id, i){
      var t = utils.Analyze.MAP[id], yt = typeof i;
      if(t && t.indexOf(yt)==-1){
        throw "TypeError: unexpected type of argument at: ." + id + "(). Expected type: " + t.join(' or ') + ". Your argument is type of: " + yt;
      }
    }

    utils.Analyze.MAP = (function(){
      var o = 'object', s = 'string', f = 'function', n = 'number';
      return {
        extend : [o,f],
        reduce : [f],
        take : [f,n],
        filter : [f],
        skip : [n],
        setup : [f],
        makeStream: [s,f],
        debounce : [n],
        getCollected : [n],
        interpolate : [s],
        mask : [o],
        warn : function(i, context){
          console.warn("Coincidence: property: '" + i + "' is already defined in stream context!", context);
        }
      }
    })();

    return utils;
  })();/* End: src/modules/Helpers.js */
/* Begin: src/modules/Extend.js */
  /* 
    Extend module: 
      docs: ./docs/Extend.md
      version: v.0.3.0

    This methods extends @obj which can be both 
    function or object with Warden.js methods .emit(), 
    .listen() and .stream() 
  */

  Warden.extend = (function(){
    var forEach = Utils.forEach, 
      is = Utils.is,
      extend = Utils.extend,
      Analyze = Utils.Analyze,

      defaultConfig = {
        max : 512,         context : 'this',         emitter : null,         listener : null       }

    return function(obj, conf) {
      Analyze('extend', obj);

      var config = extend(defaultConfig, conf || {}),           inheritor = obj,           isConstructor = true; 
      /* 
        Choose object to extend,
        if fn is constructor function, then that's prototype, else
        use actual object element 
      */    
      if(is.fn(obj)){
        inheritor = obj.prototype;
      }else{
        isConstructor = false;
      }
      
      /* 
        Setting up standart DOM event listener 
        and emitters  function to not overwrite them 
        and user should do not use that in config 
      */
      if(typeof jQuery!=="undefined"){
        config.emitter = config.emitter || 'trigger';
        config.listener = config.listener || 'on';    
      }else
      if(is.fn(inheritor.addEventListener) || is.fn(inheritor.attachEvent)){
        config.listener = config.listener || (is.fn(inheritor.addEventListener) ? "addEventListener" : "attachEvent");
      }
      
      /* Preventing native 'emit' method override */
      var emitName = inheritor.emit ? '$emit' : 'emit',

        /* Collections of private handlers */
        /* Developed to incapsulate handlers of every object */
      handlers = [];

      /* Get handlers of @object by @type */
      handlers.get = function(object, type){
        for(var i=this.length-1; i>=0; i--){
          if(this[i].o === object){
            return this[i].h[type];
          }
        }
        return false;
      };  

      /* Setting new handler @fn of event type @type to @object */
      handlers.set = function(object, type, fn){
        var handlers = this.get(object, type), collection;
        if(handlers){
          if(handlers.length < config.max){
            handlers.push(fn);
          }else{
            throw "Maximal handlers count reached";
          }
        }else{
          collection = this.getCollection(object);
          if(collection){
            collection.h[type] = collection.h[type] || [];
            collection.h[type].push(fn);
          }else{ 
            collection = {
              o : object,
              h : {}
            };
            collection.h[type] = [fn];
            this.push(collection);
          }
        }
      };
      
      /* Get collections of handlers by types of @object */
      handlers.getCollection = function(object){
        for(var i=this.length-1; i>=0; i--){
          if(this[i].o === object){
            return this[i]
          }
        }
        return false;
      };
      
      /* Emitter method */
      inheritor[emitName] = function(ev){
        var self = this,
            callbacks = handlers.get(this, ev.type || ev);
        forEach(callbacks, function(callback){
          callback.call(self, ev);
        });
          
        return this;
      };

      /* Listener function */
      inheritor.listen = function(type, callback){
        var self = this;
        handlers.set(this, type, callback);    
        if(this[config.listener]){
          this[config.listener].apply(this, [type, function(event){ 
            self[emitName](event)
          }]);
        }
        return this;
      };

      /* Creates stream */
      inheritor.stream = function(type, cnt) {
        var stream = Warden.makeStream(type, cnt || this);

        handlers.set(this, type, function(event){
          stream.eval(event);
        });

        if(this[config.listener]){
          this[config.listener].apply(this, [type, function(event){     
            stream.eval(event);      
          }]);
        }
        
        return stream.get();
      };

      return obj;
    };

  })();/* End: src/modules/Extend.js */
/* Begin: src/modules/Processor.js */
  /*
    Processor module: 
    Implements interface to processing all databus methods.
    Version: v0.1.0;
  */

  function Processor(proc, host){
    var processes = proc || [], locked = 0, i = 0,

        /* Functional methods to manipulate DataBus processing workflow */
        fns = {
          /* Continue processing with @data */
          $continue: function(data){
             return self.tick(data);
          },
          /* Break processing */
          $break: function(){
            return self.tick({}, 1);
          },
          /* Locks DataBus evaluation */
          $lock: function(){
            return locked = 1;
          },
          /* Unlocks DataBus evaluation */
          $unlock: function(){
            return locked = 0;
          },
          /* Returns current DataBus */
          $host: function(){
            return host;
          }
        };
    
    var self = {
      /* Add process if @p exists or return all processes of this Processor */
      process : function(p){
        return Utils.is.exist(p) ? processes.push(p) : processes;
      },

      /* Start processing */
      start : function(event, context, fin){
        self.ctx = context;
        self.fin = fin;    
        
        i = locked ? 0 : i;
        
        if(i==processes.length){
          i = 0;
          return fin(event);
        }

        this.tick(event);
      },

      /* Ticking processor to the next process */
      tick : function(event, breaked){        
        if(breaked){
          return i = 0;
        }
        
        if(i==processes.length){
          i = 0;
          return self.fin(event);
        }
        i++
        processes[i-1].apply(self.ctx, [event, fns]);
      }
    }
    return self;
  }/* End: src/modules/Processor.js */
/* Begin: src/modules/Streams.js */
  /*
    Streams module:
      docs: ./docs/Streams.md
      version: 0.2.2

    Creates stream of data.
    If @x is string, that it interprets as datatype
    else if @x is function, than x's first arg is emitting data function
  */

  Warden.makeStream = (function(){
    var forEach = Utils.forEach, is = Utils.is;

    /* Stream constructor */
    function Stream(context){
      var drive = [], self = {};
      return  Utils.extend(self, {
        /*
          For debugging:
        */
        $$id : Utils.$hash.set('s'),

        /* 
          Evaluating the stream with @data 
        */
        eval : function(data){
          forEach(drive, function(bus){
            bus.fire(data, context);
          });
        },
        
        /* 
          Push into executable drive @bus.
          Bus is DataBus object.
        */
        push : function(bus){
          drive.push(bus);
        },

        /* 
          Removes from executable drive @bus.
          Bus must be DataBus object.
        */
        pop : function(bus){
          var match;
          forEach(drive, function(b, i){
            if(bus.$$id == b.$$id){
              drive = drive.slice(0,i).concat(drive.slice(i+1,drive.length));
              match = b;
            }
          });
          return match;
        },

        /* 
          Removes from executable drive @bus and all @bus children;
          @bus must be DataBus object.
        */
        popAllDown : function(bus){
          forEach(this.pop(bus).children, this.pop);
        },

        /* 
          Removes from executable drive @bus, @bus.parent and @bus.parent.parent etc
          @bus must be DataBus object
        */
        popAllUp : function(bus){
          var match = this.pop(bus);
          if(is.exists(match.parent)){
            this.popAllUp(match.parent);
          }
        },

        /*
          Creates empty DataBus object and hoist it to the current stream
        */
        get : function(){
          var bus = new DataBus();
          bus.host(this);
          return bus;
        },
      });
    }

    /* 
      Creates stream of @x on context @context;
      If @strict argument is truly, than it warns about the coincidence 
      in the context to prevent overwriting;
    */
    return function(x, context, strict){
      var stream, xstr, reserved = [], i;

      Utils.Analyze("makeStream", x);
      
      context = context || {};  
      stream = Stream(context);

      if(is.fn(x)){

        /* If we strict in context */
        if(is.exist(strict)){
          xstr = x.toString();

          for(i in context){
            if(context.hasOwnPropery(i)){
              reserved.push(i);
            }
          }

          forEach(reserved, function(prop){
            if(xstr.indexOf("this."+prop)>=0){
              /* If there is a coincidence, we warn about it */
              Utils.analyzer.MAP.warn(prop, context);
            }
          });    
        }

        x.call(context, function(expectedData){
          stream.eval(expectedData);
        });  
      }
      return stream;
    };
  })();/* End: src/modules/Streams.js */
/* Begin: src/modules/DataBus.js */
  /*
    DataBus module.
    Version: v0.1.0
    Implements data processing through stream. 
  */

  var DataBus = (function(){
    var forEach = Utils.forEach, is = Utils.is, Analyze = Utils.Analyze;      

    function DataBus(proc){
      var processor = new Processor(proc || [], this),           host = 0,           setup = function(x){
            return x
          }; 

      this.$$id = Utils.$hash.set('d'),
      
      this.parent = null;
      this.children = []; 
      this.handlers = [];

      this._ = {
        fires : new Utils.Queue(),
        takes : new Utils.Queue()
      };

      /* Return hoisting stream if @h doesn't exists or setting up new host */
      this.host = function(h){
        return host = h || host;
      }

      /* This function sets up current data */
      this.setup = function(fn){
        Analyze('setup', fn);
        setup = fn;
      }

      this.process = function(p){
        var nprocess, nbus;
        if(!p){
          return processor;
        }else{
          /* Copying process */
          nprocess = [];
          forEach(processor.process(), function(i){
            nprocess.push(i);
          });
          nprocess.push(p);
          nbus = new DataBus(nprocess);
          nbus.host(this.host());
          nbus.parent = this;
          this.children.push(nbus);
          return nbus;  
        }
      };

      this.fire = function(data, context){
        var self = this;
        
        data = is.exist(data) ? setup(data) : setup({}); 
        this._.fires.push(data); 
        processor.start(data, context, function(result){
          self._.takes.push(result); 
          /* Executing all handlers of this DataBus */
          forEach(self.handlers, function(handler){
            handler.apply(context, [result]);
          });

        });
      }
    }


    /* 
      Binds a handler @x (if @x is function) or function that logging @x to console (if @x is string) to the current DataBus 

      This function don't create new DataBus object it just puts to the current data bus 
      object's handlers list new handler and push it's to the executable drive of hoster stream 
    */
    DataBus.prototype.listen = function(x){
      this.handlers.push(is.fn(x) ? x : function(){console.log(x)});
      if(this.handlers.length<=1){
        this.host().push(this);
      }
      return this;
    };


    /*
      Unbinds handler with name @x (if @x is string) or @x handler (if @x is function) 
      If in the handlers list 2 or more handlers with name @x (or @x handlers registered twice) it will remove all handlers
    */
    DataBus.prototype.mute = function(x){
      x = is.fn(fn) ? x.name : x;
      
      forEach(this.handlers, function(handler, index){
        if(handler.name == x){
           this.handlers = this.handlers.slice(0,index).concat(this.handlers.slice(index+1,this.handlers.length));
        }
      });
      return this;
    };

    /* Logging recieved data to console or logger */
    DataBus.prototype.log = function(x){
      var logger = is.exist(x) ? x : console.log;
      return this.listen(function(data){
        return logger(data);
      });
    };

    /* 
      Filtering recieved data and preventing transmitting through DataBus if @x(event) is false
    */
    DataBus.prototype.filter = function(x) {
      Analyze('filter', x);
      return this.process(function(e, drive){
        return x.apply(this, [e]) === true ? drive.$continue(e) : drive.$break();
      });
    };

    /*
      Mapping recieved data and transmit mapped to the next processor 
      If @x is string:
        and data[x] exists : result = data[x],
        and data[x] doesn't exist: result = x
      else @x is function:
        anyway: result = x(data)
      else @x is array:
        (recurently with each index of array)
      else @x is object:
        (recurently with each property of array with name data[x] : x)
      else
        reulst = x
    */
    DataBus.prototype.map = function(x) {
      var fn, ctype = typeof x, res;
      switch(ctype){
        case 'function':
          fn = function(e, drive){
            return drive.$continue(x.call(this, e));
          }
        break;
        case 'string':
          fn = function(e, drive){
            var t = e[x], 
                r = is.exist(t) ? t : x;
            return drive.$continue(r);
          }
        break;
        case 'object':
          if(is.array(x)){
            fn = function(e, drive){
              var res = [];
              forEach(x, function(i){
                var t = e[i];
                res.push(is.exist(t) ? t : i);
              }); 
              return drive.$continue(res);
            }
          }else{
            fn = function(e, drive){
              var res = {}, t;
              for(var prop in x){
                t = e[x[prop]];
                res[prop] = is.exist(t) ? t : x[prop];
              }
              return drive.$continue(res);
            }
          }
        break;
        default:
          fn = function(e, drive){
            return drive.$continue(x);
          }
        break;
      }
      return this.process(fn);
    };

    /* 
      Appying @fn function ot the previos and current value of recieved data 
      If previous value is empty, then it is init or first value (or when init == 'first' or '-f')
    */
    DataBus.prototype.reduce = function(init, fn){
      Analyze('reduce', fn);
      return this.process(function(event, drive){
        var bus = drive.$host(),
            prev = init,
            cur = event;

        if(bus._.takes.length >= 1 || init == 'first' || init == '-f'){
          prev = bus._.takes[bus._.takes.length-1];
        }
        return drive.$continue(fn(prev, cur));
      });   
    };

    /* 
      Take only @x count or (if @x is function) works like .filter()
    */
    DataBus.prototype.take = function(x){
      Analyze('take', x);
      if(is.fn(x)){
        return this.filter(x);
      }else{
        return this.process(function(e, drive){
          var bus = drive.$host();
          bus._.limit = bus._.limit || x;
          if(bus._.takes.length === bus._.limit){
            return drive.$break();
          }else{
            return drive.$continue(e);
          }
        });
      }
    };

    /*
      Skips data @c times
    */
    DataBus.prototype.skip = function(c) {
      Analyze('skip', c);
      return this.process(function(e, drive){
        var bus = drive.$host();
        if(bus._.fires.length <= c){
          drive.$break();
        }else{
          return drive.$continue(e);
        }
      });  
    };

    DataBus.prototype.interpolate = function(s){
      Analyze('interpolate', s);
      return this.process(function(event, drive){
        var regex = /{{\s*[\w\.]+\s*}}/g;
        return drive.$continue(s.replace(regex, function(i){return event[i.slice(2,-2)]}));
      })
    };

    DataBus.prototype.mask = function(o){
      Analyze('mask', o);
      return this.process(function(event, drive){
        var regex = /{{\s*[\w\.]+\s*}}/g;
        return drive.$continue(event.replace(regex, function(i){
          return o[i.slice(2,-2)];
        }));
      });
    };

    DataBus.prototype.unique = function(){
      return this.process(function(event, drive){
        var fires = drive.$host()._.fires;
        var takes = drive.$host()._.takes;
        if( (fires.length > 1 || takes.length > 0) && (event == fires[fires.length-2] || event == takes[takes.length-1])){      
          return drive.$break();
        }else{
          return drive.$continue(event);
        }  
      });
    };

    DataBus.prototype.debounce = function(t) {
      Analyze('debounce', t)
      return this.process(function(e, drive){
        var self = this, bus = drive.$host();
        clearTimeout(bus._.dbtimer);
        bus._.dbtimer = setTimeout(function(){
          delete bus._.dbtimer;
          drive.$unlock();
          drive.$continue(e);
        }, t);      
        drive.$lock();
      });
    };

    /* 
      Collecting events for @t miliseconds and after it transmitting an array of them 
    */
    DataBus.prototype.getCollected = function(t){
      Analyze('getCollected', t);
      return this.process(function(e, drive){
        var self = this, 
            bus = drive.$host(),
            fired = bus._.fires.length-1;
        bus._.tmpCollection = bus._.tmpCollection || [];
        bus._.tmpCollection.push(e);
        if(!bus._.timer){
          bus._.timer = setTimeout(function(){
            var collection = bus._.tmpCollection;

            clearTimeout(bus._.timer);
            delete bus._.timer;
            delete bus._.tmpCollection
            
            drive.$unlock();
            drive.$continue(collection);
          }, t);
          drive.$lock();
        }else{
          drive.$lock();
        }
      });
    };

    DataBus.prototype.after = function(bus, flush){
      var busExecuted = false;
      bus.listen(function(){
        busExecuted = true;
      });
      return this.process(function(event, drive){
        if(busExecuted){
          busExecuted = flush === true ? false : true;
          drive.$unlock();
          drive.$continue(event);
        }else{
          drive.$lock();
        }
      });
    };

    DataBus.prototype.waitFor = function(bus){
      var self = this;
      return Warden.makeStream(function(emit){
        var exec = false, val,         
            clear = function(){
              val = null; 
              exec = false;
            };

        bus.listen(function(data){
          if(exec){
            emit(val);
            clear();
          }
        });

        self.listen(function(data){
          val = data;
          exec = true;
        });

      }).get();
    };


    DataBus.prototype.merge = function(bus){
      var self = this;
      return Warden.makeStream(function(emit){
        bus.listen(emit);
        self.listen(emit);
      }).get();
    };


    DataBus.prototype.produceWith = function(bus, fn) {
      var self = this; 
      return Warden.makeStream(function(emit){
        self.sync(bus).listen(function(data){
          var d1 = data[0], d2 = data[1];
          emit(fn(d1, d2));
        });
      }).get();
    };

    DataBus.prototype.combine = function(bus, fn){
      var self = this;
      var a, b;
      bus.listen(function(event){
        b = event;
      });
      this.listen(function(event){
        a = event;
      })

      return Warden.makeStream(function(emit){
        self.listen(function(data){
          emit(fn(a,b));
        });
        bus.listen(function(data){
          emit(fn(a,b));
        });
      }).get();
    };

    DataBus.prototype.sync = function(bus){
      var self = this;
      return Warden.makeStream(function(emit){
        var exec1 = false, 
            exec2 = false,
            val1, 
            val2,
            clear = function(){
              val1 = null; 
              val2 = null;
              exec1 = false,
              exec2 = false;
            };

        bus.listen(function(data){
          if(exec1){
            emit([val1, data]);
            clear();
          }else{
            val2 = data,
            exec2 = true;
          }
        });

        self.listen(function(data){
          if(exec2){
            emit([data, val2]);
            clear();
          }else{
            val1 = data;
            exec1 = true;
          }
        })
      }).get();
    };

    DataBus.prototype.lock = function(){
      this.host().pop(this);
    };

    DataBus.prototype.lockChildren = function() {
      this.host().popAllDown(this);
    };

    DataBus.prototype.lockParent = function() {
      this.host().popAllUp(this);
    };

    DataBus.prototype.unlock = function(){
      this.host().push(this);
    };

    DataBus.prototype.bindTo = function(a,b){
      Warden.watcher(this, a, b);
    };

    return DataBus;
  })();

/* End: src/modules/DataBus.js */
/* Begin: src/modules/Watcher.js */
  Warden.watcher = function(bus, a, b){      
  	var ta = typeof a,
  		tb = typeof b,
  		terr = "TypeError",
  		fn, 
  		is = Utils.is;

  	if(!is.exist(b) && is.exist(a)){
  		if(ta == 'string' || ta == 'object'){
  			fn = function(event){
  				return this[a] = event;
  			}
  		}else
  		if(ta == 'function'){
  			fn = function(event){
  				return a(event);
  			}
  		}else{
  			throw terr;
  		}
  	}else

  	if(is.exist(b)){
  		if(ta == 'object' && tb == 'string'){
  			fn = function(event){
  				return a[b] = event;
  			}
  		}else

  		if(ta == 'object' && tb == 'function'){
  			fn = function(event){
  				return a = b(event);
  			}
  		}else
  		{
  			throw terr;
  		}
  	} else

  	{
  		throw "Arg Error"
  	}

  	return bus.listen(fn);
  };/* End: src/modules/Watcher.js */
}));