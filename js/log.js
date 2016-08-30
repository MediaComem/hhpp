(function(exports) {

  var log = {};

  log.isDebugEnabled = function() {
    if (log.debugEnabled) {
      return true;
    }

    log.debugEnabled = $('meta[name="debug"]').attr('content') === 'true';
  };

  log.debug = function() {
    if (!log.isDebugEnabled()) {
      return;
    }

    var args = Array.prototype.slice.call(arguments);
    console.debug.apply(console, args);
  };

  exports.log = log;
})(window);
