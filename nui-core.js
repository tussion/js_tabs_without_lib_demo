
/*jshint unused: true*/
var nui = (function(){

    var components = [],
        uid = 0;

    return {

        guid: function() {
            return "nui" + (uid++);
        },

        add: function(type, creator) {
            components[type] = creator(this);
        },

        init: function() {
            var nodes = this.dom.selectAll("[data-nui-type], [data-nui-action]");

            nui.util.forEach(nodes, function(node) {
                var type = node.getAttribute("data-nui-type"),
                    action = node.getAttribute("data-nui-action"),
                    actionParts,
                    component;


                if (type) {

                    component = components[type];

                    if (!component || !component.initType) {
                        throw new Error("Unknown type: " + type);
                    }

                    component.initType(node);

                    // listen for each event the component needs
                    nui.util.forEach(component.events, function(eventName) {
                        nui.event.on(node, eventName, function(event) {
                            component["on" + eventName](event, node);
                        });
                    });

                } else if (action) {
                    // TODO
                    actionParts = action.split("-");
                    components[actionParts[0]].initAction(node, actionParts[1]);
                }
            });

        }

    };

}());
/*global nui*/

/**
 * Main NUI object.
 * @class aria
 * @static
 * @namespace nui
 */
nui.aria = {
    setRole: function(element, role) {
        element.setAttribute("role", role);
    },

    focusable: function(node, focusable) {
        node.tabIndex = focusable ? 0 : -1;
    },

    clearState: function(element, state) {
        return element.removeAttribute("aria-" + state);
    },

    hasState: function(element, state) {
        return element.hasAttribute("aria-" + state);
    },

    setState: function(element, state) {
        return element.setAttribute("aria-" + state, true);
    },

    hide: function(element) {
        this.setState(element, "hidden");
    },

    show: function(element) {
        this.clearState(element, "hidden");
    }
};
/*global nui*/

/**
 * NUI data handling.
 * @class data
 * @static
 * @namespace nui
 */
nui.data = {

    /**
     * Parses a string in the format of "foo:bar; foo:bar"
     * into an object with key-value pairs.
     * @param {String} text
     * @return {Object} An object with key-value pairs.
     * @method parse
     */
    parse: function parseInfo(text){
        var info = {},
            parts = text.split(/\s*;\s*/g),
            i = 0,
            len = parts.length,
            subparts;

        while(i < len){
            subparts = parts[i].split(/\s*:\s*/g);
            info[subparts[0]] = subparts[1];
            i++;
        }

        return info;

    }

};
/*global nui, document*/
/**
 * Main NUI object.
 * @class dom
 * @static
 * @namespace nui
 */
 /*global nui, document*/

nui.dom = (function() {

    var util = nui.util;

    return {
        addClass: function(nodes, className){
            nodes = (nodes.length ? nodes : [nodes]);
            for (var i=0, len=nodes.length; i < len; i++){
                if (!this.hasClass(nodes[i], className)){
                    nodes[i].className += " " + className;
                }
            }
        },

        // also checks self
        ancestor: function(node, condition){
            var parentNode = node,
                found = false;

            while(parentNode && parentNode.nodeType == 1 && parentNode != document.body){
                if (condition(parentNode)){
                    return parentNode;
                }
                parentNode = parentNode.parentNode;
            }

            return null;
        },

        ancestorByClass: function(node, className){
            return this.ancestor(node, function(node){
                return nui.dom.hasClass(node, className);
            });
        },

        ancestorByAttribute: function(node, attribute){
            return this.ancestor(node, function(node){
                return node.getAttribute(attribute) !== null;
            });
        },

        hasClass: function(node, className){
            return (" " + node.className.split(/\s+/g).join(" ") + " ").indexOf(" " + className + " ") > -1;
        },

        removeClass: function(nodes, className){
            nodes = (nodes.length ? nodes : [nodes]);
            var classes,
                i = 0, j = 0, len = nodes.length, num;

            for (i=0; i < len; i++){
                classes = nodes[i].className.split(/\s+/g);
                for (j=0, num=classes.length; j < num; j++){
                    if (classes[j] == className){
                        classes.splice(j, 1);
                        break;
                    }
                }

                nodes[i].className = classes.join(" ");
            }
        },

        select: function(selector, node){
            return (node||document).querySelector(selector);
        },

        selectAll: function(selector, node){
            var nodes = (node||document).querySelectorAll(selector);
            return nui.util.toArray(nodes);
        }
    };
}());
/*global nui*/
/**
 * NUI events interface
 * @class event
 * @static
 * @namespace nui
 */
 /*global nui, document*/
nui.event = (function(){

    var ID_ATTRIBUTE = "data-nui-id";

    var events = {};



    function handleEvent(event) {
        var handlers = events[event.type],
            target = event.target || event.srcElement,
            ancestor = nui.dom.ancestorByAttribute(target, ID_ATTRIBUTE),
            handler;

        if (ancestor) {
            handler = handlers[ancestor.getAttribute(ID_ATTRIBUTE)];

            if (handler) {
                handler.call(nui.event.getTarget(event), event, ancestor);
            }
        }

    }

    return {

        /**
         * Listen for an event on a specific target.
         */
        on: function(target, eventName, handler){

            if (target.addEventListener){
                target.addEventListener(eventName, handler, false);
            } else if (target.attachEvent){
                target.attachEvent("on" + eventName, handler);
            }
        },

        getTarget: function(event){
            return event.target || event.srcElement;
        },

        preventDefault: function(event){
            if (event.preventDefault){
                event.preventDefault();
            } else {
                event.returnValue = false;
            }
        }
    };

}());
/**
 * NUI general utilities
 * @class util
 * @static
 * @namespace nui
 */
/*global nui*/
nui.util = {

    /**
     * Converts any array-like object into an actual array.
     * @param {Any[]} any array-like object
     * @return {Array} An actual array.
     */
    toArray: function(items) {
        return Array.prototype.slice.call(items);
    },

    bind: function(method, thisValue) {
        return function() {
            return method.apply(thisValue, arguments);
        };
    },

    forEach: function(items, method) {
        for (var i=0, len=items.length; i < len; i++) {
            method(items[i], i, items);
        }
    },

    /**
     * Basic string formatting using %s and %d.
     * @param {String} text The text to format.
     * @param {Any} value* The values to replace in the text.
     * @return {String} The resulting string.
     */
    format: function(text) {
        var args    = arguments,
            i       = 1;

        return text.replace(/%[sd]/g, function() {
            return args[i++];
        });
    }

};
