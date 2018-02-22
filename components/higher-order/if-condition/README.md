If Condition
============

`ifCondition` is a higher-order component creator, used for creating a new component which renders if the given condition is satisfied or with the given optional prop name.

## Usage

`ifCondition`, passed with a predicate function, will render the underlying component only if the predicate returns a truthy value. The predicate is passed the component's own original props as an argument.

```jsx
function MyEvenNumber( { number } ) {
	// This is only reached if the `number` prop is even. Otherwise, nothing
	// will be rendered.
	return <strong>{ number }</strong>;
}

MyEvenNumber = ifCondition(
	( { number } ) => number % 2 === 0
)( MyEvenNumber );
```

`ifCondition`, passed with a predicate function and prop name, will render the underlying component with the result of the predicate. This can be used to handle the case where the predicate fails.

```jsx
function MyEvenNumber( { number, isEven } ) {
	return <strong>{ isEven ? number : 'Not even!' }</strong>;
}

MyEvenNumber = ifCondition(
	( { number } ) => number % 2 === 0,
	'isEven'
)( MyEvenNumber );
```

