[< Back to New API](README.md)

# Vuex Class Component
A Type Safe Solution for Vuex Modules using ES6 Classes and ES7 Decorators that works out of the box for TypeScript and JavaScript.

## Goals
* Ensure your Codebase is type safe when writing Vuex Modules.
* Provide proxies for getters, mutations and actions in a type safe way
* Create a Vuex Manager for handling all vuex calls throughout your codebase.

## Changelog 
  - `v.1.1.0` - Sub Modules support. 
  - `v.1.4.0` - async/await now works with actions in mutatate mode. 
  - `v.1.5.0` - JavaScript Support
  - `v.1.6.0` - NuxtJS Support.
  - `v.1.7.0` - Improved testability.

## Installation
```
$ npm install --save vuex-class-component
```

## Examples
  - Vuex Class Component Simple: https://github.com/michaelolof/vuex-class-component-simple
  - Vuex Class Component Test: https://github.com/michaelolof/vuex-class-component-test

## How to use
Consider this example.
```js
// user.vuex.ts
const user = {
  namespace: true,
  state: {
    firstname: "Michael",
    lastname: "Olofinjana",
    specialty: "JavaScript",
    occupation: "Developer",
  },
  mutations: {
    changeName(state, payload) {
      state.firstname = payload.firstname; 
      state.lastname = payload.lastname;
    } 
  },
  actions: {
    doSomethingAsync(context) { ... }
    doAnotherAsyncStuff(context, payload) { ... }
  },
  getters: {
    fullname: (state) => state.firstname + " " + state.lastname,
    occupation: (state) => state.occupation,
    specialty: (state) => state.specialty,
  }
}
```
This is how we previously wrote Vuex Modules. Some of the obvious difficulties with this approach are:

* Lack of Type Safety: Type Safety and Intellisense when defining the store.
* Also notice how we are redefining **occupation** and **specialty** fields both as states and getters. This repitition and can easily lead to bugs if we update one and forget to update the other
* We also don't have any type secure way to use this module in our Vue components. We have to use strings to handle getters, commits and dispatch calls. This can easily lead to bugs.

A better approach to solving this problem would be to use a VuexModule class as follows.
```ts
// user.vuex.ts
import { VuexModule, mutation, action, getter, Module } from "vuex-class-component";

// TypeScript Only. (JavaScript devs don't need this)
interface Name { 
  firstname:string;
  lastname:string;
}

@Module({ namespacedPath: "user/" })
export class UserStore extends VuexModule {
  
  private firstname = "Michael";
  private lastname = "Olofinjana";
  @getter specialty = "JavaScript"; // The @getter decorator automatically exposes a defined state as a getter.
  @getter occupation = "Developer"; 

  @mutation changeName({firstname, lastname}:Name) {
    this.firstname = firstname;
    this.lastname = lastname;
  }

  @action async doSomethingAsync() { return 20 }

  @action async doAnotherAsyncStuff(payload) { 
    const number = await this.doSomethingAsyc();
    this.changeName({ firstname: "John", lastname: "Doe" });
    return payload + this.fullName;
  }

  // Explicitly define a vuex getter using class getters.
  get fullName() {
    return this.firstname + " " + this.lastname;
  }
}
```
This is a significant improvement over our initial method. First we get type safety out of the box since we're using classes without doing much work. Also note that **occupation** and **specialty** don't need to be redefined as getters any longer. Just import the getter decorator, use it on an already defined state and it automatically becomes a getter. This is useful when you have a long list of initialized state you also want to make available as getters. Which is also why state that are not getters must be **private**\
\
This module can now be used in our Vuex store by extracting it like so.
```ts
// store.vuex.ts
export const store = new Vuex.Store({
  modules: {
  /** 
   * PLEASE NOTE
   * ---------------------
   * If you're using namespaces in your modules, then the modules object field 
   * must be the same value as your "namespacedPath" value.
   * In this case, the "user" field must be the same as the namespacedPath "user/"
   * 
   * If you're not using namespaces, this doesn't matter.
   */
   user: UserStore.ExtractVuexModule( UserStore ),
  }
})
```

## Ok. So What About Vue Components?
Ensuring type safety in Vuex Modules is just one half of the problem solved. We still need to use them in our Vue Components.\
\
To do this is we just create a proxy in our Vue Component.
```ts
  @Component
  export class MyComponent extends Vue {
    
    user = UserStore.CreateProxy( this.$store, UserStore );

    mounted() {
      /** Now we can easily call */
      this.user.fullName; /** Michael Olofinjana */
      this.user.occupation; /** Developer */
      this.user.changeName({ firstname:"John", lastname:"Doe" });
      this.user.doAnotherAsyncStuff(payload)
      .then( result => console.log( result ) );
    }
  }
```

No more getters, commits or dispatch calls using strings. We just call them like we defined them in our class. 

### We can do better
All is looking good. we've ensured type safety in our Vue Components by creating proxies that rely on the store object and then just calling the methods like normal.\
\
The only problem here is, in reality we might have one component making request to multiple vuex modules. Imagine a vue component talking to 5 vuex modules. Importing and creating proxies for each module in all our components might become repetitive and frankly unecessary.

### Vuex Manager
A vuex manager is simply an exportable object that houses all your proxies. We can easily create a vuex manager in our original vuex store file. (See Example)
```ts
  // store.vuex.ts
  export const store = new Vuex.Store({
    modules: {
      user: UserStore.ExtractVuexModule( UserStore ),
      pages: PagesStore.ExtractVuexModule( PagesStore ),
      story: StoryStore.ExtractVuexModule( StoryStore ),
    }
  })

  export const vxm = {
    user: UserStore.CreateProxy( store, UserStore ),
    pages: PagesStore.CreateProxy( store, PagesStore ),
    story: StoryStore.CreateProxy( store, StoryStore ),
  }

  /** vxm (stands for vuex manager) can then be imported by any Vue Component and used */
  vxm.user.fullname /** Michael Olofinjana */
```
With this any component that imports **vxm** can easily use any vuex module without any hassle with full type support and intellisense.

## SubModules Support 
From version 1.1 We now get the ability to include sub modules in our Vuex Classes.
Let say we had a sub module called `CarStore`
```ts
  @Module({ namespacedPath: "car/" })
  class CarStore extends VuexModule {
    @getter noOfWheels = 4;

    @action drive() {
      console.log("driving on", this.noOfWheels, "wheels" )
    }
  }
```
We could use this sub module in a class
```ts
  @Module({ namespacedPath: "vehicle/" })
  class Vehicle extends VuexModule {
    car = CarStore.CreateSubModule( CarStore );
  }
```
Now you can easily use in your Vue Components like:
```ts
  vxm.vehicle.car.drive() // driving on 4 wheels
```

## JavaScript Support
From version `1.5.0` JavaScript is now supported fully.
To use vuex-class-component in your JavaScript files, ensure your babel.config.js file has the following plugins:
```js
module.exports = {
  ...
  plugins: [
    ["@babel/plugin-proposal-decorators", { "legacy": true }],
    ["@babel/plugin-proposal-class-properties", { "loose" : true }]
  ]
}
```
And then use as follows
```js
import { Module, VuexModule, getter, action } from "vuex-class-component/js";
```

## NuxtJS Support
From verison `1.6.0` Nuxt is also supported.
To use `vuex-class-component` with Nuxt, You add a `target` property to the @Module decorator and set it to `"nuxt"`.
```js
@Module({ namespacedPath: "user/", target: "nuxt" })

export class UserStore {
  ...
}
```

## How to test

To test components where interact with the state using a proxy, you have to create the proxy for each test, and clear the proxy cache, to keep the state clean in between tests.

If you are using jest, you could clear the proxy cache in the afterEach callback.
```js
describe('my test suite', () => {
	...
	afterEach(() => {
		UserStore.ClearProxyCache(UserStore)
	})
	...
})
```

To ensure your proxy is recreated for each test, the easiest way is to create the proxy inside the [component](#ok-so-what-about-vue-components). If not you could pass the proxy into the component using [provide/inject](https://vuejs.org/v2/api/#provide-inject), or mock the proxy if you are importing it from another file ie. like a [vuex manager](#vuex-manager).

## A note on Vuex Actions?
Vuex Actions comes in two modes. A `mutate` mode and a `raw` mode. Both can be very useful.\
For most of your use cases the `mutate` mode is all you'll need. The `raw` mode can be especially useful when you need access to `rootState` and `rootGetters`.\
This is how we use them
```ts
import { getRawActionContext } from "vuex-class-component";

@Module()
class MyModule extends VuexModule {
    
  private name = "John Doe";
  @getter occupation = "Engineer"
   
  @mutation 
  changeOccupation(occupation) {
    this.occupation = occupation;
  }

  // This action is in mutate mode by default hence 
  // the brackets and options are not necessary.
  @action dummyAction() { ... }

  @action({ mode:"mutate"})
  async mutatedAction(payload) {
    this.name = payload.firstname + " " + payload.lastname;
    this.changeOccupation("Developer");
    this.occupation /** Developer */
    const dummyVal = await this.dummyAction();
    return dummyVal;
  }

  @action({ mode: "raw" })
  async rawAction(payload) {
    const context = getRawActionContext( this );
    context.state.name = payload.firstname + " " + payload.lastname;
    context.commit("changeOccupation", "Developer");
    context.getters.occupation /** Developer */
    const dummyVal = await context.dispatch("dummyAction");
    return dummyVal;
  }
}
```
The above code snippet highlights the difference between the two action modes.

Mutated Actions can access state, getters, mutations and other actions with the `this` keyword just like any normal function.

Raw Actions on the other hand gives you access to `rootState` and `rootGetters`. The only limitation to this appoach however is that **you can't and shouldn't use the `this` keyword.** Instead you should get back the context object with the `getRawActionContext` function and then treat the function body like a regular vuex action. 

All actions MUST return a promise.\
All actions proxies are totally type safe and can still be used normally in Vue components whether mutated or raw.

[< Back to New API](README.md)