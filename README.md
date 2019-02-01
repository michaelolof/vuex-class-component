# Vuex Class Component

A Type Safe Solution for Vuex Modules using ES6 Classes and ES7 Decorators that works out of the box for TypeScript and JavaScript.

## Goals
* Ensure your Codebase is type safe when writing Vuex Modules.
* Provide proxies for getters, mutations and actions in a type safe way
* Create a Vuex Manager for handling all vuex calls throughout your codebase.

## Dependencies
This module has no external dependencies. 

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
  @getter specialty = "JavaScript";
  @getter occupation = "Developer";

  @mutation 
  changeName({firstname, lastname}:Name) {
    this.firstname = firstname;
    this.lastname = lastname;
  }

  @action() 
  doSomethingAsync() { ... }

  @action() 
  doAnotherAsyncStuff(payload) { ... }

  get fullName() {
    return this.firstname + " " + this.lastname;
  }
}
```
This is a significant improvement over our initial method. First we get type safety out of the box since we're using classes without doing much work. Also note that **occupation** and **specialty** don't need to be redefined as getters any longer. Just import the getter decorator, use it on an already defined state and it automatically becomes a getter. This is useful when you have a long list of initialized state you also want to make available as getters. Which is also why state that are not getters must be **private**\
\
We can then extract the actual vuex object:
```ts
export const user = UserStore.ExtractVuexModule( UserStore );
```
Then simply place in your Vuex Store.
```ts
  export const store = new Vuex.Store({
    modules: {
      user,
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
A vuex manager is simply an exportable object that houses all our proxies. We can easily create a vuex manager in our original vuex store file. (See Example)
```ts
  /** in store.ts/store.js */
  export const store = new Vuex.Store({
    modules: {
      user,
      pages,
      dashboard,
      story,
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

    @action()
    drive() {
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

## A note on Vuex Actions?
Vuex actions are particularly tricky to get working due to their **context** nature. But writing and using actions with type safety is not impossible.\
\
To ensure type safety and still maintain flexibility so you are not limited by the library, actions in vuex-class-components come in two modes "mutate" or "raw". By default the mode is set to "mutate"\
\
Example:
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

    @action() 
    dummyAction() { ... }

    @action({ mode:"mutate"})
    mutatedAction(payload) {
      this.name = payload.firstname + " " + payload.lastname;
      this.changeOccupation("Developer");
      this.occupation /** Developer */
      return this.dummyAction().then( val => val )
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

Mutated Actions can access state, getters, mutations and other actions with the this keyword just like any normal function would and the library resolves your context fo you. The only limitation is that **you can't use the async/await keyword** or you will get a ReferenceError.\
\
Raw Actions on the other hand give you all the freedom you want with the ability to use async/await or any features you might need. The limitation for the appoach however is that **you can't and shouldn't use this like in mutated actions**. Instead get back the context object with the getRawActionContext function and use just like your normal vuex module.\
\
**Mutated actions** are great for simple chainable promise calls or if async/await is not extremely important to you. If you must use async/await, use **Raw Actions**. Muatated Actions partially sacrifice flexibilty for total type safety. Raw actions partially sacrifice type safety for total flexibility.
\
\
All actions MUST return a promise.\
All actions proxies are totally type safe and can still be used normally in Vue components whether mutatated or raw.
