/**
 * WordPress Dependencies
 */
import {
	registerStore,
	withRehydratation,
	loadAndPersist,
	subscribe,
	dispatch,
} from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import * as actions from './actions';
import * as selectors from './selectors';

/**
 * Module Constants
 */
const STORAGE_KEY = `WP_EDIT_POST_PREFERENCES_${ window.userSettings.uid }`;

const store = registerStore( 'core/edit-post', {
	reducer: withRehydratation( reducer, 'preferences', STORAGE_KEY ),
	actions,
	selectors,
} );

loadAndPersist( store, reducer, 'preferences', STORAGE_KEY );

subscribe( 'core/viewport', [ 'isViewportMatch', '< medium' ], ( isSmall ) => {
	// Collapse sidebar when viewport shrinks.
	if ( isSmall ) {
		dispatch( 'core/edit-post' ).closeGeneralSidebar();
	}
} );

export default store;
