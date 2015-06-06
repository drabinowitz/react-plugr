(function() {
  var React, appContextMixin, contextMixin, getLocalStoreKey;

  React = require('react');


  /* Plug Store */


  /* Mixin */

  getLocalStoreKey = function(key) {
    return "__localStore__" + key;
  };

  appContextMixin = function(stores) {
    var childContext, childContextTypes, key, localStoreKey, store;
    childContextTypes = {
      __appStores__: React.PropTypes.object
    };
    childContext = {
      __appStores__: {}
    };
    for (key in stores) {
      store = stores[key];
      if (typeof store.addChangeListener !== 'function') {
        throw new Error("store plugged at key: " + key + " does not possess an 'addChangeListener' method");
      }
      if (typeof store.removeChangeListener !== 'function') {
        throw new Error("store plugged at key: " + key + " does not possess a 'removeChangeListener' method");
      }
      childContext.__appStores__[key] = store;
      localStoreKey = getLocalStoreKey(key);
      childContextTypes[localStoreKey] = React.PropTypes.bool;
    }
    return {
      childContextTypes: childContextTypes,
      getChildContext: function() {
        return childContext;
      },
      getInitialState: function() {
        this.__appOwnerContext__ = childContext;
        return {};
      }
    };
  };

  contextMixin = function(storeKeys, queryKey) {
    var childContext, childContextTypes, contextTypes, i, key, len, localStoreKey, query, result;
    if (!Array.isArray(storeKeys)) {
      storeKeys = [storeKeys];
    }
    contextTypes = {
      __appStores__: React.PropTypes.object
    };
    childContextTypes = {};
    childContext = {};
    for (i = 0, len = storeKeys.length; i < len; i++) {
      key = storeKeys[i];
      localStoreKey = getLocalStoreKey(key);
      contextTypes[localStoreKey] = React.PropTypes.bool;
      childContextTypes[localStoreKey] = React.PropTypes.bool.isRequired;
      childContext[localStoreKey] = true;
    }
    query = void 0;
    result = {
      contextTypes: contextTypes,
      childContextTypes: childContextTypes,
      getChildContext: function() {
        return childContext;
      },
      __triggerUpdate__: function() {
        return this.setState({
          __contextualizedState__: true
        });
      },
      getInitialState: function() {
        var base, contextKey, j, len1, ref, ref1, ref2, state, store;
        if ((this.__appOwnerContext__ != null) && (((ref = this.context) != null ? ref.__appStores__ : void 0) != null)) {
          throw new Error("component has appContextMixin and is not the top level React component");
        }
        if ((this.__appOwnerContext__ == null) && (((ref1 = this.context) != null ? ref1.__appStores__ : void 0) == null)) {
          throw new Error("component does not have access to app context and and does not have the appContextMixin this likely occurred because either the component did not receive the appContextMixin or the appContextMixin was passed in after the contextMixin. Please verify that this component has received all mixins and that the order of mixins is correct");
        }
        if ((queryKey != null) && typeof this[queryKey] !== 'function') {
          throw new Error("did not find a method at " + queryKey);
        }
        contextKey = 'context';
        if (this.__appOwnerContext__ != null) {
          contextKey = '__appOwnerContext__';
        }
        this.plugged = {
          stores: {}
        };
        for (j = 0, len1 = storeKeys.length; j < len1; j++) {
          key = storeKeys[j];
          store = this[contextKey].__appStores__[key];
          if (!store) {
            throw new Error("key: " + key + " does not match any of the plugged in store keys");
          }
          this.plugged.stores[key] = store;
          if (!((ref2 = this.context) != null ? ref2[getLocalStoreKey(key)] : void 0)) {
            store.addChangeListener(this.__triggerUpdate__);
            (base = this.plugged).__listenedStores__ || (base.__listenedStores__ = []);
            this.plugged.__listenedStores__.push(key);
          }
        }
        if (queryKey) {
          query = this[queryKey];
          this.plugged.data = query(this.props);
        }
        state = {};
        if (this.plugged.__listenedStores__ != null) {
          state.__contextualizedState__ = true;
        }
        return state;
      },
      componentWillUnmount: function() {
        var j, len1, ref, ref1, results, store, storeKey;
        if ((ref = this.state) != null ? ref.__contextualizedState__ : void 0) {
          ref1 = this.plugged.__listenedStores__;
          results = [];
          for (j = 0, len1 = ref1.length; j < len1; j++) {
            storeKey = ref1[j];
            store = this.plugged.stores[storeKey];
            results.push(store.removeChangeListener(this.__triggerUpdate__));
          }
          return results;
        }
      }
    };
    if (queryKey) {
      result.componentWillReceiveProps = function(nextProps) {
        this.plugged.prevData = void 0;
        this.plugged.nextData = query(nextProps);
        return this.plugged.__changed__ = true;
      };
      result.shouldComponentUpdate = function(nextProps) {
        if (!this.plugged.__changed__) {
          this.plugged.prevData = void 0;
          this.plugged.nextData = query(nextProps);
        }
        this.plugged.__changed__ = false;
        return true;
      };
      result.componentWillUpdate = function() {
        this.plugged.prevData = this.plugged.data;
        this.plugged.data = this.plugged.nextData;
        return this.plugged.nextData = void 0;
      };
    }
    return result;
  };


  /*
  React.createClass
    mixins: [ContextUpdate('storeKey', 'otherStoreKey')]
    render: ->
      myData = @pluggedIn[storeKey]byId @props.id
      <div>{myData}</div>
   */

  module.exports = {
    appContextMixin: appContextMixin,
    contextMixin: contextMixin
  };

}).call(this);