/**
 * Internal dependencies
 */
import {
	getEditorMode,
	getPreference,
	isGeneralSidebarPanelOpened,
	hasOpenSidebar,
	isEditorSidebarPanelOpened,
	isFeatureActive,
} from '../selectors';

describe( 'selectors', () => {
	describe( 'getEditorMode', () => {
		it( 'should return the selected editor mode', () => {
			const state = {
				preferences: { editorMode: 'text' },
			};

			expect( getEditorMode( state ) ).toEqual( 'text' );
		} );

		it( 'should fallback to visual if not set', () => {
			const state = {
				preferences: {},
			};

			expect( getEditorMode( state ) ).toEqual( 'visual' );
		} );
	} );

	describe( 'getPreference', () => {
		it( 'should return the preference value if set', () => {
			const state = {
				preferences: { chicken: true },
			};

			expect( getPreference( state, 'chicken' ) ).toBe( true );
		} );

		it( 'should return undefined if the preference is unset', () => {
			const state = {
				preferences: { chicken: true },
			};

			expect( getPreference( state, 'ribs' ) ).toBeUndefined();
		} );

		it( 'should return the default value if provided', () => {
			const state = {
				preferences: {},
			};

			expect( getPreference( state, 'ribs', 'chicken' ) ).toEqual( 'chicken' );
		} );
	} );

	describe( 'isGeneralSidebarPanelOpened', () => {
		it( 'should return true when specified the sidebar panel is opened', () => {
			const state = {
				preferences: {
					activeGeneralSidebar: 'editor',
					viewportType: 'desktop',
					activeSidebarPanel: 'document',
				},
			};
			const panel = 'document';
			const sidebar = 'editor';

			expect( isGeneralSidebarPanelOpened( state, sidebar, panel ) ).toBe( true );
		} );

		it( 'should return false when another panel than the specified sidebar panel is opened', () => {
			const state = {
				preferences: {
					activeGeneralSidebar: 'editor',
					viewportType: 'desktop',
					activeSidebarPanel: 'blocks',
				},
			};
			const panel = 'document';
			const sidebar = 'editor';

			expect( isGeneralSidebarPanelOpened( state, sidebar, panel ) ).toBe( false );
		} );

		it( 'should return false when no sidebar panel is opened', () => {
			const state = {
				preferences: {
					activeGeneralSidebar: null,
					viewportType: 'desktop',
					activeSidebarPanel: null,
				},
			};
			const panel = 'blocks';
			const sidebar = 'editor';

			expect( isGeneralSidebarPanelOpened( state, sidebar, panel ) ).toBe( false );
		} );
	} );

	describe( 'hasOpenSidebar', () => {
		it( 'should return true if at least one sidebar is open', () => {
			const state = {
				preferences: {
					activeSidebarPanel: null,
				},
			};

			expect( hasOpenSidebar( state ) ).toBe( true );
		} );

		it( 'should return false if no sidebar is open', () => {
			const state = {
				publishSidebarActive: false,
				preferences: {
					activeGeneralSidebar: null,
				},
			};

			expect( hasOpenSidebar( state ) ).toBe( false );
		} );
	} );

	describe( 'isEditorSidebarPanelOpened', () => {
		it( 'should return false if no panels preference', () => {
			const state = {
				preferences: {},
			};

			expect( isEditorSidebarPanelOpened( state, 'post-taxonomies' ) ).toBe( false );
		} );

		it( 'should return false if the panel value is not set', () => {
			const state = {
				preferences: { panels: {} },
			};

			expect( isEditorSidebarPanelOpened( state, 'post-taxonomies' ) ).toBe( false );
		} );

		it( 'should return the panel value', () => {
			const state = {
				preferences: { panels: { 'post-taxonomies': true } },
			};

			expect( isEditorSidebarPanelOpened( state, 'post-taxonomies' ) ).toBe( true );
		} );
	} );

	describe( 'isFeatureActive', () => {
		it( 'should return true if feature is active', () => {
			const state = {
				preferences: {
					features: {
						chicken: true,
					},
				},
			};

			expect( isFeatureActive( state, 'chicken' ) ).toBe( true );
		} );

		it( 'should return false if feature is not active', () => {
			const state = {
				preferences: {
					features: {
						chicken: false,
					},
				},
			};

			expect( isFeatureActive( state, 'chicken' ) ).toBe( false );
		} );

		it( 'should return false if feature is not referred', () => {
			const state = {
				preferences: {
					features: {
					},
				},
			};

			expect( isFeatureActive( state, 'chicken' ) ).toBe( false );
		} );
	} );
} );
