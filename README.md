# cypress-onIf ![cypress version](https://img.shields.io/badge/cypress-13.13.2-brightgreen)
[![Npm package weekly downloads](https://badgen.net/npm/dw/cypress-onIf)](https://npmjs.com/package/cypress-onIf)
[![Npm package weekly downloads](https://badgen.net/npm/dm/cypress-onIf)](https://npmjs.com/package/cypress-onIf)
[![Npm package weekly downloads](https://badgen.net/npm/dy/cypress-onIf)](https://npmjs.com/package/cypress-onIf)
[![Npm package weekly downloads](https://badgen.net/npm/dt/cypress-onIf)](https://npmjs.com/package/cypress-onIf)


## Install

Add this package as a dev dependency

```
$ npm i -D cypress-onIf
# or using Yarn
$ yarn add -D cypress-onIf
```

## import

```js
// command.js

import ('cypress-onIf')

```

# ⚙️ Use

## 1
```js
describe("template spec", () => {
  before(() => {
    cy.visit("https://jamesonbatista.github.io/projectqatesterweb/");
  });
  it("passes", () => {
    cy.contains("Login").click();
    cy.get('[name="usernam"]').onIf().type("test");

  });
});


```
<!-- ![screenshot]('../../src/images/image.png) -->
![alt text](image.png)

### ✅ correct

![alt text](image-2.png)

## 2 

```js
describe("template spec", () => {
  before(() => {
    cy.visit("https://jamesonbatista.github.io/projectqatesterweb/");
  });
  it("passes", () => {
    cy.contains("Login").click();
    cy.get('[name="username"]').onIf().type("test");

    cy.get('[name="password"]').onIf().type("test");

    cy.contains("span", "Login").onIf().click();
  });
});
```
![alt text](image-3.png)

## ✅ correct

![alt text](image-4.png)

## 3

```js

describe("template spec", () => {
  before(() => {
    cy.visit("https://jamesonbatista.github.io/projectqatesterweb/");
  });
  it("passes", () => {
    cy.contains("Login").click();
    cy.get('[name="username"]').onIf().type("test@teste.com");

    cy.get('[name="password"]').onIf().type("test");

    cy.contains("button", "Login").onIf().click();

    cy.contains('Cadastro Simples').click()
  });

  it('Fill signUp', () => {
      getBy(['[name="name"]']).type('Jam')

      // error
      getBy(['[name="nam"]']).type('Jam')

      getBy('[name="password"]').type('Testing')
  });
});


function getBy(params) {
  if(Array.isArray(params)){
    return cy.get(params[0]).onIf()
  }
  return cy.get(params)
}
```

![alt text](image-5.png)

## ✅ correct

![alt text](image-6.png)