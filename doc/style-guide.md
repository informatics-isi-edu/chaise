# Interface Style Guide

This guide defines the styles, icons, fonts and general UI control that should be used for any user interface we code. This creates a consistent look and feel - and saves time. 

which bootstrap container should we use -- i.e., use container vs container-fluid - layout classes. 

table classes 

font-family, etc and for fonts etc, i think that bootstrap mostly determines the basic font, we might just need some decisions about special cases where we deviate from the default font and which one to use.

secondly, i would say we should define our style guide in terms of the css classes to use and for those that need to extend bootstrap, our style guide should basically be a reference to the classes in our own custom chaise.css (or whatever).

and thirdly, then we need to pick a set of **non-bootstrap 3rd party ui components**, such as which dropdown control to use (e.g., angular-ui-selector or whatever its called).

<!-- TOC depthFrom:1 depthTo:6 withLinks:1 updateOnSave:1 orderedList:0 -->

<!-- /TOC -->

## Doctype

Include the HTML5 doctype at the beginning of all your projects.

~~~~
<!DOCTYPE html>
<html lang="en">
  ...
</html>
~~~~

## Framework

The underlying framework for our interfaces if <a href="http://getbootstrap.com">Bootstrap</a>. We are currently using version 3.

To add Bootstrap to your project:

- Click the "Download Bootstrap button" on the [Getting Started page](http://getbootstrap.com/getting-started/) and unzip the download.
- Add the folders ("css", "fonts" and "js") to your project (usually either at the root directory of your web files or under an "assets" directory there).
- Update the `<head>` section to link to the stylesheet:

		~~~~
		 <link href="css/bootstrap.min.css" rel="stylesheet">
		~~~~

- Update the bottom of your HTML code - right before the closing `</body>` tag - to import the Bootstrap javascript as well as jQuery:

		~~~~
		<!-- jQuery (necessary for Bootstrap's JavaScript plugins) -->
	 <script     src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js"></script>
	 <!-- Include all compiled plugins (below), or include individual files as needed -->
	 <script src="js/bootstrap.min.js"></script>
		~~~~

Note, if you prefer, you can download jQuery, add it to your web files and link to that.

## Custom Styles/css

To make changes to Bootstrap styles, do not edit the bootstrap style sheet. Add your own file (usually named `custom.css`), add it to the `css` directory and link to it from your `<head>` tag _after_ the Bootstrap style sheet (this will make sure that custom styles override the Bootstrap styles):

~~~~
 <link href="css/bootstrap.min.css" rel="stylesheet">
 <link href="css/custom.css" rel="stylesheet">
~~~~

## Normalize.css
For improved cross-browser rendering, we use [Normalize.css](http://necolas.github.io/normalize.css/), a project by Nicolas Gallagher and Jonathan Neal.

## Basic example 

The following is a basic example of an HTML page using Bootstrap (without a grid or any content yet):
~~~~
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <!-- The above 3 meta tags *must* come first in the head; any other head content must come *after* these tags -->
    <title>Bootstrap 101 Template</title>

    <!-- Bootstrap -->
    <link href="css/bootstrap.min.css" rel="stylesheet">

    <!-- HTML5 shim and Respond.js for IE8 support of HTML5 elements and media queries -->
    <!-- WARNING: Respond.js doesn't work if you view the page via file:// -->
    <!--[if lt IE 9]>
      <script src="https://oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js"></script>
      <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
    <![endif]-->
  </head>
  <body>
    <h1>Hello, world!</h1>

    <!-- jQuery (necessary for Bootstrap's JavaScript plugins) -->
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js"></script>
    <!-- Include all compiled plugins (below), or include individual files as needed -->
    <script src="js/bootstrap.min.js"></script>
  </body>
</html>
~~~~

## Layout

### Containers

Bootstrap uses two kinds of containing elements - one for fixed width and one for full-width.

In general, we use the full-width "container-fluid" tag:

~~~~
<div class="container-fluid">
...
</div>
~~~~

### Grid System

Container tags contain rows (divs using the `row` class) and then the appropriate column classes. 

In general, a row is made up of 12 possible columns. To make your grid, you 'chunk' the columns together to get the width you want. 

Further, the column classes use size terms to indicate breakpoints (points where a columns will stack vertically instead of going all the way across horizontally) for different size viewports (phone, tablet, laptop, etc). There will be more discussion in the "Responsive" section but for now we'll use the medium version for examples in this document (col-md-#).

For example:
- If you you want two columns of equal width, you would use two divs with the class `col-md-6`
- For a left sidebar and a larger content area, you could use `col-md-4` and `col-md-8`

Note: For one column, no column classes are needed, just the 'row' div. However, if you run into layout issues, use the `col-*-12`

### Grid Layout example

Here's the bootstrap HTML tags for a full-width app with a left sidebar and main content area:

~~~~
...
		<div class="container-fluid">
			<div class="row">
				<div class="col-md-4">
					Sidebar content
				</div>
				<div class="col-md-8">
					Main content
				</div>
			</div>
		</div>
...
~~~~

Note that rows/columns can be nested as needed.

## Typography

### Font

Our preferred font is 

Add it to the `font-family` CSS rule for the `body` tag as follows to allow graceful degradation if that font is not available:
~~~~
body {
	font-family: "Helvetica Neue",Helvetica,Arial,sans-serif;
}
~~~~

### Headings

Use `<h1>` through `<h6>` in a hierarchical manner as appropriate. You can also include a secondary header within the heading tags using the `<small>` tag:
~~~~
<h1>h1. Bootstrap heading <small>Secondary text</small></h1>
<h2>h2. Bootstrap heading <small>Secondary text</small></h2>
~~~~

### Body copy

Bootstrap uses a default font-size of 14px for the body copy but better practice is using 16px for improved readability. Add the following rule to your custom stylesheet:

~~~~
body {
	font-size: 16px;
}
~~~~

#### Lead class

Make a paragraph larger (good for opening paragraphs on a text-heavy page) by adding the `lead` class to a paragraph tag:

~~~~
<p class="lead">...</p>
~~~~

### Inline text elements

Highlight:

~~~~
You can use the mark tag to <mark>highlight</mark> text.
~~~~

Strikethrough:

~~~~
<del>This line of text is meant to be treated as deleted text.</del>
~~~~

Underline:

~~~~
<u>This line of text will render as underlined</u>
~~~~

Small text:

~~~~
<small>This line of text is meant to be treated as fine print.</small>
~~~~

Bold:

~~~~
<strong>rendered as bold text</strong>
~~~~

Italics/emphasized:

~~~~
<em>rendered as italicized text</em>
~~~~

### Alignment classes

~~~~
<p class="text-left">Left aligned text.</p>
<p class="text-center">Center aligned text.</p>
<p class="text-right">Right aligned text.</p>
<p class="text-justify">Justified text.</p>
<p class="text-nowrap">No wrap text.</p>
~~~~

### Code 

Inline code:

~~~~
For example, <code>&lt;section&gt;</code> should be wrapped as inline.
~~~~

User input:
~~~~
To switch directories, type <kbd>cd</kbd> followed by the name of the directory.<br>
To edit settings, press <kbd><kbd>ctrl</kbd> + <kbd>,</kbd></kbd>
~~~~

Code block:
~~~~
<pre>&lt;p&gt;Sample text here...&lt;/p&gt;</pre>
~~~~

Variables:
~~~~
<var>y</var> = <var>m</var><var>x</var> + <var>b</var>
~~~~

## Tables

Use `<table>` HTML tags as usual but include the following classes to automatically style them.

At the very minimum, use the `table` class for a clean look without borders on all cells:

~~~~
<table class="table">
  ...
</table>
~~~~

For long tables that may be difficult to parse, add the `.table-striped` class to shade every other row:

~~~~
<table class="table table-striped">
  ...
</table>
~~~~

For long tables, you can also cut the cell padding in half with the `.table-compact` class.

Also use:
- `.table-bordered` to add lines to all cells - for data tables
- `.table-hover` so that rows are shaded when the mouse hovers over them (another good trick for long tables)
- If you wrap the table in a div with the `.table-responsive`class, it will allow tables to scroll horizontally on mobile devices.

~~~~
<div class="table-responsive">
  <table class="table">
    ...
  </table>
</div>
~~~~

## Style

### Colors 

### Icons






I haven't thought about this much and some of the following headers might not make sense right now - but I'm going to flesh this out because one of our issues is how to space things out nicely and these types of guidelines should help.

### Principles

### Units and Measurements

### Metrics and keylines

### Structure

#### UI Regions

#### Toolbar

#### App bar

#### System bars

#### Side nav

#### Whiteframes (?)

### Responsive UI

#### Breakpoints

#### Grid

#### Surface Behaviors

## Components

### Buttons

Buttons indicate a user can take an action and are made up of text, image or both with a background color appropriate to the app.

#### Button types

Raised Button
Flat Button 

Describe each type and then how to choose

#### Usage

When to use Buttons

#### Button styles 

Typography (ie, capitalized or initial caps)

Accessibility - to ease reading: button height 27 px

Density - measurements between text and background: text size, button height, text left and right padding

#### Flat buttons 

More details about this style - where to use them  

Specs

Behavior (what happens onclick/hover etc)

Code  

#### Raised buttons

More details and where to use them - when you need to emphasize a function on a busy or wide space.

Specs

Behavior

Code  

#### Dropdown Buttons 

Generic Dropdown

Segmented dropdown 

Specs

Code 

#### Toggle Buttons

Exclusive selection

Multiple selection

Icon toggles  

Specs

code

### Chiclets

#### Usage

#### Behavior  

Editing value

Deleting

### Data Tables

To display raw data in tabular fashion (not used for layout).

#### Structure

#### Interaction

Row hover
Row selection
Sorted columns
Column name
Long header titles
Inline menus (we don't do this but it could be useful)
Alternative headers

#### Specs

### Dialogs

### Dividers

### Grid lists 

### Lists

### Lists controls

### Menus

### Pickers

### Progress indicators

### Selection controls

### Sliders

### Steppers 

(another interesting UI control we don't use yet but could)

### Subheaders

### Tabs

### Text fields

#### Input

#### Labels

#### Style

#### Single-line text field

#### Multi-line text field

#### Full-width text field

#### Character counter

#### Auto-complete text field

#### Search filter

#### Required fields

#### Password input

### Toolbars

### Tooltips

## Patterns

### Date Formats

### Empty states

### Errors

### Launch screens / Landing pages

### Loading Images

### Navigation

#### Usage
#### Defining your navigation
#### Hierarchy
#### Patterns
#### Combined patterns

### Navigation Drawer (ie Filter sidebar)

### Navigational Transitions

### Notifications

### Permissions

### Scrolling techniques

### Search

### Settings

## Usability and Accessibility

### Principles

### Color and contrast

### Motion

### Layout

### Writing

### Hierarchy and focus

### Implementation
