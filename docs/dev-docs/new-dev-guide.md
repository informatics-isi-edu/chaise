This document should be organized later, I just wanted to make sure the things that comes up during migration are documented:

# Reading Material

- [Intro to React, Redux, and TypeScript](https://blog.isquaredsoftware.com/presentations/react-redux-ts-intro-2020-12)


# React

- Create a `interface` for `props` of components.


- Regarding [Render logic](https://blog.isquaredsoftware.com/presentations/react-redux-ts-intro-2020-12/#/36),
  - It must be “pure“, without any “side effects”
    - No AJAX calls, mutating data, random values
    - Rendering should only be based on current props and state
  - Render any dependent items into temporary variables, such as conditional components or lists.

- Regarding `useState` and `setState` hooks:
  - Creating callbacks “closes over” variable values at time of render
    - Can cause bugs due to “stale state” if not careful!
  - Be careful with multiple update calls in a row!
  - `setState` can accept an “updater” callback instead of a value.
    - Updater will be called with the latest value as its argument, and should return a new value. Safer to use this if multiple updates depend on each other
    - Also can avoid having to capture value from parent scope

  ```typescript
  // ❌ Two bugs here!
  // 1) "Closed over" old value of `counter`
  // 2) Updates will be batched together
  const onClick = () => {
    setCounter(counter + 1);
    setCounter(counter + 1);
  }

  const onClickFixed = () => {
    // ✅ Can pass an "updater" function to setState,
    // which gets the latest value as its argument
    setCounter(prevCounter => prevCounter + 1);
    setCounter(prevCounter => prevCounter + 1);
  };
  ```
- List items must have keys, which tell React list item   identity
  - Should be unique per list
  - Ideally, use item IDs
  - Fallback, use array indices, but only if data won’t reorder

- Sample React component:

```typescript
type ListItemProps = {
  name: string;
  selected: boolean;
  onClick: (name: string) => void;
};

const ListItem = ( {
  name, selected, onClick
}: ListItemProps) => {



}


```


### Parent/child component communication

- Parents pass data as `props` to children
- Parents pass callbacks to children as props, children communicate to parent by running `props.somethingHappened(data)`





# Code style
1. Use semilicon everywhere. Eventhough it's not needed, for consistency, use semicolon after each line.
2. Stick with the indentation size of 2. If a file is not using size 2, just change the whole file.
3. Only use functional components (no class component)
