describe('Warden DataBus methods', function () {  
	var sync = {}, 
		value = 0, 
		mapped = {}, 
		filtered = {},
		reduced = {},
		taken = 0,
		_clear = function(){
			value = 0;
			mapped = {};
			filtered = {};
			reduced = {};
			taken = 0;
		},
		bus = Warden.makeStream(function(trigger){
			this.transmit = function(val){
				trigger(val);
			}
		}, sync).get();

	/* Simple */
	bus.listen(function(data){
		value = data;
	});

	include "databus/simple.js"
	include "databus/map.js"
	include "databus/filter.js"
	include "databus/reduce.js"
	include "databus/take.js"
	include "databus/skip.js"
	include "databus/mask.js"
	include "databus/unique.js"
	include "databus/timefunc.js"
	include "databus/combinig.js"
	include "common/lockunlock.js"
    include "common/context.js"
});