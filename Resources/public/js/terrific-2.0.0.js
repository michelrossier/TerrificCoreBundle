/**
 * Terrific JavaScript Framework v2.0.0
 * http://terrifically.org
 *
 * Copyright 2012, Remo Brunschwiler
 * MIT Licensed.
 *
 * Date: Fri, 25 May 2012 12:32:36 GMT
 *
 *
 * Includes:
 * Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 *
 * @module Tc
 * 
 */
var Tc = Tc || {};

/*
 * The jQuery object.
 */
Tc.$ = jQuery;

/**
 * Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 *
 */
(function(){
    var initializing = false, fnTest = /xyz/.test(function() { xyz; }) ? /\b_super\b/ : /.*/;
    
    // The base Class implementation (does nothing)
    this.Class = function(){
    };
    
    // Create a new Class that inherits from this class
    Class.extend = function(prop){
        var _super = this.prototype;
        
        // Instantiate a base class (but only create the instance,
        // don't run the init constructor)
        initializing = true;
        var prototype = new this();
        initializing = false;
        
        // Copy the properties over onto the new prototype
        for (var name in prop) {
            // Check if we're overwriting an existing function
            prototype[name] = typeof prop[name] == "function" &&
            typeof _super[name] == "function" &&
            fnTest.test(prop[name]) ? (function(name, fn){
                return function(){
                    var tmp = this._super;
                    
                    // Add a new ._super() method that is the same method
                    // but on the super-class
                    this._super = _super[name];
                    
                    // The method only need to be bound temporarily, so we
                    // remove it when we're done executing
                    var ret = fn.apply(this, arguments);
                    this._super = tmp;
                    
                    return ret;
                };
            })(name, prop[name]) : prop[name];
        }
        
        // The dummy class constructor
        function Class(){
            // All construction is actually done in the init method
            if (!initializing && this.init) {
				this.init.apply(this, arguments);
			}
        }
        
        // Populate our constructed prototype object
        Class.prototype = prototype;
        
        // Enforce the constructor to be what we expect
        Class.constructor = Class;
        
        // And make this class extendable
        Class.extend = arguments.callee;
        
        return Class;
    };
})();

/**
 * Contains the application base config.
 * The base config can be extended or overwritten either via
 * new Application ($ctx, config), during bootstrapping the application or via 
 * /public/js/Tc.Config.js in the project folder.
 *
 * @author Remo Brunschwiler
 * @namespace Tc
 * @class Config
 * @static
 */
Tc.Config = {
    /** 
     * The paths for the different types of dependencies.
     *
     * @property dependencies
     * @type Object
     */
    dependencies: {
        css: '/css/dependencies',
        js: '/js/dependencies'
    }
};

(function($) {
    "use strict";

    /**
     * Responsible for application-wide issues such as the creation of modules.
     *
     * @author Remo Brunschwiler
     * @namespace Tc
     * @class Application
     */
    Tc.Application = Class.extend({

        /**
         * Initializes the application.
         *
         * @method init
         * @return {void}
         * @constructor
         * @param {jQuery} $ctx 
         *      The jquery context
         * @param {Object} config 
         *      The configuration
         */
        init: function($ctx, config) {
            /**
             * The configuration.
             *
             * @property config
             * @type Object
             */
            this.config = $.extend(Tc.Config, config);

            /**
             * The jQuery context.
             *
             * @property $ctx
             * @type jQuery
             */
            this.$ctx = $ctx || $('body');

            /**
             * Contains references to all modules on the page. This can, for
             * example, be useful when there are interactions between Flash
             * objects and Javascript.
             *
             * @property modules
             * @type Array
             */
            this.modules = [];

            /**
             * Contains references to all connectors on the page.
             *
             * @property connectors
             * @type Object
             */
            this.connectors = {};

            /**
             * The sandbox to get the resources from 
             * This sandbox is shared between all modules.
             *
             * @property sandbox
             * @type Sandbox
             */
            this.sandbox = new Tc.Sandbox(this, this.config);
        },

        /**
         * Register modules withing scope
         * Automatically registers all modules within the scope, 
         * as long as the modules use the OOCSS naming conventions.
         *
         * @method registerModules
         * @param {jQuery} $ctx 
         *      The jQuery context.
         * @return {Array} 
         *      A list containing the references of the registered modules.
         */
        registerModules : function($ctx) {
            var that = this,
                modules = [],
                stringUtils = Tc.Utils.String;

            $ctx = $ctx || this.$ctx;

            $ctx.find('.mod:not([data-ignore="true"])').each(function() {
                var $this = $(this),
                    classes = $this.attr('class').split(' ');

                /**
                 * Indicates that it is a base module, this is the default and
                 * no JavaScript needs to be involved. It must occur excactly
                 * once.
                 * @config .mod 
                 */

                /**
                 * Indicates that it is a module of type basic, which is
                 * derived from the base module. It can occur at most
                 * once. Example: .modBasic || .mod-basic
                 * @config .mod{moduleName} || .mod-{module-name}
                 */

                /**
                 * Indicates that the module basic has the submarine skin. It
                 * will be decorated by the skin JS (if it exists). It can occur
                 * arbitrarily. Example: .skinBasicSubmarine || .skin-basic-submarine
                 * @config .skin{moduleName}{skinName} || .skin-{module-name}-{skin-name}
                 */

                /** 
                 * A module can have a comma-separated list of data connectors.
                 * The list contains the IDs of the connectors in the following
                 * schema: {connectorType}-{connectorId}
                 *
                 * {connectorType} is optional. If only the {connectorId} is given, the
                 * default connector is instantiated.
                 *
                 * The example MasterSlave-Navigation decodes to: type =
                 * MasterSlave, id = Navigation. This instantiates the MasterSlave
                 * connector (as mediator) with the connector id Navigation.
                 * The connector id is used to chain the appropriate (the ones with the same id)
                 * modules together and to improve the reusability of the connector.
                 * It can contain multiple connector ids (e.g. 1,2,MasterSlave-Navigation).
                 *
                 * @config data-connectors
                 */

                if (classes.length > 1) {
                    var modName,
                        skins = [],
                        connectors = [],
                        dataConnectors;

                    for (var i = 0, len = classes.length; i < len; i++) {
                        var part = $.trim(classes[i]);

                        // do nothing for empty parts
                        if(part) {
                            // convert to camel if necessary
                            if (part.indexOf('-') > -1) {
                                part = stringUtils.toCamel(part);
                            }

                            if (part.indexOf('mod') === 0 && part.length > 3) {
                                modName = part.substr(3);
                            }
                            else if (part.indexOf('skin') === 0) {
                                // Remove the mod name part from the skin name
                                skins.push(part.substr(4).replace(modName, ''));
                            }
                        }
                    }

                    /**
                     * This needs to be done via attr() instead of data().
                     * As data() cast a single number-only connector to an integer, the split will fail.
                     */
                    dataConnectors = $this.attr('data-connectors');

                    if (dataConnectors) {
                        connectors = dataConnectors.split(',');
                        for (var i = 0, len = connectors.length; i < len; i++) {
                            var connector = $.trim(connectors[i]);
                            // do nothing for empty connectors
                            if(connector) {
                                connectors[i] = connector;
                            }
                        }
                    }

                    if (modName && Tc.Module[modName]) {
                        modules.push(that.registerModule($this, modName, skins, connectors));
                    }
                }
            });

            return modules;
        },

        /**
         * Unregisters the modules given by the module instances.
         *
         * @method unregisterModule
         * @param {Array} modules 
         *      A list containting the module instances to unregister
         * @return {void}
         */
        unregisterModules : function(modules) {
            var connectors = this.connectors;

            modules = modules || this.modules;

            if (modules === this.modules) {
                // Clear everything if the arrays are equal
                this.connectors = [];
                this.modules = [];
            }
            else {
                // Unregister the given modules
                for (var i = 0, len = modules.length; i < len; i++) {
                    var module = modules[i],
                        index;

                    // Delete the references in the connectors
                    for (var connectorId in connectors) {
                        if (connectors.hasOwnProperty(connectorId)) {
                            connectors[connectorId].unregisterComponent(module);
                        }
                    }

                    // Delete the module instance itself
                    index = $.inArray(module, this.modules);
                    if(index > -1) {
                        delete this.modules[index];
                    }
                }
            }
        },

        /**
         * Starts (intializes) the registered modules.
         *
         * @method start
         * @param {Array} modules 
         *      A list of the modules to start
         * @return {void}
         */
        start: function(modules) {
            modules = modules || this.modules;

            // Start the modules
            for (var i = 0, len = modules.length; i < len; i++) {
                modules[i].start();
            }
        },

        /**
         * Stops the registered modules.
         *
         * @method stop
         * @param {Array} modules 
         *      A list containting the module instances to stop.
         * @return {void}
         */
        stop: function(modules) {
            modules = modules || this.modules;

            // Stop the modules
            for (var i = 0, len = modules.length; i < len; i++) {
                modules[i].stop();
            }
        },

        /**
         * Registers a module.
         *
         * @method registerModule
         * @param {jQuery} $node 
         *      The module node.
         * @param {String} modName 
         *      The module name. It must match the class name of the module
         *      (case sensitive).
         * @param {Array} skins 
         *      A list of skin names. Each entry must match a class name of a
         *      skin (case sensitive).
         * @param {Array} connectors 
         *      A list of connectors identifiers (e.g. MasterSlave1Master).
         *      Schema: {connectorName}{connectorId}{connectorRole}
         * @return {Module} 
         *      The reference to the registered module.
         */
        registerModule : function($node, modName, skins, connectors) {
            var modules = this.modules;

            modName = modName || null;
            skins = skins || [];
            connectors = connectors || [];

            if (modName && Tc.Module[modName]) {
                // Generate a unique ID for every module
                var id = modules.length;
                $.data($node[0], 'id', id);

                modules[id] = new Tc.Module[modName]($node, this.sandbox, id);

                for (var i = 0, len = skins.length; i < len; i++) {
                    var skinName = skins[i];

                    if (Tc.Module[modName][skinName]) {
                        modules[id] = modules[id].getDecoratedModule(modName, skinName);
                    }
                }

                for (var i = 0, len = connectors.length; i < len; i++) {
                    this.registerConnection(connectors[i], modules[id]);
                }

                return modules[id];
            }

            return null;
        },

        /**
         * Registers a connection between a module and a connector.
         *
         * @method registerConnection
         * @param {String} connector 
         *      The full connector name (e.g. MasterSlave1Slave).
         * @param {Module} component 
         *      The module instance.
         * @return {void}
         */
        registerConnection : function(connector, component) {
            connector = $.trim(connector);

            var parts = connector.split('-'),
                connectorType,
                connectorId,
                identifier;

            if(parts.length === 1) {
                // default connector
                identifier = connectorId = parts[0];
            }
            else if(parts.length === 2) {
                // a specific connector type is given
                connectorType = parts[0];
                connectorId = parts[1];
                identifier = connectorType + connectorId;
            }

            if(identifier) {
                var connectors = this.connectors;

                if (!connectors[identifier]) {
                    // Instantiate the appropriate connector if it does not exist yet
                    if (!connectorType) {
                        connectors[identifier] = new Tc.Connector(connectorId);
                    }
                    else if (Tc.Connector[connectorType]) {
                        connectors[identifier] = new Tc.Connector[connectorType](connectorId);
                    }
                }

                if (connectors[identifier]) {
                    /**
                     * The connector observes the component and attaches it as
                     * an observer.
                     */
                    component.attachConnector(connectors[identifier]);

                    /**
                     * The component wants to be informed over state changes.
                     * It registers it as connector member.
                     */
                    connectors[identifier].registerComponent(component);
                }
            }
        },

        /**
         * Unregisters a module from a connector.
         *
         * @method unregisterConnection
         * @param {String} connectorId
         *      The connector channel id (e.g. 2).
         * @param {Module} component
         *      The module instance.
         * @return {void}
         */
        unregisterConnection : function(connectorId, component) {
            var connector =  this.connectors[connectorId];

            // Delete the references in the connector and the module
            if (connector) {
                connector.unregisterComponent(component);
                component.detachConnector(connector);
            }
        }
    });
})(Tc.$);

(function($) {
    "use strict";

    /**
     * The sandbox is used as a central point to get resources from, grant
     * permissions, etc.  It is shared between all modules.
     *
     * @author Remo Brunschwiler
     * @namespace Tc
     * @class Sandbox
     */
    Tc.Sandbox = Class.extend({

        /**
         * Initializes the Sandbox.
         *
         * @method init
         * @return {void}
         * @constructor
         * @param {Applicaton} application 
         *      The application reference
         * @param {Object} config 
         *      The configuration
         */
        init : function(application, config) {

            /**
             * The application
             *
             * @property application
             * @type Application
             */
            this.application = application;

            /**
             * The configuration.
             *
             * @property config
             * @type Object
             */
            this.config = config;

            /**
             * Contains the 'after' hook module callbacks.
             *
             * @property afterCallbacks
             * @type Array
             */
            this.afterCallbacks = [];
        },

        /**
         * Adds (register and start) all modules in the given context scope.
         *
         * @method addModules
         * @param {jQuery} $ctx 
         *      The jQuery context.
         * @return {Array} 
         *      A list containing the references of the registered modules.
         */
        addModules: function($ctx) {
            var modules = [],
                application = this.application;

            if ($ctx) {
                // Register modules
                modules = application.registerModules($ctx);

                // Start modules
                application.start(modules);
            }

            return modules;
        },

        /**
         * Removes a module by module instances.
         * This stops and unregisters a module through a module instance.
         *
         * @method removeModules
         * @param {Array} modules 
         *      A list containting the module instances to remove.
         * @return {void}
         */
        removeModules: function(modules) {
            var application = this.application;

            if (modules) {
                // Stop modules
                application.stop(modules);

                // Unregister modules
                application.unregisterModules(modules);
            }
        },

        /**
         * Subscribes a module to a connector.
         *
         * @method subscribe
         * @param {String} connector
         *      The full connector name (e.g. MasterSlave1Slave).
         * @param {Module} module
         *      The module instance.
         * @return {void}
         */
        subscribe: function(connector, module) {
            var application = this.application;

            if(module instanceof Tc.Module && connector) {
                // explicitly cast connector to string
                connector = connector + '';
                application.registerConnection(connector, module);
            }
        },

        /**
         * Unsubscribes a module from a connector.
         *
         * @method unsubscribe
         * @param {String} connectorId
         *      The connector channel id (e.g. 2).
         * @param {Module} module
         *      The module instance.
         * @return {void}
         */
        unsubscribe: function(connectorId, module) {
            var application = this.application;

            if(module instanceof Tc.Module && connectorId) {
                // explicitly cast connector id to string
                connectorId = connectorId + '';
                application.unregisterConnection(connectorId, module);
            }
        },

        /**
         * Gets the appropriate module for the given ID.
         *
         * @method getModuleById
         * @param {int} id 
         *      The module ID
         * @return {Module} 
         *      The appropriate module
         */
        getModuleById: function(id) {
            var application = this.application;

            if (application.modules[id] !== undefined) {
                return application.modules[id];
            }
            else {
                throw new Error('the module with the id ' + id + 
                                ' does not exist');
            }
        },

        /**
         * Gets the application config.
         *
         * @method getConfig
         * @return {Object} 
         *      The configuration object
         */
        getConfig: function() {
            return this.config;
        },

        /**
         * Gets an application config param.
         *
         * @method getConfigParam
         * @param {String} name 
         *      The param name
         * @return {mixed} 
         *      The appropriate configuration param
         */
        getConfigParam: function(name) {
            var config = this.config;

            if (config.name !== undefined) {
                return config.name;
            }
            else {
                throw new Error('the config param ' + name + ' does not exist');
            }
        },

        /**
         * Collects the module status messages and handles the callbacks.
         * This means that it is ready for the 'after' hook.
         *
         * @method ready
         * @param {Function} callback 
         *      The 'after' hook module callback
         * @return {void}
         */
        ready: function(callback) {
            var afterCallbacks = this.afterCallbacks;

            // Add the callback to the stack
            afterCallbacks.push(callback);

            // Check whether all modules are ready for the 'after' hook
            if (this.application.modules.length == afterCallbacks.length) {
                for (var i = 0; i < afterCallbacks.length; i++) {
                    var afterCallback = afterCallbacks[i];

                    if(typeof afterCallback == "function") {
                        // make sure the callback is only executed once (and is not called during addModules)
                        delete afterCallbacks[i];
                        afterCallback();
                    }
                }
            }
        }
    });
})(Tc.$);

(function($) {
    "use strict";

    /**
     * Base class for the different modules.
     *
     * @author Remo Brunschwiler
     * @namespace Tc
     * @class Module
     */
    Tc.Module = Class.extend({

        /**
         * Initializes the Module.
         *
         * @method init
         * @return {void}
         * @constructor
         * @param {jQuery} $ctx 
         *      The jQuery context
         * @param {Sandbox} sandbox 
         *      The sandbox to get the resources from
         * @param {String} id
         *      The Unique module ID
         */
        init: function($ctx, sandbox, id) {
            /**
             * Contains the module context.
             *
             * @property $ctx
             * @type jQuery
             */
            this.$ctx = $ctx;

            /**
             * Contains the unique module ID.
             *
             * @property id
             * @type String
             */
            this.id = id;

            /**
             * Contains the attached connectors.
             *
             * @property connectors
             * @type Object
             */
            this.connectors = {};

            /**
             * The sandbox to get the resources from.
             *
             * @property sandbox
             * @type Sandbox
             */
            this.sandbox = sandbox;
        },

        /**
         * Template method to start (i.e. init) the module.
         * This method provides hook functions which can be overridden
         * by the individual instance.
         *
         * @method start
         * @return {void}
         */
        start: function() {
            var that = this;

            // Call the hook method from the individual instance and provide the appropriate callback
            if (this.on) {
                this.on(function() {
                    that.initAfter();
                });
            }
        },

        /**
         * Template method to stop the module.
         *
         * @method stop
         * @return {void}
         */
        stop: function() {
            var $ctx = this.$ctx;
            
            // Remove all bound events and associated jQuery data
            $('*', $ctx).unbind().removeData();
            $ctx.unbind().removeData();
        },


        /**
         * Initialization callback.
         *
         * @method initAfter
         * @return {void}
         */
        initAfter: function() {
            var that = this;

            this.sandbox.ready(function() {
                /**
                 * Call the 'after' hook method  from the individual instance
                 */
                if (that.after) {
                    that.after();
                }
            });
        },

        /**
         * Notifies all attached connectors about changes.
         *
         * @method fire
         * @param {String} state 
         *      The new state
         * @param {Object} data 
         *      The data to provide to your connected modules
         * @param {Function} defaultAction 
         *      The default action to perform
         * @return {void}
         */
        fire: function(state, data, defaultAction) {
            var that = this,
                connectors = this.connectors;

            data = data ||{};
            state = Tc.Utils.String.capitalize(state);

            for (var connectorId in connectors) {
                if(connectors.hasOwnProperty(connectorId)) {
                    var connector = connectors[connectorId];

                    // Callback combining the defaultAction and the afterAction
                    var callback = function() {
                        if (typeof defaultAction == 'function') {
                            defaultAction();
                        }
                        connector.notify(that, 'after' + state, data);
                    };

                    if (connector.notify(that, 'on' + state, data, callback)) {
                        callback();
                    }
                }
            }

            if ($.isEmptyObject(connectors)) {
                if (typeof defaultAction == 'function') {
                    defaultAction();
                }
            }
        },

        /**
         * Attaches a connector (observer).
         *
         * @method attachConnector
         * @param {Connector} connector 
         *      The connector to attach
         * @return {void}
         */
        attachConnector: function(connector) {
            this.connectors[connector.connectorId] = connector;
        },

        /**
         * Detaches a connector (observer).
         *
         * @method detachConnector
         * @param {Connector} connector
         *      The connector to detach
         * @return {void}
         */
        detachConnector: function(connector) {
            delete this.connectors[connector.connectorId];
        },

        /**
         * Decorates itself with the given skin.
         *
         * @method getDecoratedModule
         * @param {String} module 
         *      The name of the module
         * @param {String} skin 
         *      The name of the skin
         * @return {Module} 
         *      The decorated module
         */
        getDecoratedModule: function(module, skin) {
            if (Tc.Module[module][skin]) {
                var decorator = Tc.Module[module][skin];

                /*
                 * Sets the prototype object to the module.
                 * So the "non-decorated" functions will be called on the module
                 * without implementing the whole module interface.
                 */
                decorator.prototype = this;
                decorator.prototype.constructor = Tc.Module[module][skin];

                return new decorator(this);
            }

            return null;
        }
    });
})(Tc.$);

(function($) {
    "use strict";

    /**
     * Base class for the different connectors.
     *
     * @author Remo Brunschwiler
     * @namespace Tc
     * @class Connector
     */
    Tc.Connector = Class.extend({

        /**
         * Initializes the Connector.
         *
         * @method init
         * @return {void}
         * @constructor
         * @param {String} connectorId
         *      The unique connector ID
         */
        init : function(connectorId) {
            this.connectorId = connectorId;
            this.components = {};
        },

        /**
         * Registers a component.
         *
         * @method registerComponent
         * @param {Module} component 
         *      The module to register
         * @return {void}
         */
        registerComponent: function(component) {
            this.components[component.id] = {
                'component': component
            };
        },

        /**
         * Unregisters a component.
         *
         * @method unregisterComponent
         * @param {Module} component 
         *      The module to unregister
         * @return {void}
         */
        unregisterComponent: function(component) {
            var components = this.components;

            if(components[component.id]) {
                delete components[component.id];
            }
        },

        /**
         * Notifies all registered components about a state change 
         * This can be be overriden in the specific connectors.
         *
         * @method notify
         * @param {Module} origin
         *      The module that sends the state change
         * @param {String} state 
         *      The component's state
         * @param {Object} data 
         *      Contains the state relevant data (if any)
         * @param {Function} callback 
         *      The callback function, it can be executed after an asynchronous
         *      action.
         * @return {boolean} 
         *      Indicates whether the default action should be excuted or not
         */
        notify: function(origin, state, data, callback) {
            /**
             * Gives the components the ability to prevent the default- and
             * after action from the events by returning false in the
             * on {Event}-Handler.
             */
            var proceed = true,
                components = this.components;

            for (var id in components) {
                if(components.hasOwnProperty(id)) {
                    var component = components[id].component;
                    if (component !== origin && component[state]) {
                        if (component[state](data, callback) === false) {
                            proceed = false;
                        }
                    }
                }
            }

            return proceed;
        }
    });
})(Tc.$);

/*
 * Contains utility functions for several tasks.
 */
Tc.Utils = {};

/**
 * Contains utility functions for string concerning tasks.
 *
 * @author Remo Brunschwiler
 * @namespace Tc.Utils
 * @class String
 * @static
 */
(function($) {
    Tc.Utils.String = {
        /**
         * Capitalizes the first letter of the given string.
         *
         * @method capitalize
         * @param {String} str
         *      The original string
         * @return {String}
         *      The capitalized string
         */
        capitalize: function(str) {
            // Capitalize the first letter
            return str.substr(0, 1).toUpperCase().concat(str.substr(1));
        },

        toCamel: function(str){
            return str.replace(/(\-[A-Za-z])/g, function($1){return $1.toUpperCase().replace('-','');});
        }
    };
})(Tc.$);

