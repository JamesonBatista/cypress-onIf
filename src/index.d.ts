/// <reference types="cypress" />

declare namespace Cypress {
	interface Chainable<Subject = any> {
    /**
     * Conditionally execute a set of commands based on an assertion.
	 * Jam Batista created
     *
     * @param assertion The assertion to evaluate. Can be a string representing a Chai assertion or a function returning a boolean.
     * @param assertionValue (optional) The value to assert against if the assertion is a comparison.
     * @example
     * cy.get('button').onIf().click();
     */
    onIf(
      assertion: string | ((subject: Subject) => boolean),
      assertionValue?: any
    ): Chainable<Subject>;
  }
}
