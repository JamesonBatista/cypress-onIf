const debug = require("debug")("cypress-onif");
let selectors;
const Command = (cmd) =>
  cmd && cmd.attributes && cmd.attributes.name === "onif";

const skipCommand = (cmd) => {
  cmd.attributes.skip = true;
  cmd.state = "skipped";
  Cypress.log({
    displayName: "skip",
    message: `[${cmd.attributes.name}] ignored.`,
  });
};

function skipChain(cmd, chainerId) {
  while (
    cmd &&
    cmd.attributes.chainerId === chainerId &&
    cmd.attributes.name !== "finally"
  ) {
    skipCommand(cmd);
    cmd = cmd.attributes.next;
  }
}

function findSub(elseCommand) {
  if (!elseCommand) {
    return;
  }
  if (elseCommand.name === "onif") {
    return elseCommand.ifSubject;
  }
  if (
    !elseCommand.skip &&
    !Cypress._.isNil(elseCommand.subject)
  ) {
    return elseCommand.subject;
  }
  if (elseCommand.prev) {
    return findSub(elseCommand.prev.attributes);
  }
}

Cypress.Commands.add(
  "onif",
  { prevSubject: true },
  function (subject, assertion, assertionValue) {
    const cmd = cy.state("current");
    cmd.attributes.ifSubject = subject;
    if (assertion === "exists") {
      assertion = "exist";
    }

    let hasSubject = Boolean(subject);
    let assertionsPassed = true;

    const evaluateAssertion = () => {
      try {
        if (Cypress._.isFunction(assertion)) {
          const result = assertion(subject);
          if (Cypress._.isBoolean(result)) {
            if (!result) {
              throw new Error("Predicate function failed");
            }
          }
        } else if (
          assertion.startsWith("not") ||
          assertion.startsWith("have")
        ) {
          const parts = assertion.split(".");
          let assertionReduced = expect(subject).to;
          parts.forEach((assertionPart, k) => {
            if (
              k === parts.length - 1 &&
              typeof assertionValue !== "undefined"
            ) {
              assertionReduced =
                assertionReduced[assertionPart](assertionValue);
            } else {
              assertionReduced = assertionReduced[assertionPart];
            }
          });
        } else {
          if (typeof assertionValue !== "undefined") {
            expect(subject).to.be[assertion](assertionValue);
          } else {
            expect(subject).to.be[assertion];
          }
        }
      } catch (e) {
        console.error(e);
        assertionsPassed = false;
        if (e.message.includes("Invalid Chai property")) {
          throw e;
        }
      }
    };

    if (
      assertion === "failed" &&
      Cypress._.get(cmd, "attributes.prev.attributes.name") === "task" &&
      Cypress._.isError(Cypress._.get(cmd, "attributes.prev.attributes.error"))
    ) {
      hasSubject = Cypress._.get(cmd, "attributes.prev.attributes.error");
    } else {
      if (subject === null) {
        if (assertion === "null") {
          hasSubject = true;
          assertionsPassed = true;
        } else if (assertion === "not.null") {
          hasSubject = true;
          assertionsPassed = false;
        }
      } else if (hasSubject && assertion) {
        evaluateAssertion();
      } else if (subject === undefined && assertion) {
        evaluateAssertion();
        hasSubject = true;
      }
    }

    const chainerId = cmd.attributes.chainerId;
    if (!chainerId) {
      throw new Error("Command is missing chainer id");
    }

    if (!hasSubject || !assertionsPassed) {
      let nextCommand = cmd.attributes.next;
      while (nextCommand && nextCommand.attributes.chainerId === chainerId) {
        if (nextCommand.attributes.name === "else") {
          nextCommand = null;
        } else {
          skipCommand(nextCommand);

          nextCommand = nextCommand.attributes.next;
          if (nextCommand && nextCommand.attributes.name === "else") {
            nextCommand = null;
          }
        }
      }

      if (subject) {
        cy.wrap(subject, { log: false });
      }
      return;
    } else {
      let nextCommand = cmd.attributes.next;
      while (nextCommand && nextCommand.attributes.chainerId === chainerId) {
        if (nextCommand.attributes.name === "else") {
          skipChain(nextCommand, chainerId);
          nextCommand = null;
        } else {
          nextCommand = nextCommand.attributes.next;
        }
      }
    }
    return subject;
  }
);

Cypress.Commands.add("else", { prevSubject: true }, (subject, text) => {
  if (typeof subject === "undefined") {
    subject = findSub(cy.state("current").attributes);
  }
  if (typeof text !== undefined) {
    cy.log(text);
  }
  if (subject) {
    cy.wrap(subject, { log: false });
  }
});

Cypress.Commands.add("finally", { prevSubject: true }, (subject) => {
  debug("finally with the subject", subject);

  if (typeof subject === "undefined" || subject === null) {
    const currentCommand = cy.state("current").attributes;
    debug("current command is finally", currentCommand);
    subject = findSub(currentCommand);
    debug("found subject", subject);
  }
  if (subject) {
    cy.wrap(subject, { log: false });
  }
});
Cypress.Commands.overwriteQuery(
  "get",
  function (get, selector, options) {
    selectors = selector;
    let innerFn;
    const cmd = cy.state("current");
    debug(cmd);
    const next = cmd.attributes.next;
    let nextCommand = cmd.attributes.next;
    innerFn = get.call(this, selector, options);

    if (Command(next)) {
      if (selector.startsWith("@")) {
        return (subject) => {
          try {
            return innerFn(subject);
          } catch (e) {
            if (e.message.includes("could not find a registered alias for")) {
              return undefined;
            }
          }
        };
      }
      return (subject) => {
        const res = innerFn(subject);
        if (res && res.length) {
          return res;
        }
      };
    }

    return (subject) => innerFn(subject);
  }
);

Cypress.Commands.overwriteQuery(
  "contains",
  function (contains, selector, text, options) {
    if (arguments.length === 2) {
      text = selector;
      selector = undefined;
    }

    const cmd = cy.state("current");

    const next = cmd.attributes.next;
    const innerFn = contains.call(this, selector, text, options);

    if (Command(next)) {
      return (subject) => {
        const res = innerFn(subject);
        if (res && res.length) {
          return res;
        }
      };
    }

    return (subject) => innerFn(subject);
  }
);

Cypress.Commands.overwriteQuery("find", function (find, selector, options) {
  const cmd = cy.state("current");
  const next = cmd.attributes.next;
  const innerFn = find.call(this, selector, options);

  if (Command(next)) {
    return (subject) => {
      const res = innerFn(subject);
      if (res && res.length) {
        return res;
      }
    };
  }

  return (subject) => innerFn(subject);
});

Cypress.Commands.overwrite("task", function (task, args, options) {
  const cmd = cy.state("current");
  if (cmd) {
    const next = cmd.attributes.next;

    if (Command(next)) {
      return task(args, options).then(
        (taskResult) => {
          return taskResult;
        },
        (error) => {
          cmd.attributes.error = error;
        }
      );
    }
  }

  return task(args, options);
});

Cypress.Commands.add("raise", (x) => {
  if (Cypress._.isError(x)) {
    throw x;
  }
  const e = new Error(
    String(x) +
      "\n" +
      "cypress-if tip: pass an error instance to have correct stack"
  );
  throw e;
});

Cypress.Commands.overwriteQuery("not", function (notCommand, selector) {
  const cmd = cy.state("current");

  const next = cmd.attributes.next;
  const innerFn = notCommand.call(this, selector);

  if (Command(next)) {
    return (subject) => {
      const res = innerFn(subject);
      if (res && res.length) {
        return res;
      }
    };
  }

  return (subject) => innerFn(subject);
});

const app = window.top;
if (!app.document.head.querySelector("[data-hide-command-log-request]")) {
  const style = app.document.createElement("style");
  let contains = `#unified-reporter > div > div > div.wrap > ul > li > div > div.collapsible-content.runnables-region > ul > li > div > div.collapsible-content.runnable-instruments > div > ul > li > div > div.collapsible-content.attempt-content > div > div > ul > li > div > div.collapsible-content > ul > li.command.command-name-contains`;
  let click = `#unified-reporter > div > div > div.wrap > ul > li > div > div.collapsible-content.runnables-region > ul > li > div > div.collapsible-content.runnable-instruments > div > ul > li > div > div.collapsible-content.attempt-content > div > div > ul > li > div > div.collapsible-content > ul > li.command.command-name-click`;
  let type = `#unified-reporter > div > div > div.wrap > ul > li > div > div.collapsible-content.runnables-region > ul > li > div > div.collapsible-content.runnable-instruments > div > ul > li > div > div.collapsible-content.attempt-content > div > div > ul > li > div > div.collapsible-content > ul > li.command.command-name-type`;
  let assert = `#unified-reporter > div > div > div.wrap > ul > li > div > div.collapsible-content.runnables-region > ul > li > div > div.collapsible-content.runnable-instruments > div > ul > li > div > div.collapsible-content.attempt-content > div > div > ul > li > div > div.collapsible-content > ul > li.command.command-name-assert`;
  let skip = `#unified-reporter > div > div > div.wrap > ul > li > div > div.collapsible-content.runnables-region > ul > li > div > div.collapsible-content.runnable-instruments > div > ul > li > div > div.collapsible-content.attempt-content > div > div > ul > li > div > div.collapsible-content > ul > li.command.command-name-onif`;
  let select = `#unified-reporter > div > div > div.wrap > ul > li > div > div.collapsible-content.runnables-region > ul > li > div > div.collapsible-content.runnable-instruments > div > ul > li > div > div.collapsible-content.attempt-content > div > div > ul > li > div > div.collapsible-content > ul > li.command.command-name-select`;

  let change = `div > span > div > span.command-info > span.command-message > span.command-message-text { color: white;}`;
  style.innerHTML = `.command-name-request, .command-name-xhr, .command-name-page-load, .command-name-new-url { display: none };
 .reporter .command-state-passed:not(.command-is-event, .command-type-system) .command-method::before {content: '';}
 ${contains} div > span > div > span.command-info > span.command-method::before,
 ${click} div > span > div > span.command-info > span.command-method::before,
 ${skip} div > span > div > span.command-info > span.command-method::before,
 ${type} div > span > div > span.command-info > span.command-method::before,
 ${assert} div > span > div > span.command-info > span.command-method::before,
 ${select} div > span > div > span.command-info > span.command-method::before
 {
 content: '';
 }
 ${skip} div > span > div > span.command-info > span.command-method{
 	color:white;
    background: darkred;
    padding: 2px 5px;
    border-radius: 2px;
 }
 ${skip}:hover ${change}
 
  `;
  style.setAttribute("data-hide-command-log-request", "");
  app.document.head.appendChild(style);
}
