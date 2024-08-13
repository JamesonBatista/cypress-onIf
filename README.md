# cypress-onif 
![cypress version](https://img.shields.io/badge/cypress-13.13.2-brightgreen)

[![Npm package weekly downloads](https://badgen.net/npm/dw/cypress-onif)](https://npmjs.com/package/cypress-onif)
[![Npm package weekly downloads](https://badgen.net/npm/dm/cypress-onif)](https://npmjs.com/package/cypress-onif)
[![Npm package weekly downloads](https://badgen.net/npm/dy/cypress-onif)](https://npmjs.com/package/cypress-onif)
[![Npm package weekly downloads](https://badgen.net/npm/dt/cypress-onif)](https://npmjs.com/package/cypress-onif)


## Install

Add this package as a dev dependency

```
$ npm i -D cypress-onif
# or using Yarn
$ yarn add -D cypress-onif
```

## import

```js
// command.js

import ('cypress-onif')

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
    cy.get('[name="usernam"]').onif().type("test");

  });
});


```
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
    cy.get('[name="username"]').onif().type("test");

    cy.get('[name="password"]').onif().type("test");

    cy.contains("span", "Login").onif().click();
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
    cy.get('[name="username"]').onif().type("test@teste.com");

    cy.get('[name="password"]').onif().type("test");

    cy.contains("button", "Login").onif().click();

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
    return cy.get(params[0]).onif()
  }
  return cy.get(params)
}
```

![alt text](image-5.png)

## ✅ correct

![alt text](image-6.png)