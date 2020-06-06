# Vuex Class Component
A Type Safe Solution for Vuex Modules using ES6 Classes and ES7 Decorators that works out of the box for TypeScript and JavaScript.

## Installation
```
$ npm install --save vuex-class-component
```

## New API
The goal of the new API is to reduce the decorator overhead and 
https://github.com/michaelolof/vuex-class-component/issues/27

How we normally define Vuex Stores.
```js
// user.vuex.ts
const user = {
  namespace: true,
  state: {
    firstname: "Michael",
    lastname: "Olofinjana",
    specialty: "JavaScript",
  },
  mutations: {
    clearName(state ) {
      state.firstname = ""; 
      state.lastname = "";
    } 
  },
  actions: {
    doSomethingAsync(context) { ... }
    doAnotherAsyncStuff(context, payload) { ... }
  },
  getters: {
    fullname: (state) => state.firstname + " " + state.lastname,
    bio: (state) => `Name: ${state.fullname} Specialty: ${state.specialty}`,
  }
}
```

```ts
import { createModule, mutation, action, extractVuexModule } from "vuex-class-component";

const VuexModule = createModule({
  namespaced: "user",
  strict: false,
  target: "nuxt",
})

export class UserStore extends VuexModule {

  private firstname = "Michael";
  private lastname = "Olofinjana";
  specialty = "JavaScript";
  
  @mutation clearName() {
    this.firstname = "";
    this.lastname = "";
  }

  @action async doSomethingAsync() { return 20 }

  @action async doAnotherAsyncStuff(payload) { 
    const number = await this.doSomethingAsyc();
    this.changeName({ firstname: "John", lastname: "Doe" });
    return payload + this.fullName;
  }

  // Explicitly define a vuex getter using class getters.
  get fullname() {
    return this.firstname + " " + this.lastname;
  } 

  // Define a mutation for the vuex getter.
  // NOTE this only works for getters.
  set fullname( name :string ) {
    const names = name.split( " " );
    this.firstname = names[ 0 ];
    this.lastname = names[ 1 ];
  }
  
  get bio() {
    return `Name: ${this.fullname} Specialty: ${this.specialty}`;
  }
}

// store.vuex.ts
export const store = new Vuex.Store({
  modules: {
    ...extractVuexModule( UserStore )
  }
})

// Creating proxies.
const vxm = {
  user: createProxy( store, UserStore ),
}
```

On the surface, it looks like not much has changed. But some rethinking has gone into how the libary works to make for a much better developer experience.

## More Powerful Proxies
With the `strict` option set to `false` we can enable greater functionality for our proxies with automatic getters and setters for our state.\
For Example: 
```ts
vxm.user.firstname // Michael
vxm.user.firstname = "John";
vxm.user.firstname // John

vxm.user.fullname // John Olofinjana
vxm.user.fullname = "Mad Max";
vxm.user.fullname // Mad Max
vxm.user.firstname // Mad
vxm.user.lastname // Max
```

Notice that we didn't have to define a mutation to change the `firstname` we just set the state and it updates reactively. This means no more boilerplate mutations for our state, we just mutate them directly.

This also opens up new possibilities in how we consume stores in Vue components.
Example
```html
<!-- App.vue -->
<template>
  <div class>
    <input type="text" v-model="user.firstname" />
    <div>Firstname: {{ user.firstname }}</div>

    <button @click="user.clearName()">Clear Name</button>
    <div>Bio: {{ user.bio }}</div>
  </div>
</template>

<script>
  import { vxm } from "./store";

  export default {
    data() {
      return {
        user: vxm.user,
      }
    }
  }
</script>
```

Notice how much boilerplate has been reduced both in defining our vuex stores and also in using them in our components.
Also notice we no longer need functions like `mapState` or `mapGetters`.

## Implementing More Vuex Functionality
Vuex today has additional functionalities like `$watch` `$subscribe` and `$subScribeAction` respectfully.

This also possible with `vuex-class-component`
```ts
// Watch getters in Vue components
vxm.user.$watch( "fullname", newVal => { 
  console.log( `Fullname has changed: ${newVal}` )
});

// Subscribe to mutations in Vue components 
vxm.user.$subscribe( "clearName", payload => {
  console.log( `clearName was called. payload: ${payload}` )
});

// Subscribe to an action in Vue components
vxm.user.$subscribeAction( "doSomethingAsync", {
  before: (payload :any) => console.log( payload ),
  after: (payload :any) => console.log( payload ),
})
```

We can even do better with Local watchers and subscribers.

```ts
const VuexModule = createModule({
  strict: false,
  target: "nuxt",
  enableLocalWatchers: true,
})

export class UserStore extends VuexModule.With({ namespaced: "user" }) {
  
  firstname = "John";
  lastname = "Doe";
  @mutation changeName( name :string ) { ... }
  @action fetchDetails() { ... }
  get fullname() {
    return this.firstname + " " + this.lastname;
  }

  $watch = {
    fullname( newValue ) { console.log( `Fullname has changed ${newValue}` },
  }

  $subscribe = {
    changeName( payload ) {
      console.log( `changeName was called with payload: ${payload}`)
    }
  }

  $subscribeAction = {
    fetchDetails( payload ) {
      console.log( `fetchDetails action was called with payload: ${payload}` )
    }
  }

}
```



## SubModules Support 
To use submodules
```ts
  const VuexModule = createModule({
    strict: false
  })

  class CarStore extends VuexModule.With({ namespaced: "car" }) {
    @getter noOfWheels = 4;

    @action drive() {
      console.log("driving on", this.noOfWheels, "wheels" )
    }
  }
```
We could use this sub module in a class
```ts
  class VehicleStore extends VuexModule.With({ namespaced: "vehicle" }) {
    car = createSubModule( CarStore );
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
export class UserStore extends createModule({ target: "nuxt" }) {
  ...
}
```

## See Old API
[Old API >](old-api-readme.md)
