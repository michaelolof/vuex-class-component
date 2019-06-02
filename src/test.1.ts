import { createLocalProxy } from "./module";

const store = {
  dispatch( path :string, payload :any ) {

  },

  commit( path :string, payload :any ) {

  },

  get getters() {
    return []
  }
}

class TestStore {

  easyState = "John";
  deepState1 = {
    first: "First DeepState1",
    second: "Second DeepState1"
  }
  deepState2 = {
    deeperState2: {
      counterfiet: "Counterfiet DeeperState2 DeepState2",
      nice: {
        justin: "Justin Nice DeeperState2 DeepState2",
        bieber: "Bieber Nice DeeperState2 DeepState2",
      }
    }
  }

}

const proxy = createLocalProxy( TestStore, store );
console.log( proxy );
