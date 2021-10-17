
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.43.1' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const predictionPercentage = writable({});
    const toggleGraph = writable(false);
    const togglePredicted = writable(false);

    /* src\Canvas.svelte generated by Svelte v3.43.1 */

    const { Object: Object_1$2 } = globals;

    const file$3 = "src\\Canvas.svelte";

    function create_fragment$3(ctx) {
    	let link;
    	let t0;
    	let main;
    	let body;
    	let div2;
    	let div0;
    	let h10;
    	let t2;
    	let h11;
    	let p0;
    	let t4;
    	let p1;
    	let t6;
    	let p2;
    	let t7;
    	let p3;
    	let t8;
    	let p4;

    	let t9_value = (/*$predictionPercentage*/ ctx[0][/*predictedAnswer*/ ctx[4]]
    	? `Accuracy: ${/*$predictionPercentage*/ ctx[0][/*predictedAnswer*/ ctx[4]]}%`
    	: '') + "";

    	let t9;
    	let t10;
    	let canvas_1;
    	let t11;
    	let div1;
    	let button0;
    	let t13;
    	let button1;

    	const block = {
    		c: function create() {
    			link = element("link");
    			t0 = space();
    			main = element("main");
    			body = element("body");
    			div2 = element("div");
    			div0 = element("div");
    			h10 = element("h1");
    			h10.textContent = "Handwritten Digit Recognition Web App";
    			t2 = space();
    			h11 = element("h1");
    			p0 = element("p");
    			p0.textContent = "Write your number!";
    			t4 = space();
    			p1 = element("p");
    			p1.textContent = "Prediction Result";
    			t6 = space();
    			p2 = element("p");
    			t7 = space();
    			p3 = element("p");
    			t8 = space();
    			p4 = element("p");
    			t9 = text(t9_value);
    			t10 = space();
    			canvas_1 = element("canvas");
    			t11 = space();
    			div1 = element("div");
    			button0 = element("button");
    			button0.textContent = "Clear";
    			t13 = space();
    			button1 = element("button");
    			button1.textContent = "Predict";
    			attr_dev(link, "href", "https://fonts.googleapis.com/css2?family=Indie+Flower&family=Permanent+Marker&display=swap");
    			attr_dev(link, "rel", "stylesheet");
    			add_location(link, file$3, 112, 0, 3620);
    			attr_dev(h10, "id", "handWrite");
    			attr_dev(h10, "class", "svelte-1soxh5a");
    			add_location(h10, file$3, 117, 0, 3801);
    			attr_dev(p0, "id", "writenum");
    			attr_dev(p0, "class", "svelte-1soxh5a");
    			add_location(p0, file$3, 118, 4, 3867);
    			add_location(h11, file$3, 118, 0, 3863);
    			attr_dev(p1, "id", "predictionResult");
    			attr_dev(p1, "class", "svelte-1soxh5a");
    			add_location(p1, file$3, 119, 0, 3912);
    			attr_dev(p2, "id", "arrowbody");
    			attr_dev(p2, "class", "svelte-1soxh5a");
    			add_location(p2, file$3, 120, 0, 3959);
    			attr_dev(p3, "id", "triangle");
    			attr_dev(p3, "class", "svelte-1soxh5a");
    			add_location(p3, file$3, 121, 0, 3982);
    			attr_dev(p4, "id", "accuracy");
    			attr_dev(p4, "class", "svelte-1soxh5a");
    			add_location(p4, file$3, 122, 0, 4004);
    			attr_dev(canvas_1, "width", "500");
    			attr_dev(canvas_1, "height", "400");
    			attr_dev(canvas_1, "id", "canvasW");
    			attr_dev(canvas_1, "class", "svelte-1soxh5a");
    			add_location(canvas_1, file$3, 124, 0, 4128);
    			add_location(div0, file$3, 116, 0, 3795);
    			attr_dev(button0, "id", "ButtonClear");
    			attr_dev(button0, "class", "svelte-1soxh5a");
    			add_location(button0, file$3, 127, 2, 4212);
    			attr_dev(button1, "id", "ButtonPredict");
    			attr_dev(button1, "class", "svelte-1soxh5a");
    			add_location(button1, file$3, 128, 2, 4275);
    			add_location(div1, file$3, 126, 0, 4202);
    			attr_dev(div2, "id", "tabbar");
    			attr_dev(div2, "class", "svelte-1soxh5a");
    			add_location(div2, file$3, 115, 0, 3777);
    			attr_dev(body, "id", "pagePrediction");
    			attr_dev(body, "class", "svelte-1soxh5a");
    			add_location(body, file$3, 114, 0, 3750);
    			add_location(main, file$3, 113, 0, 3742);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, link, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, body);
    			append_dev(body, div2);
    			append_dev(div2, div0);
    			append_dev(div0, h10);
    			append_dev(div0, t2);
    			append_dev(div0, h11);
    			append_dev(h11, p0);
    			append_dev(div0, t4);
    			append_dev(div0, p1);
    			append_dev(div0, t6);
    			append_dev(div0, p2);
    			append_dev(div0, t7);
    			append_dev(div0, p3);
    			append_dev(div0, t8);
    			append_dev(div0, p4);
    			append_dev(p4, t9);
    			append_dev(div0, t10);
    			append_dev(div0, canvas_1);
    			/*canvas_1_binding*/ ctx[5](canvas_1);
    			append_dev(div2, t11);
    			append_dev(div2, div1);
    			append_dev(div1, button0);
    			/*button0_binding*/ ctx[6](button0);
    			append_dev(div1, t13);
    			append_dev(div1, button1);
    			/*button1_binding*/ ctx[7](button1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$predictionPercentage, predictedAnswer*/ 17 && t9_value !== (t9_value = (/*$predictionPercentage*/ ctx[0][/*predictedAnswer*/ ctx[4]]
    			? `Accuracy: ${/*$predictionPercentage*/ ctx[0][/*predictedAnswer*/ ctx[4]]}%`
    			: '') + "")) set_data_dev(t9, t9_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(link);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			/*canvas_1_binding*/ ctx[5](null);
    			/*button0_binding*/ ctx[6](null);
    			/*button1_binding*/ ctx[7](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let predictedAnswer;
    	let $predictionPercentage;
    	validate_store(predictionPercentage, 'predictionPercentage');
    	component_subscribe($$self, predictionPercentage, $$value => $$invalidate(0, $predictionPercentage = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Canvas', slots, []);
    	let canvas;
    	let clearBtn;
    	let predictBtn;
    	let flag = false;
    	let prevX = 0;
    	let currX = 0;
    	let prevY = 0;
    	let currY = 0;
    	let dot_flag = false;
    	let x = 'white';
    	let y = 30;

    	onMount(() => {
    		const ctx = canvas.getContext('2d');
    		const width = ctx.canvas.clientWidth;
    		const height = ctx.canvas.clientHeight;
    		ctx.fillStyle = 'black';
    		ctx.fillRect(0, 0, width, height);
    		ctx.fillStyle = 'white';
    		ctx.lineCap = 'round';

    		canvas.addEventListener(
    			'mousemove',
    			function (e) {
    				findxy('move', e);
    			},
    			false
    		);

    		canvas.addEventListener(
    			'mousedown',
    			function (e) {
    				findxy('down', e);
    			},
    			false
    		);

    		canvas.addEventListener(
    			'mouseup',
    			function (e) {
    				findxy('up', e);
    			},
    			false
    		);

    		canvas.addEventListener(
    			'mouseout',
    			function (e) {
    				findxy('out', e);
    			},
    			false
    		);

    		function draw() {
    			ctx.beginPath();
    			ctx.moveTo(prevX, prevY);
    			ctx.lineTo(currX, currY);
    			ctx.strokeStyle = x;
    			ctx.lineWidth = y;
    			ctx.stroke();
    			ctx.closePath();
    		}

    		function findxy(res, e) {
    			if (res == 'down') {
    				prevX = currX;
    				prevY = currY;
    				currX = e.clientX - canvas.offsetLeft;
    				currY = e.clientY - canvas.offsetTop;
    				flag = true;
    				dot_flag = true;

    				if (dot_flag) {
    					ctx.beginPath();
    					ctx.fillStyle = x;
    					ctx.fillRect(currX, currY, 2, 2);
    					ctx.closePath();
    					dot_flag = false;
    				}
    			}

    			if (res == 'up' || res == 'out') {
    				flag = false;
    			}

    			if (res == 'move') {
    				if (flag) {
    					prevX = currX;
    					prevY = currY;
    					currX = e.clientX - canvas.offsetLeft;
    					currY = e.clientY - canvas.offsetTop;
    					draw();
    				}
    			}
    		}

    		clearBtn.addEventListener(
    			'click',
    			function (e) {
    				erase();
    			},
    			false
    		);

    		function erase() {
    			ctx.clearRect(0, 0, width, height);
    			ctx.fillStyle = 'black';
    			ctx.fillRect(0, 0, width, height);
    			ctx.fillStyle = 'white';
    			predictionPercentage.set({});
    			toggleGraph.set(false);
    			togglePredicted.set(false);
    		}

    		predictBtn.addEventListener(
    			'click',
    			function (e) {
    				predict();
    			},
    			false
    		);

    		function predict() {
    			canvas.toBlob(function (blob) {
    				const formData = new FormData();
    				formData.append('file', blob);

    				fetch('http://127.0.0.1:8000/model_v1/predict', { method: 'POST', body: formData }).then(res => {
    					return res.json();
    				}).then(data => {
    					const predictions = JSON.parse(data);

    					for (let key in predictions) {
    						if (predictions.hasOwnProperty(key)) {
    							predictions[key] = parseFloat(predictions[key]);
    						}
    					}

    					predictionPercentage.update(value => predictions);
    					togglePredicted.set(true);
    				});
    			});
    		}
    	});

    	const writable_props = [];

    	Object_1$2.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Canvas> was created with unknown prop '${key}'`);
    	});

    	function canvas_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			canvas = $$value;
    			$$invalidate(1, canvas);
    		});
    	}

    	function button0_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			clearBtn = $$value;
    			$$invalidate(2, clearBtn);
    		});
    	}

    	function button1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			predictBtn = $$value;
    			$$invalidate(3, predictBtn);
    		});
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		predictionPercentage,
    		toggleGraph,
    		togglePredicted,
    		canvas,
    		clearBtn,
    		predictBtn,
    		flag,
    		prevX,
    		currX,
    		prevY,
    		currY,
    		dot_flag,
    		x,
    		y,
    		predictedAnswer,
    		$predictionPercentage
    	});

    	$$self.$inject_state = $$props => {
    		if ('canvas' in $$props) $$invalidate(1, canvas = $$props.canvas);
    		if ('clearBtn' in $$props) $$invalidate(2, clearBtn = $$props.clearBtn);
    		if ('predictBtn' in $$props) $$invalidate(3, predictBtn = $$props.predictBtn);
    		if ('flag' in $$props) flag = $$props.flag;
    		if ('prevX' in $$props) prevX = $$props.prevX;
    		if ('currX' in $$props) currX = $$props.currX;
    		if ('prevY' in $$props) prevY = $$props.prevY;
    		if ('currY' in $$props) currY = $$props.currY;
    		if ('dot_flag' in $$props) dot_flag = $$props.dot_flag;
    		if ('x' in $$props) x = $$props.x;
    		if ('y' in $$props) y = $$props.y;
    		if ('predictedAnswer' in $$props) $$invalidate(4, predictedAnswer = $$props.predictedAnswer);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$predictionPercentage*/ 1) {
    			$$invalidate(4, predictedAnswer = Object.keys($predictionPercentage).reduce(
    				(a, b) => $predictionPercentage[a] > $predictionPercentage[b]
    				? a
    				: b,
    				{}
    			));
    		}
    	};

    	return [
    		$predictionPercentage,
    		canvas,
    		clearBtn,
    		predictBtn,
    		predictedAnswer,
    		canvas_1_binding,
    		button0_binding,
    		button1_binding
    	];
    }

    class Canvas extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Canvas",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\PercentageGraph.svelte generated by Svelte v3.43.1 */

    const { Object: Object_1$1 } = globals;
    const file$2 = "src\\PercentageGraph.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i][0];
    	child_ctx[2] = list[i][1];
    	return child_ctx;
    }

    // (14:6) {#each Object.entries($predictionPercentage) as [number, percentage]}
    function create_each_block(ctx) {
    	let tr;
    	let th;
    	let t0_value = /*number*/ ctx[1] + "";
    	let t0;
    	let t1;
    	let td;
    	let span;
    	let t2_value = /*percentage*/ ctx[2] + "";
    	let t2;
    	let t3;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			th = element("th");
    			t0 = text(t0_value);
    			t1 = space();
    			td = element("td");
    			span = element("span");
    			t2 = text(t2_value);
    			t3 = space();
    			attr_dev(th, "scope", "row");
    			attr_dev(th, "class", "svelte-1l90fxy");
    			add_location(th, file$2, 15, 10, 476);
    			attr_dev(span, "class", "svelte-1l90fxy");
    			add_location(span, file$2, 17, 12, 533);
    			attr_dev(td, "class", "svelte-1l90fxy");
    			add_location(td, file$2, 16, 10, 516);
    			set_style(tr, "height", /*percentage*/ ctx[2] + "%");
    			attr_dev(tr, "class", "svelte-1l90fxy");
    			add_location(tr, file$2, 14, 8, 432);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, th);
    			append_dev(th, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td);
    			append_dev(td, span);
    			append_dev(span, t2);
    			append_dev(tr, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$predictionPercentage*/ 1 && t0_value !== (t0_value = /*number*/ ctx[1] + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*$predictionPercentage*/ 1 && t2_value !== (t2_value = /*percentage*/ ctx[2] + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*$predictionPercentage*/ 1) {
    				set_style(tr, "height", /*percentage*/ ctx[2] + "%");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(14:6) {#each Object.entries($predictionPercentage) as [number, percentage]}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let main;
    	let table;
    	let caption;
    	let t1;
    	let thead;
    	let tr;
    	let th0;
    	let t3;
    	let th1;
    	let t5;
    	let tbody;
    	let t6;
    	let button;
    	let a;
    	let h1;
    	let each_value = Object.entries(/*$predictionPercentage*/ ctx[0]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			table = element("table");
    			caption = element("caption");
    			caption.textContent = "Digit Probability Percentage";
    			t1 = space();
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "Item";
    			t3 = space();
    			th1 = element("th");
    			th1.textContent = "Percent";
    			t5 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t6 = space();
    			button = element("button");
    			a = element("a");
    			h1 = element("h1");
    			h1.textContent = "Back";
    			attr_dev(caption, "id", "colorfont");
    			attr_dev(caption, "class", "svelte-1l90fxy");
    			add_location(caption, file$2, 5, 4, 124);
    			attr_dev(th0, "scope", "col");
    			attr_dev(th0, "class", "svelte-1l90fxy");
    			add_location(th0, file$2, 8, 8, 218);
    			attr_dev(th1, "scope", "col");
    			attr_dev(th1, "class", "svelte-1l90fxy");
    			add_location(th1, file$2, 9, 8, 252);
    			attr_dev(tr, "class", "svelte-1l90fxy");
    			add_location(tr, file$2, 7, 6, 205);
    			attr_dev(thead, "class", "svelte-1l90fxy");
    			add_location(thead, file$2, 6, 4, 191);
    			attr_dev(tbody, "class", "horizontal svelte-1l90fxy");
    			attr_dev(tbody, "id", "pageG");
    			add_location(tbody, file$2, 12, 4, 310);
    			attr_dev(table, "class", "graph svelte-1l90fxy");
    			add_location(table, file$2, 4, 2, 97);
    			attr_dev(h1, "id", "font");
    			attr_dev(h1, "class", "svelte-1l90fxy");
    			add_location(h1, file$2, 23, 59, 686);
    			attr_dev(a, "href", "http://localhost:5000/");
    			add_location(a, file$2, 23, 26, 653);
    			attr_dev(button, "id", "backButton");
    			attr_dev(button, "class", "svelte-1l90fxy");
    			add_location(button, file$2, 23, 2, 629);
    			add_location(main, file$2, 3, 0, 88);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, table);
    			append_dev(table, caption);
    			append_dev(table, t1);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t3);
    			append_dev(tr, th1);
    			append_dev(table, t5);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			append_dev(main, t6);
    			append_dev(main, button);
    			append_dev(button, a);
    			append_dev(a, h1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*Object, $predictionPercentage*/ 1) {
    				each_value = Object.entries(/*$predictionPercentage*/ ctx[0]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $predictionPercentage;
    	validate_store(predictionPercentage, 'predictionPercentage');
    	component_subscribe($$self, predictionPercentage, $$value => $$invalidate(0, $predictionPercentage = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('PercentageGraph', slots, []);
    	const writable_props = [];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<PercentageGraph> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		predictionPercentage,
    		$predictionPercentage
    	});

    	return [$predictionPercentage];
    }

    class PercentageGraph extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PercentageGraph",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\PredictedDigit.svelte generated by Svelte v3.43.1 */

    const { Object: Object_1 } = globals;
    const file$1 = "src\\PredictedDigit.svelte";

    function create_fragment$1(ctx) {
    	let main;
    	let div;
    	let h1;
    	let t0;
    	let t1;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div = element("div");
    			h1 = element("h1");
    			t0 = text(/*predictedAnswer*/ ctx[0]);
    			t1 = space();
    			button = element("button");
    			button.textContent = "Graph";
    			attr_dev(h1, "id", "predictProduct");
    			attr_dev(h1, "class", "svelte-3vgab1");
    			add_location(h1, file$1, 10, 2, 369);
    			attr_dev(div, "id", "box");
    			attr_dev(div, "class", "svelte-3vgab1");
    			add_location(div, file$1, 9, 2, 352);
    			attr_dev(button, "id", "ButtonGraph");
    			attr_dev(button, "class", "svelte-3vgab1");
    			add_location(button, file$1, 11, 2, 424);
    			add_location(main, file$1, 8, 0, 343);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div);
    			append_dev(div, h1);
    			append_dev(h1, t0);
    			append_dev(main, t1);
    			append_dev(main, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*onGraphBtnClick*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*predictedAnswer*/ 1) set_data_dev(t0, /*predictedAnswer*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let predictedAnswer;
    	let $predictionPercentage;
    	validate_store(predictionPercentage, 'predictionPercentage');
    	component_subscribe($$self, predictionPercentage, $$value => $$invalidate(2, $predictionPercentage = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('PredictedDigit', slots, []);

    	function onGraphBtnClick() {
    		toggleGraph.update(value => !value);
    	}

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<PredictedDigit> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		predictionPercentage,
    		toggleGraph,
    		onGraphBtnClick,
    		predictedAnswer,
    		$predictionPercentage
    	});

    	$$self.$inject_state = $$props => {
    		if ('predictedAnswer' in $$props) $$invalidate(0, predictedAnswer = $$props.predictedAnswer);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$predictionPercentage*/ 4) {
    			$$invalidate(0, predictedAnswer = Object.keys($predictionPercentage).reduce(
    				(a, b) => $predictionPercentage[a] > $predictionPercentage[b]
    				? a
    				: b,
    				{}
    			));
    		}
    	};

    	return [predictedAnswer, onGraphBtnClick, $predictionPercentage];
    }

    class PredictedDigit extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PredictedDigit",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.43.1 */
    const file = "src\\App.svelte";

    // (14:1) {#if $togglePredicted}
    function create_if_block_1(ctx) {
    	let predicteddigit;
    	let current;
    	predicteddigit = new PredictedDigit({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(predicteddigit.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(predicteddigit, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(predicteddigit.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(predicteddigit.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(predicteddigit, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(14:1) {#if $togglePredicted}",
    		ctx
    	});

    	return block;
    }

    // (17:1) {#if $toggleGraph}
    function create_if_block(ctx) {
    	let percentagegraph;
    	let current;
    	percentagegraph = new PercentageGraph({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(percentagegraph.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(percentagegraph, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(percentagegraph.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(percentagegraph.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(percentagegraph, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(17:1) {#if $toggleGraph}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let head;
    	let link;
    	let t0;
    	let main;
    	let canvas;
    	let t1;
    	let t2;
    	let current;
    	canvas = new Canvas({ $$inline: true });
    	let if_block0 = /*$togglePredicted*/ ctx[0] && create_if_block_1(ctx);
    	let if_block1 = /*$toggleGraph*/ ctx[1] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			head = element("head");
    			link = element("link");
    			t0 = space();
    			main = element("main");
    			create_component(canvas.$$.fragment);
    			t1 = space();
    			if (if_block0) if_block0.c();
    			t2 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "href", "https://cdn.jsdelivr.net/npm/bootstrap@5.1.0/dist/css/bootstrap.min.css");
    			add_location(link, file, 7, 3, 257);
    			add_location(head, file, 6, 0, 247);
    			attr_dev(main, "id", "homepage");
    			attr_dev(main, "class", "svelte-15tftbv");
    			add_location(main, file, 10, 0, 369);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, head, anchor);
    			append_dev(head, link);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			mount_component(canvas, main, null);
    			append_dev(main, t1);
    			if (if_block0) if_block0.m(main, null);
    			append_dev(main, t2);
    			if (if_block1) if_block1.m(main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$togglePredicted*/ ctx[0]) {
    				if (if_block0) {
    					if (dirty & /*$togglePredicted*/ 1) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(main, t2);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*$toggleGraph*/ ctx[1]) {
    				if (if_block1) {
    					if (dirty & /*$toggleGraph*/ 2) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(main, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(canvas.$$.fragment, local);
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(canvas.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(head);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(canvas);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $togglePredicted;
    	let $toggleGraph;
    	validate_store(togglePredicted, 'togglePredicted');
    	component_subscribe($$self, togglePredicted, $$value => $$invalidate(0, $togglePredicted = $$value));
    	validate_store(toggleGraph, 'toggleGraph');
    	component_subscribe($$self, toggleGraph, $$value => $$invalidate(1, $toggleGraph = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Canvas,
    		PercentageGraph,
    		PredictedDigit,
    		toggleGraph,
    		togglePredicted,
    		$togglePredicted,
    		$toggleGraph
    	});

    	return [$togglePredicted, $toggleGraph];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
        props: {}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
