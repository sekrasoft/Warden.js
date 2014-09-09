/* 
  Helpers module
  v.0.2.0
*/

/* 
  Data type checking methods
*/

var Utils = (function(){
  return {
    is : {
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
        return Array.isArray ? Array.isArray : function(x){
          return Object.prototype.toString.call(x) === '[object Array]';
        }
      }()),

      /*
        Function exists(@mixed x):
        Returns true is x exists and not equal null.
      */
      exist : function(x){
        return typeof x !== 'undefined' && x !== null;
      }
    },

    /* 
      Function forEach(@array arr, @function fn):
      Applies @fn for each item from array @arr usage: forEach([1,2], function(item){...})
    */
    forEach : (function(){
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
    }()),

    /* Extending objects */
    extend : (typeof $ !== 'undefined' && $.extend) ? $.extend : function (){var a,b,c,d,e,f,g=arguments[0]||{},h=1,i=arguments.length,j=!1;for("boolean"==typeof g&&(j=g,g=arguments[h]||{},h++),"object"==typeof g||m.isFunction(g)||(g={}),h===i&&(g=this,h--);i>h;h++)if(null!=(e=arguments[h]))for(d in e)a=g[d],c=e[d],g!==c&&(j&&c&&(m.isPlainObject(c)||(b=m.isArray(c)))?(b?(b=!1,f=a&&m.isArray(a)?a:[]):f=a&&m.isPlainObject(a)?a:{},g[d]=m.extend(j,f,c)):void 0!==c&&(g[d]=c));return g},

    /* 
      Queue class @arr is Array, @maxlength is Number
    */
    Queue : function Queue(max, arr){
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
    },

    $hash : (function(){
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
    })()
  }
})();

Warden.Utils = Utils;

/* Exception manager */
var Analyze = function(id, i){
  var t = Analyze.MAP[id], yt = typeof i;
  if(t && t.indexOf(yt)==-1){
    throw "TypeError: unexpected type of argument at: ." + id + "(). Expected type: " + t.join(' or ') + ". Your argument is type of: " + yt;
  }
}

Analyze.MAP = (function(){
  var o = 'object', 
      s = 'string', 
      f = 'function', 
      n = 'number';
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

Warden.configure.datatypes = function(name, types){
  if(Analyze.MAP[name]){
    throw "This name is already exist";
  }else{
    Analyze.MAP[name] = types;
  }
}