/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { query } from '@wordpress/data';
import { dom } from '@wordpress/editor';

/**
 * Non-visual component which preserves offset of selected block within nearest
 * scrollable container while reordering.
 *
 * @example
 *
 * ```jsx
 * <PreserveScrollInReorder />
 * ```
 */
class PreserveScrollInReorder extends Component {
	constructor() {
		super( ...arguments );

		this.bindNode = this.bindNode.bind( this );
	}

	bindNode( node ) {
		this.node = node;
	}

	componentWillUpdate( nextProps ) {
		const { blockOrder, selectionStart } = nextProps;
		if ( blockOrder !== this.props.blockOrder && selectionStart ) {
			this.setPreviousOffset( selectionStart );
		}
	}

	componentDidUpdate() {
		if ( this.previousOffset ) {
			this.restorePreviousOffset();
		}
	}

	/**
	 * Given the block UID of the start of the selection, saves the block's
	 * top offset as an instance property before a reorder is to occur.
	 *
	 * @param {string} selectionStart UID of selected block.
	 */
	setPreviousOffset( selectionStart ) {
		const blockNode = dom.getBlockDOMNode( selectionStart );
		if ( ! blockNode ) {
			return;
		}

		this.previousOffset = blockNode.getBoundingClientRect().top;
	}

	/**
	 * After a block reordering, restores the previous viewport top offset.
	 */
	restorePreviousOffset() {
		const { selectionStart } = this.props;
		const scrollContainer = dom.getScrollContainer( this.node );
		const blockNode = dom.getBlockDOMNode( selectionStart );
		if ( scrollContainer && blockNode ) {
			scrollContainer.scrollTop = scrollContainer.scrollTop +
				blockNode.getBoundingClientRect().top -
				this.previousOffset;
		}

		delete this.previousOffset;
	}

	render() {
		return <noscript ref={ this.bindNode } />;
	}
}

export default query( ( select ) => {
	return {
		blockOrder: select( 'core/editor' ).getBlockOrder(),
		selectionStart: select( 'core/editor' ).getBlockSelectionStart(),
	};
} )( PreserveScrollInReorder );
