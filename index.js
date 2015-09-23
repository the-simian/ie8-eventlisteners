'use strict';


function shimEventListener() {
  // ES5 15.4.4.19
  // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
  var doc = global.document;

  if (global.addEventListener) {
    return; //nope.
  }

  var registry = [];

  // add
  function addEventListener(type, listener) {
    var target = this;

    registry.unshift({
      __listener: function (eve) {

        function shimPreventDefault() {
          eve.returnValue = false;
        }
        function shimStopPropagation() {
          eve.cancelBubble = true;
        }

        eve.currentTarget = target;
        eve.pageX = eve.clientX + document.documentElement.scrollLeft;
        eve.pageY = eve.clientY + document.documentElement.scrollTop;
        eve.preventDefault = eve.preventDefault || shimPreventDefault;
        eve.stopPropagation = eve.stopPropagation || shimStopPropagation;
        eve.relatedTarget = eve.fromElement || null;
        eve.target = eve.srcElement || target;

        try {
          listener.call(target, eve);
        } catch (err) {
          console.log(err);
        }

      },
      listener: listener,
      target: target,
      type: type
    });
    target.attachEvent('on' + type, registry[0].__listener);
  }

  // remove
  function removeEventListener(type, listener) {
    for (var index = 0, length = registry.length; index < length; ++index) {

      var entry = registry[index];
      var registryMatch = entry.target == this && entry.type == type && entry.listener == listener;

      if (registryMatch) {
        return this.detachEvent('on' + type, registry.splice(index, 1)[0].__listener);
      }
    }
  }

  function shim(node) {
    console.log(typeof node);
    if (node && node.addEventListener) {
      console.log('leaving', node);
      return;
    }

    if (node && node.length) {
      var nodeLength = node.length;
      for (var index = 0; index < nodeLength; index++) {
        console.log('index =>', index, node[index]);
        shim(node[index]);
      }
    } else {

      if (node) {
        node.addEventListener = addEventListener;
        node.removeEventListener = removeEventListener;
      }

    }

    return node;
  }

  shim([global, doc, doc.all]);

  if ('Element' in global) {
    global.Element.prototype.addEventListener = addEventListener;
    global.Element.prototype.removeEventListener = removeEventListener;
  }
}

(function supportModuleTypes(definition, context) {
  if (typeof module != 'undefined' && module.exports) {
    module.exports = definition();
  } else if (typeof define == 'function') {
    define(definition);
  } else if (typeof YUI == 'function') {
    YUI.add('es5', definition);
  } else {
    definition();
  }
})(shimEventListener);
