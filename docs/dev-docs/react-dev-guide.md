# React Developer Guide

This is a guide for people who develop Chaise using ReactJS.

## Table of Contents
- [Structure of an App](#structure-of-an-app)
  - [Main HTML](#main-html)
  - [App Wrapper](#app-wrapper)
  - [Context](#context)
  - [Error Provider](#error-provider)
  - [Alerts Provider](#alerts-provider)
  - [Chaise Navbar](#chaise-navbar)
- [Common Functionality](#common-functionality)
  - [Components](#components)
  - [Providers](#providers)
  - [Services](#services)
  - [Utilities](#utilities)
- [Typescript](#typescript)
  - [Models](#models)
- [React Development Practices](#react-development-practices)
  - [Building and Installing](#building-and-installing)
  - [CSS and Styles](#css-and-styles)
  - [Importing Dependencies](#importing-dependencies)
  - [Immutability of Objects](#immutability-of-objects)
  

## Structure of an App
Since Chaise is a collection of multiple single page apps (`recordset`, `record`, `recordedit`, etc.), app setup will be very similar. This similar structure allowed us to factor out a lot of that common setup code into difrerent bits described below.

### Main HTML
The instantiation and bundle of dependencies should be almost the same for each app. The build process using webpack will generate the outer HTML based on `pages/main.html`. Each app attaches to the element with `id` equal to `chaise-app-root` defined in `main.html`.

### App Wrapper
Each app in Chaise is instantiated and configured the same way as far as creating the outer HTML and <head> tag, wrapping the app in the proper providers, configuring Chaise and ermrestJS, and fetching the session. To help manage parts of this, we created a component called `AppWrapper` to wrap each app for setup and configuration.

### Context
For state sharing between components, Chaise is using the built in useContext hook. Each application has it's own top level context with each component defining it's own context as needed (like alerts and errors).

### Error Provider
To handle global errors, the app wrapper adds an `ErrorProvider` to handle the error state and an `ErrorBoundary` to catch the errors. Each app only needs to throw errors to let the global handler decide what to do with them.

### Alerts Provider
Alerts also has it's own provider created to have consistent state at the app level when trying to show alerts from sub components of the app. The provider here acts like a service that handles the functionality surrounding alerts. This provider also allows for showing alerts in multiple places without having duplicate alerts show in the wrong contexts.

### Chaise Navbar
The navbar for each Chaise app is the same style. It is loaded as part of the configuration phase in app wrapper. All apps in Chaise can decide to show or hide the navbar as part of defining the `AppWrapper` component.


## Common Functionality
There are different folders in the project for where to define new functionality based on what purpose that functionality is trying to provide.

### Components
Each app will rely on similar components for functionality and display purposes. If there is a need to reuse code, even if that's in only 2 places, a common component should be extracted and placed in the components folder.

### Providers
Providers are a way to have a consistent state that can be accessed by any component at any level of the parent/child component hierarchy. Providers make use of React hooks to manage the app state.

### Services
Services are used for common functionality like interacting with the server, configuring the application, managing the user session, and more. These functional services provide a scope that is shared throughout the service that each function can interact with.

### Utilities
Utilities are intended to be collections of functions exported individually that are then imported as needed in other places.


## Typescript
The application is written with typescript to have better control over the way code is used. More about typescript can be found in the [documentation](www.insert.hyperlink.here.com)

### Models
To manaage more complex objects in typescript (instead of blindly using `any` type), models for different common objects are defined in the `models` folder.


## React Development Practices

### Building and Installing
The build process uses Makefile to simplify what needs to be called from the command line to get started. `Make` will manage dependency installation (through `npm`) and the react build process (using `webpack`).

### CSS and Styles
General styles should be included as part of the build process in the <head> tag. More specific styles that are meant to be reused for a specific component should be imported at the top of the component file. Styles used only once for a specific element should be inline or factored out into that component's specific CSS document.

### Importing dependencies
Part of the build process defines an alias, called `@chaise`, to reference the `src` folder in the Chaise repo. This alias should be used instead of doing relative imports.

### Immutability of Objects
