/**
 * External dependencies
 */
import isEqualShallow from 'is-equal-shallow';
import { createStore } from 'redux';
import { flowRight, without, mapValues, castArray } from 'lodash';

/**
 * WordPress dependencies
 */
import { deprecated } from '@wordpress/utils';
import { Component, getWrapperDisplayName } from '@wordpress/element';

/**
 * Internal dependencies
 */
export { loadAndPersist, withRehydratation } from './persist';

/**
 * Module constants
 */
const stores = {};
const selectors = {};
const actions = {};
let listeners = [];

/**
 * Higher-order function creator to create a function which invokes ifTrueFn
 * only if the given predicate returns a truthy value.
 *
 * @param {Function} predicate Predicate test.
 *
 * @see http://ramdajs.com/docs/#when
 *
 * @return {Function} Higher-order function to call with ifTrueFn.
 */
const when = ( predicate ) => ( ifTrueFn ) => ( ...args ) => {
	if ( predicate() ) {
		ifTrueFn( ...args );
	}
};

/**
 * Higher-order function creator to create a function which invokes ifTrueFn
 * only if the given predicate returns a truthy value, with the result.
 *
 * @param {Function} predicate Predicate test returning tuple of isTrue, result
 *
 * @return {Function} Higher-order function to call with ifTrueFn.
 */
const whenWith = ( predicate ) => ( ifTrueFn ) => () => {
	const [ isTrue, result ] = predicate();
	if ( isTrue ) {
		ifTrueFn( result );
	}
};

/**
 * Global listener called for each store's update.
 */
export function globalListener() {
	listeners.forEach( listener => listener() );
}

/**
 * Convenience for registering reducer with actions and selectors.
 *
 * @param {string} reducerKey Reducer key.
 * @param {Object} options    Store description (reducer, actions, selectors).
 *
 * @return {Object} Registered store object.
 */
export function registerStore( reducerKey, options ) {
	if ( ! options.reducer ) {
		throw new TypeError( 'Must specify store reducer' );
	}

	const store = registerReducer( reducerKey, options.reducer );

	if ( options.actions ) {
		registerActions( reducerKey, options.actions );
	}

	if ( options.selectors ) {
		registerSelectors( reducerKey, options.selectors );
	}

	return store;
}

/**
 * Registers a new sub-reducer to the global state and returns a Redux-like store object.
 *
 * @param {string} reducerKey Reducer key.
 * @param {Object} reducer    Reducer function.
 *
 * @return {Object} Store Object.
 */
export function registerReducer( reducerKey, reducer ) {
	const enhancers = [];
	if ( window.__REDUX_DEVTOOLS_EXTENSION__ ) {
		enhancers.push( window.__REDUX_DEVTOOLS_EXTENSION__( { name: reducerKey, instanceId: reducerKey } ) );
	}
	const store = createStore( reducer, flowRight( enhancers ) );
	stores[ reducerKey ] = store;
	store.subscribe( globalListener );

	return store;
}

/**
 * Registers selectors for external usage.
 *
 * @param {string} reducerKey   Part of the state shape to register the
 *                              selectors for.
 * @param {Object} newSelectors Selectors to register. Keys will be used as the
 *                              public facing API. Selectors will get passed the
 *                              state as first argument.
 */
export function registerSelectors( reducerKey, newSelectors ) {
	const store = stores[ reducerKey ];
	const createStateSelector = ( selector ) => ( ...args ) => selector( store.getState(), ...args );
	selectors[ reducerKey ] = mapValues( newSelectors, createStateSelector );
}

/**
 * Registers actions for external usage.
 *
 * @param {string} reducerKey   Part of the state shape to register the
 *                              selectors for.
 * @param {Object} newActions   Actions to register.
 */
export function registerActions( reducerKey, newActions ) {
	const store = stores[ reducerKey ];
	const createBoundAction = ( action ) => ( ...args ) => store.dispatch( action( ...args ) );
	actions[ reducerKey ] = mapValues( newActions, createBoundAction );
}

/**
 * Subscribe to changes to any data, optionally filtering by reducer or
 * selector result.
 *
 * @param {?string}            reducerKey Reducer key.
 * @param {?(string|string[])} selector   Selector name or array of selector
 *                                        name with arguments to pass.
 * @param {Function}           listener   Listener callback.
 *
 * @return {Function} Unsubscribe function.
 */
export const subscribe = ( ...args ) => {
	// Listener will always be the last argument but can be optionally preceded
	// by reducer key and selector. Normalize to three arguments, adding empty
	// values prior to the last (listener) argument to capture supported cases:
	//
	// - listener
	// - reducerKey, listener
	// - reducerKey, selector, listener
	while ( args.length < 3 ) {
		args.splice( -1, 0, null );
	}
	// eslint-disable-next-line prefer-const
	let [ reducerKey, selector, listener ] = args;

	if ( reducerKey ) {
		// When filtering by reducer key, only invoke listener when state for
		// given reducer key changes.
		const getState = stores[ reducerKey ].getState;
		let lastState = getState();
		listener = when( () => {
			const state = getState();
			const isOk = state !== lastState;
			lastState = state;
			return isOk;
		} )( listener );

		if ( selector ) {
			// Further, when filtering by selector, only invoke listener when
			// result for given selector changes.

			// Normalize selector string to array where first entry is selector
			// name, remainder as arguments to pass to selector.
			const [ selectorName, ...selectorArgs ] = castArray( selector );

			const getResult = () => selectors[ reducerKey ][ selectorName ]( ...selectorArgs );
			let lastResult = getResult();
			listener = whenWith( () => {
				const result = getResult();
				const isOk = result !== lastResult;
				lastResult = result;
				return [ isOk, result ];
			} )( listener );
		}
	}

	listeners.push( listener );
	const unsubscribe = () => {
		listeners = without( listeners, listener );
	};

	return unsubscribe;
};

/**
 * Calls a selector given the current state and extra arguments.
 *
 * @param {string} reducerKey Part of the state shape to register the
 *                            selectors for.
 *
 * @return {*} The selector's returned value.
 */
export function select( reducerKey ) {
	if ( arguments.length > 1 ) {
		deprecated( 'Calling select with multiple arguments', {
			version: '2.4',
			plugin: 'Gutenberg',
		} );

		const [ , selectorKey, ...args ] = arguments;
		return select( reducerKey )[ selectorKey ]( ...args );
	}

	return selectors[ reducerKey ];
}

/**
 * Returns the available actions for a part of the state.
 *
 * @param {string} reducerKey Part of the state shape to dispatch the
 *                            action for.
 *
 * @return {*} The action's returned value.
 */
export function dispatch( reducerKey ) {
	return actions[ reducerKey ];
}

/**
 * Higher-order component used to inject state-derived props using registered
 * selectors.
 *
 * @param {Function} mapStateToProps Function called on every state change,
 *                                   expected to return object of props to
 *                                   merge with the component's own props.
 *
 * @return {Component} Enhanced component with merged state data props.
 */
export const withSelect = ( mapStateToProps ) => ( WrappedComponent ) => {
	class ComponentWithSelect extends Component {
		constructor() {
			super( ...arguments );

			this.runSelection = this.runSelection.bind( this );

			this.state = {};
		}

		componentWillMount() {
			this.subscribe();

			// Populate initial state.
			this.runSelection();
		}

		componentWillReceiveProps( nextProps ) {
			if ( ! isEqualShallow( nextProps, this.props ) ) {
				this.runSelection( nextProps );
			}
		}

		componentWillUnmount() {
			this.unsubscribe();
		}

		subscribe() {
			this.unsubscribe = subscribe( this.runSelection );
		}

		runSelection( props = this.props ) {
			const newState = mapStateToProps( select, props );
			if ( ! isEqualShallow( newState, this.state ) ) {
				this.setState( newState );
			}
		}

		render() {
			return <WrappedComponent { ...this.props } { ...this.state } />;
		}
	}

	ComponentWithSelect.displayName = getWrapperDisplayName( WrappedComponent, 'select' );

	return ComponentWithSelect;
};

/**
 * Higher-order component used to add dispatch props using registered action
 * creators.
 *
 * @param {Object} mapDispatchToProps Object of prop names where value is a
 *                                    dispatch-bound action creator, or a
 *                                    function to be called with with the
 *                                    component's props and returning an
 *                                    action creator.
 *
 * @return {Component} Enhanced component with merged dispatcher props.
 */
export const withDispatch = ( mapDispatchToProps ) => ( WrappedComponent ) => {
	class ComponentWithDispatch extends Component {
		constructor() {
			super( ...arguments );

			this.proxyProps = {};
		}

		componentWillMount() {
			this.setProxyProps( this.props );
		}

		componentWillUpdate( nextProps ) {
			this.setProxyProps( nextProps );
		}

		proxyDispatch( propName, ...args ) {
			// Original dispatcher is a pre-bound (dispatching) action creator.
			mapDispatchToProps( dispatch, this.props )[ propName ]( ...args );
		}

		setProxyProps( props ) {
			// Assign as instance property so that in reconciling subsequent
			// renders, the assigned prop values are referentially equal.
			const propsToDispatchers = mapDispatchToProps( dispatch, props );
			this.proxyProps = mapValues( propsToDispatchers, ( dispatcher, propName ) => {
				// Prebind with prop name so we have reference to the original
				// dispatcher to invoke. Track between re-renders to avoid
				// creating new function references every render.
				if ( this.proxyProps.hasOwnProperty( propName ) ) {
					return this.proxyProps[ propName ];
				}

				return this.proxyDispatch.bind( this, propName );
			} );
		}

		render() {
			return <WrappedComponent { ...this.props } { ...this.proxyProps } />;
		}
	}

	ComponentWithDispatch.displayName = getWrapperDisplayName( WrappedComponent, 'dispatch' );

	return ComponentWithDispatch;
};

export const query = ( mapSelectToProps ) => {
	deprecated( 'wp.data.query', {
		version: '2.5',
		alternative: 'wp.data.withSelect',
		plugin: 'Gutenberg',
	} );

	return withSelect( ( props ) => {
		return mapSelectToProps( select, props );
	} );
};
