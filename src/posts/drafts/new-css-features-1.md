New CSS Features | 4 | 2023-10-31 | webdev,css

CSS is [fun](https://pdx.su/blog/2023-10-25-css-is-fun-again) again—gone are the days of tables and clearfix! CSS can do a lot of things these days, such that I don't even use CSS preprocessors. Here I list some of the new features I know and am excited for.

## Nested CSS

```css
.btn {
  border: 1px solid;
  padding: 5px;

  &[data-color="blue"] {
    background: blue;
    color: white;
  }
  &[data-color="red"] {
    background: red;
    color: white;
  }
  &[data-primary] {
    font-weight: bold;
  }
}
```
