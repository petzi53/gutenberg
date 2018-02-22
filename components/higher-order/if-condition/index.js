/**
 * WordPress dependencies
 */
import { getWrapperDisplayName } from '@wordpress/element';

/**
 * Higher-order component creator, creating a new component which renders if
 * the given condition is satisfied or with the given optional prop name.
 *
 * @param {Function} predicate Function to test condition.
 * @param {?string}  propName  Optional name of prop passed to component with
 *                             result of predicate. If provided, component will
 *                             always render even if predicate returns false.
 *
 * @return {Function} Higher-order component.
 */
const ifCondition = ( predicate, propName ) => ( WrappedComponent ) => {
	const EnhancedComponent = ( props ) => {
		const isOk = predicate( props );

		if ( ! propName && ! isOk ) {
			return null;
		}

		if ( propName ) {
			props = { ...props, [ propName ]: isOk };
		}

		return <WrappedComponent { ...props } />;
	};

	EnhancedComponent.displayName = getWrapperDisplayName( WrappedComponent, 'condition' );

	return EnhancedComponent;
};

export default ifCondition;
