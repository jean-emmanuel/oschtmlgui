# Advanced property syntax

## Inheritance: `@{}`

Widgets can use each other's property values by using the following syntaxes:

- `@{this.propertyName}`
- `@{parent.propertyName}`
- `@{widgetId.propertyName}` (where `widgetId` is the target widget's `id`)

!!! note
    Don't use `widgetId` when targetting `this` or `parent`, it won't work.   

`propertyName` can be any of the target widget's properties.

It can be used to:

- concatenate strings: `/@{parent.id}/some_suffix`
- define object value:   `["@{parent.id}"]`

If the retreived property is an object (`[] / {}`), a subset can be defined by appending a dot and a key (array index or object key) : `@{parent.variables.key}`

!!! note ""
    The root panel's `id` is `root`.

### Using the value

The special property name `value`<i class="dynamic-prop-icon" title="dynamic"></i> refers to a widget's current value (which can be affected by its `value` *property*).

When omitted, the property name defaults to `value` : `@{widgetId}` => `@{widgetId.value}`

### Dynamic properties

Some properties, when changed, trigger a complete widget recreation that ends any ongoing user interaction. Also, updating these properties continuously (e.g. when linked to a slider's dynamic value) can be very cpu expensive.

Some properties have much cheaper update routines and can be considered as `dynamic`, as in performance safe. These properties are marked in the documentation with a ` `<i class="dynamic-prop-icon" title="dynamic"></i>.


### Circular references cases

- container widgets can inherit their children's properties only to define `dynamic` properties
- widgets can inherit their own `value`<i class="dynamic-prop-icon" title="dynamic"></i> property only to define `dynamic` properties

----

### Nesting

The inheritance syntax supports nesting with a limitation: nested calls are not updated when the target's property/value updates, they are only resolved once at the host widget's initialization.


## OSC listeners: `OSC{}`

The following syntax allows listening on an osc address to define a property, with an optionnal default value :

```
OSC{/address, 1}
```
Will return `1` at first and listen for osc messages on address `/address`. Each time a value is received, the property will be updated.

----

## Formulas: `#{}`

The following syntax allow writing mathematical formulas in widgets' properties:

```
#{FORMULA}
```

Where FORMULA is a valid [MathJS](http://mathjs.org/docs/expressions/syntax.html) expression:

- [syntax documentation](http://mathjs.org/docs/expressions/syntax.html)
- [available functions](http://mathjs.org/docs/reference/functions.html)
- [available constants](http://mathjs.org/docs/reference/constants.html)
- formulas can be [multiline](http://mathjs.org/docs/expressions/syntax.html#multiline-expressions)
- property inheritance calls (`@{...}`) are always resolved before formulas
- arrays / matrices indexes are **zero-based** (ie `["a","b"][0]` returns `"a"`)
- strings can be multiline when enclosed in backticks instead of double quotes (``` ` `  ```)

Additionnal functions:

- `unpack(x)`: remove an array's brackets (`unpack([1,2])` returns `"1, 2"`)
- `pad(x, padding)`: add leading zeros if the length the integer part of `x` is smaller than `padding` (`pad(1,2)` returns `"01"`)
- `length(x)`: returns the length of an array or string
- `keys(x)`: returns an array of a given object's property names (from [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys))
- `values(x)`: returns an array of a given object's own enumerable property values (from [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/values))
- `extend(x, y)`: merges two objects into one

!!! tip ""
    A single widget property can contain multiple formulas. Variables and functions declared in a formula are available to subsequent formulas in the same property definition.
